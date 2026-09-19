<script setup lang="ts">
import { MessageBubble, MessageInfo, MessageForm, MessageSenderAvatar, useMessage, useMessageStore, useGroupRunAvatars, useMessageScroll } from '@features/message';
import { useChatStore } from '@features/chat';
import { useProfileStore } from '@features/profile';
import type { ChatId, Tables } from '@shared/types';
import { toRef } from 'vue';

const props = defineProps<{
	loading: boolean
	chatId: ChatId
	chatMembers: Tables<"chat_members">[]
}>()
const emit = defineEmits<{
	(e: 'chat-created', chat: Tables<"chats">): void
}>()

const { userProfile } = storeToRefs(useProfileStore())
const { getReplyingTo, getEditing } = useMessageStore()

const chatId = toRef(props, 'chatId')

const { chatMessages, loadMoreMessages, hasMore, loadingMore, markAsRead } = useMessage(chatId)
const supabaseUser = useSupabaseUser()
const chatStore = useChatStore()

const currentMemberMutedUntil = computed(() => {
	const uid = userProfile.value?.user_id
	if (!uid) return null
	return props.chatMembers.find(member => member.user_id === uid)?.muted_until ?? null
})

const currentUserId = computed(() => userProfile.value?.user_id || supabaseUser.value?.id)
const isGroupChat = computed(() =>
	chatStore.chats?.find(chat => chat.id === props.chatId)?.type === 'GROUP'
)

const assets = ref<File[]>([])

const messagesPadding = computed(() => {
	const hasAssets = assets.value.length > 0
	const isReplying = !!getReplyingTo(props.chatId)
	const isEditing = !!getEditing(props.chatId)

	if (hasAssets && (isReplying || isEditing)) return 'pb-66'
	if (hasAssets) return 'pb-48'
	if (isReplying || isEditing) return 'pb-36'
	return 'pb-17'
})

const messageListRef = useTemplateRef("messageList")
const messageFormRef = useTemplateRef("messageForm")
const isInitialLoad = ref(true)

const runAvatars = useGroupRunAvatars({
	chatMessages: () => chatMessages.value,
	isGroupChat: () => isGroupChat.value,
	currentUserId: () => currentUserId.value,
	scrollContainer: messageListRef,
	form: messageFormRef,
})

const { runs: avatarRuns, setElementRef: setAvatarElementRef, build: buildRuns, update: updateRuns } = runAvatars

const { unseenCount, isFetchingMore, transitionName, jumpBottomButtonStyle, checkNearBottom, scrollToBottom, handleScroll, handleGifLoaded } = useMessageScroll({
	scrollContainer: messageListRef,
	hasMore,
	loadingMore,
	loadMore: loadMoreMessages,
	onScrollUpdate: updateRuns,
})

watch(
	() => props.chatId,
	() => {
		isInitialLoad.value = true
		assets.value = []
	}
)

watch(
	[() => assets.value.length, () => !!getReplyingTo(props.chatId), () => !!getEditing(props.chatId)],
	async () => {
		await nextTick()
		scrollToBottom(true)
	}
)

watch(
	[
		() => props.loading, 
		() => chatMessages.value?.length
	],
	async ([isLoading, newLen], [wasLoading, oldLen]) => {
		if (isLoading || !newLen || loadingMore.value || isFetchingMore.value) return

		await nextTick()

		if (isInitialLoad.value || wasLoading) {
			scrollToBottom(false)
			isInitialLoad.value = false
			markUnreadMessagesRead()
			return
		}

		const el = messageListRef.value
		if (!el) return

		const nearBottom = checkNearBottom(350)

		if (nearBottom && (oldLen === undefined || newLen > oldLen) ) {
			scrollToBottom(true)
			markUnreadMessagesRead()
		} else if (oldLen !== undefined && newLen > oldLen && !nearBottom) {
			unseenCount.value += newLen - oldLen
		}
	},
	{ immediate: true }
)

async function markUnreadMessagesRead() {
	const uid = currentUserId.value
	const messages = chatMessages.value
	if (!uid || !messages?.length) return

	const unread = messages.filter(message => message.sender_id !== uid && !message.seen_at)
	await Promise.allSettled(unread.map(message => markAsRead(message.id)))
}

watch(
	[() => chatMessages.value?.length, currentUserId, () => props.loading, isGroupChat],
	async () => {
		if (props.loading) return
		await nextTick()
		buildRuns()
		updateRuns()
	}
)

watch(
	() => props.chatId,
	async () => {
		await nextTick()
		buildRuns()
		updateRuns()
	}
)

onMounted(async () => {
	await nextTick()
	if (!props.loading) {
		scrollToBottom(false)
	}
	buildRuns()
	updateRuns()
	window.addEventListener('resize', updateRuns)
})

onUnmounted(() => {
	window.removeEventListener('resize', updateRuns)
})

</script>

<template>
	<div class="relative w-full h-full min-h-0 overflow-hidden flex flex-col">
		<div v-if="loading" class="flex flex-col items-center justify-center gap-4 w-full h-full">
			<AppLoader />
			<p class="text-muted/50 text-sm">loading chat please wait...</p>
		</div>
		
		<template v-else>
			<div 
				v-if="loadingMore" 
				class="
					absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center p-2 rounded-full 
					bg-elevated/80 backdrop-blur-xl border border-accented/50 shadow-md pointer-events-none
				"
			>
				<UIcon name="lucide:loader-2" class="animate-spin text-muted" size="18" />
			</div>

			<div
				ref="messageList"
				:class="['relative flex-1 w-full overflow-y-scroll scrollbar-thin scrollbar-thumb-(--ui-text-dimmed)', messagesPadding]"
				@scroll="handleScroll"
			>
				<TransitionGroup
					:name="transitionName"
					tag="div"
					class="flex flex-col gap-4 w-full px-4"
				>
					<template v-for="(message, index) in chatMessages" :key="message.id">
						<MessageInfo
							v-if="message.type === 'INFO'"
							:message-data="message"
							class="first:mt-4"
						/>
						<MessageBubble
							v-else
							:message-data="message"
							:prev-message-data="chatMessages?.[index - 1]"
							class="first:mt-4"
							@gif-loaded="handleGifLoaded"
							@media-loaded="handleGifLoaded"
						/>
					</template>
				</TransitionGroup>

				<template v-for="run in avatarRuns" :key="run.firstId">
					<div
						v-show="run.visible"
						:ref="setAvatarElementRef(run.firstId)"
						class="absolute left-4 z-10 pointer-events-none"
						:style="{ top: `${run.top}px` }"
					>
						<div class="pointer-events-auto">
							<MessageSenderAvatar
								:sender-id="run.senderId"
								:user-id="currentUserId"
								:chat-id="props.chatId"
							/>
						</div>
					</div>
				</template>
			</div>

			<button
				:class="jumpBottomButtonStyle"
				type="button"
				@click="scrollToBottom(true)"
			>
				<UIcon name="lucide:arrow-down" size="16" />
				<span v-if="unseenCount > 1" class="text-sm font-medium">{{ unseenCount }}</span>
			</button>

			<MessageForm
				ref="messageForm"
				v-model:assets="assets"
				class="px-2 absolute w-full bottom-0"
				:chat-id
				:muted-until="currentMemberMutedUntil"
				@chat-created="emit('chat-created', $event)"
			/>
		</template>
	</div>	
</template>
