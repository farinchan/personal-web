<script setup lang="ts">
import { FileText, Eye, Heart, MessageSquare, Mail, Share2, BarChart3, TrendingUp } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useSeoMeta({ title: 'Dashboard — Admin', robots: 'noindex, nofollow' })

const { data: posts } = await useFetch('/api/admin/posts')
const { data: messages } = await useFetch('/api/messages')
const { data: stats } = await useFetch('/api/admin/stats')

const summaryCards = computed(() => [
  { label: 'Total Posts', value: posts.value?.length || 0, icon: FileText, color: 'text-blue-600' },
  { label: 'Total Views', value: stats.value?.engagement.views || 0, icon: Eye, color: 'text-green-600' },
  { label: 'Total Likes', value: stats.value?.engagement.likes || 0, icon: Heart, color: 'text-red-500' },
  { label: 'Total Komentar', value: stats.value?.engagement.comments || 0, icon: MessageSquare, color: 'text-purple-600' },
  { label: 'Total Shares', value: stats.value?.engagement.shares || 0, icon: Share2, color: 'text-orange-500' },
  { label: 'Pesan Masuk', value: messages.value?.length || 0, icon: Mail, color: 'text-cyan-600' },
])

// Chart data
const topPostsChart = computed(() => {
  const data = stats.value?.topPosts || []
  return {
    labels: data.map((p: any) => p.title.length > 25 ? p.title.slice(0, 25) + '...' : p.title),
    datasets: [
      { label: 'Views', data: data.map((p: any) => p.viewCount), backgroundColor: '#3b82f6' },
      { label: 'Shares', data: data.map((p: any) => p.shareCount), backgroundColor: '#f59e0b' },
    ],
  }
})

function formatMonth(ym: string) {
  const [y, m] = ym.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
  return `${months[Number(m) - 1]} ${y}`
}

const activityChart = computed(() => {
  const postsData = stats.value?.postsPerMonth || []
  const commentsData = stats.value?.commentsPerMonth || []
  const msgsData = stats.value?.messagesPerMonth || []

  // Merge all months
  const allMonths = new Set<string>()
  postsData.forEach((d: any) => allMonths.add(d.month))
  commentsData.forEach((d: any) => allMonths.add(d.month))
  msgsData.forEach((d: any) => allMonths.add(d.month))

  const sortedMonths = [...allMonths].sort()
  const postsMap = Object.fromEntries(postsData.map((d: any) => [d.month, Number(d.count)]))
  const commentsMap = Object.fromEntries(commentsData.map((d: any) => [d.month, Number(d.count)]))
  const msgsMap = Object.fromEntries(msgsData.map((d: any) => [d.month, Number(d.count)]))

  return {
    labels: sortedMonths.map(formatMonth),
    datasets: [
      { label: 'Posts', data: sortedMonths.map(m => postsMap[m] || 0), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3 },
      { label: 'Komentar', data: sortedMonths.map(m => commentsMap[m] || 0), borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true, tension: 0.3 },
      { label: 'Pesan', data: sortedMonths.map(m => msgsMap[m] || 0), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.3 },
    ],
  }
})

const commentStatusChart = computed(() => {
  const data = stats.value?.commentStatus || []
  return {
    labels: data.map((d: any) => d.status === 'approved' ? 'Approved' : 'Pending'),
    data: data.map((d: any) => Number(d.count)),
    backgroundColor: ['#10b981', '#f59e0b'],
  }
})

const likesChart = computed(() => {
  const data = stats.value?.likesPerPost || []
  return {
    labels: data.map((d: any) => d.title.length > 25 ? d.title.slice(0, 25) + '...' : d.title),
    datasets: [
      { label: 'Likes', data: data.map((d: any) => Number(d.likes)), backgroundColor: '#ef4444' },
    ],
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-8">Dashboard</h1>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <UiCard v-for="card in summaryCards" :key="card.label" class="p-5">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs text-[var(--muted-foreground)]">{{ card.label }}</p>
          <component :is="card.icon" class="w-4 h-4" :class="card.color" />
        </div>
        <p class="text-2xl font-bold">{{ card.value.toLocaleString() }}</p>
      </UiCard>
    </div>

    <!-- Charts Row 1 -->
    <div class="grid lg:grid-cols-3 gap-6 mb-6">
      <!-- Activity over time -->
      <UiCard class="lg:col-span-2 p-6">
        <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp class="w-4 h-4" /> Aktivitas per Bulan
        </h3>
        <div class="h-72">
          <ClientOnly>
            <ChartsLineChart
              v-if="activityChart.labels.length > 0"
              :labels="activityChart.labels"
              :datasets="activityChart.datasets"
            />
            <p v-else class="text-sm text-[var(--muted-foreground)] text-center pt-24">Belum ada data</p>
          </ClientOnly>
        </div>
      </UiCard>

      <!-- Comment status -->
      <UiCard class="p-6">
        <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
          <MessageSquare class="w-4 h-4" /> Status Komentar
        </h3>
        <div class="h-72">
          <ClientOnly>
            <ChartsDoughnutChart
              v-if="commentStatusChart.data.length > 0"
              :labels="commentStatusChart.labels"
              :data="commentStatusChart.data"
              :background-color="commentStatusChart.backgroundColor"
            />
            <p v-else class="text-sm text-[var(--muted-foreground)] text-center pt-24">Belum ada komentar</p>
          </ClientOnly>
        </div>
      </UiCard>
    </div>

    <!-- Charts Row 2 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- Top posts by views -->
      <UiCard class="p-6">
        <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 class="w-4 h-4" /> Top Posts (Views & Shares)
        </h3>
        <div class="h-72">
          <ClientOnly>
            <ChartsBarChart
              v-if="topPostsChart.labels.length > 0"
              :labels="topPostsChart.labels"
              :datasets="topPostsChart.datasets"
              :horizontal="true"
            />
            <p v-else class="text-sm text-[var(--muted-foreground)] text-center pt-24">Belum ada post</p>
          </ClientOnly>
        </div>
      </UiCard>

      <!-- Top posts by likes -->
      <UiCard class="p-6">
        <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
          <Heart class="w-4 h-4" /> Top Posts (Likes)
        </h3>
        <div class="h-72">
          <ClientOnly>
            <ChartsBarChart
              v-if="likesChart.labels.length > 0"
              :labels="likesChart.labels"
              :datasets="likesChart.datasets"
              :horizontal="true"
            />
            <p v-else class="text-sm text-[var(--muted-foreground)] text-center pt-24">Belum ada likes</p>
          </ClientOnly>
        </div>
      </UiCard>
    </div>

    <!-- Recent messages -->
    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <Mail class="w-4 h-4" /> Pesan Terbaru
    </h2>
    <UiCard class="p-0">
      <div v-if="messages && messages.length > 0">
        <div
          v-for="msg in messages.slice(0, 5)"
          :key="msg.id"
          class="p-4 border-b last:border-b-0 flex items-start gap-4"
        >
          <div
            :class="['w-2 h-2 rounded-full mt-2 shrink-0', msg.status === 'unread' ? 'bg-blue-500' : 'bg-gray-300']"
          />
          <div class="min-w-0">
            <p class="font-semibold text-sm">{{ msg.name }} <span class="font-normal text-[var(--muted-foreground)]">({{ msg.email }})</span></p>
            <p class="text-sm font-medium">{{ msg.subject }}</p>
            <p class="text-sm text-[var(--muted-foreground)] truncate">{{ msg.body }}</p>
          </div>
          <span class="text-xs text-[var(--muted-foreground)] shrink-0">
            {{ new Date(msg.createdAt).toLocaleDateString('id-ID') }}
          </span>
        </div>
      </div>
      <div v-else class="p-8 text-center text-[var(--muted-foreground)]">
        Belum ada pesan
      </div>
    </UiCard>
  </div>
</template>
