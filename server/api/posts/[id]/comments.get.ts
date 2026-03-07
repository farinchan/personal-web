import { eq, and, desc, isNull } from 'drizzle-orm'
import { comments, posts } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'id')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  // Get top-level approved comments
  const topLevel = await db
    .select({
      id: comments.id,
      name: comments.name,
      body: comments.body,
      isAdmin: comments.isAdmin,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(and(
      eq(comments.postId, post.id),
      eq(comments.status, 'approved'),
      isNull(comments.parentId),
    ))
    .orderBy(desc(comments.createdAt))

  // Get all approved replies for this post
  const replies = await db
    .select({
      id: comments.id,
      parentId: comments.parentId,
      name: comments.name,
      body: comments.body,
      isAdmin: comments.isAdmin,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(and(
      eq(comments.postId, post.id),
      eq(comments.status, 'approved'),
    ))

  // Nest replies under parent
  const result = topLevel.map(comment => ({
    ...comment,
    replies: replies.filter(r => r.parentId === comment.id),
  }))

  return result
})
