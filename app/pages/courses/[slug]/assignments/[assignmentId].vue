<script setup lang="ts">
import { Upload, CheckCircle, Clock, AlertCircle } from 'lucide-vue-next'

const route = useRoute()
const slug = route.params.slug as string
const assignmentId = Number(route.params.assignmentId)

const { data, refresh } = await useFetch(`/api/lms/courses/${slug}/assignments/${assignmentId}`)

useSeoMeta({
  title: () => `${data.value?.assignment?.title} — Tugas`,
})

// Render description
const { renderMathInHtml } = useRenderMath()
const renderedDesc = computed(() => {
  if (!data.value?.assignment?.description) return ''
  return renderMathInHtml(data.value.assignment.description)
})

// Submission form
const content = ref(data.value?.submission?.content || '')
const fileUrl = ref(data.value?.submission?.fileUrl || '')
const submitting = ref(false)
const error = ref('')
const success = ref('')

async function submitAssignment() {
  error.value = ''
  success.value = ''
  submitting.value = true
  try {
    await $fetch(`/api/lms/courses/${slug}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: { content: content.value, fileUrl: fileUrl.value },
    })
    success.value = 'Tugas berhasil dikumpulkan!'
    await refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Gagal mengumpulkan tugas'
  }
  submitting.value = false
}

// File upload
async function uploadFile(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.[0]) return
  const formData = new FormData()
  formData.append('file', input.files[0])
  try {
    const result = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: formData })
    fileUrl.value = result.url
  } catch {
    error.value = 'Gagal upload file'
  }
}

const isGraded = computed(() => data.value?.submission?.status === 'graded')
const isPastDue = computed(() => {
  if (!data.value?.assignment?.dueDate) return false
  return new Date() > new Date(data.value.assignment.dueDate)
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-3xl" v-if="data">
    <NuxtLink :to="`/courses/${slug}/assignments`" class="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 inline-block">
      ← Kembali ke Daftar Tugas
    </NuxtLink>

    <h1 class="text-2xl font-bold mb-2">{{ data.assignment.title }}</h1>

    <div class="flex flex-wrap gap-3 mb-6 text-sm">
      <UiBadge variant="secondary">Maks. {{ data.assignment.maxScore }} poin</UiBadge>
      <span v-if="data.assignment.dueDate" class="flex items-center gap-1 text-[var(--muted-foreground)]">
        <Clock class="w-3.5 h-3.5" />
        Deadline: {{ new Date(data.assignment.dueDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
      </span>
      <UiBadge v-if="isPastDue && !data.assignment.allowLateSubmission" class="bg-red-100 text-red-800">Lewat deadline</UiBadge>
    </div>

    <!-- Description -->
    <div v-if="renderedDesc" class="prose mb-8 border-b border-[var(--border)] pb-6" v-html="renderedDesc" />

    <!-- Graded result -->
    <div v-if="isGraded" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div class="flex items-center gap-2 mb-2">
        <CheckCircle class="w-5 h-5 text-green-600" />
        <span class="font-semibold text-green-800">Sudah Dinilai</span>
      </div>
      <p class="text-2xl font-bold text-green-700 mb-1">{{ data.submission.score }} / {{ data.assignment.maxScore }}</p>
      <p v-if="data.submission.feedback" class="text-sm text-green-800 mt-2">
        <strong>Feedback:</strong> {{ data.submission.feedback }}
      </p>
    </div>

    <!-- Submission status -->
    <div v-else-if="data.submission" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div class="flex items-center gap-2">
        <Clock class="w-5 h-5 text-blue-600" />
        <span class="text-blue-800">Tugas sudah dikumpulkan, menunggu penilaian</span>
      </div>
    </div>

    <!-- Submission form -->
    <div v-if="!isGraded" class="border border-[var(--border)] rounded-lg p-6">
      <h3 class="font-semibold mb-4">{{ data.submission ? 'Perbarui Pengumpulan' : 'Kumpulkan Tugas' }}</h3>

      <div v-if="error" class="bg-red-50 text-red-800 px-4 py-2 rounded-lg mb-4 text-sm">{{ error }}</div>
      <div v-if="success" class="bg-green-50 text-green-800 px-4 py-2 rounded-lg mb-4 text-sm">{{ success }}</div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Jawaban / Catatan</label>
          <UiTextarea v-model="content" rows="6" placeholder="Tulis jawaban kamu di sini..." />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Upload File (opsional)</label>
          <div class="flex items-center gap-3">
            <input type="file" @change="uploadFile" class="text-sm" />
            <span v-if="fileUrl" class="text-xs text-green-600 flex items-center gap-1"><CheckCircle class="w-3.5 h-3.5" /> File uploaded</span>
          </div>
        </div>

        <UiButton
          @click="submitAssignment"
          :disabled="submitting || (!content.trim() && !fileUrl) || (isPastDue && !data.assignment.allowLateSubmission)"
          class="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Upload class="w-4 h-4 mr-2" />
          {{ submitting ? 'Mengumpulkan...' : (data.submission ? 'Perbarui' : 'Kumpulkan') }}
        </UiButton>
      </div>
    </div>
  </div>
</template>
