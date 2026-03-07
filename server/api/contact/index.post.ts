import { and, eq, gte, count } from 'drizzle-orm'
import { messages } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  if (!body.name || !body.email || !body.subject || !body.body) {
    throw createError({ statusCode: 400, statusMessage: 'Semua field wajib diisi' })
  }

  const ipHash = hashIP(event)

  // Rate limit: max 3 messages per IP per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const [result] = await db
    .select({ total: count() })
    .from(messages)
    .where(and(eq(messages.ipHash, ipHash), gte(messages.createdAt, oneHourAgo)))

  if (result.total >= 3) {
    throw createError({ statusCode: 429, statusMessage: 'Terlalu banyak pesan. Coba lagi nanti.' })
  }

  await db.insert(messages).values({
    name: body.name,
    email: body.email,
    subject: body.subject,
    body: body.body,
    ipHash,
  })

  return { message: 'Pesan berhasil dikirim' }
})
