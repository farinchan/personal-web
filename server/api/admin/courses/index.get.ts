import { eq, desc, sql } from 'drizzle-orm'
import { courses } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()

  const rows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      description: courses.description,
      coverImage: courses.coverImage,
      visibility: courses.visibility,
      inviteCode: courses.inviteCode,
      maxStudents: courses.maxStudents,
      status: courses.status,
      createdAt: courses.createdAt,
      studentCount: sql<number>`(SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id AND role = 'student')`,
    })
    .from(courses)
    .orderBy(desc(courses.createdAt))

  return rows
})
