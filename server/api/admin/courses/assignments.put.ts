import { eq } from 'drizzle-orm'
import { assignments } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.id) throw createError({ statusCode: 400, statusMessage: 'ID diperlukan' })

  if (body.delete) {
    await db.delete(assignments).where(eq(assignments.id, body.id))
    return { message: 'Tugas berhasil dihapus' }
  }

  await db.update(assignments).set({
    title: body.title,
    description: body.description ?? null,
    maxScore: body.maxScore ?? 100,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    allowLateSubmission: body.allowLateSubmission ?? false,
    sortOrder: body.sortOrder ?? 0,
  }).where(eq(assignments.id, body.id))

  return { message: 'Tugas berhasil diperbarui' }
})
