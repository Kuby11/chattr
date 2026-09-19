<script setup lang="ts">
import { ForwardMessageModal } from '@features/message';
import { useBreakpoint } from '@shared/composables';
import { useChatStore, usePrefetchChats } from '@features/chat';
import ChatLink from '../local/ChatLink.vue';

const ChatCreateForm = defineLazyHydrationComponent(
  'idle',
  () => import('../local/ChatCreateForm.vue')
)

const chatStore = useChatStore()
const { prefetchChats } = usePrefetchChats()

onMounted(() => {
		void chatStore.loadChats()
})

watch(
  () => chatStore.chats,
  (chats) => {
    if (chats) prefetchChats(chats)
  },
  { immediate: true }
)

const route = useRoute()
const isChatOpen = computed(() => route.path.startsWith('/chat/'))

const { sm: isMobile } = useBreakpoint()

</script>

<template>
  <div class="w-full h-full border-default border-r flex min-h-0">
    <div
      class="flex flex-col gap-1 w-[clamp(14rem,22vw,24rem)] border-r border-default p-2 min-h-0 overflow-y-auto"
      :class="isChatOpen ? 'not-lg:hidden' : 'not-lg:w-full'"
    >
      <UModal
        :ui="{ content: 'p-4! min-w-200 not-lg:min-w-0', title: 'text-xl' }"
        :dismissible="false"
        :fullscreen="isMobile"
        title="create new chat"
      >
        <UButton
          class="mt-2"
          label="create chat"
          variant="soft"
          color="neutral"
          icon="lucide:users-round"
          size="lg"
        />

        <template #body>
          <ChatCreateForm hydrate-on-idle/>
        </template>
      </UModal>

      <span class="p-2 my-2 text-dimmed border-b border-default">your chats</span>

      <ChatLink
        v-for="chat in chatStore.chats"
        :key="chat.id"
        :chat
      />
    </div>

    <div
      class="flex-1 min-w-0 min-h-0 h-full"
      :class="isChatOpen ? 'not-md:w-full' : 'not-md:hidden'"
    >
      <slot />
    </div>

    <ForwardMessageModal />

  </div>
</template>
