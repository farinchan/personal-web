import { eq } from 'drizzle-orm'
import { courseModules } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.id) throw createError({ statusCode: 400, statusMessage: 'ID diperlukan' })

  if (body.delete) {
    await db.delete(courseModules).where(eq(courseModules.id, body.id))
    return { message: 'Modul berhasil dihapus' }
  }

  await db.update(courseModules).set({
    title: body.title,
    description: body.description ?? null,
    sortOrder: body.sortOrder ?? 0,
  }).where(eq(courseModules.id, body.id))

  return { message: 'Modul berhasil diperbarui' }
})
