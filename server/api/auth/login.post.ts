import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { adminUsers } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  if (!body.username || !body.password) {
    throw createError({ statusCode: 400, statusMessage: 'Username dan password wajib diisi' })
  }

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, body.username))
    .limit(1)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Username atau password salah' })
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Username atau password salah' })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
    },
  })

  return { message: 'Login berhasil' }
})
