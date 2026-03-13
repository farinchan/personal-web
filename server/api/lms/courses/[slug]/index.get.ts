import { eq, sql } from 'drizzle-orm'
import { courses, enrollments, courseModules, materials, assignments, exams } from '../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'slug')

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug diperlukan' })

  const [course] = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      description: courses.description,
      coverImage: courses.coverImage,
      visibility: courses.visibility,
      status: courses.status,
      maxStudents: courses.maxStudents,
      createdAt: courses.createdAt,
      studentCount: sql<number>`(SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id AND role = 'student')`,
      moduleCount: sql<number>`(SELECT COUNT(*) FROM course_modules WHERE course_id = courses.id)`,
      materialCount: sql<number>`(SELECT COUNT(*) FROM materials m JOIN course_modules cm ON m.module_id = cm.id WHERE cm.course_id = courses.id)`,
    })
    .from(courses)
    .where(eq(courses.slug, slug))
    .limit(1)

  if (!course) {
    throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })
  }

  // Get modules with materials
  const modules = await db
    .select()
    .from(courseModules)
    .where(eq(courseModules.courseId, course.id))
    .orderBy(courseModules.sortOrder)

  const modulesWithMaterials = await Promise.all(
    modules.map(async (mod) => {
      const mats = await db
        .select({
          id: materials.id,
          title: materials.title,
          type: materials.type,
          duration: materials.duration,
          sortOrder: materials.sortOrder,
        })
        .from(materials)
        .where(eq(materials.moduleId, mod.id))
        .orderBy(materials.sortOrder)

      const assigns = await db
        .select({
          id: assignments.id,
          title: assignments.title,
          maxScore: assignments.maxScore,
          dueDate: assignments.dueDate,
          sortOrder: assignments.sortOrder,
        })
        .from(assignments)
        .where(eq(assignments.moduleId, mod.id))
        .orderBy(assignments.sortOrder)

      const exs = await db
        .select({
          id: exams.id,
          title: exams.title,
          duration: exams.duration,
          passingScore: exams.passingScore,
          isActive: exams.isActive,
          sortOrder: exams.sortOrder,
        })
        .from(exams)
        .where(eq(exams.moduleId, mod.id))
        .orderBy(exams.sortOrder)

      return { ...mod, materials: mats, assignments: assigns, exams: exs }
    })
  )

  // Check enrollment if student is logged in
  const student = await getStudentSession(event)
  let enrollment = null
  if (student) {
    const [enr] = await db
      .select()
      .from(enrollments)
      .where(
        sql`${enrollments.courseId} = ${course.id} AND ${enrollments.studentId} = ${student.studentId}`
      )
      .limit(1)
    enrollment = enr || null
  }

  return { course, modules: modulesWithMaterials, enrollment }
})
