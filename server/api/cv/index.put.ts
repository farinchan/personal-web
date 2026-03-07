import { eq } from 'drizzle-orm'
import { cvSections } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.sections || !Array.isArray(body.sections)) {
    throw createError({ statusCode: 400, statusMessage: 'Sections array is required' })
  }

  // Delete all existing and re-insert
  await db.delete(cvSections)

  for (let i = 0; i < body.sections.length; i++) {
    const section = body.sections[i]
    await db.insert(cvSections).values({
      type: section.type,
      title: section.title,
      body: section.body,
      sortOrder: i,
    })
  }

  return { message: 'CV updated' }
})
