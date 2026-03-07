<script setup lang="ts">
import { Heart, Share2 } from 'lucide-vue-next'

const props = defineProps<{
  slug: string
  shareCount: number
}>()

const { data: likeData, refresh: refreshLikes } = await useFetch(`/api/posts/${props.slug}/likes`)

const isLiking = ref(false)

async function toggleLike() {
  if (isLiking.value) return
  isLiking.value = true
  try {
    await $fetch(`/api/posts/${props.slug}/like`, { method: 'POST' })
    await refreshLikes()
  } finally {
    isLiking.value = false
  }
}

async function handleShare() {
  const url = window.location.href
  const title = document.title

  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      await $fetch(`/api/posts/${props.slug}/share`, { method: 'POST' })
    } catch {}
  } else {
    await navigator.clipboard.writeText(url)
    await $fetch(`/api/posts/${props.slug}/share`, { method: 'POST' })
    alert('Link berhasil disalin!')
  }
}
</script>

<template>
  <div class="flex items-center gap-6 py-6 border-y my-8">
    <!-- Like -->
    <button
      @click="toggleLike"
      :disabled="isLiking"
      class="flex items-center gap-2 text-sm hover:text-red-500 transition-colors"
      :class="{ 'text-red-500': likeData?.isLiked }"
    >
      <Heart class="w-5 h-5" :class="{ 'fill-current': likeData?.isLiked }" />
      <span>{{ likeData?.total || 0 }} suka</span>
    </button>

    <!-- Share -->
    <button
      @click="handleShare"
      class="flex items-center gap-2 text-sm hover:text-blue-500 transition-colors"
    >
      <Share2 class="w-5 h-5" />
      <span>{{ shareCount }} share</span>
    </button>
  </div>
</template>
