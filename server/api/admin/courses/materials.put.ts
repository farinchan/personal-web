import { eq } from 'drizzle-orm'
import { materials } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.id) throw createError({ statusCode: 400, statusMessage: 'ID diperlukan' })

  if (body.delete) {
    await db.delete(materials).where(eq(materials.id, body.id))
    return { message: 'Materi berhasil dihapus' }
  }

  await db.update(materials).set({
    title: body.title,
    type: body.type,
    body: body.body ?? null,
    postId: body.postId ?? null,
    videoUrl: body.videoUrl ?? null,
    fileUrl: body.fileUrl ?? null,
    duration: body.duration ?? null,
    sortOrder: body.sortOrder ?? 0,
    updatedAt: new Date(),
  }).where(eq(materials.id, body.id))

  return { message: 'Materi berhasil diperbarui' }
})
