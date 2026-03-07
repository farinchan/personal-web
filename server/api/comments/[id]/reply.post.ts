import { eq } from 'drizzle-orm'
import { comments } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!id || !body.body) {
    throw createError({ statusCode: 400, statusMessage: 'ID dan isi balasan wajib diisi' })
  }

  // Get parent comment to find postId
  const [parent] = await db.select().from(comments).where(eq(comments.id, id)).limit(1)
  if (!parent) {
    throw createError({ statusCode: 404, statusMessage: 'Komentar tidak ditemukan' })
  }

  await db.insert(comments).values({
    postId: parent.postId,
    parentId: id,
    name: session.user.username || 'Admin',
    body: body.body,
    isAdmin: 1,
    status: 'approved',
  })

  return { message: 'Balasan berhasil dikirim' }
})
