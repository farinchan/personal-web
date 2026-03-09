<script setup lang="ts">
import { Briefcase, GraduationCap, Zap, ScrollText, Rocket, Download, MapPin, type LucideIcon } from 'lucide-vue-next'
import { markRaw, type Component } from 'vue'

const requestUrl = useRequestURL()
const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`

useSeoMeta({
  title: 'CV — Fajri Gariskode',
  description: 'Curriculum Vitae Fajri Gariskode — pengalaman kerja, pendidikan, skill, dan sertifikasi.',
  ogTitle: 'CV — Fajri Gariskode',
  ogDescription: 'Curriculum Vitae Fajri Gariskode — pengalaman kerja, pendidikan, skill, dan sertifikasi.',
  ogUrl: `${siteUrl}/cv`,
  ogType: 'profile',
  twitterCard: 'summary_large_image',
  twitterTitle: 'CV — Fajri Gariskode',
  twitterDescription: 'Curriculum Vitae Fajri Gariskode — pengalaman kerja, pendidikan, skill, dan sertifikasi.',
})

const { data: sections } = await useFetch('/api/cv')
const { data: profile } = await useFetch('/api/profile')

function downloadPDF() {
  window.print()
}

const sectionIcons: Record<string, Component> = {
  experience: markRaw(Briefcase),
  education: markRaw(GraduationCap),
  skills: markRaw(Zap),
  certifications: markRaw(ScrollText),
  projects: markRaw(Rocket),
}

const defaultIcon = markRaw(MapPin)
</script>

<template>
  <div class="container mx-auto px-4 py-12 max-w-3xl">
    <!-- Header -->
    <div class="flex justify-between items-start mb-8">
      <div>
        <h1 class="text-3xl font-bold">{{ profile?.name || 'Curriculum Vitae' }}</h1>
        <p v-if="profile?.bio" class="text-[var(--muted-foreground)] mt-1">{{ profile.bio }}</p>
      </div>
      <UiButton @click="downloadPDF" class="no-print" variant="outline">
        <Download class="w-4 h-4 mr-2" /> Download PDF
      </UiButton>
    </div>

    <!-- Contact info for print -->
    <div v-if="profile" class="flex gap-4 text-sm text-[var(--muted-foreground)] mb-8 flex-wrap">
      <span v-if="profile.github">GitHub: {{ profile.github }}</span>
      <span v-if="profile.linkedin">LinkedIn: {{ profile.linkedin }}</span>
      <span v-if="profile.website">{{ profile.website }}</span>
    </div>

    <!-- CV Sections -->
    <div v-if="sections && sections.length > 0" class="space-y-8">
      <section v-for="section in sections" :key="section.id">
        <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
          <component :is="sectionIcons[section.type] || defaultIcon" class="w-5 h-5" />
          {{ section.title }}
        </h2>
        <div class="pl-4 border-l-2 border-gray-200">
          <div class="prose text-sm" v-html="section.body" />
        </div>
      </section>
    </div>
    <div v-else class="text-center text-[var(--muted-foreground)] py-12">
      <p>CV belum diatur.</p>
    </div>
  </div>
</template>
