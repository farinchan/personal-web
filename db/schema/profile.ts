import { mysqlTable, int, varchar, text } from 'drizzle-orm/mysql-core'

export const profile = mysqlTable('profile', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  headline: varchar('headline', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  bio: text('bio'),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  location: varchar('location', { length: 255 }),
  github: varchar('github', { length: 255 }),
  linkedin: varchar('linkedin', { length: 255 }),
  twitter: varchar('twitter', { length: 255 }),
  instagram: varchar('instagram', { length: 255 }),
  youtube: varchar('youtube', { length: 255 }),
  telegram: varchar('telegram', { length: 255 }),
  website: varchar('website', { length: 255 }),
})
