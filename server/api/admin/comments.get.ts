import { eq, desc } from 'drizzle-orm'
import { comments, posts } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()

  const result = await db
    .select({
      id: comments.id,
      name: comments.name,
      email: comments.email,
      body: comments.body,
      status: comments.status,
      isAdmin: comments.isAdmin,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      postId: comments.postId,
      postTitle: posts.title,
      postSlug: posts.slug,
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .orderBy(desc(comments.createdAt))

  return result
})
