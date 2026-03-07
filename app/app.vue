<script setup lang="ts">
const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl as string

defineOgImage()

useSchemaOrg([
  defineWebSite({
    name: 'Fajri Gariskode',
    url: siteUrl,
    description: 'Blog dokumentasi pembelajaran, profile, dan CV. Tempat mencatat perjalanan belajar dan berbagi pengetahuan.',
    inLanguage: 'id-ID',
  }),
  defineWebPage(),
])
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
