<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Title, Tooltip, Legend)

defineProps<{
  labels: string[]
  data: number[]
  backgroundColor?: string[]
  title?: string
}>()
</script>

<template>
  <Doughnut
    :data="{
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColor || ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'],
        borderWidth: 2,
        borderColor: 'var(--background)',
      }],
    }"
    :options="{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' as const },
        title: { display: !!title, text: title, font: { size: 14 } },
      },
    }"
    class="w-full"
  />
</template>
