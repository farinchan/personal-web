import { eq, and } from 'drizzle-orm'
import { assignments, submissions, courseModules, courses, enrollments } from '../../../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const student = await requireStudentSession(event)
  const slug = getRouterParam(event, 'slug')
  const assignmentId = Number(getRouterParam(event, 'assignmentId'))
  const body = await readBody(event)

  if (!slug || !assignmentId) throw createError({ statusCode: 400, statusMessage: 'Parameter tidak lengkap' })
  if (!body.content && !body.fileUrl) throw createError({ statusCode: 400, statusMessage: 'Konten atau file harus diisi' })

  // Verify enrollment
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.courseId, course.id), eq(enrollments.studentId, student.studentId)))
    .limit(1)
  if (!enrollment) throw createError({ statusCode: 403, statusMessage: 'Belum terdaftar' })

  // Check assignment belongs to course
  const [assignment] = await db
    .select()
    .from(assignments)
    .innerJoin(courseModules, eq(assignments.moduleId, courseModules.id))
    .where(and(eq(assignments.id, assignmentId), eq(courseModules.courseId, course.id)))
    .limit(1)
  if (!assignment) throw createError({ statusCode: 404, statusMessage: 'Tugas tidak ditemukan' })

  // Check due date
  if (assignment.assignments.dueDate && new Date() > new Date(assignment.assignments.dueDate) && !assignment.assignments.allowLateSubmission) {
    throw createError({ statusCode: 400, statusMessage: 'Batas waktu pengumpulan sudah lewat' })
  }

  // Check existing → update or insert
  const [existing] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, student.studentId)))
    .limit(1)

  if (existing) {
    if (existing.status === 'graded') {
      throw createError({ statusCode: 400, statusMessage: 'Tugas sudah dinilai, tidak bisa diubah' })
    }
    await db.update(submissions)
      .set({
        content: body.content || null,
        fileUrl: body.fileUrl || null,
        status: 'submitted',
        submittedAt: new Date(),
      })
      .where(eq(submissions.id, existing.id))
    return { message: 'Tugas berhasil diperbarui' }
  }

  await db.insert(submissions).values({
    assignmentId,
    studentId: student.studentId,
    content: body.content || null,
    fileUrl: body.fileUrl || null,
  })

  return { message: 'Tugas berhasil dikumpulkan' }
})
