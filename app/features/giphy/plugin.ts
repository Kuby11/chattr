import { defineFeaturePlugin } from '@shared/composables'
import { useGiphy } from './composables/useGiphy'

export interface GiphyFeatureContract {
	useGiphy: typeof useGiphy
}

declare module '@shared/composables/useFeature' {
	interface FeatureContracts {
		giphy: GiphyFeatureContract
	}
}

export default defineFeaturePlugin('giphy', { useGiphy })
