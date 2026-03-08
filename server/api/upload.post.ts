import { writeFile, mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  const file = formData[0]
  if (!file || !file.type?.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'File harus berupa gambar' })
  }

  // Max 5MB
  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: 'Ukuran file maksimal 5MB' })
  }

  const ext = file.filename?.split('.').pop() || 'png'
  const filename = `${randomUUID()}.${ext}`

  const uploadDir = getUploadsDir()
  await mkdir(uploadDir, { recursive: true })

  const filePath = `${uploadDir}/${filename}`
  await writeFile(filePath, file.data)

  return { url: `/uploads/${filename}` }
})
