import type { ChatId, Tables } from '@shared/types'
import { useFeature } from '@shared/composables'
import { createMessageApi } from '../api/messageApi'
import { useMessageStore } from '../stores/messageStore'
import { DEFAULT_PAGE_LIMIT, enrichMessagesWithMedia, syncChatMessagesToStore } from './useMessageSync'

const startedChats = new Set<ChatId>()

export const useMessagePrefetch = () => {
	const supabase = useSupabaseClient()
	const messageStore = useMessageStore()
	const { useAuth } = useFeature('auth')
	const { onAuthStateChange } = useAuth()

	async function prefetchChat(chatId: ChatId) {
		if (startedChats.has(chatId)) return
		startedChats.add(chatId)

		const messageService = createMessageApi(supabase, chatId)
		syncChatMessagesToStore(chatId, messageStore, messageService)

		const hasCached = messageStore.messages.get(chatId)?.length
		if (hasCached) return

		try {
			const { data, error } = await messageService.fetchMessages(chatId, { limit: DEFAULT_PAGE_LIMIT })
			if (error) throw error
			if (!data) return

			const enrichedData = await enrichMessagesWithMedia(chatId, data, messageService)
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
		prefetchChat,
		prefetchChats
	}
}
