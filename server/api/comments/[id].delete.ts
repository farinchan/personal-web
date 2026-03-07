import { eq } from 'drizzle-orm'
import { comments } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required' })
  }

  await db.delete(comments).where(eq(comments.id, id))
  return { message: 'Komentar dihapus' }
})
