<script setup lang="ts">
import { cn } from '~/lib/utils'

defineProps<{
  class?: string
  placeholder?: string
  modelValue?: string
  rows?: number
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <textarea
    :class="cn('flex min-h-[60px] w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50', $props.class)"
    :placeholder="placeholder"
    :value="modelValue"
    :rows="rows ?? 4"
    :disabled="disabled"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
