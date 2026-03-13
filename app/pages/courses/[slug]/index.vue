<script setup lang="ts">
import { Library, BookOpen, Users, CheckCircle, Lock, FileText, Pen, Video, FolderOpen, Target, ClipboardList } from 'lucide-vue-next'

const route = useRoute()
const slug = route.params.slug as string

const { data, error: fetchError } = await useFetch(`/api/lms/courses/${slug}`)

if (fetchError.value) {
  throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })
}

useSeoMeta({
  title: () => `${data.value?.course?.title} — Fajri Course`,
  description: () => data.value?.course?.description || '',
})

const joinError = ref('')
const joinLoading = ref(false)
const inviteCode = ref('')
const showInviteModal = ref(false)

async function joinCourse() {
  joinError.value = ''
  joinLoading.value = true
  try {
    await $fetch(`/api/lms/courses/${slug}/join`, {
      method: 'POST',
      body: data.value?.course?.visibility === 'private' ? { inviteCode: inviteCode.value } : {},
    })
    // Refresh page
    await refreshNuxtData()
    showInviteModal.value = false
  } catch (e: any) {
    joinError.value = e.data?.statusMessage || 'Gagal bergabung'
  } finally {
    joinLoading.value = false
  }
}

function handleJoinClick() {
  if (data.value?.course?.visibility === 'private') {
    showInviteModal.value = true
  } else {
    joinCourse()
  }
}

// Check auth
const { data: session } = await useFetch('/api/lms/auth/me')
const isLoggedIn = computed(() => session.value?.loggedIn)
</script>

<template>
  <div class="container mx-auto px-4 py-8" v-if="data">
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink to="/courses" class="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 inline-block">
        ← Kembali ke Courses
      </NuxtLink>

      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Cover -->
        <div class="lg:w-1/3 shrink-0">
          <div class="aspect-video bg-[var(--muted)] rounded-lg overflow-hidden">
            <img
              v-if="data.course.coverImage"
              :src="data.course.coverImage"
              :alt="data.course.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-6xl font-bold text-[var(--muted-foreground)]/20">
              {{ data.course.title.charAt(0) }}
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1">
          <h1 class="text-3xl font-bold mb-3">{{ data.course.title }}</h1>
          <p v-if="data.course.description" class="text-[var(--muted-foreground)] mb-4">{{ data.course.description }}</p>

          <div class="flex flex-wrap gap-3 mb-6 text-sm text-[var(--muted-foreground)]">
            <span class="flex items-center gap-1"><Library class="w-4 h-4" /> {{ data.course.moduleCount }} modul</span>
            <span class="flex items-center gap-1"><BookOpen class="w-4 h-4" /> {{ data.course.materialCount }} materi</span>
            <span class="flex items-center gap-1"><Users class="w-4 h-4" /> {{ data.course.studentCount }} siswa</span>
          </div>

          <!-- Enrollment status -->
          <div v-if="data.enrollment">
            <div class="flex items-center gap-3 mb-4">
              <UiBadge variant="default" class="bg-green-600 flex items-center gap-1"><CheckCircle class="w-3.5 h-3.5" /> Terdaftar</UiBadge>
              <span class="text-sm text-[var(--muted-foreground)]">Progress: {{ Number(data.enrollment.progress) }}%</span>
            </div>
            <div class="w-full bg-[var(--muted)] rounded-full h-2.5 mb-4">
              <div class="bg-blue-600 h-2.5 rounded-full transition-all" :style="{ width: `${Number(data.enrollment.progress)}%` }" />
            </div>
          </div>

          <div v-else-if="isLoggedIn" class="mb-4">
            <div v-if="joinError" class="bg-red-50 text-red-800 px-4 py-2 rounded-lg mb-3 text-sm">{{ joinError }}</div>
            <UiButton @click="handleJoinClick" :disabled="joinLoading" class="bg-blue-600 hover:bg-blue-700 text-white">
              <template v-if="joinLoading">Memproses...</template>
              <template v-else-if="data.course.visibility === 'private'"><Lock class="w-4 h-4 mr-1 inline" /> Gabung dengan Kode</template>
              <template v-else>Gabung Course</template>
            </UiButton>
          </div>

          <div v-else class="mb-4">
            <NuxtLink to="/courses/login">
              <UiButton class="bg-blue-600 hover:bg-blue-700 text-white">Login untuk Bergabung</UiButton>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Curriculum -->
    <div class="border border-[var(--border)] rounded-lg overflow-hidden">
      <h2 class="text-lg font-semibold px-6 py-4 bg-[var(--muted)]/50 border-b border-[var(--border)]">Kurikulum</h2>

      <div v-for="(mod, mi) in data.modules" :key="mod.id" class="border-b border-[var(--border)] last:border-0">
        <div class="px-6 py-3 bg-[var(--muted)]/30 font-medium text-sm flex items-center gap-2">
          <span class="text-[var(--muted-foreground)]">Modul {{ mi + 1 }}:</span>
          {{ mod.title }}
          <span class="ml-auto text-xs text-[var(--muted-foreground)]">
            {{ mod.materials.length }} materi
            <template v-if="mod.assignments?.length"> · {{ mod.assignments.length }} tugas</template>
            <template v-if="mod.exams?.length"> · {{ mod.exams.length }} ujian</template>
          </span>
        </div>
        <div v-if="mod.materials.length || mod.assignments?.length || mod.exams?.length">
          <!-- Materials -->
          <template v-for="(mat, matI) in mod.materials" :key="'mat-'+mat.id">
            <NuxtLink
              v-if="data.enrollment"
              :to="`/courses/${slug}/learn/${mat.id}`"
              class="px-6 py-2.5 flex items-center gap-3 text-sm transition-colors no-underline text-inherit cursor-pointer hover:bg-[var(--accent)]/50"
            >
              <span class="text-[var(--muted-foreground)] text-xs w-6">{{ matI + 1 }}.</span>
              <span class="flex-1">{{ mat.title }}</span>
              <UiBadge variant="secondary" class="text-xs flex items-center gap-1">
                <FileText v-if="mat.type === 'content'" class="w-3.5 h-3.5" />
                <Pen v-else-if="mat.type === 'post'" class="w-3.5 h-3.5" />
                <Video v-else-if="mat.type === 'video'" class="w-3.5 h-3.5" />
                <FolderOpen v-else class="w-3.5 h-3.5" />
                {{ mat.type }}
              </UiBadge>
              <span v-if="mat.duration" class="text-xs text-[var(--muted-foreground)]">{{ mat.duration }} min</span>
            </NuxtLink>
            <div v-else class="px-6 py-2.5 flex items-center gap-3 text-sm">
              <span class="text-[var(--muted-foreground)] text-xs w-6">{{ matI + 1 }}.</span>
              <span class="flex-1">{{ mat.title }}</span>
              <UiBadge variant="secondary" class="text-xs flex items-center gap-1">
                <FileText v-if="mat.type === 'content'" class="w-3.5 h-3.5" />
                <Pen v-else-if="mat.type === 'post'" class="w-3.5 h-3.5" />
                <Video v-else-if="mat.type === 'video'" class="w-3.5 h-3.5" />
                <FolderOpen v-else class="w-3.5 h-3.5" />
                {{ mat.type }}
              </UiBadge>
              <span v-if="mat.duration" class="text-xs text-[var(--muted-foreground)]">{{ mat.duration }} min</span>
            </div>
          </template>

          <!-- Assignments -->
          <template v-for="a in mod.assignments" :key="'assign-'+a.id">
            <NuxtLink
              v-if="data.enrollment"
              :to="`/courses/${slug}/assignments/${a.id}`"
              class="px-6 py-2.5 flex items-center gap-3 text-sm transition-colors no-underline text-inherit cursor-pointer hover:bg-[var(--accent)]/50"
            >
              <span class="text-orange-500 text-xs w-6 flex items-center justify-center"><ClipboardList class="w-4 h-4" /></span>
              <span class="flex-1">{{ a.title }}</span>
              <UiBadge variant="secondary" class="text-xs bg-orange-50 text-orange-700">Tugas</UiBadge>
              <span class="text-xs text-[var(--muted-foreground)]">{{ a.maxScore }} poin</span>
              <span v-if="a.dueDate" class="text-xs text-[var(--muted-foreground)]">{{ new Date(a.dueDate).toLocaleDateString('id-ID') }}</span>
            </NuxtLink>
            <div v-else class="px-6 py-2.5 flex items-center gap-3 text-sm">
              <span class="text-orange-500 text-xs w-6 flex items-center justify-center"><ClipboardList class="w-4 h-4" /></span>
              <span class="flex-1">{{ a.title }}</span>
              <UiBadge variant="secondary" class="text-xs bg-orange-50 text-orange-700">Tugas</UiBadge>
              <span class="text-xs text-[var(--muted-foreground)]">{{ a.maxScore }} poin</span>
              <span v-if="a.dueDate" class="text-xs text-[var(--muted-foreground)]">{{ new Date(a.dueDate).toLocaleDateString('id-ID') }}</span>
            </div>
          </template>

          <!-- Exams -->
          <template v-for="ex in mod.exams" :key="'exam-'+ex.id">
            <NuxtLink
              v-if="data.enrollment && ex.isActive"
              :to="`/courses/${slug}/exams/${ex.id}`"
              class="px-6 py-2.5 flex items-center gap-3 text-sm transition-colors no-underline text-inherit cursor-pointer hover:bg-[var(--accent)]/50"
            >
              <span class="text-purple-500 text-xs w-6 flex items-center justify-center"><Target class="w-4 h-4" /></span>
              <span class="flex-1">{{ ex.title }}</span>
              <UiBadge variant="secondary" class="text-xs bg-purple-50 text-purple-700">Ujian</UiBadge>
              <span v-if="ex.duration" class="text-xs text-[var(--muted-foreground)]">{{ ex.duration }} menit</span>
            </NuxtLink>
            <div v-else class="px-6 py-2.5 flex items-center gap-3 text-sm">
              <span class="text-purple-500 text-xs w-6 flex items-center justify-center"><Target class="w-4 h-4" /></span>
              <span class="flex-1">{{ ex.title }}</span>
              <UiBadge variant="secondary" class="text-xs bg-purple-50 text-purple-700">Ujian</UiBadge>
              <span v-if="ex.duration" class="text-xs text-[var(--muted-foreground)]">{{ ex.duration }} menit</span>
              <UiBadge v-if="!ex.isActive" variant="secondary" class="text-[10px]">Belum aktif</UiBadge>
            </div>
          </template>
        </div>
        <div v-else class="px-6 py-3 text-sm text-[var(--muted-foreground)] italic">Belum ada materi</div>
      </div>

      <div v-if="!data.modules?.length" class="px-6 py-8 text-center text-[var(--muted-foreground)]">
        Kurikulum belum tersedia
      </div>
    </div>

    <!-- Invite Code Modal -->
    <Teleport to="body">
      <div v-if="showInviteModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="showInviteModal = false">
        <div class="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 w-full max-w-sm">
          <h3 class="text-lg font-semibold mb-4">Masukkan Kode Undangan</h3>
          <div v-if="joinError" class="bg-red-50 text-red-800 px-4 py-2 rounded-lg mb-3 text-sm">{{ joinError }}</div>
          <UiInput v-model="inviteCode" placeholder="Masukkan kode undangan" class="mb-4" />
          <div class="flex gap-3 justify-end">
            <UiButton variant="outline" @click="showInviteModal = false">Batal</UiButton>
            <UiButton @click="joinCourse" :disabled="joinLoading || !inviteCode" class="bg-blue-600 text-white">
              {{ joinLoading ? 'Memproses...' : 'Gabung' }}
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
