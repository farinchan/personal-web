import { eq } from 'drizzle-orm'
import { backupJobs } from '../../../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()!
  const id = Number(getRouterParam(event, 'id'))

  const [job] = await db.select().from(backupJobs).where(eq(backupJobs.id, id))
  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job tidak ditemukan' })
  }

  if (!job.refreshToken) {
    throw createError({ statusCode: 400, statusMessage: 'Akun cloud belum terhubung. Hubungkan terlebih dahulu.' })
  }

  try {
    // Generate backup based on type
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

    // Upload to cloud
    const result = await uploadToCloud(job, buffer, filename, mimeType)

    // Update job status
    await db.update(backupJobs).set({
      lastBackupAt: new Date(),
      lastBackupStatus: `Berhasil — ${filename} (${formatBytes(buffer.length)})`,
      updatedAt: new Date(),
    }).where(eq(backupJobs.id, id))

    return {
      success: true,
      message: `Backup berhasil diupload ke ${job.provider === 'google_drive' ? 'Google Drive' : 'OneDrive'}`,
      file: result,
    }
  } catch (err: any) {
    // Save error status
    await db.update(backupJobs).set({
      lastBackupAt: new Date(),
      lastBackupStatus: `Gagal — ${err.message}`,
      updatedAt: new Date(),
    }).where(eq(backupJobs.id, id))

    throw createError({
      statusCode: 500,
      statusMessage: `Gagal upload backup: ${err.message}`,
    })
  }
})

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
