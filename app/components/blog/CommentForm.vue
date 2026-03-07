<script setup lang="ts">
const props = defineProps<{ slug: string }>()

const name = ref('')
const email = ref('')
const body = ref('')
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

async function submitComment() {
  if (!name.value || !body.value) {
    errorMessage.value = 'Nama dan komentar wajib diisi'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch(`/api/posts/${props.slug}/comments`, {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        body: body.value,
      },
    })
    successMessage.value = 'Komentar berhasil dikirim, menunggu moderasi'
    name.value = ''
    email.value = ''
    body.value = ''
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Gagal mengirim komentar'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mb-8">
    <h3 class="text-lg font-semibold mb-4">Tulis Komentar</h3>

    <div v-if="successMessage" class="bg-green-50 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="submitComment" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <UiInput v-model="name" placeholder="Nama *" />
        <UiInput v-model="email" type="email" placeholder="Email (opsional)" />
      </div>
      <UiTextarea v-model="body" placeholder="Tulis komentar..." :rows="4" />
      <UiButton type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Mengirim...' : 'Kirim Komentar' }}
      </UiButton>
    </form>
  </div>
</template>
