import { useFeature } from "@shared/composables"
import { createChatInviteApi, type ChatInviteWithChat } from "../api/chatInviteApi"
import { useChatStore } from "../stores/chatStore"
import type { ChatId, UserId } from "@shared/types"

export type { ChatInviteWithChat }

export const useChatInvite = () => {
	const supabase = useSupabaseClient()
	const inviteService = createChatInviteApi(supabase)
	const chatStore = useChatStore()
	const { useAuth } = useFeature('auth')
	const { useMessageInfo } = useFeature('message')
	const { getCurrentUserId, resolveCurrentUserId } = useAuth()
	const { sendMemberJoinedInfo } = useMessageInfo()

	async function getOrCreateInvite(chatId: string) {
		return await inviteService.getOrCreateInvite(chatId)
	}

	async function joinByInvite(token: string) {
		const chatId = await inviteService.joinByInvite(token)
		const targetId = await resolveCurrentUserId()

		if (targetId) {
			try {
				await sendMemberJoinedInfo(chatId as ChatId, targetId as UserId)
			} catch (error) {
				console.error('Failed to send group join info message:', error)
			}
		}

		return chatId
	}

	async function fetchInviteByToken(token: string) {
		return await inviteService.fetchInviteByToken(token)
	}

	async function fetchMemberCount(chatId: string) {
		return await inviteService.fetchMemberCount(chatId)
	}

	async function checkIsMember(chatId: string, userId?: string) {
		const uid = userId ?? getCurrentUserId() ?? await resolveCurrentUserId()
		if (!uid) return false

		return await inviteService.checkIsMember(chatId, uid as UserId)
	}

	async function checkMembership(chatId?: string, userId?: string): Promise<boolean> {
		if (!chatId) return false

		if (chatStore.chats?.some(c => c.id === chatId)) {
			return true
		}

		const uid = userId || getCurrentUserId() || await resolveCurrentUserId()
		if (!uid) return false

		return await inviteService.checkIsMember(chatId, uid as UserId)
	}

	return {
		getOrCreateInvite,
		joinByInvite,
		fetchInviteByToken,
		fetchMemberCount,
		checkIsMember,
		checkMembership
	}
}
