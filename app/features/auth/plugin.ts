import { defineFeaturePlugin } from '@shared/composables'
import { useAuth } from './composables/useAuth'

export interface AuthFeatureContract {
	useAuth: typeof useAuth
}

declare module '@shared/composables/useFeature' {
	interface FeatureContracts {
		auth: AuthFeatureContract
	}
}

export default defineFeaturePlugin('auth', { useAuth })
