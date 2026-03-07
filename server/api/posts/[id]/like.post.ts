import { eq, and, count } from 'drizzle-orm'
import { posts, postLikes } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'id')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  const voterHash = hashIP(event)

  // Find post
  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  // Check if already liked
  const [existing] = await db
    .select()
    .from(postLikes)
    .where(and(eq(postLikes.postId, post.id), eq(postLikes.voterHash, voterHash)))
    .limit(1)

  if (existing) {
    // Unlike
    await db.delete(postLikes).where(eq(postLikes.id, existing.id))
  } else {
    // Like
    await db.insert(postLikes).values({ postId: post.id, voterHash })
  }

  // Get total count
  const [result] = await db
    .select({ total: count() })
    .from(postLikes)
    .where(eq(postLikes.postId, post.id))

  return {
    liked: !existing,
    total: result.total,
  }
})
