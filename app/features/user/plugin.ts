import { defineFeaturePlugin } from '@shared/composables'
import { useUserPresence } from './composables/useUserPresence'
import { createUserPresenceApi } from './api/userPresenceApi'

export interface UserFeatureContract {
	useUserPresence: typeof useUserPresence
	createUserPresenceApi: typeof createUserPresenceApi
}

declare module '@shared/composables/useFeature' {
	interface FeatureContracts {
		user: UserFeatureContract
	}
}

export default defineFeaturePlugin('user', {
	useUserPresence,
	createUserPresenceApi,
})
