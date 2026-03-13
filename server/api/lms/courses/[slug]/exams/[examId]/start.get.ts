import { eq, and } from 'drizzle-orm'
import { exams, examQuestions, courseModules, courses, enrollments, examAttempts } from '../../../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const student = await requireStudentSession(event)
  const slug = getRouterParam(event, 'slug')
  const examId = Number(getRouterParam(event, 'examId'))

  if (!slug || !examId) throw createError({ statusCode: 400, statusMessage: 'Parameter tidak lengkap' })

  // Verify enrollment
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.courseId, course.id), eq(enrollments.studentId, student.studentId)))
    .limit(1)
  if (!enrollment) throw createError({ statusCode: 403, statusMessage: 'Belum terdaftar' })

  // Get exam
  const [exam] = await db
    .select({
      id: exams.id,
      title: exams.title,
      description: exams.description,
      duration: exams.duration,
      passingScore: exams.passingScore,
      maxAttempts: exams.maxAttempts,
      shuffleQuestions: exams.shuffleQuestions,
      showResults: exams.showResults,
      isActive: exams.isActive,
    })
    .from(exams)
    .innerJoin(courseModules, eq(exams.moduleId, courseModules.id))
    .where(and(eq(exams.id, examId), eq(courseModules.courseId, course.id)))
    .limit(1)

  if (!exam) throw createError({ statusCode: 404, statusMessage: 'Ujian tidak ditemukan' })
  if (!exam.isActive) throw createError({ statusCode: 400, statusMessage: 'Ujian belum aktif' })

  // Check attempts
  const attempts = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, student.studentId)))

  const completedAttempts = attempts.filter(a => a.completedAt)

  if (completedAttempts.length >= exam.maxAttempts) {
    throw createError({ statusCode: 400, statusMessage: `Batas percobaan (${exam.maxAttempts}x) sudah habis` })
  }

  // Check if there's an ongoing attempt
  const ongoingAttempt = attempts.find(a => !a.completedAt)
  if (ongoingAttempt) {
    // Check if duration exceeded
    if (exam.duration) {
      const elapsed = (Date.now() - new Date(ongoingAttempt.startedAt).getTime()) / 60000
      if (elapsed > exam.duration) {
        // Auto-complete expired attempt with 0
        await db.update(examAttempts)
          .set({ completedAt: new Date(), score: '0', passed: false })
          .where(eq(examAttempts.id, ongoingAttempt.id))
        // Allow new attempt if remaining
        if (completedAttempts.length + 1 >= exam.maxAttempts) {
          throw createError({ statusCode: 400, statusMessage: 'Batas percobaan sudah habis' })
        }
      }
    }
  }

  // Get questions (without correct answers for client)
  let questions = await db
    .select({
      id: examQuestions.id,
      type: examQuestions.type,
      question: examQuestions.question,
      options: examQuestions.options,
      points: examQuestions.points,
      sortOrder: examQuestions.sortOrder,
    })
    .from(examQuestions)
    .where(eq(examQuestions.examId, examId))
    .orderBy(examQuestions.sortOrder)

  // Strip isCorrect from options for client
  const clientQuestions = questions.map(q => {
    const opts = JSON.parse(q.options as string)
    return {
      ...q,
      options: opts.map((o: any) => ({ id: o.id, text: o.text })),
    }
  })

  // Shuffle if needed
  if (exam.shuffleQuestions) {
    for (let i = clientQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [clientQuestions[i], clientQuestions[j]] = [clientQuestions[j], clientQuestions[i]]
    }
  }

  // Create or return ongoing attempt
  let attemptId: number
  if (ongoingAttempt && !(exam.duration && (Date.now() - new Date(ongoingAttempt.startedAt).getTime()) / 60000 > exam.duration)) {
    attemptId = ongoingAttempt.id
  } else {
    const [result] = await db.insert(examAttempts).values({
      examId,
      studentId: student.studentId,
    }).$returningId()
    attemptId = result.id
  }

  return {
    exam,
    questions: clientQuestions,
    attemptId,
    attemptCount: completedAttempts.length,
    previousResults: exam.showResults ? completedAttempts.map(a => ({
      score: a.score,
      totalPoints: a.totalPoints,
      passed: a.passed,
      completedAt: a.completedAt,
    })) : [],
  }
})
