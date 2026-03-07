import { eq, desc, like, and, isNull, sql } from 'drizzle-orm'
import { posts, postTags, tags } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database connection failed' })
  }
  const query = getQuery(event)
  const q = query.q as string | undefined
  const tag = query.tag as string | undefined
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10
  const offset = (page - 1) * limit

  let conditions = [eq(posts.isDraft, false)]

  if (q) {
    conditions.push(like(posts.title, `%${q}%`))
  }

  let result

  if (tag) {
    // Filter by tag
    result = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        description: posts.description,
        coverImage: posts.coverImage,
        viewCount: posts.viewCount,
        shareCount: posts.shareCount,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .innerJoin(postTags, eq(posts.id, postTags.postId))
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(and(...conditions, eq(tags.slug, tag)))
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset)
  } else {
    result = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        description: posts.description,
        coverImage: posts.coverImage,
        viewCount: posts.viewCount,
        shareCount: posts.shareCount,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset)
  }

  // Fetch tags for each post   
  const postsWithTags = await Promise.all(
    result.map(async (post) => {
      const postTagsList = await db
        .select({ name: tags.name, slug: tags.slug })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(eq(postTags.postId, post.id))

      return { ...post, tags: postTagsList }
    })
  )

  return postsWithTags
})
