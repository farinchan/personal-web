<script setup lang="ts">
import { FileText, Clock, CheckCircle, XCircle, Target, FolderOpen } from 'lucide-vue-next'

const route = useRoute()
const slug = route.params.slug as string

const { data } = await useFetch(`/api/lms/courses/${slug}/exams`)

useSeoMeta({ title: 'Ujian' })
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-3xl">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Ujian</h1>
      <NuxtLink :to="`/courses/${slug}`">
        <UiButton variant="outline" size="sm">← Kembali</UiButton>
      </NuxtLink>
    </div>

    <div v-if="!data?.length" class="text-center py-12 text-[var(--muted-foreground)]">
      Belum ada ujian untuk course ini.
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="exam in data"
        :key="exam.id"
        :to="`/courses/${slug}/exams/${exam.id}`"
        class="block border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--accent)] transition-colors"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <FileText class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h3 class="font-medium">{{ exam.title }}</h3>
              <p v-if="exam.description" class="text-sm text-[var(--muted-foreground)] mt-0.5 line-clamp-2">{{ exam.description }}</p>
              <div class="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)] mt-2">
                <span v-if="exam.duration" class="flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5" /> {{ exam.duration }} menit
                </span>
                <span class="flex items-center gap-1"><Target class="w-3.5 h-3.5" /> Batas lulus: {{ exam.passingScore }}%</span>
                <span v-if="exam.moduleTitle" class="flex items-center gap-1 text-[var(--muted-foreground)]"><FolderOpen class="w-3.5 h-3.5" /> {{ exam.moduleTitle }}</span>
              </div>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
