import { eq } from 'drizzle-orm'
import { exams, examQuestions } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.moduleId || !body.title) {
    throw createError({ statusCode: 400, statusMessage: 'moduleId dan title wajib diisi' })
  }

  const [result] = await db.insert(exams).values({
    moduleId: body.moduleId,
    title: body.title,
    description: body.description || null,
    duration: body.duration || null,
    passingScore: body.passingScore ?? 60,
    maxAttempts: body.maxAttempts ?? 1,
    shuffleQuestions: body.shuffleQuestions ?? false,
    showResults: body.showResults ?? true,
    isActive: body.isActive ?? false,
    sortOrder: body.sortOrder ?? 0,
  }).$returningId()

  // Insert questions if provided
  if (body.questions?.length) {
    for (const q of body.questions) {
      await db.insert(examQuestions).values({
        examId: result.id,
        type: q.type || 'single',
        question: q.question,
        options: JSON.stringify(q.options),
        explanation: q.explanation || null,
        points: q.points ?? 1,
        sortOrder: q.sortOrder ?? 0,
      })
    }
  }

  return { id: result.id }
})
