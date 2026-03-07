import { eq, sql } from 'drizzle-orm'
import { adminUsers } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDB()!
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID tidak valid' })
  }

  // Prevent deleting self
  if ((session.user as any)?.id === id) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak bisa menghapus akun sendiri' })
  }

  // Ensure at least 1 admin remains
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(adminUsers)

  if (!result[0] || result[0].count <= 1) {
    throw createError({ statusCode: 400, statusMessage: 'Harus ada minimal 1 admin' })
  }

  await db.delete(adminUsers).where(eq(adminUsers.id, id))

  return { message: 'User berhasil dihapus' }
})
