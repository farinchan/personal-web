import { profile } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const [result] = await db.select().from(profile).limit(1)
  return result || null
})
