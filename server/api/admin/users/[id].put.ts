import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { adminUsers } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()!
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID tidak valid' })
  }

  const updates: Record<string, any> = {}

  if (body.username) {
    updates.username = body.username
  }

  if (body.password) {
    if (body.password.length < 6) {
      throw createError({ statusCode: 400, statusMessage: 'Password minimal 6 karakter' })
    }
    updates.passwordHash = await bcrypt.hash(body.password, 10)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada data yang diubah' })
  }

  await db.update(adminUsers).set(updates).where(eq(adminUsers.id, id))

  return { message: 'User berhasil diperbarui' }
})
