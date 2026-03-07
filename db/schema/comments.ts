import { mysqlTable, int, varchar, text, datetime, mysqlEnum, index } from 'drizzle-orm/mysql-core'
import { posts } from './posts'

export const comments = mysqlTable('comments', {
  id: int('id').primaryKey().autoincrement(),
  postId: int('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  parentId: int('parent_id'),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  body: text('body').notNull(),
  isAdmin: int('is_admin').notNull().default(0),
  status: mysqlEnum('status', ['pending', 'approved']).notNull().default('pending'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('post_id_idx').on(table.postId),
  index('status_idx').on(table.status),
  index('parent_id_idx').on(table.parentId),
])
