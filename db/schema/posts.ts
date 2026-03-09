import { mysqlTable, int, varchar, text, longtext, boolean, datetime, index } from 'drizzle-orm/mysql-core'

export const posts = mysqlTable('posts', {
  id: int('id').primaryKey().autoincrement(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  body: longtext('body').notNull(),
  coverImage: varchar('cover_image', { length: 500 }),
  isDraft: boolean('is_draft').notNull().default(true),
  viewCount: int('view_count').notNull().default(0),
  shareCount: int('share_count').notNull().default(0),
  publishedAt: datetime('published_at'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('slug_idx').on(table.slug),
  index('published_at_idx').on(table.publishedAt),
])
