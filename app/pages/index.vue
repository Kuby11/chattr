<script setup lang="ts">
import { ChatPage } from '@features/chat';
import { useCurrentRoute } from '@shared/composables';

definePageMeta({
  middleware: ["auth"],
  layout: "main"
})

const { setCurrentRoute } = useCurrentRoute()
setCurrentRoute({
	route: 'home',
	icon: 'fluent:chat-24-filled'
})

</script>

<template>
  <ChatPage>
    <UPageSection class="not-sm:hidden w-full h-full flex items-center justify-center">
      <p class="text-center md:text-2xl text-lg font-medium text-dimmed">choose a chat to start communicating!</p>
    </UPageSection>
  </ChatPage>
</template>
