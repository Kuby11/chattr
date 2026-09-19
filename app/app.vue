<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'chattr'

useSeoMeta({
  title,
})
</script>

<template>
  <UApp class="h-full min-h-dvh" :tooltip="{ delayDuration: 100 }">
    <div class="bg-default min-h-dvh h-full flex flex-col" data-vaul-drawer-wrapper>
      <NuxtAnnouncer />
      <NuxtRouteAnnouncer />
      <NuxtLayout>
        <NuxtLoadingIndicator :color="'primary'"/>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </UApp>
</template>
