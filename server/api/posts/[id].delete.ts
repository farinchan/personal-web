import { eq } from 'drizzle-orm'
import { posts } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required' })
  }

  await db.delete(posts).where(eq(posts.id, id))

  return { message: 'Post deleted' }
})
