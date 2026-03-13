import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { students } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  const { name, username, email, password } = body

  if (!name || !username || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Semua field wajib diisi' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password minimal 6 karakter' })
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw createError({ statusCode: 400, statusMessage: 'Username hanya boleh huruf, angka, dan underscore' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Format email tidak valid' })
  }

  // Check username/email uniqueness
  const [existingUsername] = await db.select().from(students).where(eq(students.username, username)).limit(1)
  if (existingUsername) {
    throw createError({ statusCode: 409, statusMessage: 'Username sudah digunakan' })
  }

  const [existingEmail] = await db.select().from(students).where(eq(students.email, email)).limit(1)
  if (existingEmail) {
    throw createError({ statusCode: 409, statusMessage: 'Email sudah digunakan' })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const [result] = await db.insert(students).values({
    name,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    passwordHash,
  }).$returningId()

  await setUserSession(event, {
    user: {
      studentId: result.id,
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
    },
  })

  return { message: 'Registrasi berhasil' }
})
