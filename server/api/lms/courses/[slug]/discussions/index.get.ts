import { eq, and, desc, isNull } from 'drizzle-orm'
import { discussions, students, materials, courseModules, courses, enrollments } from '../../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const student = await requireStudentSession(event)
  const slug = getRouterParam(event, 'slug')
  const materialId = Number(getQuery(event).materialId)

  if (!slug || !materialId) throw createError({ statusCode: 400, statusMessage: 'Parameter tidak lengkap' })

  // Verify enrollment
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.courseId, course.id), eq(enrollments.studentId, student.studentId)))
    .limit(1)
  if (!enrollment) throw createError({ statusCode: 403, statusMessage: 'Belum terdaftar' })

  // Get top-level discussions with replies
  const topLevel = await db
    .select({
      id: discussions.id,
      body: discussions.body,
      isInstructor: discussions.isInstructor,
      createdAt: discussions.createdAt,
      studentName: students.name,
      studentUsername: students.username,
      studentAvatar: students.avatar,
    })
    .from(discussions)
    .innerJoin(students, eq(discussions.studentId, students.id))
    .where(and(eq(discussions.materialId, materialId), isNull(discussions.parentId)))
    .orderBy(desc(discussions.createdAt))

  // Get replies
  const withReplies = await Promise.all(
    topLevel.map(async (d) => {
      const replies = await db
        .select({
          id: discussions.id,
          body: discussions.body,
          isInstructor: discussions.isInstructor,
          createdAt: discussions.createdAt,
          studentName: students.name,
          studentUsername: students.username,
          studentAvatar: students.avatar,
        })
        .from(discussions)
        .innerJoin(students, eq(discussions.studentId, students.id))
        .where(eq(discussions.parentId, d.id))
        .orderBy(discussions.createdAt)

      return { ...d, replies }
    })
  )

  return { discussions: withReplies }
})
