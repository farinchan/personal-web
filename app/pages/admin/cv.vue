<script setup lang="ts">
import { ChevronUp, ChevronDown, Plus } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useSeoMeta({ title: 'Edit CV — Admin', robots: 'noindex, nofollow' })

const { data: existingSections } = await useFetch('/api/cv')

interface CVSection {
  type: string
  title: string
  body: string
}

const sections = ref<CVSection[]>(
  existingSections.value && existingSections.value.length > 0
    ? existingSections.value.map((s: any) => ({
        type: s.type,
        title: s.title,
        body: s.body,
      }))
    : []
)
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const typeOptions = ['experience', 'education', 'skills', 'certifications', 'projects']

function addSection() {
  sections.value = [...sections.value, { type: 'experience', title: '', body: '' }]
}

function removeSection(index: number) {
  sections.value.splice(index, 1)
}

function moveUp(index: number) {
  if (index > 0) {
    const temp = sections.value[index]!
    sections.value[index] = sections.value[index - 1]!
    sections.value[index - 1] = temp
  }
}

function moveDown(index: number) {
  if (index < sections.value.length - 1) {
    const temp = sections.value[index]!
    const next = sections.value[index + 1]
    if (next) {
      sections.value[index] = next
      sections.value[index + 1] = temp
    }
  }
}

async function saveCV() {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch('/api/cv', {
      method: 'PUT',
      body: { sections: sections.value },
    })
    successMessage.value = 'CV berhasil diupdate'
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Gagal mengupdate CV'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold">Edit CV</h1>
      <UiButton @click="addSection" variant="outline">
        <Plus class="w-4 h-4 mr-1" /> Tambah Section
      </UiButton>
    </div>

    <div v-if="successMessage" class="bg-green-50 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="saveCV" class="space-y-6">
      <UiCard v-for="(section, index) in sections" :key="index" class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold">Section {{ index + 1 }}</h3>
          <div class="flex gap-2">
            <UiButton type="button" size="sm" variant="ghost" @click="moveUp(index)" :disabled="index === 0"><ChevronUp class="w-4 h-4" /></UiButton>
            <UiButton type="button" size="sm" variant="ghost" @click="moveDown(index)" :disabled="index === sections.length - 1"><ChevronDown class="w-4 h-4" /></UiButton>
            <UiButton type="button" size="sm" variant="destructive" @click="removeSection(index)">Hapus</UiButton>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Tipe</label>
            <select v-model="section.type" class="flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-1 text-sm">
              <option v-for="opt in typeOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Judul</label>
            <UiInput v-model="section.title" placeholder="Nama section" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Konten (HTML/Markdown)</label>
            <UiTextarea v-model="section.body" placeholder="Isi section..." :rows="6" />
          </div>
        </div>
      </UiCard>

      <div v-if="sections.length === 0" class="text-center text-[var(--muted-foreground)] py-8">
        Belum ada section. Klik "Tambah Section" untuk mulai.
      </div>

      <UiButton type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Menyimpan...' : 'Simpan CV' }}
      </UiButton>
    </form>
  </div>
</template>
