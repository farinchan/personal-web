import { mysqlTable, int, varchar } from 'drizzle-orm/mysql-core'

export const adminUsers = mysqlTable('admin_users', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
})
