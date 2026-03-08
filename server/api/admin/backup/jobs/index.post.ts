import { backupJobs } from '../../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()!
  const body = await readBody(event)

  if (!body.name || !body.provider || !body.clientId || !body.clientSecret) {
    throw createError({ statusCode: 400, statusMessage: 'Nama, provider, Client ID, dan Client Secret wajib diisi' })
  }

  if (!['google_drive', 'onedrive'].includes(body.provider)) {
    throw createError({ statusCode: 400, statusMessage: 'Provider tidak valid' })
  }

  const result = await db.insert(backupJobs).values({
    name: body.name,
    provider: body.provider,
    clientId: body.clientId,
    clientSecret: body.clientSecret,
    folderId: body.folderId || null,
    backupType: body.backupType || 'full',
    schedule: body.schedule || 'disabled',
    enabled: true,
  })

  const insertId = result[0].insertId

  return { id: insertId, message: 'Backup job berhasil dibuat' }
})
