import { mysqlTable, int, varchar, text, boolean, datetime, mysqlEnum } from 'drizzle-orm/mysql-core'

export const backupJobs = mysqlTable('backup_jobs', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  provider: mysqlEnum('provider', ['google_drive', 'onedrive']).notNull(),
  clientId: varchar('client_id', { length: 500 }).notNull(),
  clientSecret: varchar('client_secret', { length: 500 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiry: datetime('token_expiry'),
  folderId: varchar('folder_id', { length: 500 }),
  backupType: mysqlEnum('backup_type', ['database', 'files', 'full']).notNull().default('full'),
  schedule: mysqlEnum('schedule', ['disabled', 'daily', 'weekly', 'monthly']).notNull().default('disabled'),
  enabled: boolean('enabled').notNull().default(true),
  lastBackupAt: datetime('last_backup_at'),
  lastBackupStatus: text('last_backup_status'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
})
