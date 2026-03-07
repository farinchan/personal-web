<script setup lang="ts">
import { ArrowLeft, Eye } from 'lucide-vue-next'

const route = useRoute()
const tag = route.params.tag as string

const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl as string

useSeoMeta({
  title: `Tag: ${tag} — Blog Fajri Gariskode`,
  description: `Artikel dengan tag "${tag}" di blog Fajri Gariskode.`,
  ogTitle: `Tag: ${tag} — Blog Fajri Gariskode`,
  ogDescription: `Artikel dengan tag "${tag}" di blog Fajri Gariskode.`,
  ogUrl: `${siteUrl}/blog/tags/${tag}`,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: `Tag: ${tag} — Blog Fajri Gariskode`,
  twitterDescription: `Artikel dengan tag "${tag}" di blog Fajri Gariskode.`,
})

const { data: posts } = await useFetch('/api/posts', {
  query: { tag },
})

const { data: allTags } = await useFetch('/api/tags')
const currentTag = computed(() => allTags.value?.find((t: any) => t.slug === tag))
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8">
      <NuxtLink to="/blog" class="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        <ArrowLeft class="w-4 h-4" /> Kembali ke Blog
      </NuxtLink>
    </div>

    <h1 class="text-3xl font-bold mb-2">
      Tag: {{ currentTag?.name || tag }}
    </h1>
    <p class="text-[var(--muted-foreground)] mb-8">
      {{ posts?.length || 0 }} artikel dengan tag ini
    </p>

    <div v-if="posts && posts.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="post in posts"
        :key="post.id"
        :to="`/blog/${post.slug}`"
        class="group"
      >
        <UiCard class="h-full p-6 hover:shadow-lg transition-shadow">
          <div class="flex gap-2 flex-wrap mb-2">
            <UiBadge v-for="t in post.tags" :key="t.slug" variant="secondary">
              {{ t.name }}
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
          </div>
        </UiCard>
      </NuxtLink>
    </div>
    <div v-else class="text-center text-[var(--muted-foreground)] py-12">
      <p>Tidak ada artikel dengan tag ini.</p>
    </div>
  </div>
</template>
