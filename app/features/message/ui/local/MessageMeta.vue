<script setup lang="ts">
import { useMessage } from '../../composables/useMessage';
import type { ClientMessage } from '../../types/clientMessage';

const props = defineProps<{
  messageData: ClientMessage
  isSingle: boolean
  isOwn: boolean
}>()

const { cancelMessageUpload } = useMessage(props.messageData.chat_id)

const computedStyle = computed(() => `
	flex gap-0.5 sm:gap-1 items-center text-[11px] sm:text-xs mt-0.5 sm:mt-1 *:first:ml-auto ${props.messageData.media && !props.isSingle && 'mt-2 sm:mt-4' } ${props.isOwn ? 'text-inverted' : 'text-muted'} 
	${props.isSingle && 'bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 z-20 absolute w-fit h-fit p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-black/25 gap-1.5 sm:gap-2 backdrop-blur-xl text-white! color-white'}
`)

</script>

<template>
  	<div :class="computedStyle">
      <UIcon
        v-if="messageData.is_uploading"
        name="lucide:loader-2"
        class="animate-spin size-3 sm:size-3.5 shrink-0"
      />
      <UButton
        v-if="messageData.is_uploading"
        icon="lucide:x"
        size="xs"
        color="neutral"
        variant="ghost"
        class="text-current! hover:bg-muted/50 p-0.5"
        aria-label="Cancel upload"
        @click.stop="cancelMessageUpload(messageData.id!)"
      />
      <UIcon
        v-else-if="messageData.edited_at"
        name="lucide:pencil"
        class="size-3 sm:size-3.5 shrink-0"
      />
      <NuxtTime
        :datetime="messageData.sent_at"
        :hour12="false"
        hour="numeric"
        minute="numeric"
      />
      <UIcon
        v-if="isOwn && !messageData.is_uploading"
        :name="messageData.seen_at ? 'lucide:eye' : 'lucide:eye-off'"
        class="size-3 sm:size-3.5 shrink-0"
      />
    </div>
</template>
