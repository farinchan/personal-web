import { sql, eq, count, sum, desc, asc } from 'drizzle-orm'
import { posts, comments, messages, postLikes } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDB()

  if (!db) {
    throw new Error('Database connection failed')
  }

  // 1. Top posts by views (bar chart)
  const topPosts = await db
    .select({
      title: posts.title,
      viewCount: posts.viewCount,
      shareCount: posts.shareCount,
    })
    .from(posts)
    .where(eq(posts.isDraft, false))
    .orderBy(desc(posts.viewCount))
    .limit(10)

  // 2. Posts per month (line chart)
  const postsPerMonth = await db
    .select({
      month: sql<string>`DATE_FORMAT(${posts.publishedAt}, '%Y-%m')`.as('month'),
      count: count().as('count'),
    })
    .from(posts)
    .where(eq(posts.isDraft, false))
    .groupBy(sql`DATE_FORMAT(${posts.publishedAt}, '%Y-%m')`)
    .orderBy(asc(sql`DATE_FORMAT(${posts.publishedAt}, '%Y-%m')`))
    .limit(12)

  // 3. Comments per month (line chart)
  const commentsPerMonth = await db
    .select({
      month: sql<string>`DATE_FORMAT(${comments.createdAt}, '%Y-%m')`.as('month'),
      count: count().as('count'),
    })
    .from(comments)
    .groupBy(sql`DATE_FORMAT(${comments.createdAt}, '%Y-%m')`)
    .orderBy(asc(sql`DATE_FORMAT(${comments.createdAt}, '%Y-%m')`))
    .limit(12)

  // 4. Comment status distribution (doughnut chart)
  const commentStatus = await db
    .select({
      status: comments.status,
      count: count().as('count'),
    })
    .from(comments)
    .groupBy(comments.status)

  // 5. Messages per month (bar chart)
  const messagesPerMonth = await db
    .select({
      month: sql<string>`DATE_FORMAT(${messages.createdAt}, '%Y-%m')`.as('month'),
      count: count().as('count'),
    })
    .from(messages)
    .groupBy(sql`DATE_FORMAT(${messages.createdAt}, '%Y-%m')`)
    .orderBy(asc(sql`DATE_FORMAT(${messages.createdAt}, '%Y-%m')`))
    .limit(12)

  // 6. Likes per post (top 10)
  const likesPerPost = await db
    .select({
      title: posts.title,
      likes: count().as('likes'),
    })
    .from(postLikes)
    .innerJoin(posts, eq(postLikes.postId, posts.id))
    .groupBy(posts.id, posts.title)
    .orderBy(desc(count()))
    .limit(10)

  // 7. Engagement summary totals
  const [engagementTotals] = await db
    .select({
      totalViews: sum(posts.viewCount).as('totalViews'),
      totalShares: sum(posts.shareCount).as('totalShares'),
    })
    .from(posts)
    .where(eq(posts.isDraft, false))

  const [totalLikes] = await db
    .select({ count: count().as('count') })
    .from(postLikes)

  const [totalComments] = await db
    .select({ count: count().as('count') })
    .from(comments)

  return {
    topPosts,
    postsPerMonth,
    commentsPerMonth,
    commentStatus,
    messagesPerMonth,
    likesPerPost,
    engagement: {
      views: Number(engagementTotals?.totalViews || 0),
      shares: Number(engagementTotals?.totalShares || 0),
      likes: Number(totalLikes?.count || 0),
      comments: Number(totalComments?.count || 0),
    },
  }
})
