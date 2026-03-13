<script setup lang="ts">
import { Clock, CheckCircle, XCircle, AlertTriangle, FileText, Target, RefreshCw, Check } from 'lucide-vue-next'

const route = useRoute()
const slug = route.params.slug as string
const examId = Number(route.params.examId)

const { data, error: fetchError } = await useFetch(`/api/lms/courses/${slug}/exams/${examId}/start`)
if (fetchError.value) {
  throw createError({ statusCode: 400, statusMessage: fetchError.value.data?.statusMessage || 'Ujian tidak tersedia' })
}

useSeoMeta({ title: () => `${data.value?.exam?.title} — Ujian` })

// Timer
const timeLeft = ref<number | null>(null)
const timerInterval = ref<ReturnType<typeof setInterval>>()
const started = ref(false)
const submitted = ref(false)
const result = ref<any>(null)

// Answers: { questionId: selectedOptionId[] }
const answers = ref<Record<string, number[]>>({})

function startExam() {
  started.value = true
  if (data.value?.exam?.duration) {
    timeLeft.value = data.value.exam.duration * 60
    timerInterval.value = setInterval(() => {
      if (timeLeft.value !== null) {
        timeLeft.value--
        if (timeLeft.value <= 0) {
          clearInterval(timerInterval.value)
          submitExam()
        }
      }
    }, 1000)
  }
}

onBeforeUnmount(() => {
  if (timerInterval.value) clearInterval(timerInterval.value)
})

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function toggleOption(questionId: number, optionId: number, type: string) {
  const key = String(questionId)
  if (!answers.value[key]) answers.value[key] = []

  if (type === 'single') {
    answers.value[key] = [optionId]
  } else {
    // Multiple: toggle
    const idx = answers.value[key].indexOf(optionId)
    if (idx >= 0) {
      answers.value[key].splice(idx, 1)
    } else {
      answers.value[key].push(optionId)
    }
  }
}

const submittingExam = ref(false)

async function submitExam() {
  if (submittingExam.value) return
  submittingExam.value = true
  if (timerInterval.value) clearInterval(timerInterval.value)

  try {
    result.value = await $fetch(`/api/lms/courses/${slug}/exams/${examId}/submit`, {
      method: 'POST',
      body: { attemptId: data.value?.attemptId, answers: answers.value },
    })
    submitted.value = true
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Gagal mengirim jawaban')
  }
  submittingExam.value = false
}

const answeredCount = computed(() => {
  return Object.values(answers.value).filter(v => v.length > 0).length
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-3xl" v-if="data">
    <!-- Result View -->
    <div v-if="submitted && result" class="space-y-6">
      <div :class="['border rounded-lg p-6 text-center',
        result.passed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50']">
        <div class="mb-3">
          <CheckCircle v-if="result.passed" class="w-16 h-16 text-green-600 mx-auto" />
          <XCircle v-else class="w-16 h-16 text-red-500 mx-auto" />
        </div>
        <h2 class="text-2xl font-bold mb-1" :class="result.passed ? 'text-green-800' : 'text-red-800'">
          {{ result.passed ? 'Lulus!' : 'Belum Lulus' }}
        </h2>
        <p class="text-4xl font-bold my-3" :class="result.passed ? 'text-green-700' : 'text-red-600'">
          {{ result.score }}%
        </p>
        <p class="text-sm text-gray-600">
          Skor: {{ result.totalScore }} / {{ result.totalPoints }} | Batas lulus: {{ result.passingScore }}%
        </p>
      </div>

      <!-- Review answers -->
      <div v-if="result.results?.length" class="space-y-4">
        <h3 class="font-semibold text-lg">Review Jawaban</h3>
        <div
          v-for="(r, i) in result.results"
          :key="r.questionId"
          :class="['border rounded-lg p-4', r.correct ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50']"
        >
          <div class="flex items-start gap-2 mb-2">
            <CheckCircle v-if="r.correct" class="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <XCircle v-else class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div class="font-medium text-sm" v-html="`${i + 1}. ${data.questions[i]?.question || ''}`" />
          </div>
          <p v-if="r.explanation" class="text-sm text-gray-600 ml-7 mt-1 italic">{{ r.explanation }}</p>
          <p class="text-xs text-gray-500 ml-7 mt-1">{{ r.points }} / {{ data.questions[i]?.points || 1 }} poin</p>
        </div>
      </div>

      <div class="flex gap-3">
        <NuxtLink :to="`/courses/${slug}`">
          <UiButton variant="outline">Kembali ke Course</UiButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Exam View -->
    <div v-else>
      <!-- Info header -->
      <div v-if="!started" class="border border-[var(--border)] rounded-lg p-6 text-center">
        <h1 class="text-2xl font-bold mb-3">{{ data.exam.title }}</h1>
        <p v-if="data.exam.description" class="text-[var(--muted-foreground)] mb-4">{{ data.exam.description }}</p>

        <div class="flex flex-wrap justify-center gap-4 text-sm text-[var(--muted-foreground)] mb-6">
          <span class="flex items-center gap-1"><FileText class="w-4 h-4" /> {{ data.questions.length }} soal</span>
          <span v-if="data.exam.duration" class="flex items-center gap-1"><Clock class="w-4 h-4" /> {{ data.exam.duration }} menit</span>
          <span class="flex items-center gap-1"><Target class="w-4 h-4" /> Batas lulus: {{ data.exam.passingScore }}%</span>
          <span class="flex items-center gap-1"><RefreshCw class="w-4 h-4" /> Percobaan: {{ data.attemptCount }}/{{ data.exam.maxAttempts }}</span>
        </div>

        <!-- Previous results -->
        <div v-if="data.previousResults?.length" class="mb-6">
          <h4 class="text-sm font-medium mb-2">Hasil Sebelumnya:</h4>
          <div class="flex flex-wrap justify-center gap-2">
            <UiBadge v-for="(pr, i) in data.previousResults" :key="i"
              :class="pr.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
              {{ pr.score }}% — {{ pr.passed ? 'Lulus' : 'Gagal' }}
            </UiBadge>
          </div>
        </div>

        <UiButton @click="startExam" class="bg-blue-600 hover:bg-blue-700 text-white px-8">
          Mulai Ujian
        </UiButton>
      </div>

      <!-- Questions -->
      <div v-else>
        <!-- Timer bar -->
        <div class="sticky top-16 z-40 bg-[var(--background)] border-b border-[var(--border)] py-3 mb-6">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold">{{ data.exam.title }}</h2>
            <div class="flex items-center gap-4">
              <span class="text-sm text-[var(--muted-foreground)]">
                {{ answeredCount }}/{{ data.questions.length }} dijawab
              </span>
              <span v-if="timeLeft !== null" :class="['flex items-center gap-1 font-mono text-sm font-bold',
                timeLeft < 60 ? 'text-red-600' : timeLeft < 300 ? 'text-orange-500' : 'text-[var(--foreground)]']">
                <Clock class="w-4 h-4" /> {{ formatTime(timeLeft) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Question list -->
        <div class="space-y-6 mb-8">
          <div
            v-for="(q, qi) in data.questions"
            :key="q.id"
            class="border border-[var(--border)] rounded-lg p-5"
          >
            <div class="flex items-start gap-3 mb-4">
              <span class="text-sm font-bold bg-[var(--muted)] px-2 py-0.5 rounded">{{ qi + 1 }}</span>
              <div>
                <div class="font-medium" v-html="q.question" />
                <p class="text-xs text-[var(--muted-foreground)] mt-1">
                  {{ q.type === 'single' ? 'Pilih satu jawaban' : 'Pilih satu atau lebih jawaban' }}
                  · {{ q.points }} poin
                </p>
              </div>
            </div>

            <div class="space-y-2 ml-8">
              <button
                v-for="opt in q.options"
                :key="opt.id"
                @click="toggleOption(q.id, opt.id, q.type)"
                :class="['w-full text-left px-4 py-2.5 border rounded-lg text-sm transition-colors flex items-center gap-3',
                  answers[String(q.id)]?.includes(opt.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-[var(--border)] hover:bg-[var(--accent)]']"
              >
                <span :class="['w-5 h-5 border-2 rounded shrink-0 flex items-center justify-center text-xs',
                  q.type === 'single' ? 'rounded-full' : '',
                  answers[String(q.id)]?.includes(opt.id) ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300']">
                  <Check v-if="answers[String(q.id)]?.includes(opt.id)" class="w-3 h-3" />
                </span>
                <span v-html="opt.text" />
              </button>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div class="sticky bottom-0 bg-[var(--background)] border-t border-[var(--border)] py-4">
          <div class="flex items-center justify-between">
            <p v-if="answeredCount < data.questions.length" class="text-sm text-orange-500 flex items-center gap-1">
              <AlertTriangle class="w-4 h-4" /> {{ data.questions.length - answeredCount }} soal belum dijawab
            </p>
            <span v-else />
            <UiButton
              @click="submitExam"
              :disabled="submittingExam"
              class="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {{ submittingExam ? 'Mengirim...' : 'Kirim Jawaban' }}
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
