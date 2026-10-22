import type { Enums, UserId } from '@shared/types'
import { useFeature } from '@shared/composables'

export type PresencePolicy = Enums<'user_presence_policy'>

export const usePrivacySettings = () => {
	const { useProfile } = useFeature('profile')
	const { useAuth } = useFeature('auth')
	const { createUserPresenceApi, useUserPresence } = useFeature('user')
	const { getCurrentUserId: getProfileUserId } = useProfile()
	const { getCurrentUserId: getAuthUserId } = useAuth()
	const presenceApi = createUserPresenceApi(useSupabaseClient())
	const { upsertUserPresenceRow } = useUserPresence()

	function resolveUserId(): UserId | undefined {
		return getProfileUserId() ?? getAuthUserId()
	}

	const presencePolicy = shallowRef<PresencePolicy>('EVERYONE')
	const isLoading = shallowRef(true)
	const isSaving = shallowRef(false)
	const loadError = shallowRef(false)

	async function loadPresencePolicy() {
		isLoading.value = true
		loadError.value = false

		try {
			const userId = resolveUserId()
			if (!userId) {
				isLoading.value = false
				return
			}

			const presence = await presenceApi.findCurrentUserPresence(userId)
			presencePolicy.value = presence?.presence_policy ?? 'EVERYONE'

			if (presence) upsertUserPresenceRow(presence)
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
			const userId = resolveUserId()
			if (!userId) throw new Error('user session is undefined')

			const presence = await presenceApi.updatePresencePolicy(userId, policy)
			upsertUserPresenceRow(presence)
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
