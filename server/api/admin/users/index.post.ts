import bcrypt from 'bcrypt'
import { adminUsers } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()!
  const body = await readBody(event)

  if (!body.username || !body.password) {
    throw createError({ statusCode: 400, statusMessage: 'Username dan password wajib diisi' })
  }

  if (body.password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password minimal 6 karakter' })
  }

  const passwordHash = await bcrypt.hash(body.password, 10)

  await db.insert(adminUsers).values({
    username: body.username,
    passwordHash,
  })

  return { message: 'User berhasil ditambahkan' }
})
