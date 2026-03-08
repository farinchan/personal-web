import { backupJobs } from '../../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()!

  const jobs = await db.select({
    id: backupJobs.id,
    name: backupJobs.name,
    provider: backupJobs.provider,
    folderId: backupJobs.folderId,
    backupType: backupJobs.backupType,
    schedule: backupJobs.schedule,
    enabled: backupJobs.enabled,
    lastBackupAt: backupJobs.lastBackupAt,
    lastBackupStatus: backupJobs.lastBackupStatus,
    hasToken: backupJobs.refreshToken,
    createdAt: backupJobs.createdAt,
  }).from(backupJobs)

  return jobs.map((j) => ({
    ...j,
    connected: !!j.hasToken,
    hasToken: undefined,
  }))
})
