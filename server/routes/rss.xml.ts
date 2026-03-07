import { eq, desc } from 'drizzle-orm'
import { posts } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const config = useRuntimeConfig()

  if (!db) {
    throw new Error('Database connection is not available')
  }

  const allPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.isDraft, false))
    .orderBy(desc(posts.publishedAt))
    .limit(20)

  const siteUrl = config.public?.siteUrl || 'http://localhost:3000'

  const items = allPosts
    .map((post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <description><![CDATA[${post.description || ''}]]></description>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : ''}</pubDate>
      <guid>${siteUrl}/blog/${post.slug}</guid>
    </item>`)
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Fajri Gariskode — Blog</title>
    <link>${siteUrl}</link>
    <description>Blog dokumentasi pembelajaran, catatan teknis, dan pengalaman belajar.</description>
    <language>id</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  setResponseHeader(event, 'content-type', 'application/xml')
  return rss
})
