<script setup lang="ts">
import {
  User, Mail, Phone, MapPin, Globe,
  Github, Linkedin, Twitter, Instagram, Youtube, Send,
  ExternalLink,
} from 'lucide-vue-next'

const requestUrl = useRequestURL()
const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`

useSeoMeta({
  title: 'Profile — Fajri Gariskode',
  description: 'Profil lengkap, bio, kontak, dan media sosial Fajri Gariskode.',
  ogTitle: 'Profile — Fajri Gariskode',
  ogDescription: 'Profil lengkap, bio, kontak, dan media sosial Fajri Gariskode.',
  ogUrl: `${siteUrl}/profile`,
  ogType: 'profile',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Profile — Fajri Gariskode',
  twitterDescription: 'Profil lengkap, bio, kontak, dan media sosial Fajri Gariskode.',
})

useSchemaOrg([
  definePerson({
    name: 'Fajri Gariskode',
    url: `${siteUrl}/profile`,
  }),
])

const { data: profile } = await useFetch('/api/profile')
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div v-if="profile" class="max-w-2xl mx-auto">
      <!-- Avatar & Name -->
      <div class="flex flex-col items-center text-center mb-8">
        <img
          v-if="profile.avatarUrl"
          :src="profile.avatarUrl"
          alt="Avatar"
          class="w-32 h-32 rounded-full object-cover mb-4"
        />
        <div v-else class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
          <User class="w-12 h-12 text-gray-500" />
        </div>
        <h1 class="text-3xl font-bold mb-1">{{ profile.name }}</h1>
        <p v-if="profile.headline" class="text-lg text-[var(--muted-foreground)]">{{ profile.headline }}</p>
      </div>

      <!-- Bio -->
      <div v-if="profile.bio" class="prose mx-auto mb-8">
        <p class="text-lg text-[var(--muted-foreground)] leading-relaxed text-center">{{ profile.bio }}</p>
      </div>

      <!-- Contact Info -->
      <div class="flex flex-col items-center gap-3 mb-8">
        <div v-if="profile.email" class="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Mail class="w-4 h-4" />
          <a :href="`mailto:${profile.email}`" class="hover:text-[var(--foreground)] transition-colors">{{ profile.email }}</a>
        </div>
        <div v-if="profile.phone" class="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Phone class="w-4 h-4" />
          <a :href="`tel:${profile.phone}`" class="hover:text-[var(--foreground)] transition-colors">{{ profile.phone }}</a>
        </div>
        <div v-if="profile.location" class="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <MapPin class="w-4 h-4" />
          <span>{{ profile.location }}</span>
        </div>
      </div>

      <!-- Social Links -->
      <div class="flex justify-center gap-3 flex-wrap">
        <a v-if="profile.github" :href="profile.github" target="_blank"
          class="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-[var(--accent)] transition-colors text-sm">
          <Github class="w-4 h-4" /> GitHub
        </a>
        <a v-if="profile.linkedin" :href="profile.linkedin" target="_blank"
          class="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-[var(--accent)] transition-colors text-sm">
          <Linkedin class="w-4 h-4" /> LinkedIn
        </a>
        <a v-if="profile.twitter" :href="profile.twitter" target="_blank"
          class="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-[var(--accent)] transition-colors text-sm">
          <Twitter class="w-4 h-4" /> Twitter / X
        </a>
        <a v-if="profile.instagram" :href="profile.instagram" target="_blank"
          class="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-[var(--accent)] transition-colors text-sm">
          <Instagram class="w-4 h-4" /> Instagram
        </a>
        <a v-if="profile.youtube" :href="profile.youtube" target="_blank"
          class="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-[var(--accent)] transition-colors text-sm">
          <Youtube class="w-4 h-4" /> YouTube
        </a>
        <a v-if="profile.telegram" :href="profile.telegram" target="_blank"
          class="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-[var(--accent)] transition-colors text-sm">
          <Send class="w-4 h-4" /> Telegram
        </a>
        <a v-if="profile.website" :href="profile.website" target="_blank"
          class="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-[var(--accent)] transition-colors text-sm">
          <Globe class="w-4 h-4" /> Website
        </a>
      </div>
    </div>
    <div v-else class="text-center text-[var(--muted-foreground)] py-12">
      <p>Profile belum diatur.</p>
    </div>
  </div>
</template>
