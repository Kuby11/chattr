import type { ChatId, Tables } from "@shared/types"
import { useMessageApi } from "../../message/api/messageApi"
import { useMessageStore } from "../../message/stores/messageStore"
import { DEFAULT_PAGE_LIMIT, enrichMessagesWithMedia, syncChatMessagesToStore } from "../../message/composables/useMessageSync"
import { useAuth } from "@features/auth"

const startedChats = new Set<ChatId>()

export const usePrefetchChats = () => {
	const messageStore = useMessageStore()
	const { onAuthStateChange } = useAuth()

	async function prefetchChat(chatId: ChatId) {
		if (startedChats.has(chatId)) return
		startedChats.add(chatId)

		syncChatMessagesToStore(chatId, messageStore)

		const hasCached = messageStore.messages.get(chatId)?.length
		if (hasCached) return

		const messageService = useMessageApi(chatId)

		try {
			const { data, error } = await messageService.fetchMessages(chatId, { limit: DEFAULT_PAGE_LIMIT })
			if (error) throw error
			if (!data) return

			const enrichedData = await enrichMessagesWithMedia(chatId, data)
			messageStore.addMessages(chatId, enrichedData)
			messageStore.setHasMore(chatId, data.length >= DEFAULT_PAGE_LIMIT)
		} catch (err) {
			console.error(`Failed to prefetch messages for chat ${chatId}:`, err)
		}
	}

	function prefetchChats(chats: Tables<"chats">[]) {
		for (const chat of chats) {
			void prefetchChat(chat.id)
		}
	}

	onAuthStateChange(async (event) => {
		if (event === "SIGNED_OUT")
			messageStore.clearAllMessages()
	})

	return {
		prefetchChats
	}
}
