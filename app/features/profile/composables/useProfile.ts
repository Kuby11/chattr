import type { UserId } from "@shared/types"
import { toValue, type MaybeRefOrGetter } from "vue"
import { useProfileStore } from "../stores/profileStore"
import { createProfileApi } from "../api/profileApi"

export const useProfile = () => {
	const profileStore = useProfileStore()
	const profileService = createProfileApi(useSupabaseClient())

	function getCurrentUserProfile() {
		return profileStore.userProfile
	}

	function getCurrentUserId() {
		return profileStore.userProfile?.user_id
	}

	function isCurrentUser(userId: MaybeRefOrGetter<UserId>) {
		const resolvedId = toValue(userId)
		return !!resolvedId && resolvedId === profileStore.userProfile?.user_id
	}

	return {
		getCurrentUserProfile,
		getCurrentUserId,
		isCurrentUser,
		findUserProfile: profileService.findUserProfile,
		findUserProfiles: profileService.findUserProfiles,
		searchUserProfiles: profileService.searchUserProfiles,
		updateUserProfile: profileStore.updateProfile
	}
}
