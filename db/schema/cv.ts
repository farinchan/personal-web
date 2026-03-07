import { mysqlTable, int, varchar, text } from 'drizzle-orm/mysql-core'

export const cvSections = mysqlTable('cv_sections', {
  id: int('id').primaryKey().autoincrement(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  sortOrder: int('sort_order').notNull().default(0),
})
