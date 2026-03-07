<script setup lang="ts">
import { LayoutDashboard, FileText, MessageSquare, Mail, User, FileText as FilePage, ArrowLeft, LogOut, Users } from 'lucide-vue-next'
import type { Component } from 'vue'

const { loggedIn, clear } = useUserSession()

const sidebarLinks: { name: string; path: string; icon: Component }[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Posts', path: '/admin/posts', icon: FileText },
  { name: 'Komentar', path: '/admin/comments', icon: MessageSquare },
  { name: 'Pesan', path: '/admin/messages', icon: Mail },
  { name: 'Profile', path: '/admin/profile', icon: User },
  { name: 'CV', path: '/admin/cv', icon: FilePage },
  { name: 'Admin Users', path: '/admin/users', icon: Users },
]

const { data: unreadCount } = await useFetch('/api/messages', {
  transform: (msgs: any[]) => msgs.filter((m: any) => m.status === 'unread').length,
  default: () => 0,
})

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

      <nav class="flex-1 p-4 space-y-1">
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
