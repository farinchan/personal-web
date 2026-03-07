<script setup lang="ts">
import { ArrowLeft, X } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useSeoMeta({ title: 'Artikel Baru — Admin', robots: 'noindex, nofollow' })

const title = ref('')
const description = ref('')
const body = ref('')
const coverImage = ref('')
const coverPreview = ref('')
const isDraft = ref(true)
const tagInput = ref('')
const selectedTags = ref<string[]>([])
const isSubmitting = ref(false)
const isUploading = ref(false)
const errorMessage = ref('')

async function uploadCover(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const result = await $fetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    })
    coverImage.value = result.url
    coverPreview.value = result.url
  } catch {
    errorMessage.value = 'Gagal upload cover image'
  } finally {
    isUploading.value = false
  }
}

function removeCover() {
  coverImage.value = ''
  coverPreview.value = ''
}

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag)
  }
  tagInput.value = ''
}

function removeTag(tag: string) {
  selectedTags.value = selectedTags.value.filter(t => t !== tag)
}

async function submitPost() {
  if (!title.value || !body.value) {
    errorMessage.value = 'Judul dan konten wajib diisi'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/posts', {
      method: 'POST',
      body: {
        title: title.value,
        description: description.value,
        body: body.value,
        coverImage: coverImage.value || null,
        isDraft: isDraft.value,
        tags: selectedTags.value,
      },
    })
    navigateTo('/admin/posts')
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Gagal membuat artikel'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold">Artikel Baru</h1>
      <NuxtLink to="/admin/posts" class="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        <ArrowLeft class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <div v-if="errorMessage" class="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="submitPost" class="space-y-6 max-w-3xl">
      <div>
        <label class="block text-sm font-medium mb-1">Judul</label>
        <UiInput v-model="title" placeholder="Judul artikel" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Deskripsi</label>
        <UiInput v-model="description" placeholder="Deskripsi singkat artikel" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Cover Image</label>
        <div v-if="coverPreview" class="mb-3">
          <div class="relative inline-block">
            <img :src="coverPreview" alt="Cover preview" class="max-h-48 rounded-lg" />
            <button type="button" @click="removeCover" class="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"><X class="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <input type="file" accept="image/*" @change="uploadCover" class="block w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)] file:text-[var(--primary-foreground)] file:cursor-pointer hover:file:opacity-90" />
        <p v-if="isUploading" class="text-sm text-[var(--muted-foreground)] mt-1">Mengupload...</p>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Tags</label>
        <div class="flex gap-2 mb-2 flex-wrap">
          <UiBadge v-for="tag in selectedTags" :key="tag" variant="secondary" class="cursor-pointer flex items-center gap-1" @click="removeTag(tag)">
            {{ tag }} <X class="w-3 h-3" />
          </UiBadge>
        </div>
        <div class="flex gap-2">
          <UiInput v-model="tagInput" placeholder="Tambah tag..." @keydown.enter.prevent="addTag" />
          <UiButton type="button" variant="outline" @click="addTag">Tambah</UiButton>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Konten</label>
        <EditorRichTextEditor v-model="body" placeholder="Tulis konten artikel..." />
      </div>

      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="isDraft" class="rounded" />
          <span class="text-sm">Simpan sebagai draft</span>
        </label>
      </div>

      <div class="flex gap-4">
        <UiButton type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan Artikel' }}
        </UiButton>
        <UiButton type="button" variant="outline" to="/admin/posts">
          Batal
        </UiButton>
      </div>
    </form>
  </div>
</template>
