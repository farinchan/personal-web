export default defineEventHandler(async (event) => {
  const student = await getStudentSession(event)
  if (!student) return { loggedIn: false, user: null }
  return { loggedIn: true, user: student }
})
