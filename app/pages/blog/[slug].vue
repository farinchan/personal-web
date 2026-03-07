<script setup lang="ts">
import { ArrowLeft, Eye, ListTree, ChevronDown } from 'lucide-vue-next'

const route = useRoute()
const slug = route.params.slug as string

const { data: post } = await useFetch(`/api/posts/${slug}`)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Artikel tidak ditemukan' })
}

const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl as string
const postUrl = `${siteUrl}/blog/${slug}`
const postImage = computed(() => post.value?.coverImage || undefined)

useSeoMeta({
  title: () => `${post.value?.title} — Blog`,
  description: () => post.value?.description || '',
  ogTitle: () => post.value?.title || '',
  ogDescription: () => post.value?.description || '',
  ogUrl: postUrl,
  ogType: 'article',
  ogImage: () => postImage.value ? `${siteUrl}${postImage.value}` : undefined,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: () => post.value?.title || '',
  twitterCard: 'summary_large_image',
  twitterTitle: () => post.value?.title || '',
  twitterDescription: () => post.value?.description || '',
  twitterImage: () => postImage.value ? `${siteUrl}${postImage.value}` : undefined,
  twitterImageAlt: () => post.value?.title || '',
  articlePublishedTime: () => post.value?.publishedAt || '',
  articleModifiedTime: () => post.value?.updatedAt || '',
  articleAuthor: ['Fajri Gariskode'],
  articleSection: 'Blog',
  articleTag: () => post.value?.tags?.map((t: any) => t.name) || [],
})

useSchemaOrg([
  defineArticle({
    headline: post.value?.title || '',
    description: post.value?.description || '',
    image: postImage.value ? `${siteUrl}${postImage.value}` : undefined,
    datePublished: post.value?.publishedAt || '',
    dateModified: post.value?.updatedAt || '',
    author: {
      name: 'Fajri Gariskode',
    },
  }),
])

// Track view (once per session)
onMounted(async () => {
  const viewKey = `viewed-${slug}`
  if (!sessionStorage.getItem(viewKey)) {
    await $fetch(`/api/posts/${slug}/view`, { method: 'POST' })
    sessionStorage.setItem(viewKey, '1')
  }
})

// Generate TOC from HTML headings
const toc = computed(() => {
  if (!post.value?.body) return []
  const headingRegex = /<h([23])[^>]*>([^<]+)<\/h[23]>/g
  const items: { level: number; text: string; id: string }[] = []
  let match
  while ((match = headingRegex.exec(post.value.body)) !== null) {
    const level = Number(match[1])
    const text = match[2]?.trim() || ''
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    items.push({ level, text, id })
  }
  return items
})

// Body is already HTML from the rich text editor
// Add IDs to headings for TOC linking + render math formulas
const { renderMathInHtml } = useRenderMath()

const renderedBody = computed(() => {
  if (!post.value?.body) return ''
  let html = post.value.body
  // Add id attributes to h2/h3 for TOC navigation
  html = html.replace(/<h([23])([^>]*)>([^<]+)<\/h([23])>/g, (_match, level, attrs, text, _closeLevel) => {
    const id = text.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`
  })
  // Render math formulas (KaTeX)
  html = renderMathInHtml(html)
  return html
})

// Active heading tracking on scroll
const activeId = ref('')
const mobileTocOpen = ref(false)

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      }
    },
    { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
  )

  // Wait for DOM to render headings
  nextTick(() => {
    for (const item of toc.value) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }
  })

  onBeforeUnmount(() => observer.disconnect())
})

function scrollToHeading(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    mobileTocOpen.value = false
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="post" class="flex gap-8">
      <!-- Main Content -->
      <article class="flex-1 min-w-0">
        <div class="mb-6">
          <NuxtLink to="/blog" class="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <ArrowLeft class="w-4 h-4" /> Kembali ke Blog
          </NuxtLink>
        </div>

        <div v-if="post.coverImage" class="mb-6 rounded-lg overflow-hidden">
          <img :src="post.coverImage" :alt="post.title" class="w-full max-h-96 object-cover" />
        </div>

        <div class="flex gap-2 flex-wrap mb-4">
          <NuxtLink
            v-for="tag in post.tags"
            :key="tag.slug"
            :to="`/blog/tags/${tag.slug}`"
          >
            <UiBadge variant="secondary" class="cursor-pointer hover:bg-gray-200">
              {{ tag.name }}
            </UiBadge>
          </NuxtLink>
        </div>

        <h1 class="text-3xl md:text-4xl font-bold mb-4">{{ post.title }}</h1>

        <div class="flex items-center gap-4 text-sm text-[var(--muted-foreground)] mb-8">
          <span>{{ post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '' }}</span>
          <span class="flex items-center gap-1"><Eye class="w-4 h-4" /> {{ post.viewCount }} views</span>
        </div>

        <!-- Mobile TOC -->
        <div v-if="toc.length > 0" class="lg:hidden mb-8 border rounded-lg">
          <button
            @click="mobileTocOpen = !mobileTocOpen"
            class="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold"
          >
            <span class="flex items-center gap-2">
              <ListTree class="w-4 h-4" /> Daftar Isi
            </span>
            <ChevronDown class="w-4 h-4 transition-transform" :class="{ 'rotate-180': mobileTocOpen }" />
          </button>
          <nav v-show="mobileTocOpen" class="px-4 pb-3 space-y-1 border-t pt-3">
            <a
              v-for="item in toc"
              :key="item.id"
              href="javascript:void(0)"
              @click="scrollToHeading(item.id)"
              :class="[
                'block text-sm py-1 transition-colors border-l-2',
                item.level === 2 ? 'pl-3' : 'pl-6',
                activeId === item.id
                  ? 'border-[var(--primary)] text-[var(--foreground)] font-medium'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              ]"
            >
              {{ item.text }}
            </a>
          </nav>
        </div>

        <!-- Article Body -->
        <div class="prose" v-html="renderedBody" />

        <!-- Engagement Bar -->
        <BlogPostEngagement :slug="slug" :share-count="post.shareCount" />

        <!-- Comments -->
        <section class="mt-12">
          <h2 class="text-xl font-bold mb-6">Komentar</h2>
          <BlogCommentForm :slug="slug" />
          <BlogCommentList :slug="slug" />
        </section>
      </article>

      <!-- Sidebar TOC -->
      <aside v-if="toc.length > 0" class="hidden lg:block w-64 shrink-0">
        <div class="sticky top-20">
          <h3 class="text-sm font-semibold mb-3 text-[var(--muted-foreground)] flex items-center gap-2">
            <ListTree class="w-4 h-4" /> Daftar Isi
          </h3>
          <nav class="space-y-0.5">
            <a
              v-for="item in toc"
              :key="item.id"
              href="javascript:void(0)"
              @click="scrollToHeading(item.id)"
              :class="[
                'block text-sm py-1 transition-colors border-l-2',
                item.level === 2 ? 'pl-3' : 'pl-6',
                activeId === item.id
                  ? 'border-[var(--primary)] text-[var(--foreground)] font-medium'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              ]"
            >
              {{ item.text }}
            </a>
          </nav>
        </div>
      </aside>
    </div>
  </div>
</template>
