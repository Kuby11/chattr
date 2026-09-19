import type { ChatId, MessageId } from "@shared/types"
import type { ClientMessage } from "../types/clientMessage"

export const useMessageStore = defineStore("messageStore", () => {
	const messages = ref<Map<ChatId, ClientMessage[]>>(new Map())
	const hasMoreMap = ref<Map<ChatId, boolean>>(new Map())
	const loadingMoreMap = ref<Map<ChatId, boolean>>(new Map())
	const repliesList = ref<Map<ChatId, ClientMessage | null>>(new Map())
	const editingMessageList = ref<Map<ChatId, ClientMessage | null>>(new Map())
	const forwardingMessage = ref<ClientMessage | null>(null)

	function addMessages(chatId: ChatId, newMessages: ClientMessage[]) {
		const existing = messages.value.get(chatId) ?? []
		const map = new Map<MessageId, ClientMessage>()
		for (const msg of existing) {
			map.set(msg.id, msg)
		}
		for (const msg of newMessages) {
			map.set(msg.id, msg)
		}
		const sorted = Array.from(map.values()).sort(
			(a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
		)
		messages.value.set(chatId, sorted)
	}

	function addMessage(message: ClientMessage) {
		addMessages(message.chat_id, [message])
	}

	function replaceMessage(chatId: ChatId, tempId: MessageId, realMessage: ClientMessage) {
		const existing = messages.value.get(chatId) ?? []
		const filtered = existing.filter(msg => msg.id !== tempId)
		const map = new Map<MessageId, ClientMessage>()
		for (const msg of filtered) {
			map.set(msg.id, msg)
		}
		map.set(realMessage.id, realMessage)
		const sorted = Array.from(map.values()).sort(
			(a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
		)
		messages.value.set(chatId, sorted)
	}

	function setHasMore(chatId: ChatId, hasMore: boolean) {
		hasMoreMap.value.set(chatId, hasMore)
	}

	function getHasMore(chatId: ChatId) {
		return hasMoreMap.value.get(chatId) ?? true
	}

	function setLoadingMore(chatId: ChatId, loading: boolean) {
		loadingMoreMap.value.set(chatId, loading)
	}

	function getLoadingMore(chatId: ChatId) {
		return loadingMoreMap.value.get(chatId) ?? false
	}

	function selectReply(message: ClientMessage) {
		resetEdit(message.chat_id)
		repliesList.value.set(message.chat_id, message)
	}

	function resetReply(chatId: ChatId) {
		repliesList.value.delete(chatId)
	}

	function getReplyingTo(chatId: ChatId) {
		return repliesList.value.get(chatId)
	}

	function selectEdit(message: ClientMessage) {
		resetReply(message.chat_id)
		editingMessageList.value.set(message.chat_id, message)
	}

	function resetEdit(chatId: ChatId) {
		editingMessageList.value.delete(chatId)
	}

	function getEditing(chatId: ChatId) {
		return editingMessageList.value.get(chatId)
	}

	function selectForward(message: ClientMessage) {
		forwardingMessage.value = message
	}

	function resetForward() {
		forwardingMessage.value = null
	}

	function getMessage(chatId: ChatId, messageId: MessageId) {
		return messages.value
			.get(chatId)
			?.find(msg => msg.id === messageId)
	}

	function deleteMessage(chatId: ChatId, messageId: MessageId) {
		const chatMessages = messages.value.get(chatId)

		if (!chatMessages)
			return

		messages.value.set(
			chatId,
			chatMessages.filter(msg => msg.id !== messageId)
		)
	}

	function updateMessage(
		chatId: ChatId,
		messageId: MessageId,
		payload: {
			updatedContent?: string,
			pinnedAt?: string | null,
			editedAt?: string,
			deletedAt?: string,
			seenAt?: string,
			isUploading?: boolean,
			isError?: boolean,
			media?: ClientMessage['media']
		}
	) {
		const chatMessages = messages.value.get(chatId)

		if (!chatMessages)
			return

		const foundMessage = chatMessages.find(msg => msg.id === messageId)

		if (!foundMessage)
			return

		if (payload.updatedContent)
			foundMessage.content = payload.updatedContent

		if (payload.editedAt)
			foundMessage.edited_at = payload.editedAt

		if (payload.deletedAt)
			foundMessage.deleted_at = payload.deletedAt

		if (payload.pinnedAt)
			foundMessage.pinned_at = payload.pinnedAt

		if (payload.pinnedAt === null)
			foundMessage.pinned_at = null

		if (payload.seenAt)
			foundMessage.seen_at = payload.seenAt

		if (payload.isUploading !== undefined)
			foundMessage.is_uploading = payload.isUploading

		if (payload.isError !== undefined)
			foundMessage.is_error = payload.isError

		if (payload.media)
			foundMessage.media = payload.media

		messages.value.set(chatId, [...chatMessages])
	}

	function clearAllMessages() {
		messages.value.clear()
		hasMoreMap.value.clear()
		loadingMoreMap.value.clear()
		repliesList.value.clear()
		editingMessageList.value.clear()
		forwardingMessage.value = null
	}

	function clearChat(chatId: ChatId) {
		messages.value.delete(chatId)
		hasMoreMap.value.delete(chatId)
		loadingMoreMap.value.delete(chatId)
		repliesList.value.delete(chatId)
		editingMessageList.value.delete(chatId)

		if (forwardingMessage.value?.chat_id === chatId) {
			forwardingMessage.value = null
		}
	}

	return {
		messages,
		getMessage,
		addMessage,
		addMessages,
		replaceMessage,
		updateMessage,
		deleteMessage,
		clearAllMessages,
		clearChat,
		repliesList,
		selectReply,
		resetReply,
		getReplyingTo,
		editingMessageList,
		selectEdit,
		resetEdit,
		getEditing,
		setHasMore,
		getHasMore,
		setLoadingMore,
		getLoadingMore,
		forwardingMessage,
		selectForward,
		resetForward
	}
})
