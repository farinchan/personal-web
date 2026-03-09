<script setup lang="ts">
import { ArrowLeft, Eye, ListTree, ChevronDown, Download, Quote, Copy, Check, ChevronUp } from 'lucide-vue-next'

const route = useRoute()
const slug = route.params.slug as string

const { data: post } = await useFetch(`/api/posts/${slug}`)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Artikel tidak ditemukan' })
}

const requestUrl = useRequestURL()
const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`
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
  articleAuthor: ['Fajri Rinaldi Chan'],
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
      name: 'Fajri Rinaldi Chan',
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
const { highlightCodeBlocks } = useCodeHighlight()

const renderedBody = ref('')

function processBody() {
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
}

// Initial render (without code highlighting for SSR / fast paint)
renderedBody.value = processBody()

// Apply syntax highlighting on client after mount
onMounted(async () => {
  const html = processBody()
  renderedBody.value = await highlightCodeBlocks(html)
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

// ===== PDF Download =====
const isGeneratingPdf = ref(false)

async function downloadPdf() {
  if (isGeneratingPdf.value || !post.value) return
  isGeneratingPdf.value = true

  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas-pro'),
    ])

    const articleEl = document.querySelector('.prose') as HTMLElement
    if (!articleEl) return

    // Build an off-screen wrapper with title + metadata + content
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;padding:40px 50px;font-family:Georgia,serif;background:#fff;color:#000;'
    document.body.appendChild(wrapper)

    // Title
    const titleEl = document.createElement('h1')
    titleEl.style.cssText = 'font-size:22px;font-weight:bold;margin:0 0 8px;line-height:1.3;color:#111;'
    titleEl.textContent = post.value.title
    wrapper.appendChild(titleEl)

    // Author & Date
    const metaEl = document.createElement('p')
    metaEl.style.cssText = 'font-size:11px;color:#666;margin:0 0 4px;'
    const dateStr = post.value.publishedAt
      ? new Date(post.value.publishedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
      : ''
    metaEl.textContent = `Fajri Rinaldi Chan • ${dateStr}`
    wrapper.appendChild(metaEl)

    // URL
    const urlEl = document.createElement('p')
    urlEl.style.cssText = 'font-size:9px;color:#999;margin:0 0 16px;'
    urlEl.textContent = postUrl
    wrapper.appendChild(urlEl)

    // Separator
    const hr = document.createElement('hr')
    hr.style.cssText = 'border:none;border-top:1px solid #ddd;margin:0 0 20px;'
    wrapper.appendChild(hr)

    // Clone article content
    const contentClone = articleEl.cloneNode(true) as HTMLElement
    contentClone.style.cssText = 'font-size:13px;line-height:1.7;color:#222;'
    // Ensure images have max-width
    contentClone.querySelectorAll('img').forEach((img) => {
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
    })
    wrapper.appendChild(contentClone)

    // Wait a tick for rendering
    await new Promise(r => setTimeout(r, 100))

    // Render to canvas
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    })

    document.body.removeChild(wrapper)

    // PDF dimensions (A4)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const contentWidth = pageWidth - margin * 2

    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = contentWidth / imgWidth
    const scaledHeight = imgHeight * ratio

    // Split across pages if needed
    const maxContentHeight = pageHeight - margin * 2
    let yOffset = 0
    let page = 0

    while (yOffset < scaledHeight) {
      if (page > 0) pdf.addPage()

      // Calculate source crop
      const srcY = (yOffset / ratio)
      const srcH = Math.min(maxContentHeight / ratio, imgHeight - srcY)
      const destH = srcH * ratio

      // Create a cropped canvas for this page
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = imgWidth
      pageCanvas.height = srcH
      const ctx = pageCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, srcY, imgWidth, srcH, 0, 0, imgWidth, srcH)

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92)
      pdf.addImage(pageImgData, 'JPEG', margin, margin, contentWidth, destH)

      yOffset += maxContentHeight
      page++
    }

    const safeSlug = post.value.slug || slug
    pdf.save(`${safeSlug}.pdf`)
  } catch (err) {
    console.error('PDF generation failed:', err)
    alert('Gagal membuat PDF. Silakan coba lagi.')
  } finally {
    isGeneratingPdf.value = false
  }
}

// ===== Cite This Page =====
const showCitation = ref(false)
const copiedFormat = ref('')
const activeCitationTab = ref<'apa' | 'mla' | 'chicago' | 'ieee' | 'bibtex'>('apa')

const authorName = 'Chan, FR.'
const authorNameFull = 'Fajri Rinaldi Chan'

const publishedDate = computed(() => {
  if (!post.value?.publishedAt) return null
  return new Date(post.value.publishedAt)
})

const accessDate = computed(() => new Date())

function formatDateApa(date: Date) {
  return `${date.getFullYear()}, ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
}
function formatDateMla(date: Date) {
  return `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}. ${date.getFullYear()}`
}
function formatDateChicago(date: Date) {
  return `${date.toLocaleDateString('en-US', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`
}
function formatDateIeee(date: Date) {
  return `${date.toLocaleDateString('en-US', { month: 'short' })}. ${date.getDate()}, ${date.getFullYear()}`
}

const citations = computed(() => {
  if (!post.value) return {}
  const title = post.value.title
  const pubDate = publishedDate.value
  const accDate = accessDate.value

  const pubYear = pubDate ? pubDate.getFullYear() : 'n.d.'

  return {
    apa: `${authorName} (${pubYear}). ${title}. Fajri Gariskode Blog. ${postUrl}`,
    mla: `${authorNameFull}. "${title}." *Fajri Gariskode Blog*, ${pubDate ? formatDateMla(pubDate) : 'n.d.'}. Web. ${formatDateMla(accDate)}. <${postUrl}>.`,
    chicago: `${authorNameFull}. "${title}." Fajri Gariskode Blog. ${pubDate ? formatDateChicago(pubDate) : 'n.d.'}. ${postUrl}.`,
    ieee: `${authorName}, "${title}," *Fajri Gariskode Blog*, ${pubDate ? formatDateIeee(pubDate) : 'n.d.'}. [Online]. Available: ${postUrl}. [Accessed: ${formatDateIeee(accDate)}].`,
    bibtex: `@misc{gariskode_${slug.replace(/-/g, '_')},
  author    = {${authorNameFull}},
  title     = {${title}},
  year      = {${pubYear}},
  url       = {${postUrl}},
  note      = {Accessed: ${accDate.toISOString().split('T')[0]}}
}`,
  }
})

async function copyCitation(format: string) {
  const text = citations.value[format as keyof typeof citations.value]
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copiedFormat.value = format
    setTimeout(() => { copiedFormat.value = '' }, 2000)
  } catch {
    // Fallback
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copiedFormat.value = format
    setTimeout(() => { copiedFormat.value = '' }, 2000)
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
          <span class="flex-1" />
          <button
            @click="downloadPdf"
            :disabled="isGeneratingPdf"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--accent)] transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            <Download class="w-4 h-4" :class="{ 'animate-bounce': isGeneratingPdf }" />
            {{ isGeneratingPdf ? 'Generating...' : 'PDF' }}
          </button>
          <button
            @click="showCitation = !showCitation"
            :class="['flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md transition-colors', showCitation ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-[var(--border)] hover:bg-[var(--accent)]']"
          >
            <Quote class="w-4 h-4" />
            Cite
          </button>
        </div>

        <!-- Cite This Page Panel -->
        <div v-if="showCitation" class="mb-8 border border-[var(--border)] rounded-lg overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 bg-[var(--muted)] border-b border-[var(--border)]">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <Quote class="w-4 h-4" /> Cite This Article
            </h3>
            <button @click="showCitation = false" class="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <ChevronUp class="w-4 h-4" />
            </button>
          </div>

          <!-- Citation format tabs -->
          <div class="flex border-b border-[var(--border)] bg-[var(--muted)]/50">
            <button
              v-for="tab in (['apa', 'mla', 'chicago', 'ieee', 'bibtex'] as const)"
              :key="tab"
              @click="activeCitationTab = tab"
              :class="['px-4 py-2 text-xs font-medium border-b-2 transition-colors', activeCitationTab === tab ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]']"
            >
              {{ tab.toUpperCase() }}
            </button>
          </div>

          <!-- Citation content -->
          <div class="p-4">
            <div class="relative">
              <pre class="text-sm leading-relaxed whitespace-pre-wrap break-words bg-[var(--muted)]/30 rounded-md p-3 pr-10 font-mono border border-[var(--border)]">{{ citations[activeCitationTab] }}</pre>
              <button
                @click="copyCitation(activeCitationTab)"
                class="absolute top-2 right-2 p-1.5 rounded-md hover:bg-[var(--accent)] transition-colors"
                :title="copiedFormat === activeCitationTab ? 'Copied!' : 'Copy'"
              >
                <Check v-if="copiedFormat === activeCitationTab" class="w-4 h-4 text-green-500" />
                <Copy v-else class="w-4 h-4 text-[var(--muted-foreground)]" />
              </button>
            </div>
          </div>
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
