import { sql } from 'drizzle-orm'
import { posts, tags, postTags, postLikes, comments, messages, profile, cvSections, adminUsers } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()!

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'File backup tidak ditemukan' })
  }

  const file = formData[0]
  if (!file || !file.type?.includes('json')) {
    throw createError({ statusCode: 400, statusMessage: 'File harus berformat JSON' })
  }

  let backup: any
  try {
    backup = JSON.parse(file.data.toString('utf-8'))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'File JSON tidak valid' })
  }

  if (!backup.meta || !backup.data) {
    throw createError({ statusCode: 400, statusMessage: 'Format backup tidak valid' })
  }

  const data = backup.data

  try {
    // Disable FK checks for clean restore
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`)

    // Clear all tables in reverse dependency order
    await db.delete(postTags)
    await db.delete(postLikes)
    await db.delete(comments)
    await db.delete(posts)
    await db.delete(tags)
    await db.delete(messages)
    await db.delete(profile)
    await db.delete(cvSections)
    await db.delete(adminUsers)

    // Insert in dependency order
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

    return {
      success: true,
      message: 'Database berhasil di-restore',
      tables: backup.meta.tables,
    }
  } catch (err: any) {
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal restore database: ${err.message}`,
    })
  }
})
