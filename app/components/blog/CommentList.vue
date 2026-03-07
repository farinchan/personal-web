<script setup lang="ts">
const props = defineProps<{ slug: string }>()

const { data: comments } = await useFetch(`/api/posts/${props.slug}/comments`)
</script>

<template>
  <div>
    <div v-if="comments && comments.length > 0" class="space-y-6">
      <div v-for="comment in comments" :key="comment.id" class="border-b pb-4">
        <!-- Parent comment -->
        <div class="flex items-center gap-2 mb-2">
          <span class="font-semibold text-sm">{{ comment.name }}</span>
          <UiBadge v-if="comment.isAdmin" variant="default" class="text-xs">Admin</UiBadge>
          <span class="text-xs text-[var(--muted-foreground)]">
            {{ new Date(comment.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) }}
          </span>
        </div>
        <p class="text-sm">{{ comment.body }}</p>

        <!-- Replies -->
        <div v-if="comment.replies && comment.replies.length > 0" class="ml-6 mt-4 space-y-4">
          <div v-for="reply in comment.replies" :key="reply.id" class="border-l-2 border-[var(--border)] pl-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-semibold text-sm">{{ reply.name }}</span>
              <UiBadge v-if="reply.isAdmin" variant="default" class="text-xs">Admin</UiBadge>
              <span class="text-xs text-[var(--muted-foreground)]">
                {{ new Date(reply.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) }}
              </span>
            </div>
            <p class="text-sm">{{ reply.body }}</p>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-[var(--muted-foreground)] text-sm py-4">
      Belum ada komentar. Jadilah yang pertama!
    </div>
  </div>
</template>
