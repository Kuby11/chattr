<script setup lang="ts">
import type { ChatId, Tables } from '@shared/types';
import { ChatMain, ChatPage, ChatRightWidget, ChatTopBar, useChat, useChatMember, isDirectId, getDirectIdOtherUserId } from '@features/chat';
import { useMessage, useMessageStore } from '@features/message';
import { useProfile, useProfileStore } from '@features/profile';
import { useCachedData, useCurrentRoute } from '@shared/composables';

definePageMeta({
  middleware: ["auth"],
  layout: "main",
  key: route => route.fullPath,
})

useHead({
	title: 'Chat | Chattr'
})

const route = useRoute()
const { resolveChat } = useChat()

const chatId = computed(() => route.params.chatId as string)
const chatCacheKey = computed(() => `chat-${chatId.value}`)
const activeChatId = ref<ChatId>(chatId.value)
	
const nuxtApp = useNuxtApp()
const { loadMessages, initChannel: initMessageChannel } = useMessage(activeChatId)
const messageStore = useMessageStore()
const { chatMembers, loadMembers, initChannel: initMemberChannel } = useChatMember(activeChatId)

const { userProfile } = storeToRefs(useProfileStore())
const { findUserProfile } = useProfile()
const { setCurrentRoute } = useCurrentRoute()

const { data, pending } = useCachedData(
	chatCacheKey,
	async () => {
		try {
			const chatData = await resolveChat(chatId.value)

			if (!chatData) {
				return { chatData: null, members: [], messages: [] }
			}

			const [members, messages] = await Promise.all([
				loadMembers(chatData.id)
					.catch((err: unknown) => {
						throw new Error("Failed to fetch chat members", { cause: err })
					}),
				loadMessages(undefined, chatData.id, true)
					.catch((err: unknown) => {
						throw new Error("Failed to fetch chat messages", { cause: err })
					}),
			])
			return { chatData, members, messages }
		} catch (err) {
			console.error("Failed to fetch chat data:", err)
		}
	},
	{ watch: [chatId]	}
)

const currentUserId = computed(() => userProfile.value?.user_id)

const otherMemberId = computed<string | undefined>(() => {
	const chat = data.value?.chatData
	if (!chat || chat.type !== 'DIRECT') return draftOtherMemberId.value
	const activeUserId = currentUserId.value
	if (!activeUserId) return undefined

	const fromMembers = chatMembers.value?.find(member => member.user_id !== activeUserId)?.user_id
	if (fromMembers) return fromMembers

	if (chat.name) {
		const ids = chat.name.split("__")
		if (ids.length === 2) {
			return ids[0] === activeUserId ? ids[1] : ids[0]
		}
	}

	return undefined
})

const draftOtherMemberId = computed<string | undefined>(() => {
	if (data.value?.chatData || !isDirectId(chatId.value)) return undefined

	const activeUserId = currentUserId.value
	if (!activeUserId) return undefined

	return getDirectIdOtherUserId(chatId.value, activeUserId) ?? undefined
})

const effectiveChatData = computed<Tables<"chats"> | null>(() => {
	if (pending.value) return null
	if (data.value?.chatData) return data.value.chatData
	if (!draftOtherMemberId.value) return data.value?.chatData ?? null

	const now = new Date().toISOString()
	return {
		id: chatId.value,
		name: chatId.value,
		direct_id: chatId.value,
		type: "DIRECT",
		avatar_url: null,
		cover_url: null,
		description: null,
		created_at: now,
		updated_at: now,
	}
})

const { data: otherMemberProfile } = useAsyncData(
	`route-member-${chatId.value}`,
	async () => {
		if (!otherMemberId.value) return null
		return await findUserProfile(otherMemberId.value)
	},
	{ watch: [otherMemberId] }
)

const chatDisplayName = computed(() => {
	const chat = effectiveChatData.value
	if (!chat) return 'chat'

	if (chat.type === 'DIRECT') {
		if (otherMemberProfile.value) {
			return otherMemberProfile.value.nickname || 'User'
		}
		if (chat.direct_id?.includes("__")) {
			return 'Chat'
		}
	}
	return chat.name || 'chat'
})

function onChatUpdated(updatedChat: Tables<"chats">) {
	if (data.value && data.value.chatData) {
		data.value = {
			...data.value,
			chatData: {
				...data.value.chatData,
				...updatedChat
			}
		}
	}
}

watch(
	() => data.value?.chatData?.id,
	async (realId) => {
		if (!realId) return

		activeChatId.value = realId as ChatId

		const cachedMessages = data.value?.messages ?? []
		if (!messageStore.messages.get(realId)?.length && cachedMessages.length) {
			messageStore.addMessages(realId, cachedMessages)
		}

		try {
			await loadMessages(undefined, realId as ChatId, true)
		} catch (err) {
			console.error("Failed to hydrate chat messages:", err)
		}
	},
	{ immediate: true }
)

async function onChatCreated(created: Tables<"chats">) {
	activeChatId.value = created.id
	const createdData = {
		...(data.value ?? { members: [], messages: [] }),
		chatData: created,
		members: [],
		messages: [],
	}
	data.value = createdData
	nuxtApp.payload.data[chatCacheKey.value] = createdData

	try {
		const [members, messages] = await Promise.all([
			loadMembers(created.id),
			loadMessages(undefined, created.id, true),
		])

		if (data.value?.chatData?.id === created.id) {
			const hydratedData = { ...data.value, members, messages }
			data.value = hydratedData
			nuxtApp.payload.data[chatCacheKey.value] = hydratedData
		}

	} catch (err) {
		console.error("Failed to load newly created chat:", err)
	}
}

watch(
	() => data.value,
	(d) => {
		if (!d?.chatData || d.chatData.type !== 'DIRECT') return
		if (!chatMembers.value?.length) {
			loadMembers(d.chatData.id).catch((err: unknown) => console.error("Failed to fetch chat members:", err))
		}
	},
	{ immediate: true }
)

watch(
	chatDisplayName,
	(name) => {
		setCurrentRoute({ route: `chat/${name}`, icon: 'lucide:message-square' })
	},
	{ immediate: true }
)

const hasResolvedChatId = computed(() => {
	return !!data.value?.chatData?.id
})

let isMounted = false
let connectedChatId: string | null = null

function connectRealtimeIfReady() {
	if (!isMounted || !hasResolvedChatId.value || connectedChatId === activeChatId.value) return

	connectedChatId = activeChatId.value
	initMessageChannel()
	initMemberChannel()
}

watch(
	hasResolvedChatId,
	connectRealtimeIfReady,
)

onMounted(() => {
	isMounted = true
	connectRealtimeIfReady()
})

</script>

<template>
	<ChatPage>
		<div class="w-full h-full grid grid-cols-1 xl:grid-cols-[1fr_22.5rem] grid-rows-[4.25rem_1fr] min-h-0 overflow-hidden">
			<ChatTopBar
				:chat-data="effectiveChatData"
				:chat-members="chatMembers"
				:loading="pending"
				:chat-id="activeChatId"
				class="xl:col-span-2"
				@chat-updated="onChatUpdated"
			/>

			<ChatMain
				class="w-full"
				:loading="pending"
				:chat-id="activeChatId"
				:chat-members="chatMembers ?? []"
				@chat-created="onChatCreated"
			/>

			<ChatRightWidget
				:chat-data="effectiveChatData"
				:chat-members="chatMembers" 
				:loading="pending"
			/>
		</div>
  </ChatPage>
</template>
