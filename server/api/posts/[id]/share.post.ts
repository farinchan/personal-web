import { eq, sql } from 'drizzle-orm'
import { posts } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'id')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  await db
    .update(posts)
    .set({ shareCount: sql`${posts.shareCount} + 1` })
    .where(eq(posts.slug, slug))

  return { message: 'Share counted' }
})
