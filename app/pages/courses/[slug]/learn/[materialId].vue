<script setup lang="ts">
import { MessageSquare, CheckCircle, Circle, ChevronLeft, ChevronRight, FileText, ClipboardList, GraduationCap, Video, FolderOpen } from 'lucide-vue-next'

const route = useRoute()
const slug = route.params.slug as string
const materialId = Number(route.params.materialId)

// Get material data
const { data, error: fetchError, refresh } = await useFetch(`/api/lms/courses/${slug}/materials/${materialId}`)
if (fetchError.value) {
  if (fetchError.value.statusCode === 401) {
    await navigateTo('/courses/login', { replace: true })
  } else if (fetchError.value.statusCode === 403) {
    await navigateTo(`/courses/${slug}`, { replace: true })
  } else {
    throw createError({ statusCode: 404, statusMessage: fetchError.value.data?.statusMessage || 'Materi tidak ditemukan' })
  }
}

// Get course structure for sidebar
const { data: courseData } = await useFetch(`/api/lms/courses/${slug}`)

useSeoMeta({
  title: () => `${data.value?.material?.title} — Fajri Course`,
})

// Render body with math + code highlight
const { renderMathInHtml } = useRenderMath()
const { highlightCodeBlocks } = useCodeHighlight()
const renderedBody = ref('')

function processBody() {
  if (!data.value?.material?.body) return ''
  let html = data.value.material.body
  html = renderMathInHtml(html)
  return html
}

renderedBody.value = processBody()

onMounted(async () => {
  const html = processBody()
  renderedBody.value = await highlightCodeBlocks(html)
})

// Mark as complete
const completing = ref(false)
async function markComplete() {
  completing.value = true
  try {
    await $fetch(`/api/lms/courses/${slug}/materials/${materialId}/complete`, { method: 'POST' })
    await refresh()
  } catch { }
  completing.value = false
}

// Navigation
const allMaterials = computed(() => {
  if (!courseData.value?.modules) return []
  return courseData.value.modules.flatMap((m: any) => m.materials)
})

const currentIndex = computed(() => allMaterials.value.findIndex((m: any) => m.id === materialId))
const prevMaterial = computed(() => currentIndex.value > 0 ? allMaterials.value[currentIndex.value - 1] : null)
const nextMaterial = computed(() => currentIndex.value < allMaterials.value.length - 1 ? allMaterials.value[currentIndex.value + 1] : null)

// Discussion
const showDiscussion = ref(false)
const { data: discussionData, refresh: refreshDiscussions } = await useFetch(`/api/lms/courses/${slug}/discussions`, {
  query: { materialId },
  lazy: true,
  default: () => ({ discussions: [] }),
})
const newComment = ref('')
const replyTo = ref<number | null>(null)
const replyText = ref('')
const submittingComment = ref(false)

async function submitComment(parentId?: number) {
  submittingComment.value = true
  try {
    await $fetch(`/api/lms/courses/${slug}/discussions`, {
      method: 'POST',
      body: {
        materialId,
        body: parentId ? replyText.value : newComment.value,
        parentId: parentId || null,
      },
    })
    newComment.value = ''
    replyText.value = ''
    replyTo.value = null
    await refreshDiscussions()
  } catch { }
  submittingComment.value = false
}

// Sidebar toggle
const sidebarOpen = ref(true)
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)]" v-if="data">
    <!-- Sidebar -->
    <aside
      :class="['border-r border-[var(--border)] bg-[var(--background)] overflow-y-auto transition-all shrink-0',
        sidebarOpen ? 'w-72' : 'w-0 border-0']"
    >
      <div v-show="sidebarOpen" class="p-4">
        <NuxtLink :to="`/courses/${slug}`" class="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-3 flex items-center gap-1">
          <ChevronLeft class="w-3 h-3" /> {{ courseData?.course?.title }}
        </NuxtLink>

        <div v-for="mod in courseData?.modules" :key="mod.id" class="mb-4">
          <h4 class="text-xs font-semibold uppercase text-[var(--muted-foreground)] mb-2">{{ mod.title }}</h4>
          <div v-for="mat in mod.materials" :key="mat.id">
            <NuxtLink
              :to="`/courses/${slug}/learn/${mat.id}`"
              :class="['flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors mb-0.5',
                mat.id === materialId
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-[var(--foreground)] hover:bg-[var(--accent)]']"
            >
              <span class="text-xs flex items-center">
                <FileText v-if="mat.type === 'content'" class="w-3.5 h-3.5" />
                <ClipboardList v-else-if="mat.type === 'post'" class="w-3.5 h-3.5" />
                <Video v-else-if="mat.type === 'video'" class="w-3.5 h-3.5" />
                <FolderOpen v-else class="w-3.5 h-3.5" />
              </span>
              <span class="flex-1 truncate">{{ mat.title }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-4xl mx-auto px-6 py-6">
        <!-- Top bar -->
        <div class="flex items-center gap-3 mb-6">
          <button @click="sidebarOpen = !sidebarOpen" class="p-1.5 rounded hover:bg-[var(--accent)]">
            <ChevronRight :class="['w-4 h-4 transition-transform', { 'rotate-180': sidebarOpen }]" />
          </button>
          <h1 class="text-2xl font-bold flex-1">{{ data.material.title }}</h1>
        </div>

        <!-- Video embed -->
        <div v-if="data.material.type === 'video' && data.material.videoUrl" class="mb-6">
          <div class="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe :src="data.material.videoUrl" class="w-full h-full" frameborder="0" allowfullscreen />
          </div>
        </div>

        <!-- File download -->
        <div v-if="data.material.type === 'file' && data.material.fileUrl" class="mb-6">
          <a
            :href="data.material.fileUrl"
            target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]"
          >
            <FileText class="w-4 h-4" /> Download File
          </a>
        </div>

        <!-- Content body -->
        <div v-if="renderedBody" class="prose mb-8" v-html="renderedBody" />

        <!-- Complete button -->
        <div class="flex items-center gap-4 py-4 border-t border-[var(--border)] mb-6">
          <button
            v-if="!data.completed"
            @click="markComplete"
            :disabled="completing"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle class="w-4 h-4" />
            {{ completing ? 'Memproses...' : 'Tandai Selesai' }}
          </button>
          <div v-else class="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle class="w-5 h-5" /> Sudah diselesaikan
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between py-4 border-t border-[var(--border)] mb-8">
          <NuxtLink
            v-if="prevMaterial"
            :to="`/courses/${slug}/learn/${prevMaterial.id}`"
            class="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <ChevronLeft class="w-4 h-4" /> {{ prevMaterial.title }}
          </NuxtLink>
          <span v-else />
          <NuxtLink
            v-if="nextMaterial"
            :to="`/courses/${slug}/learn/${nextMaterial.id}`"
            class="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {{ nextMaterial.title }} <ChevronRight class="w-4 h-4" />
          </NuxtLink>
        </div>

        <!-- Discussion Toggle -->
        <div class="border-t border-[var(--border)] pt-6">
          <button
            @click="showDiscussion = !showDiscussion"
            class="flex items-center gap-2 text-sm font-medium hover:text-blue-600 transition-colors"
          >
            <MessageSquare class="w-4 h-4" />
            Diskusi ({{ discussionData?.discussions?.length || 0 }})
          </button>

          <div v-if="showDiscussion" class="mt-4 space-y-4">
            <!-- New comment -->
            <div class="flex gap-3">
              <UiTextarea
                v-model="newComment"
                placeholder="Tulis pertanyaan atau komentar..."
                class="flex-1"
                rows="2"
              />
              <UiButton
                @click="submitComment()"
                :disabled="!newComment.trim() || submittingComment"
                class="self-end bg-blue-600 text-white"
              >
                Kirim
              </UiButton>
            </div>

            <!-- Discussion list -->
            <div v-for="d in discussionData?.discussions" :key="d.id" class="border border-[var(--border)] rounded-lg p-4">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-bold">
                  {{ d.studentName?.charAt(0) }}
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-sm">{{ d.studentName }}</span>
                    <UiBadge v-if="d.isInstructor" variant="default" class="text-xs bg-blue-600">Instructor</UiBadge>
                    <span class="text-xs text-[var(--muted-foreground)]">{{ new Date(d.createdAt).toLocaleDateString('id-ID') }}</span>
                  </div>
                  <p class="text-sm">{{ d.body }}</p>

                  <button
                    @click="replyTo = replyTo === d.id ? null : d.id"
                    class="text-xs text-blue-600 hover:underline mt-2"
                  >
                    Balas
                  </button>

                  <!-- Reply form -->
                  <div v-if="replyTo === d.id" class="mt-2 flex gap-2">
                    <UiInput v-model="replyText" placeholder="Tulis balasan..." class="flex-1" />
                    <UiButton size="sm" @click="submitComment(d.id)" :disabled="!replyText.trim()" class="bg-blue-600 text-white">Balas</UiButton>
                  </div>

                  <!-- Replies -->
                  <div v-if="d.replies?.length" class="mt-3 space-y-3 pl-4 border-l-2 border-[var(--border)]">
                    <div v-for="reply in d.replies" :key="reply.id" class="flex items-start gap-2">
                      <div class="w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs">
                        {{ reply.studentName?.charAt(0) }}
                      </div>
                      <div>
                        <div class="flex items-center gap-2 mb-0.5">
                          <span class="font-medium text-xs">{{ reply.studentName }}</span>
                          <UiBadge v-if="reply.isInstructor" variant="default" class="text-[10px] bg-blue-600">Instructor</UiBadge>
                          <span class="text-[10px] text-[var(--muted-foreground)]">{{ new Date(reply.createdAt).toLocaleDateString('id-ID') }}</span>
                        </div>
                        <p class="text-sm">{{ reply.body }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p v-if="!discussionData?.discussions?.length" class="text-sm text-[var(--muted-foreground)] text-center py-4">
              Belum ada diskusi. Jadilah yang pertama bertanya!
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
