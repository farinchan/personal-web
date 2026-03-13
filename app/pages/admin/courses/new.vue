<script setup lang="ts">
import { ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Save, FileText, Video, Link, File } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useSeoMeta({ title: 'Course Baru — Admin', robots: 'noindex, nofollow' })

const router = useRouter()
const isSubmitting = ref(false)
const errorMessage = ref('')

const form = reactive({
  title: '',
  description: '',
  coverImage: '',
  visibility: 'public' as 'public' | 'private',
  maxStudents: null as number | null,
  status: 'draft' as 'draft' | 'active' | 'archived',
})

const isUploading = ref(false)
async function uploadCover(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isUploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const r = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: fd })
    form.coverImage = r.url
  } catch { errorMessage.value = 'Gagal upload cover' }
  finally { isUploading.value = false }
}

async function submitCourse() {
  if (!form.title) { errorMessage.value = 'Judul wajib diisi'; return }
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const result = await $fetch<{ id: number }>('/api/admin/courses', {
      method: 'POST',
      body: { ...form },
    })
    navigateTo(`/admin/courses/${result.id}`)
  } catch (e: any) {
    errorMessage.value = e.data?.statusMessage || 'Gagal membuat course'
  }
  isSubmitting.value = false
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold">Course Baru</h1>
      <NuxtLink to="/admin/courses" class="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        <ArrowLeft class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <div v-if="errorMessage" class="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">{{ errorMessage }}</div>

    <form @submit.prevent="submitCourse" class="space-y-6 max-w-2xl">
      <div>
        <label class="block text-sm font-medium mb-1">Judul Course</label>
        <UiInput v-model="form.title" placeholder="Masukkan judul course" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Deskripsi</label>
        <UiTextarea v-model="form.description" placeholder="Deskripsi course..." rows="3" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Cover Image</label>
        <div v-if="form.coverImage" class="mb-3 relative inline-block">
          <img :src="form.coverImage" class="max-h-40 rounded-lg" />
          <button type="button" @click="form.coverImage = ''" class="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
        </div>
        <input type="file" accept="image/*" @change="uploadCover" class="block w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)] file:text-[var(--primary-foreground)] file:cursor-pointer" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Visibilitas</label>
          <select v-model="form.visibility" class="w-full px-3 py-2 text-sm border border-[var(--input)] rounded-md bg-[var(--background)]">
            <option value="public">Public</option>
            <option value="private">Private (Invite Code)</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Status</label>
          <select v-model="form.status" class="w-full px-3 py-2 text-sm border border-[var(--input)] rounded-md bg-[var(--background)]">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Maks. Siswa (kosongkan = unlimited)</label>
        <UiInput v-model.number="form.maxStudents" type="number" placeholder="Unlimited" />
      </div>

      <div class="flex gap-4">
        <UiButton type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Menyimpan...' : 'Buat Course' }}
        </UiButton>
        <UiButton type="button" variant="outline" to="/admin/courses">Batal</UiButton>
      </div>
    </form>
  </div>
</template>
