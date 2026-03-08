import AdmZip from 'adm-zip'
import { sql } from 'drizzle-orm'
import { join } from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { posts, tags, postTags, postLikes, comments, messages, profile, cvSections, adminUsers } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()!

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'File backup tidak ditemukan' })
  }

  const file = formData[0]
  if (!file || !file.type?.includes('zip')) {
    throw createError({ statusCode: 400, statusMessage: 'File harus berformat ZIP' })
  }

  if (file.data.length > 100 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: 'Ukuran file maksimal 100MB' })
  }

  try {
    const zip = new AdmZip(file.data)

    // Restore database from database.json in the zip
    const dbEntry = zip.getEntry('database.json')
    if (!dbEntry) {
      throw createError({ statusCode: 400, statusMessage: 'File database.json tidak ditemukan dalam ZIP' })
    }

    const backup = JSON.parse(dbEntry.getData().toString('utf-8'))
    if (!backup.meta || !backup.data) {
      throw createError({ statusCode: 400, statusMessage: 'Format backup tidak valid' })
    }

    const data = backup.data

    // Restore database
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`)

    await db.delete(postTags)
    await db.delete(postLikes)
    await db.delete(comments)
    await db.delete(posts)
    await db.delete(tags)
    await db.delete(messages)
    await db.delete(profile)
    await db.delete(cvSections)
    await db.delete(adminUsers)

    if (data.adminUsers?.length) {
      await db.insert(adminUsers).values(data.adminUsers)
    }
    if (data.profile?.length) {
      await db.insert(profile).values(data.profile)
    }
    if (data.tags?.length) {
      await db.insert(tags).values(data.tags)
    }
    if (data.posts?.length) {
      await db.insert(posts).values(
        data.posts.map((p: any) => ({
          ...p,
          publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })),
      )
    }
    if (data.postTags?.length) {
      await db.insert(postTags).values(data.postTags)
    }
    if (data.postLikes?.length) {
      await db.insert(postLikes).values(
        data.postLikes.map((l: any) => ({
          ...l,
          createdAt: new Date(l.createdAt),
        })),
      )
    }
    if (data.comments?.length) {
      await db.insert(comments).values(
        data.comments.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })),
      )
    }
    if (data.messages?.length) {
      await db.insert(messages).values(
        data.messages.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
        })),
      )
    }
    if (data.cvSections?.length) {
      await db.insert(cvSections).values(data.cvSections)
    }

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`)

    // Restore uploaded files
    const uploadsDir = getUploadsDir()
    await mkdir(uploadsDir, { recursive: true })

    let restoredFiles = 0
    const entries = zip.getEntries()

    for (const entry of entries) {
      if (entry.isDirectory || entry.entryName === 'database.json') continue

      const name = entry.entryName.replace(/^uploads\//, '')
      if (!name || name.includes('..')) continue

      const ext = name.split('.').pop()?.toLowerCase()
      if (!ext || !['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'].includes(ext)) continue

      const destPath = join(uploadsDir, name)
      await writeFile(destPath, entry.getData())
      restoredFiles++
    }

    return {
      success: true,
      message: 'Full restore berhasil',
      tables: backup.meta.tables,
      restoredFiles,
    }
  } catch (err: any) {
    try {
      const db2 = useDB()!
      await db2.execute(sql`SET FOREIGN_KEY_CHECKS = 1`)
    } catch {}
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal restore: ${err.message}`,
    })
  }
})
