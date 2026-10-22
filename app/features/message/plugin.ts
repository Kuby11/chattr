import { defineFeaturePlugin } from '@shared/composables'
import { useGroupRunAvatars } from './composables/useGroupRunAvatars'
import { useMessage } from './composables/useMessage'
import { useMessageInfo } from './composables/useMessageInfo'
import { useMessagePrefetch } from './composables/useMessagePrefetch'
import { useMessageScroll } from './composables/useMessageScroll'
import { useMessageState } from './composables/useMessageState'
import { useTyping } from './composables/useTyping'

export interface MessageFeatureContract {
	useMessage: typeof useMessage
	useMessageState: typeof useMessageState
	useMessageInfo: typeof useMessageInfo
	useMessagePrefetch: typeof useMessagePrefetch
	useMessageScroll: typeof useMessageScroll
	useGroupRunAvatars: typeof useGroupRunAvatars
	useTyping: typeof useTyping
}

declare module '@shared/composables/useFeature' {
	interface FeatureContracts {
		message: MessageFeatureContract
	}
}

export default defineFeaturePlugin('message', {
	useMessage,
	useMessageState,
	useMessageInfo,
	useMessagePrefetch,
	useMessageScroll,
	useGroupRunAvatars,
	useTyping,
})
