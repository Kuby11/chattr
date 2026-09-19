import { useChatStore } from "../stores/chatStore"
import { useChatApi } from "../api/useChatApi"
import { buildDirectId, isDirectId, parseDirectId } from "../utils/directId"
import { useChatMemberApi } from "../api/useChatMemberApi"
import { useChatMemberStore } from "../stores/memberStore"
import type { ChatCreatePayload } from "../types/ChatPayload"
import type { ChatId, ChatMemberId, Enums, Tables, UserId } from "@shared/types"
import { useProfile, useProfileStore } from "@features/profile"
import { useAuth } from "@features/auth"
import { useMessageStore, useMessageInfo } from "@features/message"

const directChatEnsureCache = new Map<string, Promise<Tables<"chats">>>()

function isDuplicateKeyError(error: unknown): boolean {
	const code = (error as { code?: string })?.code
	const status = (error as { status?: number })?.status
	return code === "23505" || status === 409
}

export const useChat = () => {
	const userStore = useProfileStore()
	const { findUserProfile } = useProfile()
	const chatStore = useChatStore()
	const chatService = useChatApi()
	const chatMemberService = useChatMemberApi()
	const memberStore = useChatMemberStore()
	const messageStore = useMessageStore()
	const { sendMemberJoinedInfo, sendMemberLeftInfo } = useMessageInfo()

	async function getDirectChatOtherMember(chatId: ChatId, name: string) {
		try {
			const { supabaseAuth } = useAuth()
			let currentUserId = userStore.userProfile?.user_id

			if (!currentUserId) {
				const session = (await supabaseAuth.getSession()).data.session
				currentUserId = session?.user.id
			}

			const idsFromName = name.split("__")

			if (idsFromName.length === 2 && currentUserId) {
				const otherMemberId = idsFromName[0] === currentUserId ? idsFromName[1] : idsFromName[0]
				if (otherMemberId && otherMemberId !== currentUserId) {
					const profile = await findUserProfile(otherMemberId)
					if (profile) return profile
				}
			}

			const members = await chatMemberService.fetchMembers(chatId)
			const other = members.find(m => m.user_id !== currentUserId)
			if (other) {
				const profile = await findUserProfile(other.user_id)
				if (profile) return profile
			}
		} catch (err) {
			console.warn("Could not resolve direct chat member profile:", err)
		}

		return null
	}

	async function createChat(chatOpts: ChatCreatePayload, memberIds: UserId[] = []) {
		const chatData = await chatService.createChat(chatOpts)
		const creatorId = await resolveCurrentUserId()
		if (!creatorId) throw new Error("Cannot create a chat without an authenticated user")

		await chatMemberService.addMembers(chatData.id, [creatorId], "OWNER")
		await chatMemberService.addMembers(
			chatData.id,
			memberIds.filter(memberId => memberId !== creatorId)
		)

		const joinedMemberIds = [...new Set([
			creatorId,
			...memberIds,
		].filter((id): id is UserId => !!id))]

		await Promise.allSettled(
			joinedMemberIds.map(targetId => sendMemberJoinedInfo(chatData.id, targetId))
		)

		chatStore.addChats([chatData])
	}

	async function resolveChat(id: ChatId) {
		if (isDirectId(id)) {
			const cachedDirect = chatStore.chats?.find(chat => chat.direct_id === id || chat.id === id)
			if (cachedDirect) {
				return cachedDirect
			}

			const resolved = await chatService.resolveDirectChat(id).catch(() => null)
			if (resolved) chatStore.addChats([resolved])
			return resolved
		}

		const cached = chatStore.chats?.find(chat => chat.id === id)
		if (cached) return cached

		return await chatService.findChat(id).catch(() => null)
	}

	async function getChat(id: ChatId) {
		try {
			if (isDirectId(id)) {
				const resolved = await resolveChat(id)
				if (!resolved) return null
				id = resolved.id
			}

			let chat = chatStore.chats?.find(c => c.id === id)

			if (!chat) {
				const fetchedChat = await chatService.findChat(id)
				if (!fetchedChat) return null
				chat = fetchedChat
			}

			if (chat.type === 'DIRECT') {
				if (!chat.direct_id) return

				if (chat.direct_id.includes("__")) {
					const otherMember = await getDirectChatOtherMember(chat.id, chat.direct_id)
					if (otherMember) {
						const resolvedName = otherMember.nickname || otherMember.username || chat.name
						const resolvedAvatar = otherMember.avatar_url ?? chat.avatar_url ?? ''

						chat = {
							...chat,
							name: resolvedName,
							avatar_url: resolvedAvatar
						}

						const storeItem = chatStore.chats?.find(c => c.id === id)
						if (storeItem) {
							storeItem.name = resolvedName
							storeItem.avatar_url = resolvedAvatar
						}
					}
				}
			}

			return chat
		} catch (err) {
			console.error("Error fetching chat:", err)
			return null
		}
	}

	async function updateGroupChat(
		chatId: ChatId,
		payload: {
			name?: string
			description?: string | null
			avatarFile?: File | null
			coverFile?: File | null
			removeAvatar?: boolean
			removeCover?: boolean
		}
	) {
		const updates: Partial<Tables<"chats">> = {
			updated_at: new Date().toISOString()
		}

		if (payload.name !== undefined) {
			updates.name = payload.name.trim()
		}

		if (payload.description !== undefined) {
			updates.description = payload.description?.trim() || null
		}

		if (payload.avatarFile) {
			const path = await chatService.uploadChatAsset(chatId, payload.avatarFile, 'avatar')
			updates.avatar_url = path
		} else if (payload.removeAvatar) {
			updates.avatar_url = null
		}

		if (payload.coverFile) {
			const path = await chatService.uploadChatAsset(chatId, payload.coverFile, 'cover')
			updates.cover_url = path
		} else if (payload.removeCover) {
			updates.cover_url = null
		}

		const updatedChat = await chatService.updateChat(chatId, updates)
		chatStore.updateChatInStore(updatedChat)
		return updatedChat
	}

	async function deleteChat(chatId: ChatId) {
		const deletedChat = chatStore.chats?.find(chat => chat.id === chatId)
			?? await chatService.findChat(chatId).catch(() => null)
		const directId = deletedChat?.direct_id

		await chatService.deleteChat(chatId)
		chatStore.removeChat(chatId)
		memberStore.clearMembers(chatId)
		messageStore.clearChat(chatId)
		if (directId) {
			memberStore.clearMembers(directId)
			messageStore.clearChat(directId)
		}
		chatMemberService.disposeChannel(chatId)

		if (directId) {
			directChatEnsureCache.delete(directId)
		}

		const cacheKeys = [
			`chat-${chatId}`,
			`other-member-${chatId}`,
			...(directId ? [`chat-${directId}`, `route-member-${directId}`] : [])
		]
		clearNuxtData(cacheKeys)
	}

	async function resolveCurrentUserId(): Promise<UserId | undefined> {
		if (userStore.userProfile?.user_id) return userStore.userProfile.user_id

		const { supabaseAuth } = useAuth()
		return (await supabaseAuth.getSession()).data.session?.user.id as UserId | undefined
	}

	function ensureDirectChatById(directId: string): Promise<Tables<"chats">> {
		const cached = directChatEnsureCache.get(directId)
		if (cached) return cached

		const task = (async () => {
			const existing = await chatService.resolveDirectChat(directId).catch(() => null)
			if (existing) {
				chatStore.addChats([existing])
				const rows = await chatMemberService.fetchMembers(existing.id)
				memberStore.setMembers(existing.id, rows)
				return existing
			}

			const members = parseDirectId(directId)
			if (!members) throw new Error("Invalid direct chat id")

			const senderId = await resolveCurrentUserId()
			if (!senderId || !members.includes(senderId.trim().toLowerCase() as never)) {
				throw new Error("Cannot send messages in this chat")
			}

			let created: Tables<"chats">
			try {
				created = await chatService.createDirectChat(members[0], members[1])
				chatStore.addChats([created])
			} catch (error) {
				if (!isDuplicateKeyError(error)) throw error

				const raced = await chatService.findChatByDirectId(directId).catch(() => null)
				if (!raced) throw error
				chatStore.addChats([raced])
				return raced
			}

			const rows = await chatMemberService.fetchMembers(created.id)
			memberStore.setMembers(created.id, rows)

			return created
		})()

		task.then(
			() => {
				if (directChatEnsureCache.get(directId) === task) {
					directChatEnsureCache.delete(directId)
				}
			},
			() => {
				if (directChatEnsureCache.get(directId) === task) {
					directChatEnsureCache.delete(directId)
				}
			}
		)
		directChatEnsureCache.set(directId, task)

		return task
	}

	/**
	 * Starts (or reuses) the 1:1 DIRECT chat with another user.
	 * The chat row is created lazily — pass the returned id to the
	 * message composer, or send straight through `useMessage`.
	 */
	async function getOrCreateDirectChat(otherUserId: UserId): Promise<Tables<"chats">> {
		const currentUserId = await resolveCurrentUserId()
		if (!currentUserId) throw new Error("Sign in to send messages")

		if (currentUserId.trim().toLowerCase() === otherUserId.trim().toLowerCase()) {
			throw new Error("Cannot create a chat with yourself")
		}

		return ensureDirectChatById(buildDirectId(currentUserId, otherUserId))
	}

	async function updateMemberRole(memberId: ChatMemberId, role: Enums<"member_role">) {
		const updatedMember = await chatMemberService.updateMemberRole(memberId, role)
		if (updatedMember.chat_id)
			memberStore.upsertMember(updatedMember.chat_id, updatedMember)
		return updatedMember
	}

	async function updateMemberMute(memberId: ChatMemberId, mutedUntil: string | null) {
		const updatedMember = await chatMemberService.updateMemberMute(memberId, mutedUntil)
		if (updatedMember.chat_id)
			memberStore.upsertMember(updatedMember.chat_id, updatedMember)
		return updatedMember
	}

	async function removeGroupMember(chatId: ChatId, memberId: ChatMemberId) {
		const member = await chatMemberService.findMember(chatId, memberId)
		if (member) {
			await sendMemberLeftInfo(chatId, member.user_id)
		}

		await chatMemberService.deleteChatMember(chatId, memberId)
		memberStore.removeMember(chatId, memberId)
	}

	async function leaveGroup(chatId: ChatId, memberId: ChatMemberId, successorMemberId?: ChatMemberId) {
		if (successorMemberId) {
			await updateMemberRole(successorMemberId, 'OWNER')
		}

		const member = await chatMemberService.findMember(chatId, memberId)
		if (member) {
			await sendMemberLeftInfo(chatId, member.user_id)
		}

		await chatMemberService.deleteChatMember(chatId, memberId)
		memberStore.removeMember(chatId, memberId)
		chatStore.removeChat(chatId)
	}

	return {
		createChat,
		getChat,
		resolveChat,
		ensureDirectChatById,
		getOrCreateDirectChat,
		deleteChat,
		getChatMembers: (targetChatId: ChatId) => chatMemberService.fetchMembers(targetChatId),
		updateGroupChat,
		updateMemberRole,
		updateMemberMute,
		removeGroupMember,
		leaveGroup,
		updateChat: chatService.updateChat,
		uploadChatAsset: chatService.uploadChatAsset
	}
}
