import { eq, and, ne, isNotNull } from 'drizzle-orm'
import { backupJobs } from '../../db/schema'

export default defineNitroPlugin((nitro) => {
  // Check for scheduled backup jobs every hour
  const interval = setInterval(async () => {
    try {
      await runScheduledBackups()
    } catch (err) {
      console.error('[Backup Scheduler] Error:', err)
    }
  }, 60 * 60 * 1000) // every hour

  nitro.hooks.hook('close', () => {
    clearInterval(interval)
  })

  // Also run once shortly after startup (30s delay)
  setTimeout(async () => {
    try {
      await runScheduledBackups()
    } catch (err) {
      console.error('[Backup Scheduler] Startup check error:', err)
    }
  }, 30 * 1000)
})

async function runScheduledBackups() {
  let db: ReturnType<typeof useDB>
  try {
    db = useDB()
  } catch {
    return // DB not ready yet
  }
  if (!db) return

  const jobs = await db
    .select()
    .from(backupJobs)
    .where(
      and(
        eq(backupJobs.enabled, true),
        ne(backupJobs.schedule, 'disabled'),
        isNotNull(backupJobs.refreshToken),
      ),
    )

  for (const job of jobs) {
    if (!isDue(job)) continue

    console.log(`[Backup Scheduler] Running scheduled backup: ${job.name} (${job.provider})`)

    try {
      let buffer: Buffer
      let filename: string
      let mimeType: string
      const dateStr = new Date().toISOString().slice(0, 10)

      if (job.backupType === 'database') {
        buffer = await generateDatabaseBackup()
        filename = `db-backup-${dateStr}.json`
        mimeType = 'application/json'
      } else if (job.backupType === 'files') {
        buffer = await generateFilesBackup()
        filename = `files-backup-${dateStr}.zip`
        mimeType = 'application/zip'
      } else {
        buffer = await generateFullBackup()
        filename = `full-backup-${dateStr}.zip`
        mimeType = 'application/zip'
      }

      await uploadToCloud(job, buffer, filename, mimeType)

      const sizeStr = buffer.length < 1024 * 1024
        ? `${(buffer.length / 1024).toFixed(1)} KB`
        : `${(buffer.length / (1024 * 1024)).toFixed(1)} MB`

      await db.update(backupJobs).set({
        lastBackupAt: new Date(),
        lastBackupStatus: `Berhasil (otomatis) — ${filename} (${sizeStr})`,
        updatedAt: new Date(),
      }).where(eq(backupJobs.id, job.id))

      console.log(`[Backup Scheduler] ✓ ${job.name} completed`)
    } catch (err: any) {
      console.error(`[Backup Scheduler] ✗ ${job.name} failed:`, err.message)

      await db.update(backupJobs).set({
        lastBackupAt: new Date(),
        lastBackupStatus: `Gagal (otomatis) — ${err.message}`,
        updatedAt: new Date(),
      }).where(eq(backupJobs.id, job.id))
    }
  }
}

function isDue(job: typeof backupJobs.$inferSelect): boolean {
  if (!job.schedule || job.schedule === 'disabled') return false

  const now = new Date()
  const last = job.lastBackupAt ? new Date(job.lastBackupAt) : null

  if (!last) return true // never backed up

  const diffMs = now.getTime() - last.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  switch (job.schedule) {
    case 'daily':
      return diffHours >= 23 // at least ~23 hours gap
    case 'weekly':
      return diffHours >= 167 // at least ~7 days
    case 'monthly':
      return diffHours >= 719 // at least ~30 days
    default:
      return false
  }
}
