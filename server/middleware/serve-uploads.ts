import { join } from 'path'
import { readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  // Only handle /uploads/* requests
  if (!pathname.startsWith('/uploads/')) return

  // Only handle GET/HEAD
  const method = event.method.toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') return

  // Extract filename from path
  const filename = pathname.slice('/uploads/'.length).replace(/\.\./g, '').replace(/^\/+/, '')
  if (!filename || filename.includes('..')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file path' })
  }

  const filePath = join(getUploadsDir(), filename)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const fileStat = await stat(filePath)
  if (!fileStat.isFile()) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  const buffer = await readFile(filePath)

  setResponseStatus(event, 200)
  setHeaders(event, {
    'Content-Type': contentType,
    'Content-Length': String(buffer.length),
    'Cache-Control': 'public, max-age=31536000, immutable',
  })

  // Send binary response and end — required in middleware to prevent passing to next handler
  return send(event, buffer, contentType)
})
