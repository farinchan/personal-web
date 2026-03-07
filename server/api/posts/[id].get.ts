import { eq } from 'drizzle-orm'
import { posts, postTags, tags, postLikes, comments } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'id')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1)

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  // Fetch tags
  const postTagsList = await db
    .select({ name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id))

  // Count likes
  const [likeResult] = await db
    .select({ count: postLikes.id })
    .from(postLikes)
    .where(eq(postLikes.postId, post.id))

  // Count approved comments
  const approvedComments = await db
    .select()
    .from(comments)
    .where(eq(comments.postId, post.id))

  return {
    ...post,
    tags: postTagsList,
    likeCount: likeResult?.count ?? 0,
    commentCount: approvedComments.filter(c => c.status === 'approved').length,
  }
})
