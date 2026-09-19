import type { Tables } from "@shared/types"

export type ChatInviteWithChat = Tables<"chat_invites"> & {
	chats: Tables<"chats"> | null
}

export const useChatInviteApi = () => {
	const supabase = useSupabaseClient()

	async function getOrCreateInvite(chatId: string): Promise<{ token: string; expires_at: string } | null> {
		const { data, error } = await supabase.rpc('get_or_create_chat_invite', {
			p_chat_id: chatId
		})

		if (error) throw error
		return data?.[0] ?? null
	}

	async function fetchInviteByChatId(chatId: string): Promise<{ token: string; expires_at: string } | null> {
		const { data, error } = await supabase
			.from('chat_invites')
			.select('token, expires_at')
			.eq('chat_id', chatId)
			.maybeSingle()

		if (error) throw error
		return data
	}

	async function joinByInvite(token: string): Promise<string> {
		const { data, error } = await supabase.rpc('join_chat_by_invite', {
			p_token: token
		})

		if (error) throw error
		return data as string
	}

	async function fetchInviteByToken(token: string): Promise<ChatInviteWithChat | null> {
		const { data, error } = await supabase
			.from('chat_invites')
			.select('*, chats(*)')
			.eq('token', token)
			.maybeSingle()

		if (error) throw error
		return data as unknown as ChatInviteWithChat | null
	}

	async function fetchMemberCount(chatId: string): Promise<number> {
		const { count, error } = await supabase
			.from('chat_members')
			.select('*', { count: 'exact', head: true })
			.eq('chat_id', chatId)

		if (error) return 0
		return count ?? 0
	}

	async function checkIsMember(chatId: string, userId?: string): Promise<boolean> {
		let uid = userId
		if (!uid) {
			const { data: { session } } = await supabase.auth.getSession()
			uid = session?.user?.id
		}
		if (!uid) return false

		const { data, error } = await supabase
			.from('chat_members')
			.select('id')
			.eq('chat_id', chatId)
			.eq('user_id', uid)
			.maybeSingle()

		if (error) {
			console.warn('checkIsMember error:', error)
			return false
		}
		return !!data
	}

	return {
		getOrCreateInvite,
		fetchInviteByChatId,
		joinByInvite,
		fetchInviteByToken,
		fetchMemberCount,
		checkIsMember
	}
}
