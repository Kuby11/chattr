<script setup lang="ts">
import { useProfileStore } from '@features/profile';
import { useCachedData } from '@shared/composables';
import type { ChatId } from '@shared/types';
import { useMessageStore } from '../../stores/messageStore';
import MessageFormPreview from './MessageFormPreview.vue';
import { useMessage } from '../../composables/useMessage';

const props = defineProps<{ chatId: ChatId }>()

const messageStore = useMessageStore()
const { getSenderProfile } = useMessage(props.chatId)
const { userProfile } = storeToRefs(useProfileStore())

const replyingTo = computed(() => messageStore.getReplyingTo(props.chatId))

const replySenderId = computed(() => replyingTo.value?.sender_id)

const { data: replySender } = useCachedData(
	`interacting-sender-${replyingTo.value?.id}`,
	async () => {
		if (!replySenderId.value) return null
		if (replySenderId.value === userProfile.value?.user_id) return null
		return getSenderProfile(replySenderId.value)
	},
	{ 
		watch: [replySenderId],
	}
)

const replyingToUsername = computed(() => {
	if (!replyingTo.value) 
		return
	if (replySenderId.value === userProfile.value?.user_id) 
		return 'me'
	
	return replySender.value?.username ?? '...'
})

</script>

<template>
	<MessageFormPreview
		:condition="!!replyingTo"
		:title="`replying to ${replyingToUsername}`"
		icon="lucide:reply"
		@click="messageStore.resetReply(chatId)"
	>
		<img 
			v-if="replyingTo?.type === 'GIF'" 
			class="max-h-10 overflow-hidden" 
			:src="replyingTo!.content"
		>
		<span v-else class="text-ellipsis whitespace-nowrap max-w-[calc(100%-3rem)] overflow-hidden">
			{{ replyingTo?.content }}
		</span>
	</MessageFormPreview>
</template>

<style scoped>

.replying-enter-active,
.replying-leave-active {
  transition: all 0.2s ease;
}
.replying-enter-from,
.replying-leave-to {
  opacity: 0;
  transform: translate3d(0, 0.35rem, 0);
}

</style>
