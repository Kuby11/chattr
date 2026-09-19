import type { ChatId, Tables } from "@shared/types"
import { useAuth } from "@features/auth"
import { useChatApi } from "../api/useChatApi"
import { useProfile } from "@features/profile"

export const useChatStore = defineStore('chatStore', () => {
	const { onAuthStateChange, supabaseAuth } = useAuth()
	const { findUserProfile } = useProfile()
	const { fetchChats } = useChatApi()

	const chats = ref<Tables<"chats">[] | undefined>(undefined)
	let loadPromise: Promise<void> | null = null

	const addChats = (chat: Tables<"chats">[]) => {
		if (chats.value) {
			const existingIds = new Set(chats.value.map(c => c.id))
			const newOnes = chat.filter(c => !existingIds.has(c.id))
			chats.value.push(...newOnes)
		} else {
			chats.value = [...chat]
		}
	}

	const removeChat = (chatId: ChatId) => {
		if (chats.value) {
			chats.value = chats.value.filter(chat => chat.id !== chatId)
		}
	}

	const restoreChat = (chat: Tables<"chats">, atIndex?: number) => {
		if (!chats.value) return
		const exists = chats.value.some(c => c.id === chat.id)
		if (exists) return
		if (atIndex !== undefined && atIndex >= 0 && atIndex <= chats.value.length) {
			chats.value.splice(atIndex, 0, chat)
		} else {
			chats.value.unshift(chat)
		}
	}

	const updateChatInStore = (updatedChat: Partial<Tables<"chats">> & { id: string }) => {
		if (chats.value) {
			const index = chats.value.findIndex(chat => chat.id === updatedChat.id)
			if (index !== -1 && chats.value[index]) {
				chats.value[index] = {
					...chats.value[index],
					...updatedChat
				} as Tables<"chats">
			}
		}
	}

	async function loadChats() {
		if (chats.value !== undefined || loadPromise) return loadPromise

		loadPromise = (async () => {
			const userId = (await supabaseAuth.getSession()).data.session?.user.id
			if (!userId || chats.value) return

			const chatsData = await fetchChats()
			const enrichedChats = await Promise.all(chatsData.map(async (chat) => {
				if (chat.type === 'DIRECT') {
					const memberIds = chat.direct_id?.split("__")

					if (memberIds && memberIds.length === 2) {
						const otherMemberId = memberIds[0] === userId ? memberIds[1] : memberIds[0]
						if (otherMemberId && otherMemberId !== userId) {
							try {
								const otherMemberProfile = await findUserProfile(otherMemberId)
								if (otherMemberProfile) {
									chat.name = otherMemberProfile.nickname || otherMemberProfile.username
									chat.avatar_url = otherMemberProfile.avatar_url
								}
							} catch (error) {
								console.warn(`Failed to load direct chat profile ${otherMemberId}:`, error)
							}
						}
					}
				}

				return chat
			}))

			chats.value = enrichedChats
		})()

		try {
			await loadPromise
		} catch (error) {
			console.error('Failed to load chats:', error)
		} finally {
			loadPromise = null
		}
	}

	void loadChats()

		onAuthStateChange(async (event) => {
		if (event === 'SIGNED_OUT') {
			chats.value = undefined
			loadPromise = null
			return
		}

		await loadChats()
	})

	return {
		chats,
		loadChats,
		addChats,
		removeChat,
		restoreChat,
		updateChatInStore
	}
})
