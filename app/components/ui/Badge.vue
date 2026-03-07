<script setup lang="ts">
import { cn } from '~/lib/utils'

defineProps<{
  class?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}>()

const variantClasses: Record<string, string> = {
  default: 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow',
  secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
  destructive: 'bg-red-600 text-white shadow',
  outline: 'border text-[var(--foreground)]',
}
</script>

<template>
  <span
    :class="cn('inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors', variantClasses[variant ?? 'default'], $props.class)"
  >
    <slot />
  </span>
</template>
