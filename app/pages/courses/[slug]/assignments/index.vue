<script setup lang="ts">
import { Upload, CheckCircle, Clock, FileText } from 'lucide-vue-next'

const route = useRoute()
const slug = route.params.slug as string

const { data } = await useFetch(`/api/lms/courses/${slug}/assignments`)

useSeoMeta({ title: () => `Tugas — Fajri Course` })
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <NuxtLink :to="`/courses/${slug}`" class="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 inline-block">
      ← Kembali ke Course
    </NuxtLink>

    <h1 class="text-2xl font-bold mb-6">Tugas & Project</h1>

    <div v-if="data?.assignments?.length" class="space-y-4">
      <NuxtLink
        v-for="a in data.assignments"
        :key="a.id"
        :to="`/courses/${slug}/assignments/${a.id}`"
        class="block border border-[var(--border)] rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-[var(--muted-foreground)] mb-1">{{ a.moduleTitle }}</p>
            <h3 class="font-semibold mb-1">{{ a.title }}</h3>
            <p v-if="a.description" class="text-sm text-[var(--muted-foreground)] line-clamp-2">{{ a.description?.replace(/<[^>]*>/g,'').substring(0,120) }}</p>
          </div>
          <div class="shrink-0 text-right">
            <UiBadge variant="secondary">{{ a.maxScore }} poin</UiBadge>
            <p v-if="a.dueDate" class="text-xs text-[var(--muted-foreground)] mt-1 flex items-center gap-1">
              <Clock class="w-3 h-3" />
              {{ new Date(a.dueDate).toLocaleDateString('id-ID') }}
            </p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="text-center py-16 text-[var(--muted-foreground)]">
      Belum ada tugas untuk course ini
    </div>
  </div>
</template>
