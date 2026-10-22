import { defineFeaturePlugin } from '@shared/composables'
import { useProfile } from './composables/useProfile'
import { useProfileOverlay } from './composables/useProfileOverlay'
import { getProfileAssetUrl } from './utils/getProfileAssetUrl'

export interface ProfileFeatureContract {
	useProfile: typeof useProfile
	useProfileOverlay: typeof useProfileOverlay
	getProfileAssetUrl: typeof getProfileAssetUrl
}

declare module '@shared/composables/useFeature' {
	interface FeatureContracts {
		profile: ProfileFeatureContract
	}
}

export default defineFeaturePlugin('profile', {
	useProfile,
	useProfileOverlay,
	getProfileAssetUrl,
})
