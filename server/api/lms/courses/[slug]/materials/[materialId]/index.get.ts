import { eq, and, sql } from 'drizzle-orm'
import { materials, courseModules, courses, enrollments, materialProgress, posts } from '../../../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const student = await requireStudentSession(event)
  const slug = getRouterParam(event, 'slug')
  const materialId = Number(getRouterParam(event, 'materialId'))

  if (!slug || !materialId) throw createError({ statusCode: 400, statusMessage: 'Parameter tidak lengkap' })

  // Get course and verify enrollment
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.courseId, course.id), eq(enrollments.studentId, student.studentId)))
    .limit(1)

  if (!enrollment) throw createError({ statusCode: 403, statusMessage: 'Anda belum terdaftar di course ini' })

  // Get material with module verification
  const [material] = await db
    .select({
      id: materials.id,
      moduleId: materials.moduleId,
      title: materials.title,
      type: materials.type,
      body: materials.body,
      postId: materials.postId,
      videoUrl: materials.videoUrl,
      fileUrl: materials.fileUrl,
      duration: materials.duration,
      sortOrder: materials.sortOrder,
    })
    .from(materials)
    .innerJoin(courseModules, eq(materials.moduleId, courseModules.id))
    .where(and(eq(materials.id, materialId), eq(courseModules.courseId, course.id)))
    .limit(1)

  if (!material) throw createError({ statusCode: 404, statusMessage: 'Materi tidak ditemukan' })

  // If type is 'post', pull body from posts table
  let body = material.body
  if (material.type === 'post' && material.postId) {
    const [post] = await db.select({ body: posts.body }).from(posts).where(eq(posts.id, material.postId)).limit(1)
    if (post) body = post.body
  }

  // Get progress
  const [progress] = await db
    .select()
    .from(materialProgress)
    .where(and(eq(materialProgress.materialId, materialId), eq(materialProgress.studentId, student.studentId)))
    .limit(1)

  return {
    material: { ...material, body },
    completed: progress?.completed || false,
  }
})
