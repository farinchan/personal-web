<script setup lang="ts">
const requestUrl = useRequestURL()
const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`

useSeoMeta({
  title: 'Hubungi Saya — Fajri Gariskode',
  description: 'Punya pertanyaan atau ingin bekerja sama? Kirim pesan ke Fajri Gariskode.',
  ogTitle: 'Hubungi Saya — Fajri Gariskode',
  ogDescription: 'Punya pertanyaan atau ingin bekerja sama? Kirim pesan ke Fajri Gariskode.',
  ogUrl: `${siteUrl}/contact`,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Hubungi Saya — Fajri Gariskode',
  twitterDescription: 'Punya pertanyaan atau ingin bekerja sama? Kirim pesan ke Fajri Gariskode.',
})

const name = ref('')
const email = ref('')
const subject = ref('')
const body = ref('')
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

async function submitMessage() {
  if (!name.value || !email.value || !subject.value || !body.value) {
    errorMessage.value = 'Semua field wajib diisi'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        subject: subject.value,
        body: body.value,
      },
    })
    successMessage.value = 'Pesan berhasil dikirim! Terima kasih.'
    name.value = ''
    email.value = ''
    subject.value = ''
    body.value = ''
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Gagal mengirim pesan'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-lg mx-auto">
      <h1 class="text-3xl font-bold mb-2">Hubungi Saya</h1>
      <p class="text-[var(--muted-foreground)] mb-8">Punya pertanyaan atau ingin bekerja sama? Kirim pesan!</p>

      <div v-if="successMessage" class="bg-green-50 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="submitMessage" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Nama</label>
          <UiInput v-model="name" placeholder="Nama lengkap" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <UiInput v-model="email" type="email" placeholder="email@example.com" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Subject</label>
          <UiInput v-model="subject" placeholder="Tentang apa?" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Pesan</label>
          <UiTextarea v-model="body" placeholder="Tulis pesan Anda..." :rows="6" />
        </div>
        <UiButton type="submit" :disabled="isSubmitting" class="w-full">
          {{ isSubmitting ? 'Mengirim...' : 'Kirim Pesan' }}
        </UiButton>
      </form>
    </div>
  </div>
</template>
