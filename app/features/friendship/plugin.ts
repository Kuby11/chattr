import { defineFeaturePlugin } from '@shared/composables'
import { useFriendship } from './composables/useFriendship'

export interface FriendshipFeatureContract {
	useFriendship: typeof useFriendship
}

declare module '@shared/composables/useFeature' {
	interface FeatureContracts {
		friendship: FriendshipFeatureContract
	}
}

export default defineFeaturePlugin('friendship', { useFriendship })
