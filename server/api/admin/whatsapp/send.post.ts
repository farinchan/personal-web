export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readBody(event)
  return chateryFetch(event, '/chats/send-text', { method: 'POST', body })
})
