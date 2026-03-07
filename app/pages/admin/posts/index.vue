<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useSeoMeta({ title: 'Kelola Posts — Admin', robots: 'noindex, nofollow' })

const { data: posts, refresh } = await useFetch('/api/admin/posts')

async function deletePost(id: number) {
  if (!confirm('Yakin ingin menghapus artikel ini?')) return
  await $fetch(`/api/posts/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold">Kelola Artikel</h1>
      <UiButton to="/admin/posts/new">
        <Plus class="w-4 h-4 mr-1" /> Artikel Baru
      </UiButton>
    </div>

    <UiCard class="p-0">
      <table class="w-full">
        <thead>
          <tr class="border-b bg-[var(--muted)]">
            <th class="text-left px-4 py-3 text-sm font-medium">Judul</th>
            <th class="text-left px-4 py-3 text-sm font-medium">Status</th>
            <th class="text-left px-4 py-3 text-sm font-medium">Views</th>
            <th class="text-left px-4 py-3 text-sm font-medium">Tanggal</th>
            <th class="text-right px-4 py-3 text-sm font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id" class="border-b last:border-b-0 hover:bg-[var(--accent)]/50">
            <td class="px-4 py-3">
              <NuxtLink :to="`/admin/posts/${post.id}`" class="font-medium hover:text-blue-600">
                {{ post.title }}
              </NuxtLink>
              <div class="flex gap-1 mt-1">
                <UiBadge v-for="tag in post.tags" :key="tag.slug" variant="secondary" class="text-xs">
                  {{ tag.name }}
                </UiBadge>
              </div>
            </td>
            <td class="px-4 py-3">
              <UiBadge :variant="post.isDraft ? 'outline' : 'default'">
                {{ post.isDraft ? 'Draft' : 'Published' }}
              </UiBadge>
            </td>
            <td class="px-4 py-3 text-sm text-[var(--muted-foreground)]">{{ post.viewCount }}</td>
            <td class="px-4 py-3 text-sm text-[var(--muted-foreground)]">
              {{ post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('id-ID') : '-' }}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex gap-2 justify-end">
                <UiButton :to="`/admin/posts/${post.id}`" size="sm" variant="ghost">
                  Edit
                </UiButton>
                <UiButton size="sm" variant="destructive" @click="deletePost(post.id)">
                  Hapus
                </UiButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!posts || posts.length === 0" class="p-8 text-center text-[var(--muted-foreground)]">
        Belum ada artikel
      </div>
    </UiCard>
  </div>
</template>
