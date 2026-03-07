import { mysqlTable, int, varchar, datetime, index } from 'drizzle-orm/mysql-core'
import { posts } from './posts'

export const postLikes = mysqlTable('post_likes', {
  id: int('id').primaryKey().autoincrement(),
  postId: int('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  voterHash: varchar('voter_hash', { length: 64 }).notNull(),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('post_id_idx').on(table.postId),
  index('voter_hash_idx').on(table.voterHash),
])
