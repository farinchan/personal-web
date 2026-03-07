import { mysqlTable, int, varchar, primaryKey, index } from 'drizzle-orm/mysql-core'
import { posts } from './posts'

export const tags = mysqlTable('tags', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
})

export const postTags = mysqlTable('post_tags', {
  postId: int('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: int('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.postId, table.tagId] }),
  index('post_id_idx').on(table.postId),
  index('tag_id_idx').on(table.tagId),
])
