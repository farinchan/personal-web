import { eq } from 'drizzle-orm'
import { courseModules } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.courseId || !body.title) {
    throw createError({ statusCode: 400, statusMessage: 'courseId dan title wajib diisi' })
  }

  const [result] = await db.insert(courseModules).values({
    courseId: body.courseId,
    title: body.title,
    description: body.description || null,
    sortOrder: body.sortOrder ?? 0,
  }).$returningId()

  return { id: result.id }
})
