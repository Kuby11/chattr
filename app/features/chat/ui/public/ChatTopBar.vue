<script setup lang="ts">
import type { ChatId, Tables } from '@shared/types';
import { ROUTE_TOKENS } from '@shared/configs';
import { useBreakpoint, useCachedData } from '@shared/composables';
import { PresenceAvatar, userPresenceLabel } from '@features/user';
import { SendFriendRequestButton } from '@features/friendship';
import { TypingIndicator, useTyping, PinnedMessages, SearchMessagesModal } from '@features/message';
import { useProfile, useProfileStore } from '@features/profile';
import ChatAvatar from './ChatAvatar.vue';
import EditGroupChatModal from '../local/EditGroupChatModal.vue';
import ManageMembers from '../local/ManageMembers.vue';
import DeleteChatButton from '../local/DeleteChatButton.vue';
import LeaveChatButton from '../local/LeaveChatButton.vue';
import ChatRightWidget from './ChatRightWidget.vue';
import { useChat } from '../../composables/useChat';
import { isDirectId } from '../../utils/directId';

const props = defineProps<{
	chatData?: Tables<"chats"> | null
	chatMembers?: Tables<"chat_members">[]
	loading: boolean
	chatId: ChatId
}>()

const emit = defineEmits<{
	(e: 'chat-updated', chat: Tables<"chats">): void
	(e: 'member-updated', member: Tables<"chat_members">): void
}>()

const { typingLabel } = useTyping(props.chatId)
const { findUserProfile } = useProfile()
const { getChatMembers } = useChat()
const { userProfile } = storeToRefs(useProfileStore())
const supabaseUser = useSupabaseUser()
const { xl, md } = useBreakpoint()

const isSearchOpen = ref(false)
const isInfoOpen = ref(false)
const searchInitialQuery = ref('')

const isCompactLayout = xl
const isTabletLayout = xl && !md

const currentUserId = computed(() => userProfile.value?.user_id || supabaseUser.value?.id)

const fallbackMembers = ref<Tables<"chat_members">[]>([])
const fallbackLoadedFor = ref<ChatId | null>(null)

const activeMembers = computed(() => {
	return props.chatMembers?.length ? props.chatMembers : fallbackMembers.value
})

const currentMember = computed(() => {
	const activeUserId = currentUserId.value
	if (!activeUserId) return undefined
	return activeMembers.value.find(member => member.user_id === activeUserId)
})

const canManageGroup = computed(() => {
	if (props.chatData?.type !== 'GROUP') return false
	return currentMember.value?.role === 'OWNER' || currentMember.value?.role === 'ADMIN'
})

const isEditModalOpen = ref(false)
const isManageMembersOpen = ref(false)

function onChatUpdated(updatedChat: Tables<"chats">) {
	emit('chat-updated', updatedChat)
}

function onMemberUpdated(updatedMember: Tables<"chat_members">) {
	emit('member-updated', updatedMember)

	const member = fallbackMembers.value.find(m => m.id === updatedMember.id)
	if (member) {
		Object.assign(member, updatedMember)
	}
}

const otherMemberId = computed(() => {
	if (!props.chatData || props.chatData.type !== 'DIRECT')
		return

	const activeUserId = currentUserId.value
	if (!activeUserId) 
		return 

	const fromMembers = activeMembers.value.find(member => member.user_id !== activeUserId)?.user_id
	if (fromMembers) 
		return fromMembers

	if (props.chatData.direct_id) {
		const ids = props.chatData.direct_id?.split("__")
		if (ids?.length === 2) {
			return ids[0] === activeUserId ? ids[1] : ids[0]
		}
	}

	return
})

const { data: otherMemberProfile } = useCachedData(
	`other-member-${props.chatData?.id ?? 'none'}`,
	async () => {
		if (props.chatData?.type !== 'DIRECT' || !otherMemberId.value) 
			return null

		return await findUserProfile(otherMemberId.value)
	},
	{
		watch: [otherMemberId, () => props.chatData?.id],
	}
)

const displayName = computed(() => {
	if (!props.chatData) return ''
	if (props.chatData.type === 'DIRECT') {
		if (otherMemberProfile.value) {
			return otherMemberProfile.value.nickname  || 'User'
		}
		if (props.chatData.direct_id?.includes("__")) {
			return 'Chat'
		}
	}
	return props.chatData.name
})

const displayAvatar = computed(() => {
	if (!props.chatData) return ''
	if (props.chatData.type === 'DIRECT' && otherMemberProfile.value) {
		return otherMemberProfile.value.avatar_url ?? ''
	}
	return props.chatData.avatar_url ?? ''
})

const chatInfoDrawerUi = {
	content: 'h-[85dvh]'
}

function openChatInfo() {
	if (isCompactLayout) isInfoOpen.value = true
}

function onSearchInputKeydown(event: KeyboardEvent) {
	const value = (event.target as HTMLInputElement).value.trim()
	if (event.key === 'Enter' && value) {
		event.preventDefault()
		searchInitialQuery.value = value

		nextTick(() => {
			isSearchOpen.value = true
		})
	}
}

watch(
	() => [props.chatId, props.chatMembers] as const,
	async ([id, members]) => {
		if (id !== fallbackLoadedFor.value) {
			fallbackMembers.value = []
			fallbackLoadedFor.value = null
		}

		if ((!members || !(members as Tables<"chat_members">[]).length) && id) {
			try {
				fallbackMembers.value = await getChatMembers(id as ChatId)
				fallbackLoadedFor.value = id
			} catch (err) {
				console.warn('Failed to load fallback chat members:', err)
			}
		}
	},
	{ immediate: true }
)
</script>

<template>
	<div class="max-h-20 bg-muted/25 border-b border-default">
		<div v-if="chatData" class="px-2 py-2.5 h-full flex items-center gap-2">
			<UButton
				class="hidden not-lg:flex"
				icon="lucide:arrow-left"
				variant="ghost"
				color="neutral"
				aria-label="back to chats"
				:to="ROUTE_TOKENS.HOME"
			/>

			<button
				type="button"
				class="flex items-center xs:justify-start justify-center gap-2 flex-1 min-w-0 h-full rounded-lg px-2 -mx-2 not-sm:mr-1 transition-colors not-xl:hover:bg-elevated/50 not-xl:cursor-pointer xl:cursor-default"
				aria-label="open chat info"
				@click="openChatInfo"
			>
				<PresenceAvatar
					v-if="chatData.type === 'DIRECT'"
					:user-id="otherMemberId"
				>
					<ChatAvatar
						:src="displayAvatar"
						:chat-type="chatData.type"
						:alt="otherMemberProfile?.nickname[0]"
						size="sm"
						class="sm:size-7 size-9 sm:text-base text-lg"
					/>
				</PresenceAvatar>
				<ChatAvatar
					v-else
					:src="displayAvatar"
					:chat-type="chatData.type"
					size="sm"
					class="sm:size-7 size-9 sm:text-base text-lg"
				/>

				<div class="relative h-9 flex-1 min-w-0 flex items-center gap-2">
					<span 
						class="transition-all text-start truncate text-sm self-start"
						:class="typingLabel ? 'mt-1' : 'mt-2'"
					>
						{{ displayName }}
						<userPresenceLabel
							v-if="!typingLabel && otherMemberId"
							class="ml-2 shrink-0 text-start"
							:user-id="otherMemberId"
						/>
					</span>
					<TypingIndicator
						class="absolute inset-x-0 bottom-0"
						:label="typingLabel"
					/>
				</div>
			</button>
			<PinnedMessages :chat-id="chatId" class="justify-self-end not-sm:hidden"/>
			<UInput
				class="w-78 not-md:hidden"
				placeholder="search"
				icon="lucide:search"
				:ui="{ base: 'ring-default' }"
				@keydown.enter="onSearchInputKeydown"
			/>
			<UButton
				class="inline-flex md:hidden not-sm:hidden"
				icon="lucide:search"
				variant="soft"
				color="neutral"
				aria-label="search messages"
				@click="isSearchOpen = true"
			/>

			<UPopover :ui="{ content: 'flex flex-col gap-1 p-1 min-w-44' }">
				<UButton variant="soft" color="neutral" icon="lucide:ellipsis-vertical"/>

				<template #content>
					<div class="hidden not-sm:flex flex-col gap-1">
						<PinnedMessages :chat-id="chatId" class="w-full"/>
						<UButton
							variant="ghost"
							color="neutral"
							icon="lucide:search"
							label="search messages"
							class="justify-start text-sm"
							@click="isSearchOpen = true"
						/>
					</div>
					<UButton
						v-if="canManageGroup"
						variant="ghost"
						color="neutral"
						icon="lucide:settings-2"
						class="justify-start text-sm"
						@click="isEditModalOpen = true"
					>
						Edit group info
					</UButton>
					<UButton
						v-if="canManageGroup"
						variant="ghost"
						color="neutral"
						icon="lucide:user-cog"
						class="justify-start text-sm"
						@click="isManageMembersOpen = true"
					>
						Manage members
					</UButton>
<SendFriendRequestButton
					v-if="chatData.type === 'DIRECT' && otherMemberId"
					:user-id="otherMemberId"
				/>
				<DeleteChatButton
					v-if="!isDirectId(chatId) && (currentMember?.role === 'OWNER' || chatData.type === 'DIRECT')"
					:chat-id="chatId"
				/>
					<LeaveChatButton
						v-if="chatData.type === 'GROUP'"
						:chat-id="chatId"
						:chat-members="activeMembers"
						:current-user-id="currentUserId"
					/>
				</template>
			</UPopover>
		</div>

		<EditGroupChatModal
			v-if="chatData && canManageGroup"
			v-model:open="isEditModalOpen"
			:chat-data="chatData"
			@chat-updated="onChatUpdated"
		/>

		<ManageMembers
			v-if="chatData && canManageGroup"
			v-model:open="isManageMembersOpen"
			:chat-id="chatData.id"
			:chat-members="activeMembers"
			@member-updated="onMemberUpdated"
		/>

		<SearchMessagesModal
			v-model:open="isSearchOpen"
			:chat-id="chatId"
			:initial-query="searchInitialQuery"
		/>

		<USlideover
			v-if="isTabletLayout"
			v-model:open="isInfoOpen"
			title="chat info"
			:ui="{ content: 'w-full max-w-90' }"
		>
			<template #content>
				<ChatRightWidget
					v-if="chatData"
					:key="chatId"
					:chat-data="chatData"
					:chat-members="chatMembers"
					:loading="loading"
					embedded
					@member-updated="onMemberUpdated"
				/>
			</template>
		</USlideover>

		<UDrawer
			v-else
			v-model:open="isInfoOpen"
			title="chat info"
			should-scale-background
			set-background-color-on-scale
			:ui="chatInfoDrawerUi"
		>
			<template #content>
				<ChatRightWidget
					v-if="chatData"
					:key="chatId"
					:chat-data="chatData"
					:chat-members="chatMembers"
					:loading="loading"
					embedded
					@member-updated="onMemberUpdated"
				/>
			</template>
		</UDrawer>

		<USkeleton v-if="loading" class="w-full h-full rounded-none" />
	</div>
</template>
