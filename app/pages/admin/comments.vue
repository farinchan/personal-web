<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

useSeoMeta({ title: 'Moderasi Komentar — Admin', robots: 'noindex, nofollow' })

const { data: comments, refresh } = await useFetch('/api/admin/comments')

const replyingTo = ref<number | null>(null)
const replyBody = ref('')
const isReplying = ref(false)

function startReply(id: number) {
  replyingTo.value = id
  replyBody.value = ''
}

function cancelReply() {
  replyingTo.value = null
  replyBody.value = ''
}

async function submitReply(id: number) {
  if (!replyBody.value.trim()) return
  isReplying.value = true
  try {
    await $fetch(`/api/comments/${id}/reply`, {
      method: 'POST',
      body: { body: replyBody.value },
    })
    replyingTo.value = null
    replyBody.value = ''
    await refresh()
  } catch {}
  isReplying.value = false
}

async function approveComment(id: number) {
  await $fetch(`/api/comments/${id}/approve`, { method: 'PATCH' })
  await refresh()
}

async function deleteComment(id: number) {
  if (!confirm('Yakin ingin menghapus komentar ini?')) return
  await $fetch(`/api/comments/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-8">Moderasi Komentar</h1>

    <UiCard class="p-0">
      <div v-if="comments && comments.length > 0">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="p-4 border-b last:border-b-0"
          :class="{ 'pl-10 bg-[var(--muted)]/30': comment.parentId }"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <p class="text-sm">
                <span class="font-semibold">{{ comment.name }}</span>
                <UiBadge v-if="comment.isAdmin" variant="default" class="ml-1 text-xs">Admin</UiBadge>
                <span v-if="comment.parentId" class="text-[var(--muted-foreground)]"> membalas</span>
                <span v-else class="text-[var(--muted-foreground)]"> pada </span>
                <NuxtLink v-if="!comment.parentId" :to="`/blog/${comment.postSlug}`" class="text-blue-600 hover:underline">
                  {{ comment.postTitle }}
                </NuxtLink>
              </p>
              <p class="text-sm mt-1">{{ comment.body }}</p>
              <div class="flex items-center gap-2 mt-2">
                <UiBadge :variant="comment.status === 'approved' ? 'default' : 'outline'">
                  {{ comment.status }}
                </UiBadge>
                <span class="text-xs text-[var(--muted-foreground)]">
                  {{ new Date(comment.createdAt).toLocaleDateString('id-ID') }}
                </span>
              </div>

              <!-- Reply form -->
              <div v-if="replyingTo === comment.id" class="mt-3">
                <UiTextarea v-model="replyBody" placeholder="Tulis balasan..." :rows="3" class="text-sm" />
                <div class="flex gap-2 mt-2">
                  <UiButton size="sm" :disabled="isReplying" @click="submitReply(comment.id)">
                    {{ isReplying ? 'Mengirim...' : 'Kirim Balasan' }}
                  </UiButton>
                  <UiButton size="sm" variant="ghost" @click="cancelReply">Batal</UiButton>
                </div>
              </div>
            </div>
            <div class="flex gap-2 shrink-0">
              <UiButton v-if="!comment.parentId && !comment.isAdmin" size="sm" variant="outline" @click="startReply(comment.id)">
                Balas
              </UiButton>
              <UiButton v-if="comment.status === 'pending'" size="sm" @click="approveComment(comment.id)">
                Approve
              </UiButton>
              <UiButton size="sm" variant="destructive" @click="deleteComment(comment.id)">
                Hapus
              </UiButton>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="p-8 text-center text-[var(--muted-foreground)]">
        Belum ada komentar
      </div>
    </UiCard>
  </div>
</template>
