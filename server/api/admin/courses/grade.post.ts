import { eq } from 'drizzle-orm'
import { submissions } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.submissionId) throw createError({ statusCode: 400, statusMessage: 'submissionId diperlukan' })
  if (body.score === undefined) throw createError({ statusCode: 400, statusMessage: 'score diperlukan' })

  await db.update(submissions).set({
    score: String(body.score),
    feedback: body.feedback || null,
    status: 'graded',
    gradedAt: new Date(),
  }).where(eq(submissions.id, body.submissionId))

  return { message: 'Penilaian berhasil disimpan' }
})
