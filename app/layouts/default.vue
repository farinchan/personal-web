<script setup lang="ts">
import { Menu, X } from 'lucide-vue-next'

const route = useRoute()

const isCoursePage = computed(() => route.path.startsWith('/courses'))

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Blog', path: '/blog' },
  { name: 'Courses', path: '/courses' },
  { name: 'Profile', path: '/profile' },
  { name: 'CV', path: '/cv' },
  { name: 'Contact', path: '/contact' },
]

// LMS session (for course pages)
const { data: lmsSessionData, refresh: refreshLmsSession } = useFetch('/api/lms/auth/me', { lazy: true })
const studentUser = computed(() => lmsSessionData.value?.loggedIn ? lmsSessionData.value.user : null)
provide('lmsSession', { user: studentUser, refresh: refreshLmsSession })

const mobileOpen = ref(false)

watch(() => route.fullPath, () => {
  mobileOpen.value = false
})

async function lmsLogout() {
  await $fetch('/api/lms/auth/logout', { method: 'POST' })  
  await refreshLmsSession()
  navigateTo('/courses')
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Navbar -->
    <nav class="border-b bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60 sticky top-0 z-50 no-print">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold tracking-tight">
          Fajri-<span class="text-blue-600">Gariskode</span>
        </NuxtLink>

        <!-- Desktop nav -->
        <div class="hidden md:flex items-center gap-6">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            active-class="!text-[var(--foreground)]"
          >
            {{ link.name }}
          </NuxtLink>
          <NuxtLink
            v-if="studentUser"
            to="/courses/my"
            class="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            active-class="!text-[var(--foreground)]"
          >
            My Learning
          </NuxtLink>
        </div>

        <div class="flex items-center gap-3">
          <!-- Student auth (visible on course pages, desktop) -->
          <div v-if="isCoursePage" class="hidden md:flex items-center gap-3">
            <template v-if="studentUser">
              <span class="text-sm text-[var(--muted-foreground)]">{{ studentUser.name }}</span>
              <button
                @click="lmsLogout"
                class="text-sm px-3 py-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--accent)] transition-colors"
              >
                Logout
              </button>
            </template>
            <template v-else>
              <NuxtLink
                to="/courses/login"
                class="text-sm px-3 py-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--accent)] transition-colors"
              >
                Login
              </NuxtLink>
              <NuxtLink
                to="/courses/register"
                class="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Daftar
              </NuxtLink>
            </template>
          </div>

          <!-- Mobile hamburger -->
          <button
            class="md:hidden p-2 -mr-2 hover:bg-[var(--accent)] rounded-md transition-colors"
            @click="mobileOpen = !mobileOpen"
          >
            <X v-if="mobileOpen" class="w-5 h-5" />
            <Menu v-else class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileOpen" class="md:hidden border-t border-[var(--border)] bg-[var(--background)]">
        <div class="container mx-auto px-4 py-3 flex flex-col gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="px-3 py-2 text-sm font-medium rounded-md hover:bg-[var(--accent)] transition-colors"
            active-class="bg-[var(--accent)] text-[var(--foreground)]"
          >
            {{ link.name }}
          </NuxtLink>
          <NuxtLink
            v-if="studentUser"
            to="/courses/my"
            class="px-3 py-2 text-sm font-medium rounded-md hover:bg-[var(--accent)] transition-colors"
            active-class="bg-[var(--accent)] text-[var(--foreground)]"
          >
            My Learning
          </NuxtLink>

          <!-- Student auth (mobile) -->
          <div v-if="isCoursePage" class="border-t border-[var(--border)] mt-2 pt-2 flex flex-col gap-1">
            <template v-if="studentUser">
              <span class="px-3 py-1.5 text-sm text-[var(--muted-foreground)]">{{ studentUser.name }}</span>
              <button
                @click="lmsLogout"
                class="px-3 py-2 text-sm text-left rounded-md hover:bg-[var(--accent)] transition-colors"
              >
                Logout
              </button>
            </template>
            <template v-else>
              <NuxtLink
                to="/courses/login"
                class="px-3 py-2 text-sm rounded-md hover:bg-[var(--accent)] transition-colors"
              >
                Login
              </NuxtLink>
              <NuxtLink
                to="/courses/register"
                class="px-3 py-2 text-sm text-blue-600 font-medium rounded-md hover:bg-[var(--accent)] transition-colors"
              >
                Daftar
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t py-8 no-print">
      <div class="container mx-auto px-4 text-center text-sm text-[var(--muted-foreground)]">
        <p>&copy; {{ new Date().getFullYear() }} Fajri Rinaldi Chan. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>
