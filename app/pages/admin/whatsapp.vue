<script setup lang="ts">
import { Send, Search, ArrowLeft, Check, CheckCheck, MessageCircle, Users, User as UserIcon } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useSeoMeta({ title: 'WhatsApp — Admin', robots: 'noindex, nofollow' })

const route = useRoute()
const sessionId = computed(() => route.query.session as string || '')

// Sessions
const { data: sessionsData } = await useFetch('/api/admin/whatsapp/sessions')
const sessions = computed(() => {
  const raw = sessionsData.value as any
  return raw?.data || []
})

// Chat list state
const chats = ref<any[]>([])
const chatsLoading = ref(false)
const chatSearch = ref('')
const activeChatId = ref('')

// Messages state
const messages = ref<any[]>([])
const messagesLoading = ref(false)
const messageInput = ref('')
const sendingMessage = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

// Active chat info
const activeChat = computed(() => chats.value.find((c: any) => c.id === activeChatId.value))

// Filtered chats
const filteredChats = computed(() => {
  if (!chatSearch.value) return chats.value
  const q = chatSearch.value.toLowerCase()
  return chats.value.filter((c: any) =>
    (c.name || c.id || '').toLowerCase().includes(q),
  )
})

// Active session info
const activeSession = computed(() => sessions.value.find((s: any) => s.sessionId === sessionId.value))

// Load chats when session changes
watch(sessionId, async (val) => {
  if (!val) {
    chats.value = []
    return
  }
  await loadChats()
}, { immediate: true })

async function loadChats() {
  if (!sessionId.value) return
  chatsLoading.value = true
  try {
    const data = await $fetch('/api/admin/whatsapp/chats', {
      method: 'POST',
      body: { sessionId: sessionId.value, limit: 100, type: 'all' },
    }) as any
    chats.value = data?.data?.chats || []
  } catch {
    chats.value = []
  } finally {
    chatsLoading.value = false
  }
}

async function openChat(chatId: string) {
  activeChatId.value = chatId
  messagesLoading.value = true
  messages.value = []
  try {
    const data = await $fetch('/api/admin/whatsapp/messages', {
      method: 'POST',
      body: { sessionId: sessionId.value, chatId, limit: 50 },
    }) as any
    messages.value = (data?.data?.messages || []).reverse()
    await nextTick()
    scrollToBottom()
    // Mark as read
    await $fetch('/api/admin/whatsapp/mark-read', {
      method: 'POST',
      body: { sessionId: sessionId.value, chatId },
    }).catch(() => {})
  } catch {
    messages.value = []
  } finally {
    messagesLoading.value = false
  }
}

async function sendMessage() {
  if (!messageInput.value.trim() || !activeChatId.value || sendingMessage.value) return
  sendingMessage.value = true
  const text = messageInput.value
  messageInput.value = ''
  try {
    await $fetch('/api/admin/whatsapp/send', {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        chatId: activeChatId.value,
        message: text,
      },
    })
    // Optimistic add
    messages.value.push({
      id: Date.now().toString(),
      fromMe: true,
      content: text,
      timestamp: Math.floor(Date.now() / 1000),
      type: 'text',
    })
    await nextTick()
    scrollToBottom()
  } catch (err: any) {
    messageInput.value = text
    alert(err.data?.statusMessage || 'Gagal mengirim pesan')
  } finally {
    sendingMessage.value = false
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function formatTime(ts: number) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatChatTime(ts: number) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const oneDay = 86400000
  if (diff < oneDay && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < oneDay * 2) return 'Kemarin'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function chatName(chat: any) {
  return chat?.name || chat?.phone || chat?.id?.split('@')[0] || 'Unknown'
}

function isGroup(chatId: string) {
  return chatId?.endsWith('@g.us')
}

function getInitials(name: string) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function msgPreview(chat: any) {
  // lastMessage is a plain string preview from the API
  return chat.lastMessage || ''
}

function msgText(msg: any) {
  if (msg.type === 'text') return typeof msg.content === 'string' ? msg.content : ''
  if (msg.caption) return msg.caption
  if (typeof msg.content === 'string') return msg.content
  return ''
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-4rem)]">
    <!-- No session selected -->
    <div v-if="!sessionId" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <MessageCircle class="w-16 h-16 mx-auto text-[var(--muted-foreground)] mb-4" />
        <h2 class="text-xl font-semibold mb-2">Pilih Session WhatsApp</h2>
        <p class="text-[var(--muted-foreground)] mb-4">Pilih session dari sidebar untuk mulai</p>
        <div v-if="sessions.length === 0" class="text-sm text-[var(--muted-foreground)]">
          Belum ada session aktif di Chatery
        </div>
      </div>
    </div>

    <!-- WhatsApp Web layout -->
    <div v-else class="flex-1 flex overflow-hidden border rounded-lg">
      <!-- Left: Chat List -->
      <div
        class="w-[360px] border-r flex flex-col bg-[var(--card)] shrink-0"
        :class="{ 'hidden md:flex': activeChatId }"
      >
        <!-- Header -->
        <div class="px-4 py-3 border-b flex items-center justify-between bg-[var(--card)]">
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              :class="activeSession?.isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
            >
              {{ activeSession?.isConnected ? '●' : '○' }}
            </div>
            <div>
              <p class="text-sm font-semibold">{{ activeSession?.name || sessionId }}</p>
              <p class="text-xs text-[var(--muted-foreground)]">
                {{ activeSession?.phoneNumber || (activeSession?.isConnected ? 'Connected' : 'Disconnected') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Search -->
        <div class="px-3 py-2 border-b">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              v-model="chatSearch"
              placeholder="Cari chat..."
              class="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[var(--accent)] border-0 outline-none placeholder:text-[var(--muted-foreground)]"
            />
          </div>
        </div>

        <!-- Chat list -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="chatsLoading" class="flex items-center justify-center py-12">
            <div class="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
          <div v-else-if="filteredChats.length === 0" class="text-center text-[var(--muted-foreground)] py-12 text-sm">
            {{ chatSearch ? 'Tidak ditemukan' : 'Belum ada chat' }}
          </div>
          <button
            v-for="chat in filteredChats"
            :key="chat.id"
            @click="openChat(chat.id)"
            class="w-full flex items-center gap-3 px-3 py-3 hover:bg-[var(--accent)] transition-colors text-left border-b border-[var(--border)]/50"
            :class="{ 'bg-[var(--accent)]': activeChatId === chat.id }"
          >
            <!-- Avatar -->
            <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
              :class="isGroup(chat.id) ? 'bg-emerald-500' : 'bg-sky-500'"
            >
              <component :is="isGroup(chat.id) ? Users : UserIcon" class="w-5 h-5" v-if="!chat.profilePicture" />
              <img v-else :src="chat.profilePicture" class="w-12 h-12 rounded-full object-cover" />
            </div>
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium truncate">{{ chatName(chat) }}</p>
                <span class="text-xs text-[var(--muted-foreground)] shrink-0 ml-2">
                  {{ formatChatTime(chat.lastMessageTimestamp) }}
                </span>
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <p class="text-xs text-[var(--muted-foreground)] truncate">
                  {{ msgPreview(chat) }}
                </p>
                <span
                  v-if="chat.unreadCount > 0"
                  class="ml-2 bg-emerald-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center font-medium shrink-0"
                >
                  {{ chat.unreadCount }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Right: Message Area -->
      <div
        class="flex-1 flex flex-col bg-[#efeae2]"
        :class="{ 'hidden md:flex': !activeChatId }"
      >
        <!-- No chat selected -->
        <div v-if="!activeChatId" class="flex-1 flex items-center justify-center bg-[var(--card)]">
          <div class="text-center">
            <MessageCircle class="w-16 h-16 mx-auto text-[var(--muted-foreground)] mb-4 opacity-50" />
            <p class="text-lg text-[var(--muted-foreground)]">Pilih chat untuk mulai percakapan</p>
          </div>
        </div>

        <template v-else>
          <!-- Chat header -->
          <div class="px-4 py-3 border-b flex items-center gap-3 bg-[var(--card)]">
            <button @click="activeChatId = ''" class="md:hidden shrink-0">
              <ArrowLeft class="w-5 h-5" />
            </button>
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              :class="isGroup(activeChatId) ? 'bg-emerald-500' : 'bg-sky-500'"
            >
              <component :is="isGroup(activeChatId) ? Users : UserIcon" class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold truncate">{{ chatName(activeChat) }}</p>
              <p class="text-xs text-[var(--muted-foreground)] truncate">{{ activeChatId }}</p>
            </div>
          </div>

          <!-- Messages -->
          <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto px-4 md:px-16 py-4 space-y-1"
            style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;200&quot; height=&quot;200&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cdefs%3E%3Cpattern id=&quot;p&quot; width=&quot;40&quot; height=&quot;40&quot; patternUnits=&quot;userSpaceOnUse&quot;%3E%3Cpath d=&quot;M20 0L40 20L20 40L0 20Z&quot; fill=&quot;none&quot; stroke=&quot;%23d4cfc4&quot; stroke-width=&quot;0.5&quot; opacity=&quot;0.3&quot;/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=&quot;200&quot; height=&quot;200&quot; fill=&quot;%23efeae2&quot;/%3E%3Crect width=&quot;200&quot; height=&quot;200&quot; fill=&quot;url(%23p)&quot;/%3E%3C/svg%3E');"
          >
            <div v-if="messagesLoading" class="flex items-center justify-center py-12">
              <div class="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
            <template v-else>
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="flex"
                :class="msg.fromMe ? 'justify-end' : 'justify-start'"
              >
                <div
                  class="max-w-[65%] px-3 py-1.5 rounded-lg shadow-sm text-sm relative mb-0.5"
                  :class="msg.fromMe
                    ? 'bg-[#d9fdd3] rounded-tr-none'
                    : 'bg-white rounded-tl-none'"
                >
                  <!-- Sender name for groups -->
                  <p
                    v-if="!msg.fromMe && isGroup(activeChatId) && msg.senderName"
                    class="text-xs font-semibold mb-0.5"
                    :style="{ color: stringToColor(msg.senderName || msg.senderPhone || '') }"
                  >
                    {{ msg.senderName || msg.senderPhone }}
                  </p>

                  <!-- Image message -->
                  <div v-if="msg.type === 'image' && msg.mediaUrl">
                    <img :src="msg.mediaUrl" class="rounded max-w-full max-h-64 mb-1" />
                    <p v-if="msg.caption" class="text-sm">{{ msg.caption }}</p>
                  </div>

                  <!-- Document -->
                  <div v-else-if="msg.type === 'document'" class="flex items-center gap-2 py-1">
                    <span class="text-2xl">📄</span>
                    <span class="text-sm truncate">{{ msg.filename || 'Document' }}</span>
                  </div>

                  <!-- Sticker -->
                  <div v-else-if="msg.type === 'sticker' && msg.mediaUrl">
                    <img :src="msg.mediaUrl" class="w-32 h-32 object-contain" />
                  </div>

                  <!-- Location -->
                  <div v-else-if="msg.type === 'location'" class="text-sm">
                    📍 {{ msg.content?.name || 'Location' }}
                  </div>

                  <!-- Poll -->
                  <div v-else-if="msg.type === 'poll'" class="text-sm">
                    📊 {{ msg.content?.question || 'Poll' }}
                  </div>

                  <!-- Default: text -->
                  <p v-else class="whitespace-pre-wrap break-words">{{ msgText(msg) }}</p>

                  <!-- Time & status -->
                  <div class="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
                    <span class="text-[10px] text-gray-500">{{ formatTime(msg.timestamp) }}</span>
                    <CheckCheck v-if="msg.fromMe" class="w-3.5 h-3.5 text-sky-500" />
                  </div>
                </div>
              </div>
              <div v-if="messages.length === 0 && !messagesLoading" class="text-center text-gray-500 py-12 text-sm">
                Belum ada pesan
              </div>
            </template>
          </div>

          <!-- Input -->
          <div class="px-4 py-3 border-t flex items-center gap-3 bg-[var(--card)]">
            <input
              v-model="messageInput"
              @keydown.enter.prevent="sendMessage"
              placeholder="Ketik pesan..."
              class="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent)] border-0 outline-none text-sm placeholder:text-[var(--muted-foreground)]"
              :disabled="sendingMessage"
            />
            <button
              @click="sendMessage"
              :disabled="!messageInput.trim() || sendingMessage"
              class="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Send class="w-5 h-5 text-white" />
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Deterministic color for group member names
function stringToColor(str: string): string {
  const colors = [
    '#e17076', '#7bc862', '#e5c317', '#00bcd4',
    '#9c27b0', '#e91e63', '#ff9800', '#795548',
    '#607d8b', '#673ab7', '#2196f3', '#4caf50',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]!
}
</script>
