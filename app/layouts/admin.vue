<script setup lang="ts">
import { LayoutDashboard, FileText, MessageSquare, Mail, User, FileText as FilePage, ArrowLeft, LogOut, Users, MessageCircle, ChevronDown, HardDriveDownload, GraduationCap } from 'lucide-vue-next'
import type { Component } from 'vue'

const { loggedIn, clear } = useUserSession()

const sidebarLinks: { name: string; path: string; icon: Component }[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Posts', path: '/admin/posts', icon: FileText },
  { name: 'Courses', path: '/admin/courses', icon: GraduationCap },
  { name: 'Komentar', path: '/admin/comments', icon: MessageSquare },
  { name: 'Pesan', path: '/admin/messages', icon: Mail },
  { name: 'Profile', path: '/admin/profile', icon: User },
  { name: 'CV', path: '/admin/cv', icon: FilePage },
  { name: 'Admin Users', path: '/admin/users', icon: Users },
  { name: 'Backup', path: '/admin/backup', icon: HardDriveDownload },
]

const { data: unreadCount } = await useFetch('/api/messages', {
  transform: (msgs: any[]) => msgs.filter((m: any) => m.status === 'unread').length,
  default: () => 0,
})

// WhatsApp sessions
const route = useRoute()
const isOnWhatsApp = computed(() => route.path === '/admin/whatsapp')
const activeWaSession = computed(() => route.query.session as string || '')
const waOpen = ref(false)
const { data: waSessions } = await useFetch('/api/admin/whatsapp/sessions', {
  transform: (res: any) => res?.data || [],
  default: () => [],
})

// Auto-open WhatsApp dropdown when on WhatsApp page
watch(isOnWhatsApp, (val) => {
  if (val) waOpen.value = true
}, { immediate: true })

async function handleLogout() {
  await clear()
  navigateTo('/admin/login')
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-64 border-r bg-[var(--card)] flex flex-col">
      <div class="p-4 border-b">
        <NuxtLink to="/admin" class="text-lg font-bold">
          Admin Panel
        </NuxtLink>
      </div>

      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="link in sidebarLinks"
          :key="link.path"
          :to="link.path"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          active-class="!text-[var(--foreground)] !bg-[var(--accent)]"
        >
          <component :is="link.icon" class="w-4 h-4" />
          <span>{{ link.name }}</span>
          <span
            v-if="link.path === '/admin/messages' && unreadCount && unreadCount > 0"
            class="ml-auto bg-red-600 text-white text-xs rounded-full px-2 py-0.5"
          >
            {{ unreadCount }}
          </span>
        </NuxtLink>

        <!-- WhatsApp Dropdown -->
        <div>
          <button
            @click="waOpen = !waOpen"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="isOnWhatsApp
              ? 'text-[var(--foreground)] bg-[var(--accent)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'"
          >
            <MessageCircle class="w-4 h-4" />
            <span>WhatsApp</span>
            <ChevronDown class="w-4 h-4 ml-auto transition-transform" :class="{ 'rotate-180': waOpen }" />
          </button>
          <div v-show="waOpen" class="ml-4 mt-1 space-y-0.5">
            <NuxtLink
              to="/admin/whatsapp"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              :class="isOnWhatsApp && !activeWaSession
                ? '!text-[var(--foreground)] !bg-[var(--accent)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'"
            >
              Semua Session
            </NuxtLink>
            <NuxtLink
              v-for="s in waSessions"
              :key="s.sessionId"
              :to="`/admin/whatsapp?session=${s.sessionId}`"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              :class="activeWaSession === s.sessionId
                ? '!text-[var(--foreground)] !bg-[var(--accent)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'"
            >
              <span
                class="w-2 h-2 rounded-full shrink-0"
                :class="s.isConnected ? 'bg-green-500' : 'bg-red-400'"
              />
              <span class="truncate">{{ s.name || s.sessionId }}</span>
            </NuxtLink>
            <p v-if="waSessions.length === 0" class="px-3 py-1.5 text-xs text-[var(--muted-foreground)]">
              Tidak ada session
            </p>
          </div>
        </div>
      </nav>

      <div class="p-4 border-t space-y-2">
        <NuxtLink to="/" class="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft class="w-4 h-4" /> Lihat situs
        </NuxtLink>
        <button
          @click="handleLogout"
          class="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
        >
          <LogOut class="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 p-8">
      <slot />
    </main>
  </div>
</template>
