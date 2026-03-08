import { eq } from 'drizzle-orm'
import { backupJobs } from '../../../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()!
  const provider = getRouterParam(event, 'provider') as string
  const query = getQuery(event)
  const jobId = Number(query.jobId)

  if (!jobId) {
    throw createError({ statusCode: 400, statusMessage: 'jobId wajib diisi' })
  }

  const [job] = await db.select().from(backupJobs).where(eq(backupJobs.id, jobId))
  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job tidak ditemukan' })
  }

  const state = String(jobId)

  if (provider === 'google_drive') {
    const url = getGoogleAuthUrl(job, state)
    return sendRedirect(event, url)
  } else if (provider === 'onedrive') {
    const url = getOneDriveAuthUrl(job, state)
    return sendRedirect(event, url)
  }

  throw createError({ statusCode: 400, statusMessage: 'Provider tidak valid' })
})
