<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

defineProps<{
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
    tension?: number
  }[]
  title?: string
}>()
</script>

<template>
  <Line
    :data="{ labels, datasets }"
    :options="{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: datasets.length > 1 },
        title: { display: !!title, text: title, font: { size: 14 } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    }"
    class="w-full"
  />
</template>
