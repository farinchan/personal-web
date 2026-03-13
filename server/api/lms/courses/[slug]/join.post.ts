import { eq, and, sql } from 'drizzle-orm'
import { courses, enrollments } from '../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const student = await requireStudentSession(event)
  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug diperlukan' })

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, slug))
    .limit(1)

  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })
  if (course.status !== 'active') throw createError({ statusCode: 400, statusMessage: 'Course belum aktif' })

  // Check if already enrolled
  const [existing] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.courseId, course.id), eq(enrollments.studentId, student.studentId)))
    .limit(1)

  if (existing) throw createError({ statusCode: 409, statusMessage: 'Sudah terdaftar di course ini' })

  // Check invite code for private courses
  if (course.visibility === 'private') {
    if (!body?.inviteCode || body.inviteCode !== course.inviteCode) {
      throw createError({ statusCode: 403, statusMessage: 'Kode undangan salah' })
    }
  }

  // Check max students
  if (course.maxStudents) {
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(enrollments)
      .where(and(eq(enrollments.courseId, course.id), eq(enrollments.role, 'student')))
    if (count >= course.maxStudents) {
      throw createError({ statusCode: 400, statusMessage: 'Course sudah penuh' })
    }
  }

  await db.insert(enrollments).values({
    courseId: course.id,
    studentId: student.studentId,
    role: 'student',
  })

  return { message: 'Berhasil bergabung ke course' }
})
