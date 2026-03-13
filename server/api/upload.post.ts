import { writeFile, mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  // Allow both admin and student sessions
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Login diperlukan' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  const file = formData[0]
  if (!file || !file.filename) {
    throw createError({ statusCode: 400, statusMessage: 'File tidak valid' })
  }

  // Max 10MB
  if (file.data.length > 10 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: 'Ukuran file maksimal 10MB' })
  }

  const ext = file.filename?.split('.').pop() || 'png'
  const filename = `${randomUUID()}.${ext}`

  const uploadDir = getUploadsDir()
  await mkdir(uploadDir, { recursive: true })

  const filePath = `${uploadDir}/${filename}`
  await writeFile(filePath, file.data)

  return { url: `/uploads/${filename}` }
})
