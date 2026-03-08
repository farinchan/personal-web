import AdmZip from 'adm-zip'
import { join } from 'path'
import { readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const uploadsDir = getUploadsDir()

  if (!existsSync(uploadsDir)) {
    throw createError({ statusCode: 404, statusMessage: 'Folder uploads tidak ditemukan' })
  }

  const files = await readdir(uploadsDir)
  if (files.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Tidak ada file untuk di-backup' })
  }

  const zip = new AdmZip()

  for (const file of files) {
    const filePath = join(uploadsDir, file)
    const fileStat = await stat(filePath)
    if (fileStat.isFile()) {
      zip.addLocalFile(filePath, 'uploads')
    }
  }

  const buffer = zip.toBuffer()
  const filename = `files-backup-${new Date().toISOString().slice(0, 10)}.zip`

  setHeaders(event, {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': String(buffer.length),
  })

  return buffer
})
