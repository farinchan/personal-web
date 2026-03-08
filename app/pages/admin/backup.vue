<script setup lang="ts">
import {
  Database, FolderArchive, Package, Upload, Download,
  AlertTriangle, CheckCircle2, Loader2, HardDriveDownload, RotateCcw,
  Cloud, Plus, Trash2, Play, Link2, Pencil, X,
} from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useSeoMeta({ title: 'Backup & Restore — Admin', robots: 'noindex, nofollow' })

// States
const loading = ref<string | null>(null)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showConfirm = ref<string | null>(null)

// File inputs
const dbFileInput = ref<HTMLInputElement>()
const filesFileInput = ref<HTMLInputElement>()
const fullFileInput = ref<HTMLInputElement>()

// Cloud backup jobs
const { data: jobs, refresh: refreshJobs } = await useFetch<any[]>('/api/admin/backup/jobs')
const showJobForm = ref(false)
const editingJob = ref<any>(null)
const jobForm = ref({
  name: '',
  provider: 'google_drive' as 'google_drive' | 'onedrive',
  clientId: '',
  clientSecret: '',
  folderId: '',
  backupType: 'full' as 'database' | 'files' | 'full',
  schedule: 'disabled' as 'disabled' | 'daily' | 'weekly' | 'monthly',
})
const showDeleteConfirm = ref<number | null>(null)

// Check OAuth callback result
const route = useRoute()
onMounted(() => {
  if (route.query.oauth_success) {
    showMessage('success', 'Akun cloud berhasil terhubung!')
    refreshJobs()
    navigateTo('/admin/backup', { replace: true })
  }
  if (route.query.oauth_error) {
    showMessage('error', `OAuth error: ${route.query.oauth_error}`)
    navigateTo('/admin/backup', { replace: true })
  }
})

function openAddJob() {
  editingJob.value = null
  jobForm.value = { name: '', provider: 'google_drive', clientId: '', clientSecret: '', folderId: '', backupType: 'full', schedule: 'disabled' }
  showJobForm.value = true
}

function openEditJob(job: any) {
  editingJob.value = job
  jobForm.value = {
    name: job.name,
    provider: job.provider,
    clientId: '', // Don't expose existing
    clientSecret: '',
    folderId: job.folderId || '',
    backupType: job.backupType,
    schedule: job.schedule,
  }
  showJobForm.value = true
}

async function saveJob() {
  loading.value = 'save-job'
  try {
    if (editingJob.value) {
      const body: any = {
        name: jobForm.value.name,
        folderId: jobForm.value.folderId,
        backupType: jobForm.value.backupType,
        schedule: jobForm.value.schedule,
      }
      if (jobForm.value.clientId) body.clientId = jobForm.value.clientId
      if (jobForm.value.clientSecret) body.clientSecret = jobForm.value.clientSecret

      await $fetch(`/api/admin/backup/jobs/${editingJob.value.id}`, { method: 'PUT', body })
      showMessage('success', 'Job berhasil diperbarui')
    } else {
      if (!jobForm.value.clientId || !jobForm.value.clientSecret) {
        showMessage('error', 'Client ID dan Client Secret wajib diisi')
        return
      }
      await $fetch('/api/admin/backup/jobs', { method: 'POST', body: jobForm.value })
      showMessage('success', 'Job berhasil dibuat. Hubungkan akun cloud untuk mulai backup.')
    }
    showJobForm.value = false
    refreshJobs()
  } catch (err: any) {
    showMessage('error', err.data?.message || 'Gagal menyimpan job')
  } finally {
    loading.value = null
  }
}

async function deleteJob(id: number) {
  showDeleteConfirm.value = null
  loading.value = `delete-${id}`
  try {
    await $fetch(`/api/admin/backup/jobs/${id}`, { method: 'DELETE' })
    showMessage('success', 'Job berhasil dihapus')
    refreshJobs()
  } catch (err: any) {
    showMessage('error', err.data?.message || 'Gagal menghapus job')
  } finally {
    loading.value = null
  }
}

async function runJob(id: number) {
  loading.value = `run-${id}`
  try {
    const res = await $fetch<any>(`/api/admin/backup/jobs/${id}/run`, { method: 'POST' })
    showMessage('success', res.message || 'Backup berhasil di-upload')
    refreshJobs()
  } catch (err: any) {
    showMessage('error', err.data?.message || 'Gagal menjalankan backup')
    refreshJobs()
  } finally {
    loading.value = null
  }
}

function connectOAuth(job: any) {
  window.location.href = `/api/admin/backup/oauth/${job.provider}?jobId=${job.id}`
}

async function toggleJob(job: any) {
  try {
    await $fetch(`/api/admin/backup/jobs/${job.id}`, {
      method: 'PUT',
      body: { enabled: !job.enabled },
    })
    refreshJobs()
  } catch (err: any) {
    showMessage('error', err.data?.message || 'Gagal mengubah status')
  }
}

const providerLabel = (p: string) => p === 'google_drive' ? 'Google Drive' : 'OneDrive'
const scheduleLabel = (s: string) => ({ disabled: 'Nonaktif', daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan' }[s] || s)
const typeLabel = (t: string) => ({ database: 'Database', files: 'File', full: 'Full' }[t] || t)

function redirectUri(provider: string) {
  const base = useRuntimeConfig().public.siteUrl || 'http://localhost:3000'
  return `${base}/api/admin/backup/oauth/${provider}/callback`
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function showMessage(type: 'success' | 'error', text: string) {
  message.value = { type, text }
  setTimeout(() => { message.value = null }, 5000)
}

// === BACKUP ===
async function backupDatabase() {
  loading.value = 'backup-db'
  try {
    const res = await $fetch('/api/admin/backup/database', { responseType: 'blob' })
    downloadBlob(res as unknown as Blob, `db-backup-${dateStr()}.json`)
    showMessage('success', 'Database berhasil di-backup')
  } catch (err: any) {
    showMessage('error', err.data?.message || 'Gagal backup database')
  } finally {
    loading.value = null
  }
}

async function backupFiles() {
  loading.value = 'backup-files'
  try {
    const res = await $fetch('/api/admin/backup/files', { responseType: 'blob' })
    downloadBlob(res as unknown as Blob, `files-backup-${dateStr()}.zip`)
    showMessage('success', 'File berhasil di-backup')
  } catch (err: any) {
    showMessage('error', err.data?.message || 'Gagal backup file')
  } finally {
    loading.value = null
  }
}

async function backupFull() {
  loading.value = 'backup-full'
  try {
    const res = await $fetch('/api/admin/backup/full', { responseType: 'blob' })
    downloadBlob(res as unknown as Blob, `full-backup-${dateStr()}.zip`)
    showMessage('success', 'Full backup berhasil')
  } catch (err: any) {
    showMessage('error', err.data?.message || 'Gagal full backup')
  } finally {
    loading.value = null
  }
}

// === RESTORE ===
async function restoreDatabase() {
  const input = dbFileInput.value
  if (!input?.files?.length) return

  showConfirm.value = null
  loading.value = 'restore-db'

  const formData = new FormData()
  formData.append('file', input.files[0]!)

  try {
    const res = await $fetch<any>('/api/admin/backup/restore-db', {
      method: 'POST',
      body: formData,
    })
    showMessage('success', res.message || 'Database berhasil di-restore')
  } catch (err: any) {
    showMessage('error', err.data?.message || 'Gagal restore database')
  } finally {
    loading.value = null
    input.value = ''
  }
}

async function restoreFiles() {
  const input = filesFileInput.value
  if (!input?.files?.length) return

  showConfirm.value = null
  loading.value = 'restore-files'

  const formData = new FormData()
  formData.append('file', input.files[0]!)

  try {
    const res = await $fetch<any>('/api/admin/backup/restore-files', {
      method: 'POST',
      body: formData,
    })
    showMessage('success', res.message || 'File berhasil di-restore')
  } catch (err: any) {
    showMessage('error', err.data?.message || 'Gagal restore file')
  } finally {
    loading.value = null
    input.value = ''
  }
}

async function restoreFull() {
  const input = fullFileInput.value
  if (!input?.files?.length) return

  showConfirm.value = null
  loading.value = 'restore-full'

  const formData = new FormData()
  formData.append('file', input.files[0]!)

  try {
    const res = await $fetch<any>('/api/admin/backup/restore-full', {
      method: 'POST',
      body: formData,
    })
    const msg = `Full restore berhasil — ${res.restoredFiles || 0} file dipulihkan`
    showMessage('success', msg)
  } catch (err: any) {
    showMessage('error', err.data?.message || 'Gagal full restore')
  } finally {
    loading.value = null
    input.value = ''
  }
}

// Confirm before restore
function confirmRestore(type: string) {
  const inputMap: Record<string, HTMLInputElement | undefined> = {
    'restore-db': dbFileInput.value,
    'restore-files': filesFileInput.value,
    'restore-full': fullFileInput.value,
  }
  const input = inputMap[type]
  if (!input?.files?.length) {
    showMessage('error', 'Pilih file backup terlebih dahulu')
    return
  }
  showConfirm.value = type
}

function executeRestore() {
  if (showConfirm.value === 'restore-db') restoreDatabase()
  else if (showConfirm.value === 'restore-files') restoreFiles()
  else if (showConfirm.value === 'restore-full') restoreFull()
}

// Helpers
function dateStr() {
  return new Date().toISOString().slice(0, 10)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatFileSize(input: HTMLInputElement | undefined) {
  if (!input?.files?.length) return ''
  const bytes = input.files[0]!.size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <h1 class="text-2xl font-bold">Backup & Restore</h1>

    <!-- Alert Message -->
    <Transition name="fade">
      <div
        v-if="message"
        class="flex items-center gap-3 p-4 rounded-lg border"
        :class="message.type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'"
      >
        <CheckCircle2 v-if="message.type === 'success'" class="w-5 h-5 shrink-0" />
        <AlertTriangle v-else class="w-5 h-5 shrink-0" />
        <p class="text-sm">{{ message.text }}</p>
      </div>
    </Transition>

    <!-- BACKUP SECTION -->
    <section class="space-y-4">
      <div class="flex items-center gap-2">
        <HardDriveDownload class="w-5 h-5 text-blue-600" />
        <h2 class="text-lg font-semibold">Backup</h2>
      </div>
      <p class="text-sm text-[var(--muted-foreground)]">
        Download backup data dari server. Database akan disimpan sebagai JSON, file sebagai ZIP.
      </p>

      <div class="grid gap-4 sm:grid-cols-3">
        <!-- Backup Database -->
        <button
          @click="backupDatabase"
          :disabled="!!loading"
          class="flex flex-col items-center gap-3 p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Database class="w-6 h-6 text-blue-600" />
          </div>
          <div class="text-center">
            <p class="font-medium text-sm">Database</p>
            <p class="text-xs text-[var(--muted-foreground)] mt-1">Export semua tabel (JSON)</p>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
            <Loader2 v-if="loading === 'backup-db'" class="w-3.5 h-3.5 animate-spin" />
            <Download v-else class="w-3.5 h-3.5" />
            {{ loading === 'backup-db' ? 'Downloading...' : 'Download' }}
          </div>
        </button>

        <!-- Backup Files -->
        <button
          @click="backupFiles"
          :disabled="!!loading"
          class="flex flex-col items-center gap-3 p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-green-300 hover:bg-green-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <FolderArchive class="w-6 h-6 text-green-600" />
          </div>
          <div class="text-center">
            <p class="font-medium text-sm">File Upload</p>
            <p class="text-xs text-[var(--muted-foreground)] mt-1">Semua gambar & file (ZIP)</p>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <Loader2 v-if="loading === 'backup-files'" class="w-3.5 h-3.5 animate-spin" />
            <Download v-else class="w-3.5 h-3.5" />
            {{ loading === 'backup-files' ? 'Downloading...' : 'Download' }}
          </div>
        </button>

        <!-- Backup Full -->
        <button
          @click="backupFull"
          :disabled="!!loading"
          class="flex flex-col items-center gap-3 p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-purple-300 hover:bg-purple-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <Package class="w-6 h-6 text-purple-600" />
          </div>
          <div class="text-center">
            <p class="font-medium text-sm">Full Backup</p>
            <p class="text-xs text-[var(--muted-foreground)] mt-1">Database + file (ZIP)</p>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-purple-600 font-medium">
            <Loader2 v-if="loading === 'backup-full'" class="w-3.5 h-3.5 animate-spin" />
            <Download v-else class="w-3.5 h-3.5" />
            {{ loading === 'backup-full' ? 'Downloading...' : 'Download' }}
          </div>
        </button>
      </div>
    </section>

    <hr class="border-[var(--border)]" />

     <!-- CLOUD BACKUP SECTION -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Cloud class="w-5 h-5 text-sky-600" />
          <h2 class="text-lg font-semibold">Cloud Backup</h2>
        </div>
        <button
          @click="openAddJob"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors"
        >
          <Plus class="w-4 h-4" />
          Tambah Job
        </button>
      </div>
      <p class="text-sm text-[var(--muted-foreground)]">
        Konfigurasi backup otomatis ke Google Drive atau OneDrive. Hubungkan akun OAuth, pilih jadwal, dan backup berjalan otomatis.
      </p>

      <!-- Jobs List -->
      <div v-if="jobs?.length" class="space-y-3">
        <div
          v-for="job in jobs"
          :key="job.id"
          class="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-medium text-sm truncate">{{ job.name }}</h3>
                <span
                  class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="job.provider === 'google_drive' ? 'bg-blue-100 text-blue-700' : 'bg-sky-100 text-sky-700'"
                >
                  {{ providerLabel(job.provider) }}
                </span>
                <span
                  class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="job.connected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                >
                  {{ job.connected ? 'Terhubung' : 'Belum terhubung' }}
                </span>
              </div>
              <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                <span>Tipe: <strong>{{ typeLabel(job.backupType) }}</strong></span>
                <span>Jadwal: <strong>{{ scheduleLabel(job.schedule) }}</strong></span>
                <span v-if="job.folderId">Folder: <strong>{{ job.folderId }}</strong></span>
                <span>Terakhir: <strong>{{ formatDate(job.lastBackupAt) }}</strong></span>
              </div>
              <p v-if="job.lastBackupStatus" class="mt-1 text-xs" :class="job.lastBackupStatus.startsWith('Gagal') ? 'text-red-600' : 'text-green-600'">
                {{ job.lastBackupStatus }}
              </p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <!-- Toggle enable -->
              <button
                @click="toggleJob(job)"
                class="p-1.5 rounded-md transition-colors"
                :class="job.enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'"
                :title="job.enabled ? 'Nonaktifkan' : 'Aktifkan'"
              >
                <div class="w-4 h-4 rounded-full border-2" :class="job.enabled ? 'border-green-600 bg-green-600' : 'border-gray-400'" />
              </button>
              <!-- Connect OAuth -->
              <button
                v-if="!job.connected"
                @click="connectOAuth(job)"
                class="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 transition-colors"
                title="Hubungkan akun"
              >
                <Link2 class="w-4 h-4" />
              </button>
              <!-- Run Now -->
              <button
                @click="runJob(job.id)"
                :disabled="!job.connected || !!loading"
                class="p-1.5 rounded-md text-sky-600 hover:bg-sky-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Jalankan sekarang"
              >
                <Loader2 v-if="loading === `run-${job.id}`" class="w-4 h-4 animate-spin" />
                <Play v-else class="w-4 h-4" />
              </button>
              <!-- Edit -->
              <button
                @click="openEditJob(job)"
                class="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                title="Edit"
              >
                <Pencil class="w-4 h-4" />
              </button>
              <!-- Delete -->
              <button
                @click="showDeleteConfirm = job.id"
                class="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                title="Hapus"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8 text-[var(--muted-foreground)]">
        <Cloud class="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p class="text-sm">Belum ada cloud backup job. Klik "Tambah Job" untuk memulai.</p>
      </div>
    </section>

    <!-- RESTORE SECTION -->
    <section class="space-y-4">
      <div class="flex items-center gap-2">
        <RotateCcw class="w-5 h-5 text-orange-600" />
        <h2 class="text-lg font-semibold">Restore</h2>
      </div>
      <div class="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
        <AlertTriangle class="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p class="text-sm text-amber-800">
          <strong>Perhatian:</strong> Restore akan <strong>menimpa</strong> data yang ada saat ini. Pastikan Anda sudah membuat backup terlebih dahulu sebelum melakukan restore.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <!-- Restore Database -->
        <div class="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-4">
          <div class="flex flex-col items-center gap-2">
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Database class="w-6 h-6 text-blue-600" />
            </div>
            <p class="font-medium text-sm">Restore Database</p>
            <p class="text-xs text-[var(--muted-foreground)] text-center">Upload file JSON backup</p>
          </div>
          <div>
            <input
              ref="dbFileInput"
              type="file"
              accept=".json"
              class="text-xs w-full file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
          <button
            @click="confirmRestore('restore-db')"
            :disabled="!!loading"
            class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="loading === 'restore-db'" class="w-4 h-4 animate-spin" />
            <Upload v-else class="w-4 h-4" />
            {{ loading === 'restore-db' ? 'Restoring...' : 'Restore' }}
          </button>
        </div>

        <!-- Restore Files -->
        <div class="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-4">
          <div class="flex flex-col items-center gap-2">
            <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <FolderArchive class="w-6 h-6 text-green-600" />
            </div>
            <p class="font-medium text-sm">Restore File</p>
            <p class="text-xs text-[var(--muted-foreground)] text-center">Upload file ZIP backup</p>
          </div>
          <div>
            <input
              ref="filesFileInput"
              type="file"
              accept=".zip"
              class="text-xs w-full file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-green-50 file:text-green-600 hover:file:bg-green-100 cursor-pointer"
            />
          </div>
          <button
            @click="confirmRestore('restore-files')"
            :disabled="!!loading"
            class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="loading === 'restore-files'" class="w-4 h-4 animate-spin" />
            <Upload v-else class="w-4 h-4" />
            {{ loading === 'restore-files' ? 'Restoring...' : 'Restore' }}
          </button>
        </div>

        <!-- Restore Full -->
        <div class="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-4">
          <div class="flex flex-col items-center gap-2">
            <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Package class="w-6 h-6 text-purple-600" />
            </div>
            <p class="font-medium text-sm">Full Restore</p>
            <p class="text-xs text-[var(--muted-foreground)] text-center">Upload full backup (ZIP)</p>
          </div>
          <div>
            <input
              ref="fullFileInput"
              type="file"
              accept=".zip"
              class="text-xs w-full file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100 cursor-pointer"
            />
          </div>
          <button
            @click="confirmRestore('restore-full')"
            :disabled="!!loading"
            class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="loading === 'restore-full'" class="w-4 h-4 animate-spin" />
            <Upload v-else class="w-4 h-4" />
            {{ loading === 'restore-full' ? 'Restoring...' : 'Restore' }}
          </button>
        </div>
      </div>
    </section>

    <hr class="border-[var(--border)]" />

   

    <!-- Job Form Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showJobForm"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          @click.self="showJobForm = false"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-lg">{{ editingJob ? 'Edit Job' : 'Tambah Cloud Backup Job' }}</h3>
              <button @click="showJobForm = false" class="p-1 rounded-md hover:bg-gray-100">
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">Nama Job</label>
                <input v-model="jobForm.name" type="text" placeholder="contoh: Daily Backup Google Drive" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Provider</label>
                <select v-model="jobForm.provider" :disabled="!!editingJob" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60">
                  <option value="google_drive">Google Drive</option>
                  <option value="onedrive">OneDrive</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">
                  Client ID
                  <span v-if="editingJob" class="text-xs text-gray-500 font-normal">(kosongkan jika tidak ingin mengubah)</span>
                </label>
                <input v-model="jobForm.clientId" type="text" placeholder="OAuth Client ID" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">
                  Client Secret
                  <span v-if="editingJob" class="text-xs text-gray-500 font-normal">(kosongkan jika tidak ingin mengubah)</span>
                </label>
                <input v-model="jobForm.clientSecret" type="password" placeholder="OAuth Client Secret" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">
                  Folder ID / Path
                  <span class="text-xs text-gray-500 font-normal">(opsional)</span>
                </label>
                <input v-model="jobForm.folderId" type="text" :placeholder="jobForm.provider === 'google_drive' ? 'ID folder Google Drive' : 'Path folder, misal: Backups'" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <p class="text-xs text-gray-500 mt-1">
                  <template v-if="jobForm.provider === 'google_drive'">
                    Ambil dari URL folder Google Drive: drive.google.com/drive/folders/<strong>[ID INI]</strong>
                  </template>
                  <template v-else>
                    Path folder di OneDrive, misal: <strong>Backups/personal-web</strong>
                  </template>
                </p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1">Tipe Backup</label>
                  <select v-model="jobForm.backupType" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="database">Database saja</option>
                    <option value="files">File saja</option>
                    <option value="full">Full (DB + File)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Jadwal</label>
                  <select v-model="jobForm.schedule" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="disabled">Nonaktif (manual)</option>
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                  </select>
                </div>
              </div>

              <!-- Setup Guide -->
              <div class="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <p class="text-xs font-medium text-gray-700 mb-1">Panduan Setup:</p>
                <ol class="text-xs text-gray-600 list-decimal list-inside space-y-0.5">
                  <template v-if="jobForm.provider === 'google_drive'">
                    <li>Buka <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="text-sky-600 underline">Google Cloud Console</a></li>
                    <li>Buat OAuth 2.0 Client ID (Web application)</li>
                    <li>Tambahkan redirect URI: <code class="bg-gray-200 px-1 rounded text-xs">{{ redirectUri('google_drive') }}</code></li>
                    <li>Aktifkan Google Drive API di project</li>
                    <li>Salin Client ID dan Secret ke form ini</li>
                  </template>
                  <template v-else>
                    <li>Buka <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" class="text-sky-600 underline">Azure Portal — App registrations</a></li>
                    <li>Buat app registration baru</li>
                    <li>Tambahkan redirect URI (Web): <code class="bg-gray-200 px-1 rounded text-xs">{{ redirectUri('onedrive') }}</code></li>
                    <li>Buat Client Secret di bagian "Certificates & secrets"</li>
                    <li>Salin Application (client) ID dan Secret Value ke form ini</li>
                  </template>
                </ol>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button @click="showJobForm = false" class="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button
                @click="saveJob"
                :disabled="!jobForm.name || loading === 'save-job'"
                class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition-colors disabled:opacity-50"
              >
                <Loader2 v-if="loading === 'save-job'" class="w-4 h-4 animate-spin" />
                {{ editingJob ? 'Simpan' : 'Buat Job' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showDeleteConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          @click.self="showDeleteConfirm = null"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 class="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 class="font-semibold">Hapus Job?</h3>
                <p class="text-sm text-gray-600 mt-1">Job backup ini akan dihapus permanen.</p>
              </div>
            </div>
            <div class="flex justify-end gap-3">
              <button @click="showDeleteConfirm = null" class="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors">Batal</button>
              <button @click="deleteJob(showDeleteConfirm!)" class="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirmation Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          @click.self="showConfirm = null"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle class="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 class="font-semibold">Konfirmasi Restore</h3>
                <p class="text-sm text-gray-600 mt-1">
                  <template v-if="showConfirm === 'restore-db'">
                    Semua data di database akan <strong>dihapus</strong> dan diganti dengan data dari file backup. Lanjutkan?
                  </template>
                  <template v-else-if="showConfirm === 'restore-files'">
                    File yang sudah ada dengan nama yang sama akan <strong>ditimpa</strong>. Lanjutkan?
                  </template>
                  <template v-else>
                    Semua data database dan file akan <strong>dihapus dan diganti</strong> dengan data dari backup. Lanjutkan?
                  </template>
                </p>
              </div>
            </div>
            <div class="flex justify-end gap-3">
              <button
                @click="showConfirm = null"
                class="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                @click="executeRestore"
                class="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Ya, Restore
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
