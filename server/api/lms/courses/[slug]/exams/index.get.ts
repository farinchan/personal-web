import { eq, and } from 'drizzle-orm'
import { exams, courseModules, courses, enrollments } from '../../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const student = await requireStudentSession(event)
  const slug = getRouterParam(event, 'slug')

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug diperlukan' })

  const [course] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.courseId, course.id), eq(enrollments.studentId, student.studentId)))
    .limit(1)
  if (!enrollment) throw createError({ statusCode: 403, statusMessage: 'Belum terdaftar' })

  const rows = await db
    .select({
      id: exams.id,
      title: exams.title,
      description: exams.description,
      duration: exams.duration,
      passingScore: exams.passingScore,
      maxAttempts: exams.maxAttempts,
      isActive: exams.isActive,
      moduleId: exams.moduleId,
      moduleTitle: courseModules.title,
    })
    .from(exams)
    .innerJoin(courseModules, eq(exams.moduleId, courseModules.id))
    .where(eq(courseModules.courseId, course.id))
    .orderBy(courseModules.sortOrder, exams.sortOrder)

  return { exams: rows }
})
