<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Quote, Code, CodeXml, Minus,
  Link as LinkIcon, ImagePlus, Globe,
  Undo2, Redo2,
} from 'lucide-vue-next'

const lowlight = createLowlight(common)

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      codeBlock: false,
    }),
    Image.configure({
      inline: false,
      allowBase64: true,
    }),
    Link.configure({
      openOnClick: false,
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Placeholder.configure({
      placeholder: props.placeholder || 'Tulis konten...',
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
  ],
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val)
  }
})

function addImage() {
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.onchange = async () => {
    const file = fileInput.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await $fetch<{ url: string }>('/api/upload', {
        method: 'POST',
        body: formData,
      })
      editor.value?.chain().focus().setImage({ src: result.url }).run()
    } catch {
      // Fallback: use base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const src = e.target?.result as string
        editor.value?.chain().focus().setImage({ src }).run()
      }
      reader.readAsDataURL(file)
    }
  }
  fileInput.click()
}

function addImageUrl() {
  const url = prompt('Masukkan URL gambar:')
  if (url) {
    editor.value?.chain().focus().setImage({ src: url }).run()
  }
}

function setLink() {
  const url = prompt('Masukkan URL:')
  if (url) {
    editor.value?.chain().focus().setLink({ href: url }).run()
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="border border-[var(--input)] rounded-md overflow-hidden">
    <!-- Toolbar -->
    <div v-if="editor" class="flex flex-wrap gap-0.5 p-2 border-b border-[var(--input)] bg-[var(--muted)]">
      <!-- Text formatting -->
      <button type="button" @click="editor.chain().focus().toggleBold().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('bold') }]" title="Bold">
        <Bold class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleItalic().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('italic') }]" title="Italic">
        <Italic class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleUnderline().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('underline') }]" title="Underline">
        <UnderlineIcon class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleStrike().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('strike') }]" title="Strikethrough">
        <Strikethrough class="w-4 h-4" />
      </button>

      <span class="toolbar-divider" />

      <!-- Headings -->
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('heading', { level: 1 }) }]" title="Heading 1">
        <Heading1 class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('heading', { level: 2 }) }]" title="Heading 2">
        <Heading2 class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('heading', { level: 3 }) }]" title="Heading 3">
        <Heading3 class="w-4 h-4" />
      </button>

      <span class="toolbar-divider" />

      <!-- Lists -->
      <button type="button" @click="editor.chain().focus().toggleBulletList().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('bulletList') }]" title="Bullet List">
        <List class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleOrderedList().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('orderedList') }]" title="Numbered List">
        <ListOrdered class="w-4 h-4" />
      </button>

      <span class="toolbar-divider" />

      <!-- Text Align -->
      <button type="button" @click="editor.chain().focus().setTextAlign('left').run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive({ textAlign: 'left' }) }]" title="Align Left">
        <AlignLeft class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().setTextAlign('center').run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive({ textAlign: 'center' }) }]" title="Align Center">
        <AlignCenter class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().setTextAlign('right').run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive({ textAlign: 'right' }) }]" title="Align Right">
        <AlignRight class="w-4 h-4" />
      </button>

      <span class="toolbar-divider" />

      <!-- Block -->
      <button type="button" @click="editor.chain().focus().toggleBlockquote().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('blockquote') }]" title="Blockquote">
        <Quote class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleCodeBlock().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('codeBlock') }]" title="Code Block">
        <CodeXml class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleCode().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('code') }]" title="Inline Code">
        <Code class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().setHorizontalRule().run()"
        class="toolbar-btn" title="Horizontal Rule">
        <Minus class="w-4 h-4" />
      </button>

      <span class="toolbar-divider" />

      <!-- Media & Link -->
      <button type="button" @click="setLink"
        :class="['toolbar-btn', { 'is-active': editor.isActive('link') }]" title="Insert Link">
        <LinkIcon class="w-4 h-4" />
      </button>
      <button type="button" @click="addImage" class="toolbar-btn" title="Upload Image">
        <ImagePlus class="w-4 h-4" />
      </button>
      <button type="button" @click="addImageUrl" class="toolbar-btn" title="Image from URL">
        <Globe class="w-4 h-4" />
      </button>

      <span class="toolbar-divider" />

      <!-- Undo/Redo -->
      <button type="button" @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().undo()" class="toolbar-btn" title="Undo">
        <Undo2 class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().redo()" class="toolbar-btn" title="Redo">
        <Redo2 class="w-4 h-4" />
      </button>
    </div>

    <!-- Editor -->
    <EditorContent :editor="editor" class="tiptap-editor" />
  </div>
</template>

<style scoped>
.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  cursor: pointer;
  background: transparent;
  border: none;
  color: var(--foreground);
  transition: background 0.15s;
}
.toolbar-btn:hover {
  background: var(--accent);
}
.toolbar-btn.is-active {
  background: var(--primary);
  color: var(--primary-foreground);
}
.toolbar-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.toolbar-divider {
  width: 1px;
  height: 1.5rem;
  background: var(--border);
  margin: 0.25rem 0.25rem;
  align-self: center;
}
</style>

<style>
.tiptap-editor .tiptap {
  padding: 1rem;
  min-height: 400px;
  outline: none;
  font-size: 0.95rem;
  line-height: 1.7;
}

.tiptap-editor .tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--muted-foreground);
  pointer-events: none;
  height: 0;
}

.tiptap-editor .tiptap h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 1.5rem 0 0.75rem;
  line-height: 1.2;
}
.tiptap-editor .tiptap h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
  line-height: 1.3;
}
.tiptap-editor .tiptap h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
  line-height: 1.4;
}
.tiptap-editor .tiptap p {
  margin: 0.5rem 0;
}
.tiptap-editor .tiptap ul,
.tiptap-editor .tiptap ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}
.tiptap-editor .tiptap ul {
  list-style-type: disc;
}
.tiptap-editor .tiptap ol {
  list-style-type: decimal;
}
.tiptap-editor .tiptap blockquote {
  border-left: 3px solid var(--border);
  padding-left: 1rem;
  margin: 0.75rem 0;
  color: var(--muted-foreground);
}
.tiptap-editor .tiptap code {
  background: var(--muted);
  border-radius: 0.25rem;
  padding: 0.15rem 0.35rem;
  font-size: 0.875em;
  font-family: monospace;
}
.tiptap-editor .tiptap pre {
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.75rem 0;
  font-family: monospace;
  font-size: 0.875rem;
}
.tiptap-editor .tiptap pre code {
  background: none;
  padding: 0;
  border-radius: 0;
  color: inherit;
}
.tiptap-editor .tiptap img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 0.75rem 0;
}
.tiptap-editor .tiptap a {
  color: #3b82f6;
  text-decoration: underline;
}
.tiptap-editor .tiptap hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 1.5rem 0;
}
</style>
