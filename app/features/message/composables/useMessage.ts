import type { ChatId, MessageId, Tables } from "@shared/types";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { STATE_TOKENS } from "@shared/configs";
import { useAuth } from "@features/auth";
import { useProfileStore } from "@features/profile";
import { useChat } from "../../chat/composables/useChat";
import { isDirectId } from "../../chat/utils/directId";
import { useMessageApi } from "../api/messageApi";
import type { MessagePayload } from "../types/messagePayload";
import { useMessageStore } from "../stores/messageStore";
import type { ClientMessage } from "../types/clientMessage";
import { DEFAULT_PAGE_LIMIT, enrichMessagesWithMedia, syncChatMessagesToStore } from "./useMessageSync";

export type ChatMediaItem = { url: string; type: 'image' | 'video'; size: number }

function isVideoUrl(url: string) {
	const withoutQuery = url.split("?")[0] ?? ""
	const extension = withoutQuery.split(".").pop()?.toLowerCase() ?? ""
	return STATE_TOKENS.VIDEO_EXTENSIONS.includes(extension as never)
}

type PendingMediaUpload = {
	cancelled: boolean
	uploadedUrls: string[]
}

const pendingMediaUploads = new Map<MessageId, PendingMediaUpload>()

export const useMessage = (chatId: MaybeRefOrGetter<ChatId>) => {
	const { onAuthStateChange } = useAuth()
	const currentChatId = computed(() => toValue(chatId))
	const messageService = useMessageApi(currentChatId.value)
	const messageStore = useMessageStore()
	const userStore = useProfileStore()
	const { ensureDirectChatById } = useChat()

	const hasMore = computed(() => messageStore.getHasMore(currentChatId.value))
	const loadingMore = computed(() => messageStore.getLoadingMore(currentChatId.value))

	const chatMessages = computed(() => messageStore.messages.get(currentChatId.value))

	async function sendMessage(payload: MessagePayload): Promise<Tables<"chats"> | null> {
		let ensured: Tables<"chats"> | null = null

		if (payload.chat_id && isDirectId(payload.chat_id)) {
			ensured = await ensureDirectChatById(payload.chat_id)
			payload = { ...payload, chat_id: ensured.id }
		}

		const { data: insertedMessage, error } = await messageService.insertMessage(payload)

		if (error) throw error

		if (insertedMessage) {
			messageStore.addMessage(insertedMessage)
		}

		return ensured
	}

	async function sendMessageWithMedia(payload: MessagePayload, files: File[]): Promise<Tables<"chats"> | null> {
		let ensured: Tables<"chats"> | null = null

		if (payload.chat_id && isDirectId(payload.chat_id)) {
			ensured = await ensureDirectChatById(payload.chat_id)
			payload = { ...payload, chat_id: ensured.id }
		}

		const senderId = userStore.userProfile?.user_id ?? ""
		const tempId = `temp-${crypto.randomUUID()}`
		const chatId = payload.chat_id!
		const objectMedia = files.map((file) => ({
			url: URL.createObjectURL(file),
			size: file.size,
			type: file.type,
		}))

		const optimisticMessage: ClientMessage = {
			id: tempId,
			chat_id: chatId,
			sender_id: senderId,
			content: payload.content,
			media: objectMedia,
			type: payload.type,
			sent_at: new Date().toISOString(),
			replying_to: payload.replying_to ?? null,
			forwarded_from: payload.forwarded_from ?? null,
			edited_at: null,
			deleted_at: null,
			pinned_at: null,
			seen_at: null,
			is_uploading: true,
			is_error: false,
		}

		messageStore.addMessage(optimisticMessage)
		const pendingUpload: PendingMediaUpload = {
			cancelled: false,
			uploadedUrls: [],
		}
		pendingMediaUploads.set(tempId, pendingUpload)

		try {
			const media = await messageService.uploadMessageMedia(
				files,
				chatId,
				(url) => {
					pendingUpload.uploadedUrls.push(url)
					if (pendingUpload.cancelled) throw new Error("Media upload cancelled")
				}
			)

			if (pendingUpload.cancelled) {
				const urls = media.map(m => m.url)

				await messageService.removeMessageMedia(urls)
				return ensured
			}

			const { data: realMessage, error } = await messageService.insertMessage({
				...payload,
				media_urls: media.map(m => m.url)
			})

			if (error || !realMessage) {
				throw error ?? new Error("Failed to insert message with media")
			}

			if (pendingUpload.cancelled) {
				await messageService.deleteMessage(realMessage.id)
				return ensured
			}

			messageStore.replaceMessage(chatId, tempId, {
				...realMessage,
				media
			})
		} catch (error) {
			if (pendingUpload.cancelled) {
				const { error: cleanupError } = await messageService.removeMessageMedia(pendingUpload.uploadedUrls)
				if (cleanupError) console.error("Failed to remove cancelled upload media:", cleanupError)
				return ensured
			}

			console.error("Error sending media message:", error)
			messageStore.updateMessage(chatId, tempId, {
				isUploading: false,
				isError: true
			})
		} finally {
			pendingMediaUploads.delete(tempId)
			objectMedia.forEach(media => URL.revokeObjectURL(media.url))
		}

		return ensured
	}

	function cancelMessageUpload(messageId: MessageId) {
		const pendingUpload = pendingMediaUploads.get(messageId)
		if (!pendingUpload) return

		pendingUpload.cancelled = true
		messageStore.deleteMessage(currentChatId.value, messageId)
	}

	async function pinOrUnpinMessage(messageId: MessageId, pin: boolean = true) {
		const { error } = await messageService.pinOrUnpinMessage(messageId, pin)

		if (error) throw error

		messageStore.updateMessage(currentChatId.value, messageId, {
			pinnedAt: pin ? new Date().toISOString() : null
		})
	}

	async function markAsRead(messageId: MessageId) {
		const { error } = await messageService.markAsRead(messageId)

		if (error)
			throw error

		messageStore.updateMessage(currentChatId.value, messageId, { seenAt: new Date().toISOString() })
	}

	async function editMessage(messageId: MessageId, editedContent: string) {
		const { error } = await messageService.updateMessage(messageId, editedContent)
		if (error)
			throw error

		messageStore.updateMessage(currentChatId.value, messageId, { updatedContent: editedContent })
		messageStore.resetEdit(currentChatId.value)
	}

	async function deleteMessage(messageId: MessageId) {
		const message = messageStore.getMessage(currentChatId.value, messageId)
		messageStore.deleteMessage(currentChatId.value, messageId)

		const { error } = await messageService.deleteMessage(messageId)
		if (error) {
			if (message) messageStore.addMessage(message)
			throw error
		}
	}

	async function forwardMessage(message: ClientMessage, targetChatIds: ChatId[]) {
		const results = await Promise.allSettled(
			targetChatIds.map(targetId =>
				messageService.insertMessage({
					chat_id: targetId,
					content: message.content,
					forwarded_from: message.sender_id,
					type: message.type,
					replying_to: message.replying_to ?? null,
					media_urls: message.media?.map(m => m.url) ?? [],
					edited_at: null,
				})
			)
		)

		const errors = results.filter(r => r.status === 'rejected')
		if (errors.length > 0) {
			console.error(`Failed to forward to ${errors.length} chat(s)`, errors)
		}

		messageStore.resetForward()
	}

	async function loadMessages(
		limit = DEFAULT_PAGE_LIMIT,
		targetChatId: ChatId = currentChatId.value,
		force = false,
	) {
		const existingMessages = messageStore.messages.get(targetChatId)
		if (!force && existingMessages?.length)
			return existingMessages

		messageStore.setLoadingMore(targetChatId, true)
		try {
			const { data, error } = await messageService.fetchMessages(targetChatId, { limit })

			if (error) throw error

			const enrichedData = data ? await enrichMessagesWithMedia(targetChatId, data) : []
			messageStore.addMessages(targetChatId, enrichedData)
			messageStore.setHasMore(targetChatId, enrichedData.length >= limit)
			return enrichedData
		} finally {
			messageStore.setLoadingMore(targetChatId, false)
		}
	}

	async function loadMoreMessages(limit = DEFAULT_PAGE_LIMIT) {
		if (!hasMore.value || loadingMore.value) return

		const currentMessages = chatMessages.value
		if (!currentMessages || currentMessages.length === 0) {
			return loadMessages(limit)
		}

		const oldestMessage = currentMessages[0]
		if (!oldestMessage) return

		const before = oldestMessage.sent_at

		const targetChatId = currentChatId.value
		messageStore.setLoadingMore(targetChatId, true)
		try {
			const { data, error } = await messageService.fetchMessages(targetChatId, { limit, before })
			if (error)
				throw error

			if (data) {
				const enrichedData = await enrichMessagesWithMedia(targetChatId, data)
				messageStore.addMessages(targetChatId, enrichedData)
				messageStore.setHasMore(targetChatId, data.length >= limit)
			}
		} finally {
			messageStore.setLoadingMore(targetChatId, false)
		}
	}

	async function fetchChatMedia(
		targetChatId: ChatId,
		options?: { limit?: number; before?: string }
	): Promise<{ items: ChatMediaItem[]; cursor: string | null; hasMore: boolean }> {
		const limit = options?.limit ?? DEFAULT_PAGE_LIMIT

		const { data, error } = await messageService.fetchChatMedia(targetChatId, { ...options, limit })
		if (error) throw error

		const rows = data ?? []

		const fileMap = new Map<string, { size: number; type: string }>()
		try {
			const { data: storageFiles } = await messageService.getMediaMeta(targetChatId)
			if (storageFiles) {
				for (const file of storageFiles) {
					fileMap.set(file.name, {
						size: file.metadata?.size ?? 0,
						type: file.metadata?.mimetype ?? ''
					})
				}
			}
		} catch (err) {
			console.error("Failed to fetch media metadata from storage:", err)
		}

		const items: ChatMediaItem[] = []
		for (const msg of rows) {
			for (const url of msg.media_urls ?? []) {
				const fileName = decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '')
				const meta = fileMap.get(fileName)
				let size = meta?.size ?? 0
				let type = meta?.type ?? ''

				if (!size) {
					const headRes = await fetch(url, { method: 'HEAD' })
					const cl = headRes.headers.get('content-length')
					const ct = headRes.headers.get('content-type')
					if (cl) size = parseInt(cl, 10)
					if (ct) type = ct
				}

				items.push({
					url,
					type: isVideoUrl(url) || type.startsWith('video/') ? 'video' : 'image',
					size
				})
			}
		}

		return {
			items,
			cursor: rows.length ? rows[rows.length - 1]!.sent_at : null,
			hasMore: rows.length >= limit
		}
	}

	async function searchMessages(
		queryText: string,
		targetChatId: ChatId = currentChatId.value,
		options?: { limit?: number; before?: string }
	): Promise<{ items: ClientMessage[]; cursor: string | null; hasMore: boolean }> {
		const limit = options?.limit ?? DEFAULT_PAGE_LIMIT

		const { data, error } = await messageService.searchMessages(targetChatId, queryText, { ...options, limit })
		if (error) throw error

		const rows = data ?? []
		const items = await enrichMessagesWithMedia(targetChatId, rows)

		return {
			items,
			cursor: rows.length ? rows[rows.length - 1]!.sent_at : null,
			hasMore: rows.length >= limit
		}
	}

	function initChannel(targetChatId: ChatId = currentChatId.value) {
		return syncChatMessagesToStore(targetChatId, messageStore)
	}

	onAuthStateChange(async (event) => {
		if (event === "SIGNED_OUT")
			messageStore.clearAllMessages()
	})

	return {
		chatMessages,
		hasMore,
		loadingMore,
		initChannel,
		sendMessage,
		sendMessageWithMedia,
		cancelMessageUpload,
		editMessage,
		pinOrUnpinMessage,
		deleteMessage,
		loadMessages,
		loadMoreMessages,
		fetchChatMedia,
		searchMessages,
		markAsRead,
		forwardMessage,
		getSenderProfile: messageService.getSenderProfile
	}
}
