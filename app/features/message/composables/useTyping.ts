import type { ChatId } from "@shared/types"
import { useProfileStore } from "@features/profile"
import { useMessageApi } from "../api/messageApi"
import type { TypingPayload } from "../types/typingPayload"

const typingByChat = ref(new Map<ChatId, Map<string, string>>())
const remoteTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function typingEntryKey(chatId: ChatId, userId: string) {
	return `${chatId}:${userId}`
}

function setRemoteTyping(chatId: ChatId, payload: TypingPayload) {
	const next = new Map(typingByChat.value)
	const users = new Map(next.get(chatId) ?? [])
	const key = typingEntryKey(chatId, payload.userId)

	const existingTimeout = remoteTimeouts.get(key)
	if (existingTimeout) clearTimeout(existingTimeout)

	if (!payload.isTyping) {
		users.delete(payload.userId)
		remoteTimeouts.delete(key)
	} else {
		users.set(payload.userId, payload.nickname)
		remoteTimeouts.set(
			key,
			setTimeout(() => {
				const current = new Map(typingByChat.value)
				const chatUsers = new Map(current.get(chatId) ?? [])
				chatUsers.delete(payload.userId)
				if (chatUsers.size) current.set(chatId, chatUsers)
				else current.delete(chatId)
				typingByChat.value = current
				remoteTimeouts.delete(key)
			}, 3000)
		)
	}

	if (users.size) next.set(chatId, users)
	else next.delete(chatId)

	typingByChat.value = next
}

function clearRemoteTyping(chatId: ChatId) {
	const prefix = `${chatId}:`
	for (const [key, timer] of remoteTimeouts) {
		if (!key.startsWith(prefix)) continue
		clearTimeout(timer)
		remoteTimeouts.delete(key)
	}

	const next = new Map(typingByChat.value)
	next.delete(chatId)
	typingByChat.value = next
}

export const useTyping = (chatId: ChatId) => {
	const userStore = useProfileStore()
	const messageService = useMessageApi(chatId)

	const typingUsers = computed(() => {
		const users = typingByChat.value.get(chatId)
		if (!users) return []

		const selfId = userStore.userProfile?.user_id
		return [...users.entries()]
			.filter(([userId]) => userId !== selfId)
			.map(([userId, nickname]) => ({ userId, nickname }))
	})

	const typingLabel = computed(() => {
		const names = typingUsers.value.map((u) => u.nickname)
		if (!names.length) return null
		if (names.length === 1) return `${names[0]} is typing…`
		if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`
		return `${names[0]} and ${names.length - 1} others are typing…`
	})

	let idleTimer: ReturnType<typeof setTimeout> | undefined
	let isBroadcasting = false
	let lastBroadcastAt = 0

	async function broadcast(isTyping: boolean) {
		const profile = userStore.userProfile
		if (!profile) return

		await messageService.sendTypingStatus({
			userId: profile.user_id,
			nickname: profile.nickname,
			isTyping,
		})
	}

	function notifyTyping() {
		const now = Date.now()
		const shouldSend = !isBroadcasting || now - lastBroadcastAt > 1500

		if (shouldSend) {
			isBroadcasting = true
			lastBroadcastAt = now
			broadcast(true)
		}

		if (idleTimer) clearTimeout(idleTimer)
		idleTimer = setTimeout(() => {
			stopTyping()
		}, 2000)
	}

	function stopTyping() {
		if (idleTimer) {
			clearTimeout(idleTimer)
			idleTimer = undefined
		}
		if (!isBroadcasting) return
		isBroadcasting = false
		broadcast(false)
	}

	const stopListen = messageService.onTyping((payload) => {
		setRemoteTyping(chatId, payload)
	})

	onScopeDispose(() => {
		stopTyping()
		stopListen()
		clearRemoteTyping(chatId)
	})

	return {
		typingUsers,
		typingLabel,
		notifyTyping,
		stopTyping,
	}
}
