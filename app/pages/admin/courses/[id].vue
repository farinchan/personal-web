<script setup lang="ts">
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, Save, FileText, Video, Link2, File, Users, ClipboardList, GraduationCap, CheckCircle, X } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const courseId = Number(route.params.id)

const { data, refresh } = await useFetch(`/api/admin/courses/${courseId}`)
if (!data.value) throw createError({ statusCode: 404, statusMessage: 'Course tidak ditemukan' })

useSeoMeta({ title: () => `Edit: ${data.value?.course.title} — Admin`, robots: 'noindex, nofollow' })

// Active tab
const activeTab = ref<'settings' | 'curriculum' | 'students' | 'submissions'>('curriculum')

// ========================
// SETTINGS TAB
// ========================
const courseForm = reactive({
  title: data.value.course.title,
  description: data.value.course.description || '',
  coverImage: data.value.course.coverImage || '',
  visibility: data.value.course.visibility,
  inviteCode: data.value.course.inviteCode || '',
  maxStudents: data.value.course.maxStudents,
  status: data.value.course.status,
})

const savingSettings = ref(false)
const settingsMsg = ref('')

async function saveSettings() {
  savingSettings.value = true
  settingsMsg.value = ''
  try {
    await $fetch(`/api/admin/courses/${courseId}`, { method: 'PUT', body: courseForm })
    settingsMsg.value = 'Berhasil disimpan'
    await refresh()
    setTimeout(() => settingsMsg.value = '', 2000)
  } catch (e: any) {
    settingsMsg.value = 'Error: ' + (e.data?.statusMessage || 'Gagal menyimpan')
  }
  savingSettings.value = false
}

const isUploadingCover = ref(false)
async function uploadCover(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isUploadingCover.value = true
  try {
    const fd = new FormData(); fd.append('file', file)
    const r = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: fd })
    courseForm.coverImage = r.url
  } catch { settingsMsg.value = 'Error: Gagal upload cover' }
  finally { isUploadingCover.value = false }
}

// ========================
// CURRICULUM TAB
// ========================
const expandedModules = ref<Set<number>>(new Set())

function toggleModule(moduleId: number) {
  if (expandedModules.value.has(moduleId)) expandedModules.value.delete(moduleId)
  else expandedModules.value.add(moduleId)
}

// Add Module
const addingModule = ref(false)
const newModuleTitle = ref('')
async function addModule() {
  if (!newModuleTitle.value.trim()) return
  addingModule.value = true
  try {
    await $fetch('/api/admin/courses/modules', {
      method: 'POST',
      body: { courseId, title: newModuleTitle.value, sortOrder: (data.value?.modules.length || 0) },
    })
    newModuleTitle.value = ''
    await refresh()
  } catch (e: any) { alert(e.data?.statusMessage || 'Gagal menambah modul') }
  addingModule.value = false
}

// Edit Module
const editingModuleId = ref<number | null>(null)
const editModuleTitle = ref('')
function startEditModule(mod: any) {
  editingModuleId.value = mod.id
  editModuleTitle.value = mod.title
}
async function saveModule(id: number) {
  await $fetch('/api/admin/courses/modules', { method: 'PUT', body: { id, title: editModuleTitle.value } })
  editingModuleId.value = null
  await refresh()
}
async function deleteModule(id: number) {
  if (!confirm('Hapus modul ini dan semua isinya?')) return
  await $fetch('/api/admin/courses/modules', { method: 'PUT', body: { id, delete: true } })
  await refresh()
}

// ========================
// MATERIAL MODALS
// ========================
const materialModal = ref(false)
const materialForm = reactive({
  id: null as number | null,
  moduleId: 0,
  title: '',
  type: 'content' as 'content' | 'post' | 'video' | 'file',
  body: '',
  postId: null as number | null,
  videoUrl: '',
  fileUrl: '',
  duration: null as number | null,
  sortOrder: 0,
})

function openAddMaterial(moduleId: number, sortOrder: number) {
  Object.assign(materialForm, { id: null, moduleId, title: '', type: 'content', body: '', postId: null, videoUrl: '', fileUrl: '', duration: null, sortOrder })
  materialModal.value = true
}
function openEditMaterial(mat: any) {
  Object.assign(materialForm, { ...mat, videoUrl: mat.videoUrl || '', fileUrl: mat.fileUrl || '', body: mat.body || '' })
  materialModal.value = true
}

const savingMaterial = ref(false)
async function saveMaterial() {
  if (!materialForm.title) return
  savingMaterial.value = true
  try {
    const payload = { ...materialForm }
    if (materialForm.id) {
      await $fetch('/api/admin/courses/materials', { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/courses/materials', { method: 'POST', body: payload })
    }
    materialModal.value = false
    await refresh()
  } catch (e: any) { alert(e.data?.statusMessage || 'Gagal menyimpan materi') }
  savingMaterial.value = false
}

async function deleteMaterial(id: number) {
  if (!confirm('Hapus materi ini?')) return
  await $fetch('/api/admin/courses/materials', { method: 'PUT', body: { id, delete: true } })
  await refresh()
}

// ========================
// ASSIGNMENT MODALS
// ========================
const assignmentModal = ref(false)
const assignmentForm = reactive({
  id: null as number | null,
  moduleId: 0,
  title: '',
  description: '',
  maxScore: 100,
  dueDate: '',
  allowLateSubmission: false,
  sortOrder: 0,
})

function openAddAssignment(moduleId: number, sortOrder: number) {
  Object.assign(assignmentForm, { id: null, moduleId, title: '', description: '', maxScore: 100, dueDate: '', allowLateSubmission: false, sortOrder })
  assignmentModal.value = true
}
function openEditAssignment(a: any) {
  Object.assign(assignmentForm, { ...a, description: a.description || '', dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : '' })
  assignmentModal.value = true
}

const savingAssignment = ref(false)
async function saveAssignment() {
  if (!assignmentForm.title) return
  savingAssignment.value = true
  try {
    const payload = { ...assignmentForm, dueDate: assignmentForm.dueDate || null }
    if (assignmentForm.id) {
      await $fetch('/api/admin/courses/assignments', { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/courses/assignments', { method: 'POST', body: payload })
    }
    assignmentModal.value = false
    await refresh()
  } catch (e: any) { alert(e.data?.statusMessage || 'Gagal menyimpan tugas') }
  savingAssignment.value = false
}

async function deleteAssignment(id: number) {
  if (!confirm('Hapus tugas ini?')) return
  await $fetch('/api/admin/courses/assignments', { method: 'PUT', body: { id, delete: true } })
  await refresh()
}

// ========================
// EXAM MODALS
// ========================
const examModal = ref(false)
const examForm = reactive({
  id: null as number | null,
  moduleId: 0,
  title: '',
  description: '',
  duration: 60,
  passingScore: 60,
  maxAttempts: 1,
  shuffleQuestions: false,
  showResults: true,
  isActive: false,
  sortOrder: 0,
  questions: [] as { id?: number; type: string; question: string; options: { id: number; text: string; isCorrect: boolean }[]; explanation: string; points: number; sortOrder: number }[],
})

let optionIdCounter = 1

function openAddExam(moduleId: number, sortOrder: number) {
  optionIdCounter = 1
  Object.assign(examForm, {
    id: null, moduleId, title: '', description: '', duration: 60, passingScore: 60,
    maxAttempts: 1, shuffleQuestions: false, showResults: true, isActive: false, sortOrder,
    questions: [],
  })
  examModal.value = true
}

function openEditExam(ex: any) {
  optionIdCounter = 1
  const questions = (ex.questions || []).map((q: any, qi: number) => {
    const opts = (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) || []
    opts.forEach((o: any) => { if (o.id >= optionIdCounter) optionIdCounter = o.id + 1 })
    return { ...q, options: opts, explanation: q.explanation || '', sortOrder: q.sortOrder ?? qi }
  })
  Object.assign(examForm, { ...ex, description: ex.description || '', questions })
  examModal.value = true
}

function addQuestion() {
  examForm.questions.push({
    type: 'single',
    question: '',
    options: [
      { id: optionIdCounter++, text: '', isCorrect: false },
      { id: optionIdCounter++, text: '', isCorrect: false },
    ],
    explanation: '',
    points: 1,
    sortOrder: examForm.questions.length,
  })
}

function removeQuestion(qi: number) {
  examForm.questions.splice(qi, 1)
}

function addOption(qi: number) {
  examForm.questions[qi].options.push({ id: optionIdCounter++, text: '', isCorrect: false })
}

function removeOption(qi: number, oi: number) {
  examForm.questions[qi].options.splice(oi, 1)
}

function toggleCorrect(qi: number, oi: number) {
  const q = examForm.questions[qi]
  if (q.type === 'single') {
    q.options.forEach((o, i) => o.isCorrect = i === oi)
  } else {
    q.options[oi].isCorrect = !q.options[oi].isCorrect
  }
}

const savingExam = ref(false)
async function saveExam() {
  if (!examForm.title) return
  savingExam.value = true
  try {
    const payload = { ...examForm }
    if (examForm.id) {
      await $fetch('/api/admin/courses/exams', { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/courses/exams', { method: 'POST', body: payload })
    }
    examModal.value = false
    await refresh()
  } catch (e: any) { alert(e.data?.statusMessage || 'Gagal menyimpan ujian') }
  savingExam.value = false
}

async function deleteExam(id: number) {
  if (!confirm('Hapus ujian ini dan semua soalnya?')) return
  // Use PUT with delete flag (need to add this API or use different approach)
  await $fetch('/api/admin/courses/exams', { method: 'PUT', body: { id, delete: true } })
  await refresh()
}

// ========================
// SUBMISSIONS TAB
// ========================
const { data: submissionsData, refresh: refreshSubmissions } = await useFetch('/api/admin/courses/submissions', {
  query: { courseId },
})

const gradingId = ref<number | null>(null)
const gradeScore = ref('')
const gradeFeedback = ref('')

function openGrading(sub: any) {
  gradingId.value = sub.id
  gradeScore.value = sub.score || ''
  gradeFeedback.value = sub.feedback || ''
}

const savingGrade = ref(false)
async function saveGrade() {
  if (gradeScore.value === '') return
  savingGrade.value = true
  try {
    await $fetch('/api/admin/courses/grade', {
      method: 'POST',
      body: { submissionId: gradingId.value, score: Number(gradeScore.value), feedback: gradeFeedback.value },
    })
    gradingId.value = null
    await refreshSubmissions()
  } catch (e: any) { alert(e.data?.statusMessage || 'Gagal menyimpan nilai') }
  savingGrade.value = false
}

// Posts selector for material type "post"
const { data: allPosts } = await useFetch('/api/admin/posts')
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold truncate">{{ data?.course.title }}</h1>
      <NuxtLink to="/admin/courses" class="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] shrink-0">
        <ArrowLeft class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-[var(--border)] mb-6 overflow-x-auto">
      <button v-for="tab in [
        { key: 'curriculum', label: 'Kurikulum', icon: GraduationCap },
        { key: 'settings', label: 'Pengaturan', icon: FileText },
        { key: 'students', label: 'Siswa', icon: Users },
        { key: 'submissions', label: 'Penilaian', icon: ClipboardList },
      ]" :key="tab.key"
        @click="activeTab = tab.key as any"
        :class="['flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] whitespace-nowrap transition-colors',
          activeTab === tab.key ? 'border-[var(--foreground)] text-[var(--foreground)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]']"
      >
        <component :is="tab.icon" class="w-4 h-4" /> {{ tab.label }}
      </button>
    </div>

    <!-- ==================== SETTINGS TAB ==================== -->
    <div v-if="activeTab === 'settings'" class="max-w-2xl">
      <div v-if="settingsMsg" :class="['px-4 py-3 rounded-lg mb-4 text-sm', settingsMsg.startsWith('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800']">
        {{ settingsMsg }}
      </div>

      <form @submit.prevent="saveSettings" class="space-y-5">
        <div>
          <label class="block text-sm font-medium mb-1">Judul</label>
          <UiInput v-model="courseForm.title" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Deskripsi</label>
          <UiTextarea v-model="courseForm.description" rows="3" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Cover Image</label>
          <div v-if="courseForm.coverImage" class="mb-3 relative inline-block">
            <img :src="courseForm.coverImage" class="max-h-40 rounded-lg" />
            <button type="button" @click="courseForm.coverImage = ''" class="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
          </div>
          <input type="file" accept="image/*" @change="uploadCover" class="block w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)] file:text-[var(--primary-foreground)] file:cursor-pointer" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Visibilitas</label>
            <select v-model="courseForm.visibility" class="w-full px-3 py-2 text-sm border border-[var(--input)] rounded-md bg-[var(--background)]">
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Status</label>
            <select v-model="courseForm.status" class="w-full px-3 py-2 text-sm border border-[var(--input)] rounded-md bg-[var(--background)]">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        <div v-if="courseForm.visibility === 'private'">
          <label class="block text-sm font-medium mb-1">Invite Code</label>
          <UiInput v-model="courseForm.inviteCode" readonly class="font-mono bg-[var(--muted)]" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Maks. Siswa</label>
          <UiInput v-model.number="courseForm.maxStudents" type="number" placeholder="Unlimited" />
        </div>
        <UiButton type="submit" :disabled="savingSettings">
          <Save class="w-4 h-4 mr-1" /> {{ savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan' }}
        </UiButton>
      </form>
    </div>

    <!-- ==================== CURRICULUM TAB ==================== -->
    <div v-if="activeTab === 'curriculum'">
      <!-- Module list -->
      <div class="space-y-4 mb-6">
        <div v-for="mod in data?.modules" :key="mod.id" class="border border-[var(--border)] rounded-lg overflow-hidden">
          <!-- Module header -->
          <div class="flex items-center gap-3 px-4 py-3 bg-[var(--muted)]/50 cursor-pointer" @click="toggleModule(mod.id)">
            <component :is="expandedModules.has(mod.id) ? ChevronDown : ChevronRight" class="w-4 h-4 shrink-0" />
            <template v-if="editingModuleId === mod.id">
              <UiInput v-model="editModuleTitle" class="flex-1" @click.stop @keydown.enter.prevent="saveModule(mod.id)" />
              <UiButton size="sm" @click.stop="saveModule(mod.id)"><Save class="w-3 h-3" /></UiButton>
              <UiButton size="sm" variant="outline" @click.stop="editingModuleId = null"><X class="w-3 h-3" /></UiButton>
            </template>
            <template v-else>
              <span class="font-medium flex-1">{{ mod.title }}</span>
              <span class="text-xs text-[var(--muted-foreground)]">
                {{ mod.materials.length }} materi · {{ mod.assignments.length }} tugas · {{ mod.exams.length }} ujian
              </span>
              <UiButton size="sm" variant="outline" @click.stop="startEditModule(mod)">Edit</UiButton>
              <UiButton size="sm" variant="outline" @click.stop="deleteModule(mod.id)" class="text-red-600"><Trash2 class="w-3 h-3" /></UiButton>
            </template>
          </div>

          <!-- Module content (expanded) -->
          <div v-if="expandedModules.has(mod.id)" class="p-4 space-y-4">
            <!-- Materials -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-semibold text-[var(--muted-foreground)]">📄 Materi</h4>
                <UiButton size="sm" variant="outline" @click="openAddMaterial(mod.id, mod.materials.length)">
                  <Plus class="w-3 h-3 mr-1" /> Materi
                </UiButton>
              </div>
              <div v-if="mod.materials.length" class="space-y-1">
                <div v-for="mat in mod.materials" :key="mat.id" class="flex items-center justify-between px-3 py-2 bg-[var(--accent)]/30 rounded text-sm">
                  <div class="flex items-center gap-2">
                    <component :is="mat.type === 'video' ? Video : mat.type === 'file' ? File : FileText" class="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span>{{ mat.title }}</span>
                    <UiBadge variant="secondary" class="text-[10px]">{{ mat.type }}</UiBadge>
                  </div>
                  <div class="flex gap-1">
                    <button @click="openEditMaterial(mat)" class="text-xs text-blue-600 hover:underline">Edit</button>
                    <button @click="deleteMaterial(mat.id)" class="text-xs text-red-600 hover:underline">Hapus</button>
                  </div>
                </div>
              </div>
              <p v-else class="text-xs text-[var(--muted-foreground)] italic">Belum ada materi</p>
            </div>

            <!-- Assignments -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-semibold text-[var(--muted-foreground)]">📝 Tugas</h4>
                <UiButton size="sm" variant="outline" @click="openAddAssignment(mod.id, mod.assignments.length)">
                  <Plus class="w-3 h-3 mr-1" /> Tugas
                </UiButton>
              </div>
              <div v-if="mod.assignments.length" class="space-y-1">
                <div v-for="a in mod.assignments" :key="a.id" class="flex items-center justify-between px-3 py-2 bg-[var(--accent)]/30 rounded text-sm">
                  <div>
                    <span>{{ a.title }}</span>
                    <span class="text-xs text-[var(--muted-foreground)] ml-2">Maks: {{ a.maxScore }} poin</span>
                  </div>
                  <div class="flex gap-1">
                    <button @click="openEditAssignment(a)" class="text-xs text-blue-600 hover:underline">Edit</button>
                    <button @click="deleteAssignment(a.id)" class="text-xs text-red-600 hover:underline">Hapus</button>
                  </div>
                </div>
              </div>
              <p v-else class="text-xs text-[var(--muted-foreground)] italic">Belum ada tugas</p>
            </div>

            <!-- Exams -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-semibold text-[var(--muted-foreground)]">🎯 Ujian</h4>
                <UiButton size="sm" variant="outline" @click="openAddExam(mod.id, mod.exams.length)">
                  <Plus class="w-3 h-3 mr-1" /> Ujian
                </UiButton>
              </div>
              <div v-if="mod.exams.length" class="space-y-1">
                <div v-for="ex in mod.exams" :key="ex.id" class="flex items-center justify-between px-3 py-2 bg-[var(--accent)]/30 rounded text-sm">
                  <div>
                    <span>{{ ex.title }}</span>
                    <span class="text-xs text-[var(--muted-foreground)] ml-2">{{ ex.questions?.length || 0 }} soal · {{ ex.duration }} menit</span>
                    <UiBadge v-if="ex.isActive" class="ml-2 bg-green-100 text-green-800 text-[10px]">Aktif</UiBadge>
                  </div>
                  <div class="flex gap-1">
                    <button @click="openEditExam(ex)" class="text-xs text-blue-600 hover:underline">Edit</button>
                    <button @click="deleteExam(ex.id)" class="text-xs text-red-600 hover:underline">Hapus</button>
                  </div>
                </div>
              </div>
              <p v-else class="text-xs text-[var(--muted-foreground)] italic">Belum ada ujian</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Module -->
      <div class="flex gap-2">
        <UiInput v-model="newModuleTitle" placeholder="Judul modul baru..." @keydown.enter.prevent="addModule" class="max-w-xs" />
        <UiButton @click="addModule" :disabled="addingModule || !newModuleTitle.trim()">
          <Plus class="w-4 h-4 mr-1" /> Tambah Modul
        </UiButton>
      </div>
    </div>

    <!-- ==================== STUDENTS TAB ==================== -->
    <div v-if="activeTab === 'students'">
      <h3 class="text-lg font-semibold mb-4">Siswa Terdaftar ({{ data?.students.length || 0 }})</h3>
      <div v-if="!data?.students.length" class="text-center py-8 text-[var(--muted-foreground)]">Belum ada siswa terdaftar.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[var(--border)] text-left">
              <th class="py-2 px-3 font-medium">Nama</th>
              <th class="py-2 px-3 font-medium">Username</th>
              <th class="py-2 px-3 font-medium">Email</th>
              <th class="py-2 px-3 font-medium">Role</th>
              <th class="py-2 px-3 font-medium">Progress</th>
              <th class="py-2 px-3 font-medium">Tanggal Daftar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in data.students" :key="s.enrollmentId" class="border-b border-[var(--border)]">
              <td class="py-2 px-3">{{ s.name }}</td>
              <td class="py-2 px-3 text-[var(--muted-foreground)]">{{ s.username }}</td>
              <td class="py-2 px-3 text-[var(--muted-foreground)]">{{ s.email }}</td>
              <td class="py-2 px-3"><UiBadge variant="secondary" class="text-[10px]">{{ s.role }}</UiBadge></td>
              <td class="py-2 px-3">
                <div class="flex items-center gap-2">
                  <div class="w-20 bg-[var(--muted)] rounded-full h-2 overflow-hidden">
                    <div class="bg-blue-600 h-full rounded-full" :style="{ width: `${s.progress || 0}%` }" />
                  </div>
                  <span class="text-xs">{{ s.progress || 0 }}%</span>
                </div>
              </td>
              <td class="py-2 px-3 text-[var(--muted-foreground)]">{{ new Date(s.enrolledAt).toLocaleDateString('id-ID') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== SUBMISSIONS TAB ==================== -->
    <div v-if="activeTab === 'submissions'">
      <h3 class="text-lg font-semibold mb-4">Penilaian Tugas</h3>
      <div v-if="!submissionsData?.submissions?.length" class="text-center py-8 text-[var(--muted-foreground)]">Belum ada submission.</div>
      <div v-else class="space-y-3">
        <div v-for="sub in submissionsData.submissions" :key="sub.id" class="border border-[var(--border)] rounded-lg p-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-medium">{{ sub.studentName }} <span class="text-[var(--muted-foreground)] text-sm font-normal">@{{ sub.studentUsername }}</span></p>
              <p class="text-sm text-[var(--muted-foreground)]">Tugas: {{ sub.assignmentTitle }}</p>
              <p v-if="sub.content" class="text-sm mt-1">{{ sub.content }}</p>
              <a v-if="sub.fileUrl" :href="sub.fileUrl" target="_blank" class="text-sm text-blue-600 hover:underline">📎 File lampiran</a>
              <p class="text-xs text-[var(--muted-foreground)] mt-1">
                Dikirim: {{ new Date(sub.submittedAt).toLocaleString('id-ID') }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <template v-if="sub.status === 'graded'">
                <p class="text-lg font-bold text-green-600">{{ sub.score }}/{{ sub.maxScore }}</p>
                <p v-if="sub.feedback" class="text-xs text-[var(--muted-foreground)] max-w-[200px]">{{ sub.feedback }}</p>
                <button @click="openGrading(sub)" class="text-xs text-blue-600 hover:underline mt-1">Edit Nilai</button>
              </template>
              <template v-else>
                <UiBadge class="bg-yellow-100 text-yellow-800 text-xs">Belum Dinilai</UiBadge>
                <br />
                <button @click="openGrading(sub)" class="text-xs text-blue-600 hover:underline mt-1">Beri Nilai</button>
              </template>
            </div>
          </div>

          <!-- Inline grading form -->
          <div v-if="gradingId === sub.id" class="mt-3 pt-3 border-t border-[var(--border)] flex gap-3 items-end">
            <div class="w-24">
              <label class="block text-xs font-medium mb-1">Skor</label>
              <UiInput v-model="gradeScore" type="number" :max="sub.maxScore" min="0" />
            </div>
            <div class="flex-1">
              <label class="block text-xs font-medium mb-1">Feedback</label>
              <UiInput v-model="gradeFeedback" placeholder="Feedback opsional..." />
            </div>
            <UiButton size="sm" @click="saveGrade" :disabled="savingGrade">
              <CheckCircle class="w-3 h-3 mr-1" /> Simpan
            </UiButton>
            <UiButton size="sm" variant="outline" @click="gradingId = null">Batal</UiButton>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== MATERIAL MODAL ==================== -->
    <Teleport to="body">
      <div v-if="materialModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="materialModal = false">
        <div class="bg-[var(--background)] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h3 class="text-lg font-semibold">{{ materialForm.id ? 'Edit Materi' : 'Tambah Materi' }}</h3>
            <button @click="materialModal = false"><X class="w-5 h-5" /></button>
          </div>
          <form @submit.prevent="saveMaterial" class="p-4 space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Judul</label>
              <UiInput v-model="materialForm.title" placeholder="Judul materi" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Tipe</label>
              <select v-model="materialForm.type" class="w-full px-3 py-2 text-sm border border-[var(--input)] rounded-md bg-[var(--background)]">
                <option value="content">Konten (Rich Text)</option>
                <option value="post">Tarik dari Post</option>
                <option value="video">Video URL</option>
                <option value="file">File</option>
              </select>
            </div>

            <!-- Content editor -->
            <div v-if="materialForm.type === 'content'">
              <label class="block text-sm font-medium mb-1">Konten</label>
              <EditorRichTextEditor v-model="materialForm.body" placeholder="Tulis konten materi..." />
            </div>

            <!-- Post selector -->
            <div v-if="materialForm.type === 'post'">
              <label class="block text-sm font-medium mb-1">Pilih Post</label>
              <select v-model="materialForm.postId" class="w-full px-3 py-2 text-sm border border-[var(--input)] rounded-md bg-[var(--background)]">
                <option :value="null">-- Pilih post --</option>
                <option v-for="post in allPosts" :key="post.id" :value="post.id">{{ post.title }}</option>
              </select>
            </div>

            <!-- Video URL -->
            <div v-if="materialForm.type === 'video'">
              <label class="block text-sm font-medium mb-1">Video URL</label>
              <UiInput v-model="materialForm.videoUrl" placeholder="https://youtube.com/..." />
            </div>

            <!-- File URL -->
            <div v-if="materialForm.type === 'file'">
              <label class="block text-sm font-medium mb-1">File URL</label>
              <UiInput v-model="materialForm.fileUrl" placeholder="https://..." />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Durasi (menit, opsional)</label>
              <UiInput v-model.number="materialForm.duration" type="number" placeholder="Durasi" />
            </div>

            <div class="flex gap-3 pt-2">
              <UiButton type="submit" :disabled="savingMaterial">{{ savingMaterial ? 'Menyimpan...' : 'Simpan' }}</UiButton>
              <UiButton type="button" variant="outline" @click="materialModal = false">Batal</UiButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ==================== ASSIGNMENT MODAL ==================== -->
    <Teleport to="body">
      <div v-if="assignmentModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="assignmentModal = false">
        <div class="bg-[var(--background)] rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h3 class="text-lg font-semibold">{{ assignmentForm.id ? 'Edit Tugas' : 'Tambah Tugas' }}</h3>
            <button @click="assignmentModal = false"><X class="w-5 h-5" /></button>
          </div>
          <form @submit.prevent="saveAssignment" class="p-4 space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Judul</label>
              <UiInput v-model="assignmentForm.title" placeholder="Judul tugas" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Deskripsi</label>
              <UiTextarea v-model="assignmentForm.description" rows="3" placeholder="Deskripsi tugas..." />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Skor Maksimal</label>
                <UiInput v-model.number="assignmentForm.maxScore" type="number" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Deadline</label>
                <input v-model="assignmentForm.dueDate" type="datetime-local" class="w-full px-3 py-2 text-sm border border-[var(--input)] rounded-md bg-[var(--background)]" />
              </div>
            </div>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" v-model="assignmentForm.allowLateSubmission" class="rounded" />
              Izinkan pengumpulan terlambat
            </label>
            <div class="flex gap-3 pt-2">
              <UiButton type="submit" :disabled="savingAssignment">{{ savingAssignment ? 'Menyimpan...' : 'Simpan' }}</UiButton>
              <UiButton type="button" variant="outline" @click="assignmentModal = false">Batal</UiButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ==================== EXAM MODAL ==================== -->
    <Teleport to="body">
      <div v-if="examModal" class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" @click.self="examModal = false">
        <div class="bg-[var(--background)] rounded-lg shadow-xl w-full max-w-3xl my-8">
          <div class="flex items-center justify-between p-4 border-b border-[var(--border)] sticky top-0 bg-[var(--background)] z-10 rounded-t-lg">
            <h3 class="text-lg font-semibold">{{ examForm.id ? 'Edit Ujian' : 'Tambah Ujian' }}</h3>
            <button @click="examModal = false"><X class="w-5 h-5" /></button>
          </div>

          <form @submit.prevent="saveExam" class="p-4 space-y-5">
            <!-- Exam settings -->
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-sm font-medium mb-1">Judul Ujian</label>
                <UiInput v-model="examForm.title" placeholder="Judul ujian" />
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium mb-1">Deskripsi</label>
                <UiTextarea v-model="examForm.description" rows="2" placeholder="Deskripsi opsional..." />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Durasi (menit)</label>
                <UiInput v-model.number="examForm.duration" type="number" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Batas Lulus (%)</label>
                <UiInput v-model.number="examForm.passingScore" type="number" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Maks. Percobaan</label>
                <UiInput v-model.number="examForm.maxAttempts" type="number" />
              </div>
            </div>

            <div class="flex flex-wrap gap-4">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" v-model="examForm.shuffleQuestions" class="rounded" /> Acak soal
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" v-model="examForm.showResults" class="rounded" /> Tampilkan hasil
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" v-model="examForm.isActive" class="rounded" /> Aktifkan ujian
              </label>
            </div>

            <!-- Questions -->
            <div class="border-t border-[var(--border)] pt-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold">Soal ({{ examForm.questions.length }})</h4>
                <UiButton type="button" size="sm" @click="addQuestion">
                  <Plus class="w-3 h-3 mr-1" /> Tambah Soal
                </UiButton>
              </div>

              <div class="space-y-4">
                <div v-for="(q, qi) in examForm.questions" :key="qi" class="border border-[var(--border)] rounded-lg p-4">
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <span class="text-sm font-bold bg-[var(--muted)] px-2 py-0.5 rounded shrink-0">{{ qi + 1 }}</span>
                    <div class="flex-1 space-y-2">
                      <UiInput v-model="q.question" placeholder="Teks pertanyaan..." />
                      <div class="flex items-center gap-4 text-sm">
                        <select v-model="q.type" class="px-2 py-1 text-xs border border-[var(--input)] rounded bg-[var(--background)]">
                          <option value="single">Pilihan Ganda</option>
                          <option value="multiple">Jawaban Ganda</option>
                        </select>
                        <div class="flex items-center gap-1">
                          <label class="text-xs text-[var(--muted-foreground)]">Poin:</label>
                          <input v-model.number="q.points" type="number" min="1" class="w-14 px-2 py-1 text-xs border border-[var(--input)] rounded bg-[var(--background)]" />
                        </div>
                      </div>
                    </div>
                    <button type="button" @click="removeQuestion(qi)" class="text-red-600 hover:text-red-700">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>

                  <!-- Options -->
                  <div class="space-y-2 ml-8">
                    <div v-for="(opt, oi) in q.options" :key="opt.id" class="flex items-center gap-2">
                      <button type="button" @click="toggleCorrect(qi, oi)"
                        :class="['w-5 h-5 border-2 shrink-0 flex items-center justify-center text-xs',
                          q.type === 'single' ? 'rounded-full' : 'rounded',
                          opt.isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300']">
                        <span v-if="opt.isCorrect">✓</span>
                      </button>
                      <UiInput v-model="opt.text" placeholder="Teks opsi..." class="flex-1 text-sm" />
                      <button type="button" @click="removeOption(qi, oi)" class="text-red-400 hover:text-red-600">
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                    <button type="button" @click="addOption(qi)" class="text-xs text-blue-600 hover:underline ml-7">
                      + Tambah opsi
                    </button>
                  </div>

                  <!-- Explanation -->
                  <div class="mt-3 ml-8">
                    <UiInput v-model="q.explanation" placeholder="Penjelasan jawaban (opsional)..." class="text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-3 pt-4 border-t border-[var(--border)]">
              <UiButton type="submit" :disabled="savingExam">{{ savingExam ? 'Menyimpan...' : 'Simpan Ujian' }}</UiButton>
              <UiButton type="button" variant="outline" @click="examModal = false">Batal</UiButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
