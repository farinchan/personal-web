import { eq, and } from 'drizzle-orm'
import { exams, examQuestions, examAttempts, courseModules, courses, enrollments } from '../../../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const student = await requireStudentSession(event)
  const slug = getRouterParam(event, 'slug')
  const examId = Number(getRouterParam(event, 'examId'))
  const body = await readBody(event)

  if (!slug || !examId) throw createError({ statusCode: 400, statusMessage: 'Parameter tidak lengkap' })
  if (!body.attemptId || !body.answers) throw createError({ statusCode: 400, statusMessage: 'Data jawaban tidak lengkap' })

  // Verify enrollment
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.courseId, course.id), eq(enrollments.studentId, student.studentId)))
    .limit(1)
  if (!enrollment) throw createError({ statusCode: 403, statusMessage: 'Belum terdaftar' })

  // Get attempt
  const [attempt] = await db
    .select()
    .from(examAttempts)
    .where(and(
      eq(examAttempts.id, body.attemptId),
      eq(examAttempts.examId, examId),
      eq(examAttempts.studentId, student.studentId),
    ))
    .limit(1)

  if (!attempt) throw createError({ statusCode: 404, statusMessage: 'Attempt tidak ditemukan' })
  if (attempt.completedAt) throw createError({ statusCode: 400, statusMessage: 'Ujian sudah selesai' })

  // Get exam
  const [exam] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1)
  if (!exam) throw createError({ statusCode: 404, statusMessage: 'Ujian tidak ditemukan' })

  // Check duration
  if (exam.duration) {
    const elapsed = (Date.now() - new Date(attempt.startedAt).getTime()) / 60000
    if (elapsed > exam.duration + 1) { // 1 min grace
      await db.update(examAttempts)
        .set({ completedAt: new Date(), score: '0', totalPoints: 0, passed: false, answers: JSON.stringify(body.answers) })
        .where(eq(examAttempts.id, attempt.id))
      throw createError({ statusCode: 400, statusMessage: 'Waktu ujian sudah habis' })
    }
  }

  // Get questions with correct answers
  const questions = await db
    .select()
    .from(examQuestions)
    .where(eq(examQuestions.examId, examId))

  // Grade
  const answers: Record<string, number[]> = body.answers // { questionId: [selectedOptionIds] }
  let totalScore = 0
  let totalPoints = 0
  const results: any[] = []

  for (const q of questions) {
    const opts: { id: number; text: string; isCorrect: boolean }[] = JSON.parse(q.options as string)
    const correctIds = opts.filter(o => o.isCorrect).map(o => o.id).sort()
    const selectedIds = (answers[String(q.id)] || []).sort()
    totalPoints += q.points

    const isCorrect = correctIds.length === selectedIds.length &&
      correctIds.every((id, i) => id === selectedIds[i])

    if (isCorrect) totalScore += q.points

    results.push({
      questionId: q.id,
      correct: isCorrect,
      selectedIds,
      correctIds,
      explanation: q.explanation,
      points: isCorrect ? q.points : 0,
    })
  }

  const scorePercent = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 10000) / 100 : 0
  const passed = scorePercent >= exam.passingScore

  await db.update(examAttempts)
    .set({
      answers: JSON.stringify(body.answers),
      score: String(scorePercent),
      totalPoints: totalScore,
      passed,
      completedAt: new Date(),
    })
    .where(eq(examAttempts.id, attempt.id))

  return {
    score: scorePercent,
    totalScore,
    totalPoints,
    passed,
    passingScore: exam.passingScore,
    results: exam.showResults ? results : [],
  }
})
