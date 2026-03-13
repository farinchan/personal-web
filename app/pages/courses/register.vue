<script setup lang="ts">
useSeoMeta({ title: 'Daftar — Fajri Course' })

const name = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Password tidak cocok'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/lms/auth/register', {
      method: 'POST',
      body: {
        name: name.value,
        username: username.value,
        email: email.value,
        password: password.value,
      },
    })
    navigateTo('/courses/my')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Registrasi gagal'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-12 max-w-md">
    <div class="border border-[var(--border)] rounded-lg p-6">
      <h1 class="text-2xl font-bold mb-6 text-center">Daftar Akun</h1>

      <div v-if="error" class="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">{{ error }}</div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Nama Lengkap</label>
          <UiInput v-model="name" placeholder="Nama lengkap" required />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Username</label>
          <UiInput v-model="username" placeholder="username" required />
          <p class="text-xs text-[var(--muted-foreground)] mt-1">Hanya huruf, angka, dan underscore</p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <UiInput v-model="email" type="email" placeholder="email@contoh.com" required />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <UiInput v-model="password" type="password" placeholder="Minimal 6 karakter" required />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Konfirmasi Password</label>
          <UiInput v-model="confirmPassword" type="password" placeholder="Ulangi password" required />
        </div>
        <UiButton type="submit" class="w-full" :disabled="loading">
          {{ loading ? 'Memproses...' : 'Daftar' }}
        </UiButton>
      </form>

      <p class="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        Sudah punya akun?
        <NuxtLink to="/courses/login" class="text-blue-600 hover:underline">Login</NuxtLink>
      </p>
    </div>
  </div>
</template>
