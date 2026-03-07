import { tags } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  return await db.select().from(tags)
})
