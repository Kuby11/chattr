import { inject, type App, type InjectionKey } from 'vue'

/**
 * The public surface a feature exposes to other features.
 *
 * This interface intentionally starts empty. Each feature augments it from its
 * own `plugin.ts`, so this shared module never needs to import feature code.
 */
// Empty by design: each feature adds its own member via declaration merging.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FeatureContracts {}

export type FeatureName = keyof FeatureContracts

function getFeatureKey<K extends FeatureName>(name: K): InjectionKey<FeatureContracts[K]> {
	return Symbol.for(`chattr:feature:${name}`) as InjectionKey<FeatureContracts[K]>
}

export type FeatureProvider = (app: App) => void

/**
 * Declare a feature's public contract in its own `plugin.ts`.
 * The root feature plugin discovers and mounts every feature provider.
 */
export function defineFeaturePlugin<K extends FeatureName>(
	name: K,
	contract: FeatureContracts[K],
): FeatureProvider {
	return (app) => {
		app.provide(getFeatureKey(name), contract)
	}
}

/**
 * Resolve a feature contract from its own injection key.
 *
 * Feature stores are intentionally not part of a feature's contract. Read state
 * through the owning feature's composable getters instead.
 *
 * @example
 * const { useProfile } = useFeature('profile')
 * const { getCurrentUserId } = useProfile()
 */
export function useFeature<K extends FeatureName>(name: K): FeatureContracts[K] {
	const feature = inject(getFeatureKey(name))

	if (!feature) {
		throw new Error(
			`[chattr] Feature "${name}" is not registered. Default-export defineFeaturePlugin('${name}', contract) from app/features/${name}/plugin.ts.`
		)
	}

	return feature
}
