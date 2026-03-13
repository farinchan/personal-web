import { eq, desc, sql } from 'drizzle-orm'
import { enrollments, courses } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const student = await requireStudentSession(event)

  const rows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      description: courses.description,
      coverImage: courses.coverImage,
      status: courses.status,
      role: enrollments.role,
      progress: enrollments.progress,
      enrolledAt: enrollments.enrolledAt,
      completedAt: enrollments.completedAt,
      studentCount: sql<number>`(SELECT COUNT(*) FROM enrollments e2 WHERE e2.course_id = courses.id AND e2.role = 'student')`,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.studentId, student.studentId))
    .orderBy(desc(enrollments.enrolledAt))

  return { courses: rows }
})
