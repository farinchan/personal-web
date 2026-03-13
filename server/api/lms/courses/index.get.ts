import { eq, and, sql, desc } from 'drizzle-orm'
import { courses, enrollments } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12))
  const offset = (page - 1) * limit

  // Public courses only (active status)
  const rows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      description: courses.description,
      coverImage: courses.coverImage,
      visibility: courses.visibility,
      status: courses.status,
      createdAt: courses.createdAt,
      studentCount: sql<number>`(SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id AND role = 'student')`,
    })
    .from(courses)
    .where(and(eq(courses.visibility, 'public'), eq(courses.status, 'active')))
    .orderBy(desc(courses.createdAt))
    .limit(limit)
    .offset(offset)

  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(courses)
    .where(and(eq(courses.visibility, 'public'), eq(courses.status, 'active')))

  return { courses: rows, total, page, limit }
})
