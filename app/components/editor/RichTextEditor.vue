<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { ResizableImage } from './ResizableImage'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Youtube from '@tiptap/extension-youtube'
import Typography from '@tiptap/extension-typography'
import CharacterCount from '@tiptap/extension-character-count'
import { MathInline, MathBlock } from './MathExtension'
import { common, createLowlight } from 'lowlight'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, ListChecks,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Quote, Code, CodeXml, Minus,
  Link as LinkIcon, Unlink, ImagePlus, Globe, Youtube as YoutubeIcon,
  Undo2, Redo2,
  Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
  Highlighter, Palette, RemoveFormatting,
  Table as TableIcon, TableCellsMerge, Rows3, Columns3,
  Plus, Trash2, ArrowDownFromLine, ArrowUpFromLine,
  ArrowRightFromLine, ArrowLeftFromLine,
  Sigma, Pi,
  WrapText, Eraser,
} from 'lucide-vue-next'

const lowlight = createLowlight(common)

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Text color state
const showColorPicker = ref(false)
const currentColor = ref('#000000')

// Table menu
const showTableMenu = ref(false)

const colors = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e',
  '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488',
  '#2563eb', '#4f46e5', '#9333ea', '#db2777', '#e11d48',
  '#991b1b', '#9a3412', '#854d0e', '#166534', '#115e59',
  '#1e40af', '#3730a3', '#6b21a8', '#9d174d', '#9f1239',
]

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      codeBlock: false,
    }),
    ResizableImage.configure({
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
    Subscript,
    Superscript,
    Highlight.configure({
      multicolor: true,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    TextStyle,
    Color,
    Youtube.configure({
      inline: false,
      ccLanguage: 'id',
    }),
    Typography,
    CharacterCount,
    MathInline,
    MathBlock,
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

// Character/word count
const characterCount = computed(() => editor.value?.storage.characterCount?.characters() ?? 0)
const wordCount = computed(() => editor.value?.storage.characterCount?.words() ?? 0)

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
  if (editor.value?.isActive('link')) {
    editor.value?.chain().focus().unsetLink().run()
    return
  }
  const url = prompt('Masukkan URL:')
  if (url) {
    editor.value?.chain().focus().setLink({ href: url }).run()
  }
}

function addYoutube() {
  const url = prompt('Masukkan URL YouTube:')
  if (url) {
    editor.value?.commands.setYoutubeVideo({ src: url })
  }
}

function setColor(color: string) {
  editor.value?.chain().focus().setColor(color).run()
  currentColor.value = color
  showColorPicker.value = false
}

function unsetColor() {
  editor.value?.chain().focus().unsetColor().run()
  showColorPicker.value = false
}

function toggleHighlight() {
  editor.value?.chain().focus().toggleHighlight({ color: '#fef08a' }).run()
}

function clearFormatting() {
  editor.value?.chain().focus().clearNodes().unsetAllMarks().run()
}

function insertTable() {
  editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  showTableMenu.value = false
}

function insertMathInline() {
  editor.value?.commands.insertMath('')
}

function insertMathBlock() {
  editor.value?.commands.insertMathBlock('')
}

// Close dropdowns on click outside
function closeDropdowns(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.color-picker-wrapper')) showColorPicker.value = false
  if (!target.closest('.table-menu-wrapper')) showTableMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', closeDropdowns)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdowns)
  editor.value?.destroy()
})
</script>

<template>
  <div class="border border-[var(--input)] rounded-md overflow-hidden">
    <!-- Toolbar -->
    <div v-if="editor" class="flex flex-wrap gap-0.5 p-2 border-b border-[var(--input)] bg-[var(--muted)]">
      <!-- Row 1: Text formatting -->
      <button type="button" @click="editor.chain().focus().toggleBold().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('bold') }]" title="Bold (Ctrl+B)">
        <Bold class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleItalic().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('italic') }]" title="Italic (Ctrl+I)">
        <Italic class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleUnderline().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('underline') }]" title="Underline (Ctrl+U)">
        <UnderlineIcon class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleStrike().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('strike') }]" title="Strikethrough">
        <Strikethrough class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleSubscript().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('subscript') }]" title="Subscript">
        <SubscriptIcon class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleSuperscript().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('superscript') }]" title="Superscript">
        <SuperscriptIcon class="w-4 h-4" />
      </button>

      <span class="toolbar-divider" />

      <!-- Text Color -->
      <div class="relative color-picker-wrapper">
        <button type="button" @click.stop="showColorPicker = !showColorPicker"
          class="toolbar-btn" title="Text Color">
          <Palette class="w-4 h-4" />
          <span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-0.5 rounded-full" :style="{ background: currentColor }" />
        </button>
        <div v-if="showColorPicker" class="absolute top-full left-0 z-50 mt-1 p-2 bg-[var(--popover)] border border-[var(--border)] rounded-lg shadow-lg w-44">
          <div class="grid grid-cols-5 gap-1 mb-2">
            <button v-for="c in colors" :key="c" type="button"
              @click="setColor(c)"
              class="w-6 h-6 rounded border border-[var(--border)] hover:scale-110 transition-transform"
              :style="{ background: c }"
              :title="c" />
          </div>
          <button type="button" @click="unsetColor" class="w-full text-xs text-center py-1 hover:bg-[var(--accent)] rounded flex items-center justify-center gap-1">
            <Eraser class="w-3 h-3" /> Reset warna
          </button>
        </div>
      </div>

      <!-- Highlight -->
      <button type="button" @click="toggleHighlight"
        :class="['toolbar-btn', { 'is-active': editor.isActive('highlight') }]" title="Highlight">
        <Highlighter class="w-4 h-4" />
      </button>

      <!-- Clear formatting -->
      <button type="button" @click="clearFormatting"
        class="toolbar-btn" title="Clear Formatting">
        <RemoveFormatting class="w-4 h-4" />
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
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 4 }).run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('heading', { level: 4 }) }]" title="Heading 4">
        <Heading4 class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 5 }).run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('heading', { level: 5 }) }]" title="Heading 5">
        <Heading5 class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 6 }).run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('heading', { level: 6 }) }]" title="Heading 6">
        <Heading6 class="w-4 h-4" />
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
      <button type="button" @click="editor.chain().focus().toggleTaskList().run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive('taskList') }]" title="Checklist">
        <ListChecks class="w-4 h-4" />
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
      <button type="button" @click="editor.chain().focus().setTextAlign('justify').run()"
        :class="['toolbar-btn', { 'is-active': editor.isActive({ textAlign: 'justify' }) }]" title="Justify">
        <AlignJustify class="w-4 h-4" />
      </button>

      <span class="toolbar-divider" />

      <!-- Block elements -->
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
      <button type="button" @click="editor.chain().focus().setHardBreak().run()"
        class="toolbar-btn" title="Line Break (Shift+Enter)">
        <WrapText class="w-4 h-4" />
      </button>

      <span class="toolbar-divider" />

      <!-- Table -->
      <div class="relative table-menu-wrapper">
        <button type="button" @click.stop="showTableMenu = !showTableMenu"
          :class="['toolbar-btn', { 'is-active': editor.isActive('table') }]" title="Table">
          <TableIcon class="w-4 h-4" />
        </button>
        <div v-if="showTableMenu" class="absolute top-full left-0 z-50 mt-1 p-1 bg-[var(--popover)] border border-[var(--border)] rounded-lg shadow-lg min-w-[180px]">
          <button type="button" @click="insertTable" class="table-menu-item">
            <Plus class="w-3.5 h-3.5" /> Insert Table (3×3)
          </button>
          <template v-if="editor.isActive('table')">
            <hr class="my-1 border-[var(--border)]" />
            <button type="button" @click="editor.chain().focus().addColumnBefore().run(); showTableMenu = false" class="table-menu-item">
              <ArrowLeftFromLine class="w-3.5 h-3.5" /> Add Column Before
            </button>
            <button type="button" @click="editor.chain().focus().addColumnAfter().run(); showTableMenu = false" class="table-menu-item">
              <ArrowRightFromLine class="w-3.5 h-3.5" /> Add Column After
            </button>
            <button type="button" @click="editor.chain().focus().deleteColumn().run(); showTableMenu = false" class="table-menu-item text-red-500">
              <Columns3 class="w-3.5 h-3.5" /> Delete Column
            </button>
            <hr class="my-1 border-[var(--border)]" />
            <button type="button" @click="editor.chain().focus().addRowBefore().run(); showTableMenu = false" class="table-menu-item">
              <ArrowUpFromLine class="w-3.5 h-3.5" /> Add Row Before
            </button>
            <button type="button" @click="editor.chain().focus().addRowAfter().run(); showTableMenu = false" class="table-menu-item">
              <ArrowDownFromLine class="w-3.5 h-3.5" /> Add Row After
            </button>
            <button type="button" @click="editor.chain().focus().deleteRow().run(); showTableMenu = false" class="table-menu-item text-red-500">
              <Rows3 class="w-3.5 h-3.5" /> Delete Row
            </button>
            <hr class="my-1 border-[var(--border)]" />
            <button type="button" @click="editor.chain().focus().mergeCells().run(); showTableMenu = false" class="table-menu-item">
              <TableCellsMerge class="w-3.5 h-3.5" /> Merge Cells
            </button>
            <button type="button" @click="editor.chain().focus().splitCell().run(); showTableMenu = false" class="table-menu-item">
              <TableCellsMerge class="w-3.5 h-3.5" /> Split Cell
            </button>
            <hr class="my-1 border-[var(--border)]" />
            <button type="button" @click="editor.chain().focus().deleteTable().run(); showTableMenu = false" class="table-menu-item text-red-500">
              <Trash2 class="w-3.5 h-3.5" /> Delete Table
            </button>
          </template>
        </div>
      </div>

      <span class="toolbar-divider" />

      <!-- Math formulas -->
      <button type="button" @click="insertMathInline"
        class="toolbar-btn" title="Inline Math Formula (LaTeX)">
        <Sigma class="w-4 h-4" />
      </button>
      <button type="button" @click="insertMathBlock"
        class="toolbar-btn" title="Block Math Formula (LaTeX)">
        <Pi class="w-4 h-4" />
      </button>

      <span class="toolbar-divider" />

      <!-- Media & Link -->
      <button type="button" @click="setLink"
        :class="['toolbar-btn', { 'is-active': editor.isActive('link') }]" title="Insert/Remove Link">
        <LinkIcon class="w-4 h-4" />
      </button>
      <button v-if="editor.isActive('link')" type="button" @click="editor.chain().focus().unsetLink().run()"
        class="toolbar-btn" title="Remove Link">
        <Unlink class="w-4 h-4" />
      </button>
      <button type="button" @click="addImage" class="toolbar-btn" title="Upload Image">
        <ImagePlus class="w-4 h-4" />
      </button>
      <button type="button" @click="addImageUrl" class="toolbar-btn" title="Image from URL">
        <Globe class="w-4 h-4" />
      </button>
      <button type="button" @click="addYoutube" class="toolbar-btn" title="YouTube Video">
        <YoutubeIcon class="w-4 h-4" />
      </button>

      <span class="toolbar-divider" />

      <!-- Undo/Redo -->
      <button type="button" @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().undo()" class="toolbar-btn" title="Undo (Ctrl+Z)">
        <Undo2 class="w-4 h-4" />
      </button>
      <button type="button" @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().redo()" class="toolbar-btn" title="Redo (Ctrl+Shift+Z)">
        <Redo2 class="w-4 h-4" />
      </button>
    </div>

    <!-- Editor -->
    <EditorContent :editor="editor" class="tiptap-editor" />

    <!-- Status bar -->
    <div v-if="editor" class="flex items-center justify-end gap-4 px-3 py-1.5 border-t border-[var(--input)] bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
      <span>{{ wordCount }} kata</span>
      <span>{{ characterCount }} karakter</span>
    </div>
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
  position: relative;
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
.table-menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.35rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  background: transparent;
  border: none;
  color: var(--foreground);
  text-align: left;
  white-space: nowrap;
}
.table-menu-item:hover {
  background: var(--accent);
}
</style>

<style>
/* ===== Tiptap Editor Content Styles ===== */
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

/* Headings */
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
.tiptap-editor .tiptap h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0.75rem 0 0.4rem;
  line-height: 1.4;
}
.tiptap-editor .tiptap h5 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.75rem 0 0.4rem;
  line-height: 1.5;
}
.tiptap-editor .tiptap h6 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0.5rem 0 0.3rem;
  line-height: 1.5;
  color: var(--muted-foreground);
}

/* Paragraphs */
.tiptap-editor .tiptap p {
  margin: 0.5rem 0;
}

/* Lists */
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

/* Task Lists */
.tiptap-editor .tiptap ul[data-type="taskList"] {
  list-style-type: none;
  padding-left: 0;
}
.tiptap-editor .tiptap ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0.25rem 0;
}
.tiptap-editor .tiptap ul[data-type="taskList"] li > label {
  flex-shrink: 0;
  margin-top: 0.25rem;
}
.tiptap-editor .tiptap ul[data-type="taskList"] li > label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary);
  cursor: pointer;
}
.tiptap-editor .tiptap ul[data-type="taskList"] li > div {
  flex: 1;
}
.tiptap-editor .tiptap ul[data-type="taskList"] li[data-checked="true"] > div {
  text-decoration: line-through;
  color: var(--muted-foreground);
}

/* Blockquote */
.tiptap-editor .tiptap blockquote {
  border-left: 3px solid var(--border);
  padding-left: 1rem;
  margin: 0.75rem 0;
  color: var(--muted-foreground);
}

/* Code */
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

/* Images */
.tiptap-editor .tiptap img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 0.75rem 0;
}

/* Links */
.tiptap-editor .tiptap a {
  color: #3b82f6;
  text-decoration: underline;
}

/* Horizontal Rule */
.tiptap-editor .tiptap hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 1.5rem 0;
}

/* Subscript & Superscript */
.tiptap-editor .tiptap sub {
  font-size: 0.75em;
}
.tiptap-editor .tiptap sup {
  font-size: 0.75em;
}

/* Highlight */
.tiptap-editor .tiptap mark {
  border-radius: 0.15rem;
  padding: 0.05rem 0.15rem;
}

/* Table */
.tiptap-editor .tiptap table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.75rem 0;
  table-layout: auto;
  overflow: hidden;
}
.tiptap-editor .tiptap table td,
.tiptap-editor .tiptap table th {
  border: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
  min-width: 80px;
  vertical-align: top;
  position: relative;
}
.tiptap-editor .tiptap table th {
  background: var(--muted);
  font-weight: 600;
  text-align: left;
}
.tiptap-editor .tiptap table .selectedCell::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(59, 130, 246, 0.15);
  pointer-events: none;
}
.tiptap-editor .tiptap table .column-resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #3b82f6;
  cursor: col-resize;
  z-index: 10;
}

/* YouTube embed */
.tiptap-editor .tiptap div[data-youtube-video] {
  margin: 0.75rem 0;
}
.tiptap-editor .tiptap div[data-youtube-video] iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 0.5rem;
  border: none;
}

/* Math nodes */
.tiptap-editor .tiptap .math-node {
  display: inline;
}
.tiptap-editor .tiptap .math-node.math-block {
  display: block;
  margin: 1rem 0;
}
</style>
