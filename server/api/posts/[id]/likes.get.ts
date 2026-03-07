import { eq, and, count } from 'drizzle-orm'
import { posts, postLikes } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'id')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  const voterHash = hashIP(event)

  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  const [result] = await db.select({ total: count() }).from(postLikes).where(eq(postLikes.postId, post.id))

  const [liked] = await db
    .select()
    .from(postLikes)
    .where(and(eq(postLikes.postId, post.id), eq(postLikes.voterHash, voterHash)))
    .limit(1)

  return {
    total: result.total,
    isLiked: !!liked,
  }
})
