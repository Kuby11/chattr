import type { ChatId, Tables } from "@shared/types";
import { useMessageApi } from "../api/messageApi";
import { useMessageStore } from "../stores/messageStore";
import type { ClientMessage } from "../types/clientMessage";

export const DEFAULT_PAGE_LIMIT = 30

export async function enrichMessagesWithMedia(chatId: ChatId, messages: Tables<'messages'>[]): Promise<ClientMessage[]> {
	const messageService = useMessageApi(chatId)

	const messagesWithMedia = messages.filter(m => m.media_urls && m.media_urls.length > 0)
	if (messagesWithMedia.length === 0) {
		return messages
	}

	const fileMap = new Map<string, { size: number; type: string }>()
	try {
		const { data: storageFiles } = await messageService.getMediaMeta(chatId)
		if (storageFiles) {
			for (const file of storageFiles) {
				const size = file.metadata?.size ?? 0
				const type = file.metadata?.mimetype ?? ''
				fileMap.set(file.name, { size, type })
			}
		}
	} catch (err) {
		console.error("Failed to fetch media metadata from storage:", err)
	}

	for (const message of messages) {
		if (message.media_urls && message.media_urls.length > 0) {
			const mediaItems = await Promise.all(
				message.media_urls.map(async (url) => {
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

					if (!type) {
						const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
						if (['mp4', 'webm', 'mov', 'ogg', 'm4v', 'avi'].includes(ext)) {
							type = `video/${ext}`
						} else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
							type = `image/${ext === 'jpg' ? 'jpeg' : ext}`
						}
					}

					return {
						url,
						size,
						type
					}
				})
			);

			(message as unknown as ClientMessage).media = mediaItems
		}
	}

	return messages
}

export function syncChatMessagesToStore(chatId: ChatId, messageStore = useMessageStore()) {
	const messageService = useMessageApi(chatId)
	const channel = messageService.initChannel(chatId)

	messageService.onChannelEvent("INSERT", async (msg) => {
		const newMsg = msg.new as Tables<"messages">
		const [enriched] = await enrichMessagesWithMedia(chatId, [newMsg])
		messageStore.addMessage(enriched ?? newMsg)
	})

	messageService.onChannelEvent("DELETE", (msg) => {
		const message = msg.old as Tables<"messages">
		messageStore.deleteMessage(chatId, message.id)
	})

	messageService.onChannelEvent("UPDATE", (msg) => {
		const message = msg.new as Tables<"messages">
		const existing = messageStore.getMessage(chatId, message.id)
		messageStore.updateMessage(chatId, message.id, {
			updatedContent: message.content,
			editedAt: message.edited_at!,
			media: existing?.media
		})

		if (message.seen_at) {
			messageStore.updateMessage(chatId, message.id, { seenAt: message.seen_at })
		}

		if (message.deleted_at) {
			messageStore.deleteMessage(chatId, message.id)
		}

		if (message.pinned_at) {
			messageStore.updateMessage(chatId, message.id, { pinnedAt: message.pinned_at })
		}

		if (!message.pinned_at) {
			messageStore.updateMessage(chatId, message.id, { pinnedAt: null })
		}
	})

	return channel
}