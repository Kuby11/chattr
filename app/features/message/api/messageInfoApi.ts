import type { ChatId, Tables, UserId } from '@shared/types'

export type MemberInfoEvent = 'joined' | 'leaved'

export const useMessageInfoApi = () => {
	const supabase = useSupabaseClient()

	async function insertMemberInfo(
		chatId: ChatId,
		targetId: UserId,
		event: MemberInfoEvent,
	): Promise<Tables<'messages'>> {
		const { data, error } = await supabase
			.from('messages')
			.insert({
				chat_id: chatId,
				content: `${targetId} has ${event}`,
				type: 'INFO',
			})
			.select('*')
			.single()

		if (error) throw error

		return data
	}

	return {
		insertMemberInfo,
	}
}
