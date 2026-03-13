<script setup lang="ts">
const { data } = await useFetch('/api/lms/courses')

useSeoMeta({
  title: 'Courses — Fajri Course',
  description: 'Jelajahi kursus-kursus yang tersedia',
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Courses</h1>
      <p class="text-[var(--muted-foreground)]">Jelajahi kursus-kursus yang tersedia dan mulai belajar</p>
    </div>

    <div v-if="data?.courses?.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="course in data.courses"
        :key="course.id"
        :to="`/courses/${course.slug}`"
        class="group border border-[var(--border)] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div class="aspect-video bg-[var(--muted)] overflow-hidden">
          <img
            v-if="course.coverImage"
            :src="course.coverImage"
            :alt="course.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-4xl font-bold text-[var(--muted-foreground)]/30">
            {{ course.title.charAt(0) }}
          </div>
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">{{ course.title }}</h3>
          <p v-if="course.description" class="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">{{ course.description }}</p>
          <div class="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>{{ course.studentCount }} siswa</span>
            <UiBadge variant="secondary">{{ course.visibility === 'public' ? 'Public' : 'Private' }}</UiBadge>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="text-center py-16 text-[var(--muted-foreground)]">
      <p class="text-lg">Belum ada course yang tersedia</p>
    </div>
  </div>
</template>
