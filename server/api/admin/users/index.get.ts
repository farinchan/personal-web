import { adminUsers } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const db = useDB()

  const users = await db
    .select({
      id: adminUsers.id,
      username: adminUsers.username,
    })
    .from(adminUsers)

  return users
})
