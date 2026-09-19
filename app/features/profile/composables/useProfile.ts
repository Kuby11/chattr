import type { UserId, VueValue } from "@shared/types"
import { useProfileStore } from "../stores/profileStore"
import { useProfileApi } from "../api/useProfileApi"

export const useProfile = () => {
	const profileStore = useProfileStore()
	const profileService = useProfileApi()

	function isCurrentUser(userId: VueValue<UserId>){
		toValue(userId)
  
		return userId === profileStore.userProfile!.user_id
	}

	return {
		isCurrentUser,
		findUserProfile: profileService.findUserProfile,
		findUserProfiles: profileService.findUserProfiles,
		searchUserProfiles: profileService.searchUserProfiles,
		updateUserProfile: profileStore.updateProfile
	}
}