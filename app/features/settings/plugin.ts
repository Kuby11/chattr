import { defineFeaturePlugin } from '@shared/composables'
import { usePrivacySettings } from './composables/usePrivacySettings'

export interface SettingsFeatureContract {
	usePrivacySettings: typeof usePrivacySettings
}

declare module '@shared/composables/useFeature' {
	interface FeatureContracts {
		settings: SettingsFeatureContract
	}
}

export default defineFeaturePlugin('settings', { usePrivacySettings })
