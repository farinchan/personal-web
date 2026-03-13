import { eq } from 'drizzle-orm'
import { courses } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID diperlukan' })

  await db.update(courses).set({
    title: body.title,
    slug: body.slug,
    description: body.description || null,
    coverImage: body.coverImage || null,
    visibility: body.visibility,
    inviteCode: body.inviteCode || null,
    maxStudents: body.maxStudents || null,
    status: body.status,
    updatedAt: new Date(),
  }).where(eq(courses.id, id))

  return { message: 'Course berhasil diperbarui' }
})
