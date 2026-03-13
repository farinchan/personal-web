import { eq, sql } from 'drizzle-orm'
import { courses, courseModules, materials, assignments, exams, examQuestions, enrollments, students } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))

  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID diperlukan' })

  const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1)
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })

  // Modules with materials, assignments, exams
  const modules = await db.select().from(courseModules).where(eq(courseModules.courseId, id)).orderBy(courseModules.sortOrder)

  const modulesDetail = await Promise.all(modules.map(async (mod) => {
    const mats = await db.select().from(materials).where(eq(materials.moduleId, mod.id)).orderBy(materials.sortOrder)
    const assigns = await db.select().from(assignments).where(eq(assignments.moduleId, mod.id)).orderBy(assignments.sortOrder)
    const exs = await db.select().from(exams).where(eq(exams.moduleId, mod.id)).orderBy(exams.sortOrder)

    // Get questions for each exam
    const exsWithQuestions = await Promise.all(exs.map(async (ex) => {
      const questions = await db.select().from(examQuestions).where(eq(examQuestions.examId, ex.id)).orderBy(examQuestions.sortOrder)
      return { ...ex, questions }
    }))

    return { ...mod, materials: mats, assignments: assigns, exams: exsWithQuestions }
  }))

  // Enrolled students
  const enrolledStudents = await db
    .select({
      enrollmentId: enrollments.id,
      role: enrollments.role,
      progress: enrollments.progress,
      enrolledAt: enrollments.enrolledAt,
      completedAt: enrollments.completedAt,
      studentId: students.id,
      name: students.name,
      username: students.username,
      email: students.email,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.courseId, id))

  return { course, modules: modulesDetail, students: enrolledStudents }
})
