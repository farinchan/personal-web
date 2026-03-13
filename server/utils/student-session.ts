import type { H3Event } from 'h3'

/**
 * Require a student session. Throws 401 if not logged in as student.
 */
export async function requireStudentSession(event: H3Event) {
  const session = await getUserSession(event)
  if (!session?.user || !(session.user as any).studentId) {
    throw createError({ statusCode: 401, statusMessage: 'Login diperlukan' })
  }
  return session.user as { studentId: number; name: string; username: string; email: string }
}

/**
 * Get student session if exists, null otherwise.
 */
export async function getStudentSession(event: H3Event) {
  const session = await getUserSession(event)
  if (!session?.user || !(session.user as any).studentId) return null
  return session.user as { studentId: number; name: string; username: string; email: string }
}
