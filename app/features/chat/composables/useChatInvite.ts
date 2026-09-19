import { useChatInviteApi, type ChatInviteWithChat } from "../api/useChatInviteApi"
import { useChatStore } from "../stores/chatStore"
import { useAuthStore } from "@features/auth"
import { useMessageInfo } from "@features/message"
import type { ChatId, UserId } from "@shared/types"

export type { ChatInviteWithChat }

export const useChatInvite = () => {
	const inviteService = useChatInviteApi()
	const chatStore = useChatStore()
	const authStore = useAuthStore()
	const supabaseUser = useSupabaseUser()
	const { sendMemberJoinedInfo } = useMessageInfo()

	async function getOrCreateInvite(chatId: string) {
		return await inviteService.getOrCreateInvite(chatId)
	}

	async function joinByInvite(token: string) {
		const chatId = await inviteService.joinByInvite(token)
		let targetId = supabaseUser.value?.id ?? authStore.userSession?.id

		if (!targetId) {
			const supabase = useSupabaseClient()
			const { data: { session } } = await supabase.auth.getSession()
			targetId = session?.user.id
		}

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
		return await inviteService.checkIsMember(chatId, userId)
	}

	async function checkMembership(chatId?: string, userId?: string): Promise<boolean> {
		if (!chatId) return false

		if (chatStore.chats?.some(c => c.id === chatId)) {
			return true
		}

		let uid = userId || authStore.userSession?.id || supabaseUser.value?.id
		if (!uid) {
			const supabase = useSupabaseClient()
			const { data: { session } } = await supabase.auth.getSession()
			uid = session?.user?.id
		}

		if (!uid) return false

		return await inviteService.checkIsMember(chatId, uid)
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
