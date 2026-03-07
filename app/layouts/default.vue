<script setup lang="ts">
const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Blog', path: '/blog' },
  { name: 'Profile', path: '/profile' },
  { name: 'CV', path: '/cv' },
  { name: 'Contact', path: '/contact' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Navbar -->
    <nav class="border-b bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60 sticky top-0 z-50 no-print">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold tracking-tight">
          Fajri-<span class="text-blue-600">Gariskode</span>
        </NuxtLink>
        <div class="flex items-center gap-6">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            active-class="!text-[var(--foreground)]"
          >
            {{ link.name }}
          </NuxtLink>
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
        <p>&copy; {{ new Date().getFullYear() }} Fajri-Gariskode. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>
