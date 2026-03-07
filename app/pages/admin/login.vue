<script setup lang="ts">
definePageMeta({ layout: false })
useSeoMeta({ title: 'Login — Admin', robots: 'noindex, nofollow' })

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    errorMessage.value = 'Username dan password wajib diisi'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value },
    })
    // Full reload to pick up session cookie on server side
    window.location.href = '/admin'
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Login gagal'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--background)]">
    <UiCard class="w-full max-w-sm p-8">
      <h1 class="text-2xl font-bold text-center mb-6">Admin Login</h1>

      <div v-if="errorMessage" class="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Username</label>
          <UiInput v-model="username" placeholder="admin" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <UiInput v-model="password" type="password" placeholder="••••••••" />
        </div>
        <UiButton type="submit" :disabled="isLoading" class="w-full">
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </UiButton>
      </form>
    </UiCard>
  </div>
</template>
