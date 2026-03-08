import { eq } from 'drizzle-orm'
import { backupJobs } from '../../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()!
  const id = Number(getRouterParam(event, 'id'))

  await db.delete(backupJobs).where(eq(backupJobs.id, id))

  return { message: 'Backup job berhasil dihapus' }
})
