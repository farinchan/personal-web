<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

useSeoMeta({ title: 'Pesan Masuk — Admin', robots: 'noindex, nofollow' })

const { data: messages, refresh } = await useFetch('/api/messages')

async function markAsRead(id: number) {
  await $fetch(`/api/messages/${id}/read`, { method: 'PATCH' })
  await refresh()
}

async function deleteMessage(id: number) {
  if (!confirm('Yakin ingin menghapus pesan ini?')) return
  await $fetch(`/api/messages/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-8">Pesan Masuk</h1>

    <UiCard class="p-0">
      <div v-if="messages && messages.length > 0">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['p-4 border-b last:border-b-0', msg.status === 'unread' ? 'bg-blue-50/50' : '']"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-sm">{{ msg.name }}</span>
                <span class="text-[var(--muted-foreground)] text-sm">({{ msg.email }})</span>
                <UiBadge v-if="msg.status === 'unread'" variant="default" class="text-xs">Baru</UiBadge>
              </div>
              <p class="font-medium text-sm mb-1">{{ msg.subject }}</p>
              <p class="text-sm text-[var(--muted-foreground)]">{{ msg.body }}</p>
              <p class="text-xs text-[var(--muted-foreground)] mt-2">
                {{ new Date(msg.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
              </p>
            </div>
            <div class="flex gap-2 shrink-0">
              <UiButton v-if="msg.status === 'unread'" size="sm" variant="outline" @click="markAsRead(msg.id)">
                Tandai Dibaca
              </UiButton>
              <UiButton size="sm" variant="destructive" @click="deleteMessage(msg.id)">
                Hapus
              </UiButton>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="p-8 text-center text-[var(--muted-foreground)]">
        Belum ada pesan
      </div>
    </UiCard>
  </div>
</template>
