import type { ChatId, MessageId, UserId } from "@shared/types"
import type { ClientMessage } from "../types/clientMessage"
import { useMessageStore } from "../stores/messageStore"

/**
 * Read/action facade over the message store for consumers that only need
 * message state. This keeps the store private to the message feature while
 * giving other features a small, explicit surface.
 */
export const useMessageState = () => {
	const messageStore = useMessageStore()

	function getMessages(chatId: ChatId) {
		return messageStore.messages.get(chatId)
	}

	function getMessage(chatId: ChatId, messageId: MessageId) {
		return messageStore.getMessage(chatId, messageId)
	}

	function getLastMessage(chatId: ChatId) {
		const messages = getMessages(chatId)
		return messages?.length ? messages[messages.length - 1] ?? null : null
	}

	function addMessages(chatId: ChatId, messages: ClientMessage[]) {
		messageStore.addMessages(chatId, messages)
	}

	function clearChat(chatId: ChatId) {
		messageStore.clearChat(chatId)
	}

	function getUnreadCount(chatId: ChatId, currentUserId: UserId) {
		const messages = getMessages(chatId)
		if (!messages?.length) return 0

		return messages.reduce((count, message) => {
			if (message.sender_id !== currentUserId && !message.seen_at) count++
			return count
		}, 0)
	}

	function getTotalUnreadCount(currentUserId: UserId) {
		let total = 0

		for (const chatId of messageStore.messages.keys()) {
			total += getUnreadCount(chatId, currentUserId)
		}

		return total
	}

	function getReplyingTo(chatId: ChatId) {
		return messageStore.getReplyingTo(chatId)
	}

	function getEditing(chatId: ChatId) {
		return messageStore.getEditing(chatId)
	}

	return {
		getMessages,
		getMessage,
		getLastMessage,
		addMessages,
		clearChat,
		getUnreadCount,
		getTotalUnreadCount,
		getReplyingTo,
		getEditing,
	}
}
