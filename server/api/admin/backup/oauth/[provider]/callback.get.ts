import { eq } from 'drizzle-orm'
import { backupJobs } from '../../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string
  const state = query.state as string
  const error = query.error as string
  const provider = getRouterParam(event, 'provider') as string

  if (error) {
    return sendRedirect(event, `/admin/backup?oauth_error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return sendRedirect(event, '/admin/backup?oauth_error=Missing+code+or+state')
  }

  const jobId = Number(state)
  const db = useDB()!

  const [job] = await db.select().from(backupJobs).where(eq(backupJobs.id, jobId))
  if (!job) {
    return sendRedirect(event, '/admin/backup?oauth_error=Job+not+found')
  }

  try {
    if (provider === 'google_drive') {
      await handleGoogleCallback(job, code)
    } else if (provider === 'onedrive') {
      await handleOneDriveCallback(job, code)
    } else {
      return sendRedirect(event, '/admin/backup?oauth_error=Invalid+provider')
    }

    return sendRedirect(event, '/admin/backup?oauth_success=1')
  } catch (err: any) {
    const msg = encodeURIComponent(err.message || 'OAuth failed')
    return sendRedirect(event, `/admin/backup?oauth_error=${msg}`)
  }
})
