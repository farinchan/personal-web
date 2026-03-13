import { eq, and, desc } from 'drizzle-orm'
import { submissions, students, assignments, courseModules } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const query = getQuery(event)
  const courseId = Number(query.courseId)

  if (!courseId) throw createError({ statusCode: 400, statusMessage: 'courseId diperlukan' })

  const rows = await db
    .select({
      id: submissions.id,
      content: submissions.content,
      fileUrl: submissions.fileUrl,
      score: submissions.score,
      feedback: submissions.feedback,
      status: submissions.status,
      submittedAt: submissions.submittedAt,
      gradedAt: submissions.gradedAt,
      studentName: students.name,
      studentUsername: students.username,
      assignmentTitle: assignments.title,
      maxScore: assignments.maxScore,
    })
    .from(submissions)
    .innerJoin(students, eq(submissions.studentId, students.id))
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .innerJoin(courseModules, eq(assignments.moduleId, courseModules.id))
    .where(eq(courseModules.courseId, courseId))
    .orderBy(desc(submissions.submittedAt))

  return { submissions: rows }
})
