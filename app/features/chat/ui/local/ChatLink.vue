<script setup lang="ts">
import type { Tables, UserId } from '@shared/types';
import { ROUTE_TOKENS } from '@shared/configs';
import { useTyping, useMessageStore } from '@features/message';
import { PresenceAvatar, userPresenceLabel, useUserPresence } from '@features/user';
import { useProfile, useProfileStore } from '@features/profile';
import { useChat } from '../../composables/useChat';
import { useChatMemberStore } from '../../stores/memberStore';
import ChatAvatar from '../public/ChatAvatar.vue';

const props = defineProps<{ chat: Tables<"chats"> }>()

const { typingLabel } = useTyping(props.chat.id)
const { userProfile } = storeToRefs(useProfileStore())
const { findUserProfile } = useProfile()
const { getChatMembers } = useChat()
const messageStore = useMessageStore()
const memberStore = useChatMemberStore()
const { loadPresenceRows } = useUserPresence()

const currentUserId = computed(() => userProfile.value?.user_id)

const isDirect = computed(() => props.chat.type === 'DIRECT')
const chatRouteId = computed(() => isDirect.value ? (props.chat.direct_id ?? props.chat.id) : props.chat.id)

const otherIdFromMembers = computed(() => {
	const list = memberStore.members.get(props.chat.id)
	if (!list?.length) return undefined

	const activeUserId = currentUserId.value
	if (!activeUserId) return undefined

	return list.find(member => member.user_id !== activeUserId)?.user_id
})

const otherIdFromName = computed(() => {
	if (!isDirect.value) return undefined

	const activeUserId = currentUserId.value
	if (!activeUserId || !props.chat.name) return undefined

	const ids = props.chat.name.split('__')
	if (ids.length !== 2) return undefined

	return ids[0] === activeUserId ? ids[1] : ids[0]
})

const resolvedOtherId = ref<UserId | undefined>()

const otherMemberId = computed(() => resolvedOtherId.value ?? otherIdFromMembers.value ?? otherIdFromName.value)

const { data: otherProfile } = useLazyAsyncData(
	`chat-link-other-${props.chat.id}`,
	async () => {
		if (!isDirect.value || !currentUserId.value) return null

		const activeUserId = currentUserId.value

		let otherId = otherMemberId.value
		if (!otherId) {
			try {
				const members = await getChatMembers(props.chat.id)
				otherId = members.find(m => m.user_id !== activeUserId)?.user_id
			} catch {
				return null
			}
		}
		if (!otherId) return null

		resolvedOtherId.value ??= otherId

		loadPresenceRows([otherId])

		try {
			return await findUserProfile(otherId)
		} catch {
			return null
		}
	},
	{ server: false, watch: [otherMemberId, currentUserId] }
)

const displayName = computed(() => {
	if (isDirect.value && otherProfile.value?.nickname) return otherProfile.value.nickname
	return props.chat.name
})

const displaySrc = computed(() => (isDirect.value ? otherProfile.value?.avatar_url ?? '' : props.chat.avatar_url ?? ''))

const displayInitial = computed(() => (otherProfile.value?.nickname?.trim().charAt(0) ?? '').toUpperCase())

const lastMessage = computed(() => {
	const chatMessages = messageStore.messages.get(props.chat.id)
	return chatMessages?.length ? chatMessages[chatMessages.length - 1] ?? null : null
})

const unreadCount = computed(() => {
	const uid = currentUserId.value
	const chatMessages = messageStore.messages.get(props.chat.id)
	if (!uid || !chatMessages?.length) return 0

	return chatMessages.reduce((count, message) => {
		if (message.sender_id !== uid && !message.seen_at) count++
		return count
	}, 0)
})

const hasUnread = computed(() => unreadCount.value > 0)

const lastMessagePreview = computed(() => {
	const message = lastMessage.value
	if (!message) return ''

	if (message.media?.length) {
		const isVideo = message.media.some(m => m.type.startsWith('video'))
		return isVideo ? 'video' : 'photo'
	}

	const content = message.content?.trim()
	if (!content) return 'media'

	const lines = content.split('\n').filter(Boolean)
	return lines[lines.length - 1] ?? content
})

</script>

<template>
	<LinkButton 
		:to="ROUTE_TOKENS.CHAT(chatRouteId)"
		active-variant="soft"
		active-color="neutral"
		class="p-2 flex gap-2 items-center transition hover:bg-elevated/50 cursor-pointer rounded-lg"
	>
		<PresenceAvatar
			v-if="isDirect"
			:user-id="otherMemberId"
		>
			<UAvatar
				:src="displaySrc"
				:alt="otherProfile?.nickname"
				:text="displayInitial"
				color="neutral"
				size="sm"
				class="not-sm:size-10"
			/>
		</PresenceAvatar>
		<ChatAvatar
			v-else
			:src="chat.avatar_url ?? ''"
			:chat-type="chat.type"
			size="sm"
			class="not-sm:size-10 sm:size-7"
		/>
		<div class="flex flex-col min-w-0 flex-1">
			<div class="flex items-center gap-2 min-w-0">
				<span class="not-sm:text-lg truncate">{{ displayName }}</span>
				<userPresenceLabel
					v-if="!typingLabel && otherMemberId && isDirect"
					:user-id="otherMemberId"
				/>
				<span
					v-if="hasUnread"
					class="ml-auto shrink-0 min-w-4.5 h-4.5 px-1 rounded-full bg-primary text-inverted text-[10px] font-semibold flex items-center justify-center"
				>
					{{ unreadCount > 9 ? '9+' : unreadCount }}
				</span>
			</div>
			<div class="flex items-center gap-2 min-w-0">
				<span v-if="typingLabel" class="truncate text-dimmed text-sm not-sm:text-[13px]">{{ typingLabel }}</span>
				<template v-else-if="lastMessage">
					<span
						class="truncate text-sm not-sm:text-[13px]"
						:class="hasUnread ? 'text-default font-medium' : 'text-dimmed'"
					>{{ lastMessagePreview }}</span>
					<NuxtTime 
						:datetime="lastMessage?.sent_at"
						:hour12="false"
						time-style="short"
						class="ml-auto shrink-0 text-[11px] not-sm:text-xs"
						:class="hasUnread ? 'text-default font-medium' : 'text-dimmed'"
					/>
				</template>
			</div>
		</div>
	</LinkButton>
</template>
