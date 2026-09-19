import type { ChatId, MessageId, UserId } from "@shared/types"
import type { MessagePayload } from "../types/messagePayload"
import type { RealtimePostgresChangesPayload } from "@supabase/realtime-js"
import type { PostgresChangesEvents } from "../types/postgresChangesEvents"
import type { TypingPayload } from "../types/typingPayload"
import type { ClientMessage } from "../types/clientMessage"
import { isDirectId } from "../../chat/utils/directId"

type ChangePayload = RealtimePostgresChangesPayload<{ [key: string]: unknown }>
type ChangeCallback = (payload: ChangePayload) => void
type TypingCallback = (payload: TypingPayload) => void
type BroadcastTypingPayload = TypingPayload & { chatId: ChatId }

const listeners = new Map<ChatId, Map<string, ChangeCallback>>()
const typingListeners = new Map<ChatId, Set<TypingCallback>>()

function listenerKey(event: PostgresChangesEvents, key: string) {
	return `${event}:${key}`
}

function getListeners(chatId: ChatId) {
	let callbacks = listeners.get(chatId)
	if (!callbacks) {
		callbacks = new Map()
		listeners.set(chatId, callbacks)
	}
	return callbacks
}

function getTypingListeners(chatId: ChatId) {
	let callbacks = typingListeners.get(chatId)
	if (!callbacks) {
		callbacks = new Set()
		typingListeners.set(chatId, callbacks)
	}
	return callbacks
}

function getPayloadChatId(payload: ChangePayload): ChatId | undefined {
	const record = payload.eventType === "DELETE" ? payload.old : payload.new
	return record.chat_id as ChatId | undefined
}

let messageChannelAuthReady: Promise<void> | null = null

function ensureMessageChannelAuth() {
	if (!messageChannelAuthReady) {
		const supabase = useSupabaseClient()
		messageChannelAuthReady = supabase.realtime.setAuth()
	}
	return messageChannelAuthReady
}

function ensureMessageChannel(chatId: ChatId) {
	if (isDirectId(chatId))
		return null

	const supabase = useSupabaseClient()

	const channelName = `chat-messages-channel:${chatId}`
	const topic = `realtime:${channelName}`

	const existing = supabase.getChannels().find(channel => channel.topic === topic)
	if (existing)
		return existing

	const channel = supabase
		.channel(channelName, {
			config: {
				private: true,
				broadcast: { self: false },
			},
		})
		.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "messages",
				filter: `chat_id=eq.${chatId}`
			},
			(payload) => {
				const change = payload as ChangePayload
				const payloadChatId = getPayloadChatId(change)
				if (!payloadChatId)
					return

				const event = change.eventType as PostgresChangesEvents
				for (const [key, callback] of getListeners(payloadChatId)) {
					if (key.startsWith(`${event}:`) || key.startsWith("*:"))
						callback(change)
				}
			}
		)
		.on("broadcast", { event: "typing" }, ({ payload }) => {
			const typingPayload = payload as BroadcastTypingPayload
			if (!typingPayload.chatId)
				return

			getTypingListeners(typingPayload.chatId).forEach(callback => {
				callback(typingPayload)
			})
		})

	void ensureMessageChannelAuth().then(() => {
		channel.subscribe()
	})

	return channel
}

export const useMessageApi = (chatId: ChatId) => {
	const supabase = useSupabaseClient()

	function initChannel(targetChatId?: ChatId) {
		return ensureMessageChannel(targetChatId ?? chatId)
	}

	function disposeChannel(targetChatId: ChatId = chatId) {
		listeners.delete(targetChatId)
		typingListeners.delete(targetChatId)

		if (isDirectId(targetChatId)) return

		const channelName = `chat-messages-channel:${targetChatId}`
		const topic = `realtime:${channelName}`
		const channel = supabase.getChannels().find(item => item.topic === topic)
		if (channel) {
			void supabase.removeChannel(channel).catch((error: unknown) => {
				console.warn("Failed to remove chat messages channel:", error)
			})
		}
	}

	function onChannelEvent(
		event: PostgresChangesEvents,
		callback: ChangeCallback,
		key = "default"
	) {
		if (isDirectId(chatId))
			return () => { }

		ensureMessageChannel(chatId)
		const callbacks = getListeners(chatId)
		const id = listenerKey(event, key)

		if (callbacks.has(id))
			return () => { }

		callbacks.set(id, callback)

		return () => {
			callbacks.delete(id)
			if (!callbacks.size)
				listeners.delete(chatId)
		}
	}

	function onTyping(callback: TypingCallback) {
		if (isDirectId(chatId))
			return () => { }

		ensureMessageChannel(chatId)
		const callbacks = getTypingListeners(chatId)
		callbacks.add(callback)

		return () => {
			callbacks.delete(callback)
			if (!callbacks.size)
				typingListeners.delete(chatId)
		}
	}

	async function sendTypingStatus(payload: TypingPayload) {
		if (isDirectId(chatId)) return

		const channel = ensureMessageChannel(chatId)
		if (!channel) return

		await channel.send({
			type: "broadcast",
			event: "typing",
			payload: { ...payload, chatId },
		})
	}

	async function fetchMessages(chatId: ChatId, options?: { limit?: number; before?: string }) {
		if (isDirectId(chatId))
			return { data: [], error: null }

		let query = supabase
			.from("messages")
			.select("*")
			.eq("chat_id", chatId)
			.order("sent_at", { ascending: false })
			.limit(options?.limit ?? 30)

		if (options?.before)
			query = query.lt("sent_at", options.before)

		return query
	}

	function fetchMessageById(messageId: MessageId) {
		return supabase
			.from("messages")
			.select("*")
			.eq("id", messageId)
			.single()
	}

	async function fetchPinnedMessages(targetChatId?: ChatId) {
		const resolvedChatId = targetChatId ?? chatId
		if (isDirectId(resolvedChatId))
			return { data: [], error: null }

		return supabase
			.from("messages")
			.select("*")
			.eq("chat_id", resolvedChatId)
			.not("pinned_at", "is", null)
			.order("pinned_at", { ascending: true })
	}

	async function fetchChatMedia(targetChatId: ChatId, options?: { limit?: number; before?: string }) {
		if (isDirectId(targetChatId))
			return { data: [], error: null }

		let query = supabase
			.from("messages")
			.select("*")
			.eq("chat_id", targetChatId)
			.not("media_urls", "is", null)
			.filter("media_urls", "neq", "{}")
			.order("sent_at", { ascending: false })
			.limit(options?.limit ?? 30)

		if (options?.before)
			query = query.lt("sent_at", options.before)

		return query
	}

	async function searchMessages(targetChatId: ChatId, queryText: string, options?: { limit?: number; before?: string }) {
		if (isDirectId(targetChatId))
			return { data: [], error: null }

		let query = supabase
			.from("messages")
			.select("*")
			.eq("chat_id", targetChatId)
			.ilike("content", `%${queryText}%`)
			.order("sent_at", { ascending: false })
			.limit(options?.limit ?? 30)

		if (options?.before)
			query = query.lt("sent_at", options.before)

		return query
	}

	async function uploadMessageMedia(
		files: File[],
		targetChatId: ChatId,
		onUploaded?: (url: string) => void
	) {
		const { data: { session } } = await supabase.auth.getSession()

		if (!session)
			throw new Error("user is not authenticated")

		const mediaArr: ClientMessage['media'] = []

		for (const file of files) {
			const extension = file.name.split(".").pop() ?? "bin"
			const path = `${targetChatId}/${session.user.id}-${crypto.randomUUID()}.${extension}`

			const { data, error } = await supabase.storage
				.from("chat-media")
				.upload(path, file, {
					upsert: true,
					cacheControl: "max-age=3600"
				})

			if (error)
				throw error

			const { data: { publicUrl } } = supabase.storage
				.from("chat-media")
				.getPublicUrl(data.path)

			mediaArr.push({
				url: publicUrl,
				size: file.size,
				type: file.type
			})
			onUploaded?.(publicUrl)
		}

		return mediaArr
	}

	function getStoragePaths(urls: string[]) {
		return urls
			.map(url => url.split("/chat-media/")[1]?.split("?")[0])
			.filter((path): path is string => !!path)
			.map(path => decodeURIComponent(path))
	}

	async function removeMessageMedia(urls: string[]) {
		const storagePaths = getStoragePaths(urls)
		if (storagePaths.length === 0) return { error: null }

		return supabase.storage
			.from("chat-media")
			.remove(storagePaths)
	}

	function insertMessage(payload: MessagePayload) {
		return supabase
			.from("messages")
			.insert(payload)
			.select()
			.single()
	}

	async function deleteMessage(messageId: MessageId) {
		const { data: message, error: fetchError } = await supabase
			.from("messages")
			.select("media_urls")
			.eq("id", messageId)
			.single()

		if (fetchError)
			return { error: fetchError }

		if (message?.media_urls?.length) {
			const { error: storageError } = await removeMessageMedia(message.media_urls)
			if (storageError) {
				console.error("Failed to delete media from storage:", storageError)
			}
		}

		const { error } = await supabase
			.from("messages")
			.update({ deleted_at: new Date().toISOString() })
			.eq("id", messageId)
			.select()
			.single()

		if (error)
			return { error }

		return supabase
			.from("messages")
			.delete()
			.eq("id", messageId)
			.select()
			.single()
	}

	function updateMessage(messageId: MessageId, content: string) {
		return supabase
			.from("messages")
			.update({
				content,
				edited_at: new Date().toISOString()
			})
			.eq("id", messageId)
			.select()
			.single()
	}

	function pinOrUnpinMessage(messageId: MessageId, pin: boolean = true) {
		return supabase.rpc('mark_message_pinned', {
			p_message_id: messageId,
			p_is_pinned: pin
		})
	}

	function markAsRead(messageId: MessageId) {
		return supabase.rpc("mark_message_as_read", { p_message_id: messageId })
	}

	async function getSenderProfile(senderId: UserId) {
		const { data, error } = await supabase
			.from("user_profiles")
			.select("*")
			.eq("user_id", senderId)
			.single()

		if (error) throw error

		return data
	}

	async function getMediaMeta(path: string) {
		return supabase
			.storage
			.from('chat-media')
			.list(path)
	}

	return {
		initChannel,
		disposeChannel,
		fetchMessages,
		fetchMessageById,
		fetchPinnedMessages,
		fetchChatMedia,
		searchMessages,
		onChannelEvent,
		onTyping,
		sendTypingStatus,
		insertMessage,
		uploadMessageMedia,
		removeMessageMedia,
		deleteMessage,
		updateMessage,
		pinOrUnpinMessage,
		markAsRead,
		getSenderProfile,
		getMediaMeta
	}
}
