import { eq } from 'drizzle-orm'
import { profile } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDB()
  const body = await readBody(event)

  const [existing] = await db.select().from(profile).limit(1)

  if (existing) {
    await db.update(profile).set({
      name: body.name,
      headline: body.headline,
      avatarUrl: body.avatarUrl,
      bio: body.bio,
      email: body.email,
      phone: body.phone,
      location: body.location,
      github: body.github,
      linkedin: body.linkedin,
      twitter: body.twitter,
      instagram: body.instagram,
      youtube: body.youtube,
      telegram: body.telegram,
      website: body.website,
    }).where(eq(profile.id, existing.id))
  } else {
    await db.insert(profile).values({
      name: body.name,
      headline: body.headline,
      avatarUrl: body.avatarUrl,
      bio: body.bio,
      email: body.email,
      phone: body.phone,
      location: body.location,
      github: body.github,
      linkedin: body.linkedin,
      twitter: body.twitter,
      instagram: body.instagram,
      youtube: body.youtube,
      telegram: body.telegram,
      website: body.website,
    })
  }

  return { message: 'Profile updated' }
})
