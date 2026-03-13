<script setup lang="ts">
useSeoMeta({ title: 'Login — Fajri Course' })

const login = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/lms/auth/login', {
      method: 'POST',
      body: { login: login.value, password: password.value },
    })
    navigateTo('/courses/my')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Login gagal'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-12 max-w-md">
    <div class="border border-[var(--border)] rounded-lg p-6">
      <h1 class="text-2xl font-bold mb-6 text-center">Login</h1>

      <div v-if="error" class="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">{{ error }}</div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Email atau Username</label>
          <UiInput v-model="login" placeholder="email@contoh.com atau username" required />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <UiInput v-model="password" type="password" placeholder="Password" required />
        </div>
        <UiButton type="submit" class="w-full" :disabled="loading">
          {{ loading ? 'Memproses...' : 'Login' }}
        </UiButton>
      </form>

      <p class="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        Belum punya akun?
        <NuxtLink to="/courses/register" class="text-blue-600 hover:underline">Daftar</NuxtLink>
      </p>
    </div>
  </div>
</template>
