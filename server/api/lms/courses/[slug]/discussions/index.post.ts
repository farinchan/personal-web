import { eq, and } from 'drizzle-orm'
import { discussions, materials, courseModules, courses, enrollments } from '../../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const student = await requireStudentSession(event)
  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug diperlukan' })
  if (!body.materialId || !body.body) throw createError({ statusCode: 400, statusMessage: 'Materi dan isi diskusi wajib diisi' })

  // Verify enrollment
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.courseId, course.id), eq(enrollments.studentId, student.studentId)))
    .limit(1)
  if (!enrollment) throw createError({ statusCode: 403, statusMessage: 'Belum terdaftar' })

  // Verify material belongs to course
  const [material] = await db
    .select({ id: materials.id })
    .from(materials)
    .innerJoin(courseModules, eq(materials.moduleId, courseModules.id))
    .where(and(eq(materials.id, body.materialId), eq(courseModules.courseId, course.id)))
    .limit(1)
  if (!material) throw createError({ statusCode: 404, statusMessage: 'Materi tidak ditemukan' })

  await db.insert(discussions).values({
    materialId: body.materialId,
    studentId: student.studentId,
    parentId: body.parentId || null,
    body: body.body,
    isInstructor: enrollment.role === 'instructor',
  })

  return { message: 'Diskusi berhasil ditambahkan' }
})
