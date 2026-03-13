import { eq } from 'drizzle-orm'
import { courses } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))

  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID diperlukan' })

  await db.delete(courses).where(eq(courses.id, id))

  return { message: 'Course berhasil dihapus' }
})
