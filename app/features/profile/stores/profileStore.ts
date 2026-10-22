import type { Tables } from "@shared/types"
import { useFeature } from "@shared/composables"
import type { ProfileUpdatePayload } from "../types/ProfileUpdatePayload"
import { createProfileApi } from "../api/profileApi"

export const useProfileStore = defineStore('profileStore', () => {
	const { useAuth } = useFeature('auth')
	const { onAuthStateChange } = useAuth()
	const supabase = useSupabaseClient()
	const { updateUserProfile, fetchUserProfile } = createProfileApi(supabase)

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

		const updatedFields = await updateUserProfile(updated, userProfile.value.user_id)

		userProfile.value = {
			...userProfile.value,
			...updatedFields
		}
	}

	async function initUserProfile() {
		if (userProfile.value) return
		const session = (await supabase.auth.getSession()).data.session
		if (session?.user) {
			userProfile.value = await fetchUserProfile(session.user.id).catch(() => null)
		}
	}

	initUserProfile()

	onAuthStateChange(async (event, session) => {
		if (event === 'SIGNED_OUT') {
			userProfile.value = undefined
			return
		}

		if (session) {
			userProfile.value = await fetchUserProfile(session.user.id).catch(() => null)
		}
	})

	return {
		userProfile,
		updateProfile,
	}
})