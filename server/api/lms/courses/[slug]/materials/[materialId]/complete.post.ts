import { eq, and, sql } from 'drizzle-orm'
import { materialProgress, courseModules, materials, courses, enrollments } from '../../../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const student = await requireStudentSession(event)
  const slug = getRouterParam(event, 'slug')
  const materialId = Number(getRouterParam(event, 'materialId'))

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

  // Verify material belongs to course
  const [material] = await db
    .select({ id: materials.id })
    .from(materials)
    .innerJoin(courseModules, eq(materials.moduleId, courseModules.id))
    .where(and(eq(materials.id, materialId), eq(courseModules.courseId, course.id)))
    .limit(1)
  if (!material) throw createError({ statusCode: 404, statusMessage: 'Materi tidak ditemukan' })

  // Upsert progress
  const [existing] = await db
    .select()
    .from(materialProgress)
    .where(and(eq(materialProgress.materialId, materialId), eq(materialProgress.studentId, student.studentId)))
    .limit(1)

  if (existing) {
    await db.update(materialProgress)
      .set({ completed: true, completedAt: new Date() })
      .where(eq(materialProgress.id, existing.id))
  } else {
    await db.insert(materialProgress).values({
      materialId,
      studentId: student.studentId,
      completed: true,
      completedAt: new Date(),
    })
  }

  // Recalculate course progress
  const [{ totalMaterials }] = await db
    .select({ totalMaterials: sql<number>`COUNT(*)` })
    .from(materials)
    .innerJoin(courseModules, eq(materials.moduleId, courseModules.id))
    .where(eq(courseModules.courseId, course.id))

  const [{ completedMaterials }] = await db
    .select({ completedMaterials: sql<number>`COUNT(*)` })
    .from(materialProgress)
    .innerJoin(materials, eq(materialProgress.materialId, materials.id))
    .innerJoin(courseModules, eq(materials.moduleId, courseModules.id))
    .where(and(
      eq(courseModules.courseId, course.id),
      eq(materialProgress.studentId, student.studentId),
      eq(materialProgress.completed, true),
    ))

  const progress = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 10000) / 100 : 0

  await db.update(enrollments)
    .set({
      progress: String(progress),
      ...(progress >= 100 ? { completedAt: new Date() } : {}),
    })
    .where(eq(enrollments.id, enrollment.id))

  return { progress }
})
