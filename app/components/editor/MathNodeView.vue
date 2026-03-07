<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import katex from 'katex'

const props = defineProps(nodeViewProps)

const isEditing = ref(false)
const latexInput = ref(props.node.attrs.latex || '')
const inputEl = ref<HTMLTextAreaElement | null>(null)

const isBlock = computed(() => props.node.type.name === 'mathBlock')

const renderedMath = computed(() => {
  const latex = props.node.attrs.latex || ''
  if (!latex) return '<span class="text-muted-foreground italic">Click to add formula</span>'
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: isBlock.value,
    })
  } catch {
    return `<span class="text-red-500">Invalid formula: ${latex}</span>`
  }
})

function startEditing() {
  latexInput.value = props.node.attrs.latex || ''
  isEditing.value = true
  nextTick(() => {
    inputEl.value?.focus()
  })
}

function saveFormula() {
  props.updateAttributes({ latex: latexInput.value })
  isEditing.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    saveFormula()
  }
  if (e.key === 'Escape') {
    isEditing.value = false
  }
}

function deleteNode() {
  props.deleteNode()
}

onMounted(() => {
  if (!props.node.attrs.latex) {
    startEditing()
  }
})
</script>

<template>
  <NodeViewWrapper :as="isBlock ? 'div' : 'span'" :class="[
    'math-node',
    isBlock ? 'math-block' : 'math-inline',
    { 'is-selected': selected },
  ]">
    <!-- Display mode -->
    <span v-if="!isEditing" @click="startEditing" class="math-display cursor-pointer" :class="{ 'block text-center my-4': isBlock }" v-html="renderedMath" />

    <!-- Edit mode -->
    <span v-else class="math-editor" :class="{ 'block my-2': isBlock }">
      <textarea
        ref="inputEl"
        v-model="latexInput"
        @keydown="handleKeydown"
        @blur="saveFormula"
        :placeholder="isBlock ? 'Display formula, e.g: \\sum_{i=0}^n x_i' : 'Inline formula, e.g: x^2'"
        class="w-full px-3 py-2 font-mono text-sm bg-[var(--muted)] border border-[var(--input)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
        :rows="isBlock ? 3 : 1"
      />
      <span class="flex gap-1 mt-1">
        <button type="button" @click.prevent="saveFormula" class="text-xs px-2 py-0.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded">OK</button>
        <button type="button" @click.prevent="deleteNode" class="text-xs px-2 py-0.5 bg-red-500 text-white rounded">Hapus</button>
      </span>
    </span>
  </NodeViewWrapper>
</template>

<style scoped>
.math-node {
  position: relative;
}
.math-node.is-selected .math-display {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: 4px;
}
.math-inline {
  display: inline;
}
.math-block {
  display: block;
}
.math-editor {
  display: inline-block;
  min-width: 200px;
}
.math-block .math-editor {
  display: block;
  max-width: 600px;
  margin: 0 auto;
}
</style>
