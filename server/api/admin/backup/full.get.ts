import AdmZip from 'adm-zip'
import { join } from 'path'
import { readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { posts, tags, postTags, postLikes, comments, messages, profile, cvSections, adminUsers } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()!

  // Export database
  const [
    postsData,
    tagsData,
    postTagsData,
    postLikesData,
    commentsData,
    messagesData,
    profileData,
    cvSectionsData,
    adminUsersData,
  ] = await Promise.all([
    db.select().from(posts),
    db.select().from(tags),
    db.select().from(postTags),
    db.select().from(postLikes),
    db.select().from(comments),
    db.select().from(messages),
    db.select().from(profile),
    db.select().from(cvSections),
    db.select().from(adminUsers),
  ])

  const dbBackup = {
    meta: {
      version: 1,
      createdAt: new Date().toISOString(),
      tables: {
        posts: postsData.length,
        tags: tagsData.length,
        postTags: postTagsData.length,
        postLikes: postLikesData.length,
        comments: commentsData.length,
        messages: messagesData.length,
        profile: profileData.length,
        cvSections: cvSectionsData.length,
        adminUsers: adminUsersData.length,
      },
    },
    data: {
      posts: postsData,
      tags: tagsData,
      postTags: postTagsData,
      postLikes: postLikesData,
      comments: commentsData,
      messages: messagesData,
      profile: profileData,
      cvSections: cvSectionsData,
      adminUsers: adminUsersData,
    },
  }

  const zip = new AdmZip()

  // Add database JSON
  zip.addFile('database.json', Buffer.from(JSON.stringify(dbBackup, null, 2), 'utf-8'))

  // Add uploaded files
  const uploadsDir = getUploadsDir()
  if (existsSync(uploadsDir)) {
    const files = await readdir(uploadsDir)
    for (const file of files) {
      const filePath = join(uploadsDir, file)
      const fileStat = await stat(filePath)
      if (fileStat.isFile()) {
        zip.addLocalFile(filePath, 'uploads')
      }
    }
  }

  const buffer = zip.toBuffer()
  const filename = `full-backup-${new Date().toISOString().slice(0, 10)}.zip`

  setHeaders(event, {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': String(buffer.length),
  })

  return buffer
})
