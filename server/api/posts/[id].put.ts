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
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required' })
  }

  const updateData: Record<string, any> = { updatedAt: new Date() }
  if (body.title !== undefined) {
    updateData.title = body.title
    // Auto-update slug from new title
    const newSlug = generateSlug(body.title)
    const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, newSlug)).limit(1)
    if (!existing || existing.id === id) {
      updateData.slug = newSlug
    } else {
      updateData.slug = `${newSlug}-${Date.now()}`
    }
  }
  if (body.description !== undefined) updateData.description = body.description
  if (body.body !== undefined) updateData.body = body.body
  if (body.coverImage !== undefined) updateData.coverImage = body.coverImage
  if (body.isDraft !== undefined) {
    updateData.isDraft = body.isDraft
    if (!body.isDraft) updateData.publishedAt = new Date()
  }

  await db.update(posts).set(updateData).where(eq(posts.id, id))

  // Update tags if provided
  if (body.tags && Array.isArray(body.tags)) {
    await db.delete(postTags).where(eq(postTags.postId, id))

    for (const tagName of body.tags) {
      const tagSlug = tagName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-')
      await db.insert(tags).values({ name: tagName, slug: tagSlug }).onDuplicateKeyUpdate({ set: { name: tagName } })
      const [existingTag] = await db.select().from(tags).where(eq(tags.slug, tagSlug)).limit(1)
      if (existingTag) {
        await db.insert(postTags).values({ postId: id, tagId: existingTag.id })
      }
    }
  }

  return { message: 'Post updated' }
})
