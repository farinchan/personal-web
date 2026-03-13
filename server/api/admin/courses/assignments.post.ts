import { eq } from 'drizzle-orm'
import { assignments } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.moduleId || !body.title) {
    throw createError({ statusCode: 400, statusMessage: 'moduleId dan title wajib diisi' })
  }

  const [result] = await db.insert(assignments).values({
    moduleId: body.moduleId,
    title: body.title,
    description: body.description || null,
    maxScore: body.maxScore ?? 100,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    allowLateSubmission: body.allowLateSubmission ?? false,
    sortOrder: body.sortOrder ?? 0,
  }).$returningId()

  return { id: result.id }
})
