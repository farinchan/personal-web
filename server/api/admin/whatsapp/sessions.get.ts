export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  return chateryFetch(event, '/sessions')
})
