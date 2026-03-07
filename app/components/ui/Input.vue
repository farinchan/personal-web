<script setup lang="ts">
import { cn } from '~/lib/utils'

defineProps<{
  class?: string
  type?: string
  placeholder?: string
  modelValue?: string | number
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :class="cn('flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50', $props.class)"
    :type="type"
    :placeholder="placeholder"
    :value="modelValue"
    :disabled="disabled"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
