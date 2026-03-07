<script setup lang="ts">
import { Eye, Heart } from 'lucide-vue-next'

const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl as string

useSeoMeta({
  title: 'Blog — Fajri Gariskode',
  description: 'Dokumentasi pembelajaran dan catatan teknis. Kumpulan artikel tentang pemrograman, teknologi, dan pengalaman belajar.',
  ogTitle: 'Blog — Fajri Gariskode',
  ogDescription: 'Dokumentasi pembelajaran dan catatan teknis. Kumpulan artikel tentang pemrograman, teknologi, dan pengalaman belajar.',
  ogUrl: `${siteUrl}/blog`,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Blog — Fajri Gariskode',
  twitterDescription: 'Dokumentasi pembelajaran dan catatan teknis. Kumpulan artikel tentang pemrograman, teknologi, dan pengalaman belajar.',
})

const searchQuery = ref('')
const selectedTag = ref('')

const { data: posts, refresh } = await useFetch('/api/posts', {
  query: computed(() => ({
    q: searchQuery.value || undefined,
    tag: selectedTag.value || undefined,
  })),
})

const { data: allTags } = await useFetch('/api/tags')

function selectTag(slug: string) {
  selectedTag.value = selectedTag.value === slug ? '' : slug
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-2">Blog</h1>
    <p class="text-[var(--muted-foreground)] mb-8">Dokumentasi pembelajaran dan catatan teknis</p>

    <!-- Search & Filter -->
    <div class="flex flex-col md:flex-row gap-4 mb-8">
      <UiInput
        v-model="searchQuery"
        placeholder="Cari artikel..."
        class="max-w-sm"
      />
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="tag in allTags"
          :key="tag.id"
          @click="selectTag(tag.slug)"
          :class="[
            'px-3 py-1 rounded-full text-sm border transition-colors',
            selectedTag === tag.slug
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
              : 'hover:bg-[var(--accent)]'
          ]"
        >
          {{ tag.name }}
        </button>
      </div>
    </div>

    <!-- Posts Grid -->
    <div v-if="posts && posts.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="post in posts"
        :key="post.id"
        :to="`/blog/${post.slug}`"
        class="group"
      >
        <UiCard class="h-full p-6 hover:shadow-lg transition-shadow">
          <div v-if="post.coverImage" class="mb-4 rounded-lg overflow-hidden">
            <img :src="post.coverImage" :alt="post.title" class="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
          </div>
          <div class="flex gap-2 flex-wrap mb-2">
            <UiBadge v-for="tag in post.tags" :key="tag.slug" variant="secondary">
              {{ tag.name }}
            </UiBadge>
          </div>
          <h2 class="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">
            {{ post.title }}
          </h2>
          <p class="text-sm text-[var(--muted-foreground)] line-clamp-2">
            {{ post.description }}
          </p>
          <div class="flex items-center gap-4 mt-4 text-xs text-[var(--muted-foreground)]">
            <span>{{ post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('id-ID') : '' }}</span>
            <span class="flex items-center gap-1"><Eye class="w-3.5 h-3.5" /> {{ post.viewCount }}</span>
            <span class="flex items-center gap-1"><Heart class="w-3.5 h-3.5" /> {{ post.shareCount }}</span>
          </div>
        </UiCard>
      </NuxtLink>
    </div>
    <div v-else class="text-center text-[var(--muted-foreground)] py-12">
      <p>Tidak ada artikel ditemukan.</p>
    </div>
  </div>
</template>
