<script setup lang="ts">
import { useProfileStore } from '@features/profile';
import { useChatStore } from '@features/chat';
import { useMessageStore } from '../../stores/messageStore';
import RepliedMessageContent from '../local/RepliedMessageContent.vue';
import { useMessage } from '../../composables/useMessage';
import { useIntersectionObserver } from '@vueuse/core';
import { useCachedData } from '@shared/composables';
import ForwardedFrom from '../local/ForwardedFrom.vue';
import MessageActionsPopover from '../local/MessageActionsPopover.vue';
import { useMessageApi } from '../../api/messageApi';
import MessageBubbleMedia from '../local/MessageBubbleMedia.vue';
import MessageSingleMedia from '../local/MessageSingleMedia.vue';
import type { ClientMessage } from '../../types/clientMessage';
import MessageMeta from '../local/MessageMeta.vue';
import MessageText from '../local/MessageText.vue';

const props = defineProps<{ 
	messageData: ClientMessage, 
	prevMessageData?: ClientMessage | null 
}>()

defineEmits(['gif-loaded', 'media-loaded'])

const { getMessage } = useMessageStore()
const { userProfile } = storeToRefs(useProfileStore())
const supabaseUser = useSupabaseUser()
const { markAsRead, getSenderProfile } = useMessage(props.messageData.chat_id)
const { fetchMessageById } = useMessageApi(props.messageData.chat_id)
const chatStore = useChatStore()

const targetRef = useTemplateRef<HTMLElement>("targetRef")

const currentUserId = computed(() => userProfile.value?.user_id || supabaseUser.value?.id)
const isOwn = computed(() => !!(currentUserId.value && props.messageData.sender_id === currentUserId.value))

const isGroupChat = computed(() => chatStore.chats?.find(chat => chat.id === props.messageData.chat_id)?.type === 'GROUP')
const isFirstFromSender = computed(() => !props.prevMessageData || props.prevMessageData.sender_id !== props.messageData.sender_id)
const showSenderName = computed(() => isGroupChat.value && !isOwn.value && isFirstFromSender.value)

const { data: senderProfile } = useCachedData(
	`message-sender-${props.messageData.sender_id}`,
	async () => {
		if (!showSenderName.value) return null
		if (props.messageData.sender_id === currentUserId.value) return userProfile.value

		try {
			return await getSenderProfile(props.messageData.sender_id)
		} catch {
			return null
		}
	},
	{ watch: [showSenderName, currentUserId] }
)

const senderName = computed(() => senderProfile.value?.nickname || senderProfile.value?.username || '')

const { data: repliedMessage } = useCachedData(
	`replied-message-${props.messageData.replying_to}`,
	async () => {
		if (!props.messageData.replying_to) 
			return null

		const fromStore = getMessage(props.messageData.chat_id, props.messageData.replying_to)

		if(!fromStore){
			const { data } = await fetchMessageById(props.messageData.replying_to!)
			if (data) return data
		}
		return fromStore
	}
)

const replySenderId = computed(() => repliedMessage.value?.sender_id)

const { data: interactingToProfile } = useCachedData(
	`interacting-to-sender-${replySenderId.value ?? props.messageData.forwarded_from}`,
	async () => {
		const targetId = replySenderId.value ?? props.messageData.forwarded_from
		if (!targetId) return null
		if (targetId === currentUserId.value) return userProfile.value
		return getSenderProfile(targetId)
	},
	{ watch: [replySenderId, currentUserId] }
)

const showSingleMedia = computed(() => {
	if (props.messageData.type === 'GIF' && props.messageData.content) {
		return true
	}

	const mediaUrls = props.messageData.media?.map(media => media.url)
	if (!mediaUrls?.length) {
		return false
	}

	const hasSingleImage = mediaUrls.length === 1
	const hasNoContent = !props.messageData.content || !props.messageData.content.trim()

	if (hasSingleImage && hasNoContent) {
		return true
	}

	return false
})

const groupMessageIndent = computed(() => isGroupChat.value && !isOwn.value ? 'ml-8.5 sm:ml-10' : '')

const computedStyle = computed(() => {
	const isSingle = showSingleMedia.value
	const isMine = isOwn.value

	return {
		base: `
			message-bubble relative w-fit h-fit max-w-[85%] sm:max-w-3/4 rounded-lg sm:rounded-xl ${isSingle ? 'bg-elevated!' : 'p-2.5 sm:p-3'} 
			${isMine ? 'bg-primary text-inverted self-end' : 'bg-elevated'}`
		,
		replying: `
			mx-2 sm:mx-4 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-md mb-1.5 sm:mb-2 opacity-70 relative before:absolute before:h-full before:w-1.5 before:bg-elevated 
			before:rounded-full before:top-0 ${isMine ? 'before:-right-3 sm:before:-right-4' : 'before:-left-3 sm:before:-left-4'}
		`,
	}
})

onMounted(() => {
	if (!isOwn.value && !props.messageData.seen_at) {
		const { stop } = useIntersectionObserver(
			targetRef,
			([entry]) => {
				if (entry?.isIntersecting && !props.messageData.seen_at) {
					markAsRead(props.messageData.id)
					stop()
				}
			}
		)
	}
})

</script>

<template>
	<div
		:id="`message-${messageData.id}`"
		:data-own="isOwn"
		class="group flex flex-col"
	>
		<ClientOnly>
			<template #fallback>
				<USkeleton
					class="w-2/5 h-20 rounded-xl"
					:class="isOwn && 'ml-auto'"
				/>
			</template>

			<RepliedMessageContent
				v-if="messageData.replying_to && repliedMessage && !messageData.forwarded_from && interactingToProfile"
				:is-own
				:replier-profile="interactingToProfile"
				:message-data="repliedMessage"
				:class="groupMessageIndent"
			/>

			<div class="flex items-end gap-1.5 sm:gap-2" :class="groupMessageIndent">
				<div class="flex flex-col flex-1 min-w-0">
					<span
						v-if="showSenderName && senderName"
						class="text-[11px] sm:text-xs font-medium text-dimmed mb-0.5 sm:mb-1 truncate max-w-full"
					>
						{{ senderName }}
					</span>

					<MessageActionsPopover :message-data :is-own>
					<div
						ref="targetRef"
						:data-own="isOwn"
						:class="[computedStyle.base, 'min-w-18 sm:min-w-25 relative']"
					>
						<UIcon
							v-if="messageData.pinned_at"
							:class="[
								'absolute text-dimmed size-3.5 sm:size-4', 
								isOwn ? '-left-5 sm:-left-6 top-3 sm:top-6' : '-right-5 sm:-right-6 top-3 sm:top-6'
							]"
							name="lucide:pin"
						/>

						<ForwardedFrom
							v-if="messageData.forwarded_from && interactingToProfile"
							:forwarder-profile="interactingToProfile"
						/>

						<MessageSingleMedia
							v-if="showSingleMedia"
							:message-data="messageData"
							@media-loaded="$emit('media-loaded')"
						/>

						<template v-else>
							<MessageText
								v-if="messageData.content"
								:text="messageData.content"
								:class="messageData.media?.length ? 'mb-2 sm:mb-4' : ''"
							/>

							<MessageBubbleMedia
								v-if="messageData.media && messageData.media.length"
								:message-data="messageData"
								:is-own
								@media-loaded="$emit('media-loaded')"
							/>
						</template>

						<MessageMeta
							:message-data
							:is-own
							:is-single="showSingleMedia"
						/>

					</div>
				</MessageActionsPopover>
				</div>
			</div>
		</ClientOnly>
	</div>
</template>

<style scoped>
.message-bubble-enter-active,
.message-bubble-leave-active {
	transition:
		opacity 0.22s ease,
		transform 0.22s ease;
}

.message-bubble-enter-from,
.message-bubble-leave-to {
	opacity: 0;
}

.message-bubble-enter-from[data-own="true"],
.message-bubble-leave-to[data-own="true"] {
	transform: translate3d(0.75rem, 0.35rem, 0) scale(0.98);
}

.message-bubble-enter-from[data-own="false"],
.message-bubble-leave-to[data-own="false"] {
	transform: translate3d(-0.75rem, 0.35rem, 0) scale(0.98);
}

.message-bubble-move {
	transition: transform 0.22s ease;
}

</style>
