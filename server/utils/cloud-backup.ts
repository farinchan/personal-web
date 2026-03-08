import { google } from 'googleapis'
import { eq } from 'drizzle-orm'
import { backupJobs } from '../../db/schema'
import { Readable } from 'stream'

interface CloudJob {
  id: number
  provider: 'google_drive' | 'onedrive'
  clientId: string
  clientSecret: string
  accessToken: string | null
  refreshToken: string | null
  tokenExpiry: Date | null
  folderId: string | null
}

// ─── Google Drive ────────────────────────────────────────────

function getGoogleRedirectUri() {
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${siteUrl}/api/admin/backup/oauth/google_drive/callback`
}

export function getGoogleAuthUrl(job: CloudJob, state: string): string {
  const oauth2 = new google.auth.OAuth2(job.clientId, job.clientSecret, getGoogleRedirectUri())
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    state,
  })
}

export async function handleGoogleCallback(job: CloudJob, code: string) {
  const oauth2 = new google.auth.OAuth2(job.clientId, job.clientSecret, getGoogleRedirectUri())
  const { tokens } = await oauth2.getToken(code)

  const db = useDB()!
  await db.update(backupJobs).set({
    accessToken: tokens.access_token || null,
    refreshToken: tokens.refresh_token || null,
    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    updatedAt: new Date(),
  }).where(eq(backupJobs.id, job.id))

  return tokens
}

async function getGoogleDriveClient(job: CloudJob) {
  const oauth2 = new google.auth.OAuth2(job.clientId, job.clientSecret, getGoogleRedirectUri())

  oauth2.setCredentials({
    access_token: job.accessToken,
    refresh_token: job.refreshToken,
    expiry_date: job.tokenExpiry?.getTime(),
  })

  // Auto-refresh if expired
  if (job.tokenExpiry && job.tokenExpiry.getTime() < Date.now()) {
    const { credentials } = await oauth2.refreshAccessToken()
    const db = useDB()!
    await db.update(backupJobs).set({
      accessToken: credentials.access_token || null,
      refreshToken: credentials.refresh_token || job.refreshToken,
      tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
      updatedAt: new Date(),
    }).where(eq(backupJobs.id, job.id))
  }

  return google.drive({ version: 'v3', auth: oauth2 })
}

export async function uploadToGoogleDrive(job: CloudJob, buffer: Buffer, filename: string, mimeType: string) {
  const drive = await getGoogleDriveClient(job)

  const fileMetadata: any = { name: filename }
  if (job.folderId) {
    fileMetadata.parents = [job.folderId]
  }

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, name, size, webViewLink',
  })

  return {
    fileId: res.data.id,
    fileName: res.data.name,
    size: res.data.size,
    link: res.data.webViewLink,
  }
}

// ─── OneDrive (Microsoft Graph) ──────────────────────────────

function getOneDriveRedirectUri() {
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${siteUrl}/api/admin/backup/oauth/onedrive/callback`
}

export function getOneDriveAuthUrl(job: CloudJob, state: string): string {
  const params = new URLSearchParams({
    client_id: job.clientId,
    response_type: 'code',
    redirect_uri: getOneDriveRedirectUri(),
    scope: 'Files.ReadWrite offline_access',
    state,
    response_mode: 'query',
  })
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
}

export async function handleOneDriveCallback(job: CloudJob, code: string) {
  const res = await $fetch<any>('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: job.clientId,
      client_secret: job.clientSecret,
      code,
      redirect_uri: getOneDriveRedirectUri(),
      grant_type: 'authorization_code',
      scope: 'Files.ReadWrite offline_access',
    }).toString(),
  })

  const db = useDB()!
  await db.update(backupJobs).set({
    accessToken: res.access_token,
    refreshToken: res.refresh_token || null,
    tokenExpiry: new Date(Date.now() + (res.expires_in || 3600) * 1000),
    updatedAt: new Date(),
  }).where(eq(backupJobs.id, job.id))

  return res
}

async function getOneDriveAccessToken(job: CloudJob): Promise<string> {
  // Refresh if expired
  if (job.tokenExpiry && job.tokenExpiry.getTime() < Date.now() && job.refreshToken) {
    const res = await $fetch<any>('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: job.clientId,
        client_secret: job.clientSecret,
        refresh_token: job.refreshToken,
        grant_type: 'refresh_token',
        scope: 'Files.ReadWrite offline_access',
      }).toString(),
    })

    const db = useDB()!
    await db.update(backupJobs).set({
      accessToken: res.access_token,
      refreshToken: res.refresh_token || job.refreshToken,
      tokenExpiry: new Date(Date.now() + (res.expires_in || 3600) * 1000),
      updatedAt: new Date(),
    }).where(eq(backupJobs.id, job.id))

    return res.access_token
  }

  return job.accessToken!
}

export async function uploadToOneDrive(job: CloudJob, buffer: Buffer, filename: string, _mimeType: string) {
  const accessToken = await getOneDriveAccessToken(job)
  const folderPath = job.folderId || 'Backups'
  const uploadPath = `${folderPath}/${filename}`

  if (buffer.length < 4 * 1024 * 1024) {
    // Simple upload for < 4MB
    const res = await $fetch<any>(`https://graph.microsoft.com/v1.0/me/drive/root:/${uploadPath}:/content`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: buffer,
    })
    return {
      fileId: res.id,
      fileName: res.name,
      size: String(res.size),
      link: res.webUrl,
    }
  }

  // Upload session for large files
  const session = await $fetch<any>(`https://graph.microsoft.com/v1.0/me/drive/root:/${uploadPath}:/createUploadSession`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: { item: { name: filename } },
  })

  const uploadUrl = session.uploadUrl
  const chunkSize = 4 * 1024 * 1024 // 4MB chunks
  let offset = 0
  let result: any = null

  while (offset < buffer.length) {
    const end = Math.min(offset + chunkSize, buffer.length)
    const chunk = buffer.subarray(offset, end)

    result = await $fetch<any>(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${offset}-${end - 1}/${buffer.length}`,
        'Content-Length': String(chunk.length),
      },
      body: chunk,
    })

    offset = end
  }

  return {
    fileId: result?.id,
    fileName: result?.name,
    size: String(result?.size || buffer.length),
    link: result?.webUrl,
  }
}

// ─── Generic Upload ──────────────────────────────────────────

export async function uploadToCloud(job: CloudJob, buffer: Buffer, filename: string, mimeType: string) {
  if (job.provider === 'google_drive') {
    return uploadToGoogleDrive(job, buffer, filename, mimeType)
  } else {
    return uploadToOneDrive(job, buffer, filename, mimeType)
  }
}
