import bcrypt from 'bcrypt'
import { eq, or } from 'drizzle-orm'
import { students } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  const { login, password } = body

  if (!login || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email/username dan password wajib diisi' })
  }

  const loginLower = login.toLowerCase()

  const [student] = await db
    .select()
    .from(students)
    .where(or(eq(students.username, loginLower), eq(students.email, loginLower)))
    .limit(1)

  if (!student) {
    throw createError({ statusCode: 401, statusMessage: 'Email/username atau password salah' })
  }

  if (!student.isActive) {
    throw createError({ statusCode: 403, statusMessage: 'Akun telah dinonaktifkan' })
  }

  const valid = await bcrypt.compare(password, student.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Email/username atau password salah' })
  }

  await setUserSession(event, {
    user: {
      studentId: student.id,
      name: student.name,
      username: student.username,
      email: student.email,
    },
  })

  return { message: 'Login berhasil' }
})
