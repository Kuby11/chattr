import type { Enums } from '@shared/types'
import { useUserPresenceApi, useUserPresenceStore } from '@features/user'

export type PresencePolicy = Enums<'user_presence_policy'>

export const usePrivacySettings = () => {
	const presenceApi = useUserPresenceApi()
	const presenceStore = useUserPresenceStore()

	const presencePolicy = shallowRef<PresencePolicy>('EVERYONE')
	const isLoading = shallowRef(true)
	const isSaving = shallowRef(false)
	const loadError = shallowRef(false)

	async function loadPresencePolicy() {
		isLoading.value = true
		loadError.value = false

		try {
			const presence = await presenceApi.findCurrentUserPresence()
			presencePolicy.value = presence?.presence_policy ?? 'EVERYONE'

			if (presence) presenceStore.upsertUserPresenceRow(presence)
		} catch (error) {
			loadError.value = true
			console.error('Failed to load privacy settings:', error)
		} finally {
			isLoading.value = false
		}
	}

	async function savePresencePolicy(policy: PresencePolicy) {
		const previousPolicy = presencePolicy.value
		presencePolicy.value = policy
		isSaving.value = true

		try {
			const presence = await presenceApi.updatePresencePolicy(policy)
			presenceStore.upsertUserPresenceRow(presence)
		} catch (error) {
			presencePolicy.value = previousPolicy
			throw error
		} finally {
			isSaving.value = false
		}
	}

	return {
		presencePolicy,
		isLoading,
		isSaving,
		loadError,
		loadPresencePolicy,
		savePresencePolicy,
	}
}
