import { eq } from 'drizzle-orm'
import { comments, posts } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  if (!body.name || !body.body) {
    throw createError({ statusCode: 400, statusMessage: 'Nama dan komentar wajib diisi' })
  }

  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  await db.insert(comments).values({
    postId: post.id,
    name: body.name,
    email: body.email || null,
    body: body.body,
    status: 'pending',
  })

  return { message: 'Komentar berhasil dikirim, menunggu moderasi' }
})
