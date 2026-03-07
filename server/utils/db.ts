import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '../../db/schema'

let _db: ReturnType<typeof drizzle> | null = null

export function useDB() {
  if (_db) return _db

  const config = useRuntimeConfig()

  const pool = mysql.createPool({
    host: config.db.host,
    port: Number(config.db.port),
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  })

  _db = drizzle(pool, { schema, mode: 'default' })
  return _db
}
