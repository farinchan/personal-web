import { eq } from 'drizzle-orm'
import { materials } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.moduleId || !body.title) {
    throw createError({ statusCode: 400, statusMessage: 'moduleId dan title wajib diisi' })
  }

  const [result] = await db.insert(materials).values({
    moduleId: body.moduleId,
    title: body.title,
    type: body.type || 'content',
    body: body.body || null,
    postId: body.postId || null,
    videoUrl: body.videoUrl || null,
    fileUrl: body.fileUrl || null,
    duration: body.duration || null,
    sortOrder: body.sortOrder ?? 0,
  }).$returningId()

  return { id: result.id }
})
