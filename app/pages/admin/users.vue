<script setup lang="ts">
import { Plus, Trash2, Pencil, Shield, X, Check } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useSeoMeta({ title: 'Kelola Admin — Admin', robots: 'noindex, nofollow' })

const { user: currentUser } = useUserSession()

const { data: users, refresh } = await useFetch('/api/admin/users')

// Add user form
const showAddForm = ref(false)
const newUsername = ref('')
const newPassword = ref('')
const addLoading = ref(false)
const addError = ref('')

async function addUser() {
  if (!newUsername.value || !newPassword.value) {
    addError.value = 'Username dan password wajib diisi'
    return
  }
  addLoading.value = true
  addError.value = ''
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: { username: newUsername.value, password: newPassword.value },
    })
    newUsername.value = ''
    newPassword.value = ''
    showAddForm.value = false
    await refresh()
  } catch (err: any) {
    addError.value = err.data?.statusMessage || 'Gagal menambahkan user'
  } finally {
    addLoading.value = false
  }
}

// Edit user
const editId = ref<number | null>(null)
const editUsername = ref('')
const editPassword = ref('')
const editLoading = ref(false)
const editError = ref('')

function startEdit(user: { id: number; username: string }) {
  editId.value = user.id
  editUsername.value = user.username
  editPassword.value = ''
  editError.value = ''
}

function cancelEdit() {
  editId.value = null
  editError.value = ''
}

async function saveEdit() {
  if (!editId.value) return
  editLoading.value = true
  editError.value = ''
  try {
    await $fetch(`/api/admin/users/${editId.value}`, {
      method: 'PUT',
      body: {
        username: editUsername.value || undefined,
        password: editPassword.value || undefined,
      },
    })
    editId.value = null
    await refresh()
  } catch (err: any) {
    editError.value = err.data?.statusMessage || 'Gagal memperbarui user'
  } finally {
    editLoading.value = false
  }
}

// Delete user
const deleteLoading = ref<number | null>(null)

async function deleteUser(id: number) {
  if (!confirm('Yakin ingin menghapus user ini?')) return
  deleteLoading.value = id
  try {
    await $fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Gagal menghapus user')
  } finally {
    deleteLoading.value = null
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Kelola Admin</h1>
        <p class="text-sm text-[var(--muted-foreground)]">Daftar user admin yang dapat login ke panel</p>
      </div>
      <UiButton @click="showAddForm = !showAddForm">
        <Plus class="w-4 h-4 mr-2" />
        Tambah Admin
      </UiButton>
    </div>

    <!-- Add User Form -->
    <UiCard v-if="showAddForm" class="p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Tambah Admin Baru</h2>
      <div v-if="addError" class="bg-red-50 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
        {{ addError }}
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium mb-1">Username</label>
          <UiInput v-model="newUsername" placeholder="Username baru" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <UiInput v-model="newPassword" type="password" placeholder="Minimal 6 karakter" />
        </div>
      </div>
      <div class="flex gap-2 mt-4">
        <UiButton @click="addUser" :disabled="addLoading">
          {{ addLoading ? 'Menyimpan...' : 'Simpan' }}
        </UiButton>
        <UiButton variant="outline" @click="showAddForm = false">Batal</UiButton>
      </div>
    </UiCard>

    <!-- Users Table -->
    <UiCard class="overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b">
            <th class="text-left px-4 py-3 font-medium">ID</th>
            <th class="text-left px-4 py-3 font-medium">Username</th>
            <th class="text-left px-4 py-3 font-medium">Status</th>
            <th class="text-right px-4 py-3 font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
            class="border-b last:border-0 hover:bg-[var(--accent)]/50 transition-colors"
          >
            <td class="px-4 py-3 text-[var(--muted-foreground)]">{{ user.id }}</td>

            <!-- Edit Mode -->
            <template v-if="editId === user.id">
              <td class="px-4 py-3">
                <div class="space-y-2">
                  <UiInput v-model="editUsername" placeholder="Username" class="max-w-xs" />
                  <UiInput v-model="editPassword" type="password" placeholder="Password baru (kosongkan jika tidak diubah)" class="max-w-xs" />
                  <p v-if="editError" class="text-xs text-red-600">{{ editError }}</p>
                </div>
              </td>
              <td class="px-4 py-3">
                <span v-if="currentUser?.id === user.id" class="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  <Shield class="w-3 h-3" /> Anda
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <UiButton size="sm" @click="saveEdit" :disabled="editLoading">
                    <Check class="w-4 h-4" />
                  </UiButton>
                  <UiButton size="sm" variant="outline" @click="cancelEdit">
                    <X class="w-4 h-4" />
                  </UiButton>
                </div>
              </td>
            </template>

            <!-- View Mode -->
            <template v-else>
              <td class="px-4 py-3 font-medium">{{ user.username }}</td>
              <td class="px-4 py-3">
                <span v-if="currentUser?.id === user.id" class="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  <Shield class="w-3 h-3" /> Anda
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <UiButton size="sm" variant="outline" @click="startEdit(user)">
                    <Pencil class="w-4 h-4" />
                  </UiButton>
                  <UiButton
                    size="sm"
                    variant="outline"
                    class="text-red-600 hover:text-red-700"
                    @click="deleteUser(user.id)"
                    :disabled="currentUser?.id === user.id || deleteLoading === user.id"
                  >
                    <Trash2 class="w-4 h-4" />
                  </UiButton>
                </div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>

      <div v-if="!users || users.length === 0" class="text-center text-[var(--muted-foreground)] py-12">
        Belum ada user admin.
      </div>
    </UiCard>
  </div>
</template>
