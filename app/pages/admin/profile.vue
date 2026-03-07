<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

useSeoMeta({ title: 'Edit Profile — Admin', robots: 'noindex, nofollow' })

const { data: existingProfile } = await useFetch('/api/profile')

const name = ref('')
const headline = ref('')
const avatarUrl = ref('')
const bio = ref('')
const email = ref('')
const phone = ref('')
const location = ref('')
const github = ref('')
const linkedin = ref('')
const twitter = ref('')
const instagram = ref('')
const youtube = ref('')
const telegram = ref('')
const website = ref('')
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Populate form
watchEffect(() => {
  if (existingProfile.value) {
    name.value = existingProfile.value.name || ''
    headline.value = existingProfile.value.headline || ''
    avatarUrl.value = existingProfile.value.avatarUrl || ''
    bio.value = existingProfile.value.bio || ''
    email.value = existingProfile.value.email || ''
    phone.value = existingProfile.value.phone || ''
    location.value = existingProfile.value.location || ''
    github.value = existingProfile.value.github || ''
    linkedin.value = existingProfile.value.linkedin || ''
    twitter.value = existingProfile.value.twitter || ''
    instagram.value = existingProfile.value.instagram || ''
    youtube.value = existingProfile.value.youtube || ''
    telegram.value = existingProfile.value.telegram || ''
    website.value = existingProfile.value.website || ''
  }
})

async function saveProfile() {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch('/api/profile', {
      method: 'PUT',
      body: {
        name: name.value,
        headline: headline.value,
        avatarUrl: avatarUrl.value,
        bio: bio.value,
        email: email.value,
        phone: phone.value,
        location: location.value,
        github: github.value,
        linkedin: linkedin.value,
        twitter: twitter.value,
        instagram: instagram.value,
        youtube: youtube.value,
        telegram: telegram.value,
        website: website.value,
      },
    })
    successMessage.value = 'Profile berhasil diupdate'
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Gagal mengupdate profile'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-8">Edit Profile</h1>

    <div v-if="successMessage" class="bg-green-50 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm max-w-lg">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm max-w-lg">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="saveProfile" class="space-y-4 max-w-lg">
      <div>
        <label class="block text-sm font-medium mb-1">Nama</label>
        <UiInput v-model="name" placeholder="Nama lengkap" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Headline / Tagline</label>
        <UiInput v-model="headline" placeholder="Full Stack Developer, dll." />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Avatar URL</label>
        <UiInput v-model="avatarUrl" placeholder="https://..." />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Bio</label>
        <UiTextarea v-model="bio" placeholder="Tentang saya..." :rows="4" />
      </div>

      <h3 class="text-sm font-semibold text-[var(--muted-foreground)] pt-2">Kontak</h3>
      <div>
        <label class="block text-sm font-medium mb-1">Email</label>
        <UiInput v-model="email" type="email" placeholder="you@example.com" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Telepon</label>
        <UiInput v-model="phone" placeholder="+62 812 xxxx xxxx" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Lokasi</label>
        <UiInput v-model="location" placeholder="Jakarta, Indonesia" />
      </div>

      <h3 class="text-sm font-semibold text-[var(--muted-foreground)] pt-2">Sosial Media</h3>
      <div>
        <label class="block text-sm font-medium mb-1">GitHub</label>
        <UiInput v-model="github" placeholder="https://github.com/username" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">LinkedIn</label>
        <UiInput v-model="linkedin" placeholder="https://linkedin.com/in/username" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Twitter / X</label>
        <UiInput v-model="twitter" placeholder="https://twitter.com/username" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Instagram</label>
        <UiInput v-model="instagram" placeholder="https://instagram.com/username" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">YouTube</label>
        <UiInput v-model="youtube" placeholder="https://youtube.com/@channel" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Telegram</label>
        <UiInput v-model="telegram" placeholder="https://t.me/username" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Website</label>
        <UiInput v-model="website" placeholder="https://example.com" />
      </div>

      <UiButton type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Menyimpan...' : 'Simpan Profile' }}
      </UiButton>
    </form>
  </div>
</template>
