import { defineFeaturePlugin } from '@shared/composables'
import { useChat } from './composables/useChat'
import { useChatMember } from './composables/useChatMember'

export interface ChatFeatureContract {
	useChat: typeof useChat
	useChatMember: typeof useChatMember
}

declare module '@shared/composables/useFeature' {
	interface FeatureContracts {
		chat: ChatFeatureContract
	}
}

export default defineFeaturePlugin('chat', { useChat, useChatMember })
