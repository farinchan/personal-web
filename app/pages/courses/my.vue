<script setup lang="ts">
useSeoMeta({ title: 'My Learning — Fajri Course' })

const { data: session } = await useFetch('/api/lms/auth/me')
if (!session.value?.loggedIn) {
  navigateTo('/courses/login')
}

const { data } = await useFetch('/api/lms/my/courses')
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-2">My Learning</h1>
    <p class="text-[var(--muted-foreground)] mb-8">Kursus yang sedang kamu ikuti</p>

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
          <h3 class="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">{{ course.title }}</h3>

          <!-- Progress bar -->
          <div class="mb-2">
            <div class="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1">
              <span>Progress</span>
              <span>{{ Number(course.progress) }}%</span>
            </div>
            <div class="w-full bg-[var(--muted)] rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all"
                :style="{ width: `${Number(course.progress)}%` }"
              />
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>{{ course.studentCount }} siswa</span>
            <UiBadge :variant="course.completedAt ? 'default' : 'secondary'">
              {{ course.completedAt ? 'Selesai' : 'Berlangsung' }}
            </UiBadge>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="text-center py-16 text-[var(--muted-foreground)]">
      <p class="text-lg mb-4">Kamu belum mengikuti course apapun</p>
      <NuxtLink to="/courses" class="text-blue-600 hover:underline">Jelajahi Courses</NuxtLink>
    </div>
  </div>
</template>
