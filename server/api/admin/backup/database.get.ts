import { posts, tags, postTags, postLikes, comments, messages, profile, cvSections, adminUsers } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()!

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

  const backup = {
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

  const filename = `db-backup-${new Date().toISOString().slice(0, 10)}.json`

  setHeaders(event, {
    'Content-Type': 'application/json',
    'Content-Disposition': `attachment; filename="${filename}"`,
  })

  return backup
})
