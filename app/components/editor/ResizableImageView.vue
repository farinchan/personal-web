<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps(nodeViewProps)

const imgRef = ref<HTMLImageElement | null>(null)
const resizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

const width = computed(() => {
  const w = props.node.attrs.width
  return w ? (typeof w === 'number' ? `${w}px` : w) : undefined
})

const alignment = computed(() => {
  const a = props.node.attrs.textAlign || props.node.attrs.align
  if (a === 'center') return 'center'
  if (a === 'right') return 'right'
  return 'left'
})

const wrapperStyle = computed(() => {
  const styles: Record<string, string> = {}
  if (alignment.value === 'center') styles.textAlign = 'center'
  else if (alignment.value === 'right') styles.textAlign = 'right'
  return styles
})

const imgStyle = computed(() => {
  const styles: Record<string, string> = {}
  if (width.value) styles.width = width.value
  styles.maxWidth = '100%'
  styles.height = 'auto'
  return styles
})

function onMouseDown(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  resizing.value = true
  startX.value = e.clientX
  startWidth.value = imgRef.value?.offsetWidth || 300
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (!resizing.value) return
  const diff = e.clientX - startX.value
  const newWidth = Math.max(100, startWidth.value + diff)
  props.updateAttributes({ width: newWidth })
}

function onMouseUp() {
  resizing.value = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

// Touch support
function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  e.preventDefault()
  e.stopPropagation()
  resizing.value = true
  startX.value = e.touches[0]!.clientX
  startWidth.value = imgRef.value?.offsetWidth || 300
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onTouchEnd)
}

function onTouchMove(e: TouchEvent) {
  if (!resizing.value || e.touches.length !== 1) return
  e.preventDefault()
  const diff = e.touches[0]!.clientX - startX.value
  const newWidth = Math.max(100, startWidth.value + diff)
  props.updateAttributes({ width: newWidth })
}

function onTouchEnd() {
  resizing.value = false
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
})
</script>

<template>
  <NodeViewWrapper as="div" class="resizable-image-wrapper" :style="wrapperStyle"
    :class="{ 'is-selected': selected }">
    <div class="resizable-image-container" :class="{ 'is-resizing': resizing }">
      <img
        ref="imgRef"
        :src="node.attrs.src"
        :alt="node.attrs.alt || ''"
        :title="node.attrs.title || ''"
        :style="imgStyle"
        class="resizable-image"
        draggable="false"
      />
      <!-- Resize handle - right edge -->
      <div
        v-if="selected"
        class="resize-handle resize-handle-right"
        @mousedown="onMouseDown"
        @touchstart="onTouchStart"
      >
        <div class="resize-handle-bar" />
      </div>
      <!-- Width indicator -->
      <div v-if="resizing" class="resize-indicator">
        {{ Math.round(imgRef?.offsetWidth || 0) }}px
      </div>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.resizable-image-wrapper {
  margin: 0.75rem 0;
  line-height: 0;
}

.resizable-image-container {
  display: inline-block;
  position: relative;
  line-height: 0;
}

.resizable-image {
  border-radius: 0.5rem;
  display: block;
  cursor: default;
}

.is-selected .resizable-image {
  outline: 2px solid var(--primary, #3b82f6);
  outline-offset: 2px;
}

.resize-handle {
  position: absolute;
  z-index: 10;
}

.resize-handle-right {
  right: -6px;
  top: 0;
  bottom: 0;
  width: 12px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-handle-bar {
  width: 4px;
  height: 40px;
  max-height: 50%;
  min-height: 20px;
  background: var(--primary, #3b82f6);
  border-radius: 4px;
  opacity: 0.8;
  transition: opacity 0.15s, transform 0.15s;
}

.resize-handle:hover .resize-handle-bar {
  opacity: 1;
  transform: scaleY(1.2);
}

.is-resizing {
  user-select: none;
}

.is-resizing .resize-handle-bar {
  opacity: 1;
  background: var(--primary, #3b82f6);
}

.resize-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  pointer-events: none;
  line-height: 1.4;
  font-family: monospace;
}
</style>
