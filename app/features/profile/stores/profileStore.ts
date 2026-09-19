import type { Tables } from "@shared/types"
import { useAuth } from "@features/auth"
import type { ProfileUpdatePayload } from "../types/ProfileUpdatePayload"
import { useProfileApi } from "../api/useProfileApi"

export const useProfileStore = defineStore('profileStore', () => {
	const { onAuthStateChange } = useAuth()
	const { updateUserProfile, fetchUserProfile } = useProfileApi()

	const userProfile = ref<null | undefined | Tables<"user_profiles">>()

	async function updateProfile(changedFields: ProfileUpdatePayload) {
		if (!userProfile.value) return

		const updated: ProfileUpdatePayload = {}

		if (changedFields.nickname !== userProfile.value?.nickname) {
			updated.nickname = changedFields.nickname
		}

		if (changedFields.bio !== userProfile.value?.bio) {
			updated.bio = changedFields.bio
		}

		if (changedFields.avatar) {
			updated.avatar = changedFields.avatar
		}

		if (changedFields.coverPicture) {
			updated.coverPicture = changedFields.coverPicture
		}

		const updatedFields = await updateUserProfile(updated)

		userProfile.value = {
			...userProfile.value,
			...updatedFields
		}
	}

	async function initUserProfile() {
		if (userProfile.value) return
		const client = useSupabaseClient()
		const session = (await client.auth.getSession()).data.session
		if (session?.user) {
			userProfile.value = await fetchUserProfile().catch(() => null)
		}
	}

	initUserProfile()

	onAuthStateChange(async (event, session) => {
		if (event === 'SIGNED_OUT') {
			userProfile.value = undefined
			return
		}

		if (session) {
			userProfile.value = await fetchUserProfile().catch(() => null)
		}
	})

	return {
		userProfile,
		updateProfile,
	}
})