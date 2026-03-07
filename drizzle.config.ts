import { defineConfig } from 'drizzle-kit'

const host = process.env.DB_HOST || 'localhost'
const port = process.env.DB_PORT || '3306'
const user = process.env.DB_USER || 'root'
const password = process.env.DB_PASSWORD
const database = process.env.DB_NAME || 'personal_web'

const auth = password ? `${user}:${password}` : user

export default defineConfig({
  schema: './db/schema',
  out: './db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: `mysql://${auth}@${host}:${port}/${database}`,
  },
})
