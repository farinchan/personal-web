<script setup lang="ts">
import { Plus, Users, Eye, EyeOff, Trash2, Edit } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useSeoMeta({ title: 'Kelola Courses — Admin', robots: 'noindex, nofollow' })

const { data: courses, refresh } = await useFetch('/api/admin/courses')

async function deleteCourse(id: number) {
  if (!confirm('Yakin ingin menghapus course ini? Semua data terkait akan ikut terhapus.')) return
  await $fetch(`/api/admin/courses/${id}`, { method: 'DELETE' })
  await refresh()
}

function statusColor(status: string) {
  return status === 'active' ? 'bg-green-100 text-green-800' : status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold">Kelola Courses</h1>
      <UiButton to="/admin/courses/new">
        <Plus class="w-4 h-4 mr-1" /> Course Baru
      </UiButton>
    </div>

    <div v-if="!courses?.length" class="text-center py-12 text-[var(--muted-foreground)]">
      Belum ada course. Buat course pertama Anda.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="course in courses"
        :key="course.id"
        class="border border-[var(--border)] rounded-lg p-4 flex items-center justify-between hover:bg-[var(--accent)]/30 transition-colors"
      >
        <div class="flex items-center gap-4 min-w-0">
          <img v-if="course.coverImage" :src="course.coverImage" class="w-16 h-12 object-cover rounded" />
          <div class="w-16 h-12 bg-[var(--muted)] rounded flex items-center justify-center" v-else>
            <span class="text-2xl">📚</span>
          </div>
          <div class="min-w-0">
            <h3 class="font-medium truncate">{{ course.title }}</h3>
            <div class="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mt-1">
              <UiBadge :class="statusColor(course.status)" class="text-[10px]">{{ course.status }}</UiBadge>
              <span class="flex items-center gap-1">
                <component :is="course.visibility === 'public' ? Eye : EyeOff" class="w-3 h-3" /> {{ course.visibility }}
              </span>
              <span class="flex items-center gap-1">
                <Users class="w-3 h-3" /> {{ course.studentCount }} siswa
              </span>
              <span v-if="course.inviteCode" class="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded text-[10px]">
                {{ course.inviteCode }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <NuxtLink :to="`/admin/courses/${course.id}`">
            <UiButton variant="outline" size="sm">
              <Edit class="w-4 h-4" />
            </UiButton>
          </NuxtLink>
          <UiButton variant="outline" size="sm" @click="deleteCourse(course.id)" class="text-red-600 hover:text-red-700">
            <Trash2 class="w-4 h-4" />
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
