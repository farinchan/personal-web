import { eq } from 'drizzle-orm'
import { posts, postTags, tags } from '../../../db/schema'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDB()

  const body = await readBody(event)

  if (!body.title || !body.body) {
    throw createError({ statusCode: 400, statusMessage: 'title dan body wajib diisi' })
  }

  // Auto-generate slug from title, append timestamp if duplicate
  let slug = body.slug || generateSlug(body.title)
  const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1)
  if (existing) {
    slug = `${slug}-${Date.now()}`
  }

  const [result] = await db.insert(posts).values({
    title: body.title,
    slug,
    description: body.description || null,
    body: body.body,
    coverImage: body.coverImage || null,
    isDraft: body.isDraft ?? true,
    publishedAt: body.isDraft ? null : new Date(),
  }).$returningId()

  // Handle tags
  if (body.tags && Array.isArray(body.tags) && body.tags.length > 0) {
    for (const tagName of body.tags) {
      const tagSlug = tagName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-')

      // Upsert tag
      await db.insert(tags).values({ name: tagName, slug: tagSlug }).onDuplicateKeyUpdate({ set: { name: tagName } })

      const [existingTag] = await db.select().from(tags).where(eq(tags.slug, tagSlug)).limit(1)

      if (existingTag) {
        await db.insert(postTags).values({ postId: result.id, tagId: existingTag.id })
      }
    }
  }

  return { id: result.id, message: 'Post created' }
})
