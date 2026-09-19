import type { ChatId, UserId } from '@shared/types'
import { useMessageInfoApi, type MemberInfoEvent } from '../api/messageInfoApi'

export const useMessageInfo = () => {
	const messageInfoService = useMessageInfoApi()

	function sendMemberInfo(chatId: ChatId, targetId: UserId, event: MemberInfoEvent) {
		return messageInfoService.insertMemberInfo(chatId, targetId, event)
	}

	function sendMemberJoinedInfo(chatId: ChatId, targetId: UserId) {
		return sendMemberInfo(chatId, targetId, 'joined')
	}

	function sendMemberLeftInfo(chatId: ChatId, targetId: UserId) {
		return sendMemberInfo(chatId, targetId, 'leaved')
	}

	return {
		sendMemberInfo,
		sendMemberJoinedInfo,
		sendMemberLeftInfo,
	}
}
