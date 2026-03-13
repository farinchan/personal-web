import { eq, and } from 'drizzle-orm'
import { assignments, submissions, courseModules, courses, enrollments } from '../../../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const student = await requireStudentSession(event)
  const slug = getRouterParam(event, 'slug')
  const assignmentId = Number(getRouterParam(event, 'assignmentId'))

  if (!slug || !assignmentId) throw createError({ statusCode: 400, statusMessage: 'Parameter tidak lengkap' })

  // Verify enrollment
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.courseId, course.id), eq(enrollments.studentId, student.studentId)))
    .limit(1)
  if (!enrollment) throw createError({ statusCode: 403, statusMessage: 'Belum terdaftar' })

  // Get assignment
  const [assignment] = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      description: assignments.description,
      maxScore: assignments.maxScore,
      dueDate: assignments.dueDate,
      allowLateSubmission: assignments.allowLateSubmission,
    })
    .from(assignments)
    .innerJoin(courseModules, eq(assignments.moduleId, courseModules.id))
    .where(and(eq(assignments.id, assignmentId), eq(courseModules.courseId, course.id)))
    .limit(1)
  if (!assignment) throw createError({ statusCode: 404, statusMessage: 'Tugas tidak ditemukan' })

  // Get student's submission
  const [submission] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, student.studentId)))
    .limit(1)

  return { assignment, submission: submission || null }
})
