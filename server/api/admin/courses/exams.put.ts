import { eq } from 'drizzle-orm'
import { exams, examQuestions } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.id) throw createError({ statusCode: 400, statusMessage: 'ID diperlukan' })

  if (body.delete) {
    await db.delete(exams).where(eq(exams.id, body.id))
    return { message: 'Ujian berhasil dihapus' }
  }

  await db.update(exams).set({
    title: body.title,
    description: body.description ?? null,
    duration: body.duration ?? null,
    passingScore: body.passingScore ?? 60,
    maxAttempts: body.maxAttempts ?? 1,
    shuffleQuestions: body.shuffleQuestions ?? false,
    showResults: body.showResults ?? true,
    isActive: body.isActive ?? false,
    sortOrder: body.sortOrder ?? 0,
  }).where(eq(exams.id, body.id))

  // Replace questions if provided
  if (body.questions) {
    await db.delete(examQuestions).where(eq(examQuestions.examId, body.id))
    for (const q of body.questions) {
      await db.insert(examQuestions).values({
        examId: body.id,
        type: q.type || 'single',
        question: q.question,
        options: JSON.stringify(q.options),
        explanation: q.explanation || null,
        points: q.points ?? 1,
        sortOrder: q.sortOrder ?? 0,
      })
    }
  }

  return { message: 'Ujian berhasil diperbarui' }
})
