<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

defineProps<{
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
  title?: string
  horizontal?: boolean
}>()
</script>

<template>
  <Bar
    :data="{ labels, datasets }"
    :options="{
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? 'y' as const : 'x' as const,
      plugins: {
        legend: { display: datasets.length > 1 },
        title: { display: !!title, text: title, font: { size: 14 } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
        x: { ticks: { precision: 0 } },
      },
    }"
    class="w-full"
  />
</template>
