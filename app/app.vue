<script setup lang="ts">
const requestUrl = useRequestURL()
const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`

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
