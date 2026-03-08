import { eq } from 'drizzle-orm'
import { backupJobs } from '../../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()!
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const [existing] = await db.select().from(backupJobs).where(eq(backupJobs.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Job tidak ditemukan' })
  }

  const updates: any = { updatedAt: new Date() }

  if (body.name !== undefined) updates.name = body.name
  if (body.folderId !== undefined) updates.folderId = body.folderId || null
  if (body.backupType !== undefined) updates.backupType = body.backupType
  if (body.schedule !== undefined) updates.schedule = body.schedule
  if (body.enabled !== undefined) updates.enabled = body.enabled

  // If client credentials change, reset tokens
  if (body.clientId && body.clientId !== existing.clientId) {
    updates.clientId = body.clientId
    updates.accessToken = null
    updates.refreshToken = null
    updates.tokenExpiry = null
  }
  if (body.clientSecret && body.clientSecret !== existing.clientSecret) {
    updates.clientSecret = body.clientSecret
    updates.accessToken = null
    updates.refreshToken = null
    updates.tokenExpiry = null
  }

  await db.update(backupJobs).set(updates).where(eq(backupJobs.id, id))

  return { message: 'Backup job berhasil diperbarui' }
})
