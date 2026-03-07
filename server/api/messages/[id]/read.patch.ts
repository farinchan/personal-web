import { eq } from 'drizzle-orm'
import { messages } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required' })
  }

  await db.update(messages).set({ status: 'read' }).where(eq(messages.id, id))
  return { message: 'Pesan ditandai sudah dibaca' }
})
