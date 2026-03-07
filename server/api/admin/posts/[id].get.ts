import { eq } from 'drizzle-orm'
import { posts, postTags, tags } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required' })
  }

  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1)

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Artikel tidak ditemukan' })
  }

  const postTagsList = await db
    .select({ name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id))

  return { ...post, tags: postTagsList }
})
