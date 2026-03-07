import { mysqlTable, int, varchar, text, datetime, mysqlEnum, index } from 'drizzle-orm/mysql-core'

export const messages = mysqlTable('messages', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  body: text('body').notNull(),
  status: mysqlEnum('status', ['unread', 'read']).notNull().default('unread'),
  ipHash: varchar('ip_hash', { length: 64 }).notNull(),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('status_idx').on(table.status),
  index('ip_hash_idx').on(table.ipHash),
])
