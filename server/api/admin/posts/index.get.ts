import { eq, desc, like, and } from 'drizzle-orm'
import { posts, postTags, tags } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const query = getQuery(event)
  const q = query.q as string | undefined

  const conditions: any[] = []
  if (q) {
    conditions.push(like(posts.title, `%${q}%`))
  }

  const result = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      description: posts.description,
      body: posts.body,
      coverImage: posts.coverImage,
      isDraft: posts.isDraft,
      viewCount: posts.viewCount,
      shareCount: posts.shareCount,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(posts.createdAt))

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
