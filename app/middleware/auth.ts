export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (to.path.startsWith('/admin') && to.path !== '/admin/login' && !loggedIn.value) {
    return navigateTo('/admin/login')
  }
})
