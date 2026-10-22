import { useFeature } from '@shared/composables'

export const usePrefetchChats = () => {
	const { useMessagePrefetch } = useFeature('message')
	const { prefetchChats } = useMessagePrefetch()

	return {
		prefetchChats
	}
}
