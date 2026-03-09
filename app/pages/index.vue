<script setup lang="ts">
import { Hand, Eye } from 'lucide-vue-next'

const requestUrl = useRequestURL()
const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`

useSeoMeta({
  title: 'Fajri Gariskode — Blog, Profile & CV',
  description: 'Blog dokumentasi pembelajaran, profile, dan CV. Tempat mencatat perjalanan belajar dan berbagi pengetahuan.',
  ogTitle: 'Fajri Gariskode — Blog, Profile & CV',
  ogDescription: 'Blog dokumentasi pembelajaran, profile, dan CV. Tempat mencatat perjalanan belajar dan berbagi pengetahuan.',
  ogUrl: siteUrl,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Fajri Gariskode — Blog, Profile & CV',
  twitterDescription: 'Blog dokumentasi pembelajaran, profile, dan CV. Tempat mencatat perjalanan belajar dan berbagi pengetahuan.',
})

const { data: recentPosts } = await useFetch('/api/posts', {
  query: { limit: 6 },
})
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="container mx-auto px-4 py-20 text-center">
      <h1 class="text-4xl md:text-6xl font-bold tracking-tight mb-6">
        Selamat Datang <Hand class="inline w-10 h-10" />
      </h1>
      <p class="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-8">
        Blog dokumentasi pembelajaran, profile, dan CV saya. Tempat saya mencatat perjalanan belajar dan berbagi pengetahuan.
      </p>
      <div class="flex gap-4 justify-center">
        <UiButton to="/blog" size="lg">
          Baca Blog
        </UiButton>
        <UiButton to="/contact" variant="outline" size="lg">
          Hubungi Saya
        </UiButton>
      </div>
    </section>

    <!-- Recent Posts -->
    <section class="container mx-auto px-4 py-12">
      <h2 class="text-2xl font-bold mb-8">Artikel Terbaru</h2>
      <div v-if="recentPosts && recentPosts.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="post in recentPosts"
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
            <h3 class="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">
              {{ post.title }}
            </h3>
            <p class="text-sm text-[var(--muted-foreground)] line-clamp-2">
              {{ post.description }}
            </p>
            <div class="flex items-center gap-4 mt-4 text-xs text-[var(--muted-foreground)]">
              <span>{{ post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('id-ID') : '' }}</span>
              <span class="flex items-center gap-1"><Eye class="w-3.5 h-3.5" /> {{ post.viewCount }}</span>
            </div>
          </UiCard>
        </NuxtLink>
      </div>
      <div v-else class="text-center text-[var(--muted-foreground)] py-12">
        <p>Belum ada artikel. Nantikan segera!</p>
      </div>
    </section>
  </div>
</template>
