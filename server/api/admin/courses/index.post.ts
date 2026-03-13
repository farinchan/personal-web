import { courses } from '../../../../db/schema'

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 200)
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.title) throw createError({ statusCode: 400, statusMessage: 'Judul course wajib diisi' })

  const slug = body.slug || generateSlug(body.title)
  const inviteCode = body.visibility === 'private' ? (body.inviteCode || generateInviteCode()) : null

  const [result] = await db.insert(courses).values({
    slug,
    title: body.title,
    description: body.description || null,
    coverImage: body.coverImage || null,
    visibility: body.visibility || 'public',
    inviteCode,
    maxStudents: body.maxStudents || null,
    status: body.status || 'draft',
  }).$returningId()

  return { id: result.id, slug, inviteCode }
})
