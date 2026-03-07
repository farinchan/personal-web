import { desc } from 'drizzle-orm'
import { messages } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDB()

  return await db.select().from(messages).orderBy(desc(messages.createdAt))
})
