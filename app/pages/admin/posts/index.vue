<script setup lang="ts">
import { Plus, Search, X, Filter } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useSeoMeta({ title: 'Kelola Posts — Admin', robots: 'noindex, nofollow' })

const searchQuery = ref('')
const selectedTag = ref('')
const debouncedSearch = ref('')
let debounceTimer: ReturnType<typeof setTimeout>

watch(searchQuery, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = val
  }, 300)
})

const { data: posts, refresh } = await useFetch('/api/admin/posts', {
  query: { q: debouncedSearch },
  watch: [debouncedSearch],
})

// Extract all unique tags from posts
const allTags = computed(() => {
  if (!posts.value) return []
  const tagMap = new Map<string, string>()
  for (const post of posts.value) {
    for (const tag of post.tags) {
      tagMap.set(tag.slug, tag.name)
    }
  }
  return Array.from(tagMap.entries()).map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name))
})

// Filter posts by selected tag (client-side)
const filteredPosts = computed(() => {
  if (!posts.value) return []
  if (!selectedTag.value) return posts.value
  return posts.value.filter((post) =>
    post.tags.some((tag) => tag.slug === selectedTag.value)
  )
})

function clearFilters() {
  searchQuery.value = ''
  selectedTag.value = ''
}

const hasActiveFilters = computed(() => searchQuery.value || selectedTag.value)

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

    <!-- Search & Filter Bar -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <!-- Search -->
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari artikel berdasarkan judul..."
          class="w-full pl-9 pr-9 py-2 text-sm border border-[var(--input)] rounded-md bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Filter Tag -->
      <div class="relative">
        <Filter class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
        <select
          v-model="selectedTag"
          class="appearance-none pl-9 pr-8 py-2 text-sm border border-[var(--input)] rounded-md bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] min-w-[180px] cursor-pointer"
        >
          <option value="">Semua Tag</option>
          <option v-for="tag in allTags" :key="tag.slug" :value="tag.slug">
            {{ tag.name }}
          </option>
        </select>
      </div>

      <!-- Clear filters -->
      <button
        v-if="hasActiveFilters"
        type="button"
        @click="clearFilters"
        class="flex items-center gap-1 px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--input)] rounded-md hover:bg-[var(--accent)] transition-colors"
      >
        <X class="w-3.5 h-3.5" /> Reset
      </button>
    </div>

    <!-- Results info -->
    <div v-if="hasActiveFilters" class="text-sm text-[var(--muted-foreground)] mb-3">
      Menampilkan {{ filteredPosts.length }} artikel
      <span v-if="searchQuery"> dengan kata kunci "<strong class="text-[var(--foreground)]">{{ searchQuery }}</strong>"</span>
      <span v-if="selectedTag"> di tag "<strong class="text-[var(--foreground)]">{{ allTags.find(t => t.slug === selectedTag)?.name }}</strong>"</span>
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
          <tr v-for="post in filteredPosts" :key="post.id" class="border-b last:border-b-0 hover:bg-[var(--accent)]/50">
            <td class="px-4 py-3">
              <NuxtLink :to="`/admin/posts/${post.id}`" class="font-medium hover:text-blue-600">
                {{ post.title }}
              </NuxtLink>
              <div class="flex gap-1 mt-1 flex-wrap">
                <UiBadge
                  v-for="tag in post.tags"
                  :key="tag.slug"
                  variant="secondary"
                  class="text-xs cursor-pointer hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-colors"
                  :class="{ 'bg-[var(--primary)] text-[var(--primary-foreground)]': selectedTag === tag.slug }"
                  @click="selectedTag = selectedTag === tag.slug ? '' : tag.slug"
                >
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
      <div v-if="filteredPosts.length === 0" class="p-8 text-center text-[var(--muted-foreground)]">
        <template v-if="hasActiveFilters">
          Tidak ada artikel yang cocok dengan filter
        </template>
        <template v-else>
          Belum ada artikel
        </template>
      </div>
    </UiCard>
  </div>
</template>
