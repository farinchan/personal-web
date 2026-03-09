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
  const db = useDB()!

  const body = await readBody(event)

  if (!body.title || !body.body) {
    throw createError({ statusCode: 400, statusMessage: 'title dan body wajib diisi' })
  }

  // Validate field lengths
  if (body.title.length > 255) {
    throw createError({ statusCode: 400, statusMessage: `Judul terlalu panjang (${body.title.length}/255 karakter)` })
  }

  // Check body size (~16MB MySQL TEXT limit, but warn at 10MB)
  const bodySize = new Blob([body.body]).size
  if (bodySize > 10 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: `Konten terlalu besar (${(bodySize / 1024 / 1024).toFixed(1)}MB). Maksimal 10MB. Coba kompres gambar yang ada di konten.` })
  }

  try {
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

    if (!result) {
      throw createError({ statusCode: 500, statusMessage: 'Gagal menyimpan artikel ke database' })
    }

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
  } catch (err: any) {
    // If it's already an H3 error, re-throw
    if (err.statusCode) throw err

    console.error('[POST /api/posts] Error creating post:', err.message || err)
    console.error('[POST /api/posts] Stack:', err.stack)

    // MySQL specific errors
    if (err.code === 'ER_DATA_TOO_LONG') {
      throw createError({ statusCode: 400, statusMessage: `Data terlalu panjang untuk kolom database. Coba persingkat judul atau deskripsi.` })
    }
    if (err.code === 'ER_DUP_ENTRY') {
      throw createError({ statusCode: 409, statusMessage: 'Artikel dengan slug yang sama sudah ada. Coba ubah judul.' })
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      throw createError({ statusCode: 503, statusMessage: 'Database tidak dapat dijangkau. Coba lagi nanti.' })
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Gagal membuat artikel: ${err.message || 'Unknown error'}`,
    })
  }
})
