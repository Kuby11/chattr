import type { FeatureProvider } from '@shared/composables'

/**
 * Features provide their own contracts from `app/features/<name>/plugin.ts`.
 * This root plugin discovers those providers automatically, so adding a
 * feature does not require maintaining a central import list.
 */
const featureProviders = import.meta.glob<FeatureProvider>('../features/*/plugin.ts', {
	eager: true,
	import: 'default',
})

export default defineNuxtPlugin((nuxtApp) => {
	for (const [path, provide] of Object.entries(featureProviders)) {
		if (typeof provide !== 'function') {
			throw new Error(`[chattr] Feature plugin "${path}" must default-export a provider function.`)
		}

		provide(nuxtApp.vueApp)
	}
})
