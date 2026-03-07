import { asc } from 'drizzle-orm'
import { cvSections } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  return await db.select().from(cvSections).orderBy(asc(cvSections.sortOrder))
})
