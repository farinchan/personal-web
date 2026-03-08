import AdmZip from 'adm-zip'
import { join } from 'path'
import { mkdir, writeFile, readdir, rm } from 'fs/promises'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'File backup tidak ditemukan' })
  }

  const file = formData[0]
  if (!file || !file.type?.includes('zip')) {
    throw createError({ statusCode: 400, statusMessage: 'File harus berformat ZIP' })
  }

  // Max 100MB
  if (file.data.length > 100 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: 'Ukuran file maksimal 100MB' })
  }

  try {
    const zip = new AdmZip(file.data)
    const entries = zip.getEntries()

    const uploadsDir = getUploadsDir()
    await mkdir(uploadsDir, { recursive: true })

    // Count files before restore
    let existingFiles = 0
    if (existsSync(uploadsDir)) {
      existingFiles = (await readdir(uploadsDir)).length
    }

    let restoredCount = 0

    for (const entry of entries) {
      if (entry.isDirectory) continue

      // Extract filename (handle both "uploads/file.jpg" and "file.jpg")
      const name = entry.entryName.replace(/^uploads\//, '')
      if (!name || name.includes('..')) continue

      // Only allow image files
      const ext = name.split('.').pop()?.toLowerCase()
      if (!ext || !['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'].includes(ext)) continue

      const destPath = join(uploadsDir, name)
      const data = entry.getData()
      await writeFile(destPath, data)
      restoredCount++
    }

    return {
      success: true,
      message: `${restoredCount} file berhasil di-restore`,
      restoredCount,
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal restore file: ${err.message}`,
    })
  }
})
