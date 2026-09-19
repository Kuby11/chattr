import { useProfileStore } from "@features/profile"
import { safeValue } from "@shared/utils"
import type { FriendshipId, UserId } from "@shared/types"

export const useFriendshipApi = () => {
	const supabase = useSupabaseClient()
	const userStore = useProfileStore() 
	
	async function sendFriendRequest(userId: UserId){
		const { data ,error } = await supabase
			.from("friendships")
			.insert({
				status: "PENDING",
				requester_id: userStore.userProfile?.user_id,
				receiver_id: userId
			})
			.select("*")
			.single()
			
		if(error)	throw error
		
		return data
	}

	async function acceptFriendRequest(id: UserId | FriendshipId){
		const { data, error } = await supabase
			.from("friendships")
			.update({ status: "ACCEPTED" })
			.eq('id',id)
			.select("*")
			.single();

		if(error) throw error
			
		return data
	} 

	async function deleteRequest(id: FriendshipId){
		const { data, error } = await supabase
			.from("friendships")
			.delete()
			.eq('id', id)
			.select("*")
			.single();
			
		if(error) throw error
			
		return data
	}

	async function deleteFriend(friendId: UserId) {
		const { error } = await supabase
			.from("friendships")
			.delete()
			.or(`receiver_id.eq.${friendId},requester_id.eq.${friendId}`);

		if(error) throw error
	}

	async function getUserFriends(userId: UserId){
		const friendsIds: { friendId: UserId }[] = []

		const { data, error } = await supabase
			.from("friendships")
			.select("receiver_id,requester_id")
			.eq("status", "ACCEPTED")
			.or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

		if(error) throw error

		for (const friendRequest of data) {
			if(friendRequest.receiver_id === userId) 
				friendsIds.push({ friendId: friendRequest.requester_id})
			else 
				friendsIds.push({ friendId: friendRequest.receiver_id})
		}

		return friendsIds
	}

	async function getIncomeFriendRequests() {
		const { data, error } = await supabase
			.from("friendships")
			.select("*")
			.eq('status', 'PENDING')
			.eq("receiver_id", userStore.userProfile!.user_id);

		if(error) throw error

		return data
	}

	async function getSentFriendRequests() {
		const { data, error } = await supabase
			.from("friendships")
			.select("*")
			.eq('status', 'PENDING')
			.eq("requester_id", userStore.userProfile!.user_id);

		if(error) throw error

		return data
	}

	async function filterFriendIdsByTerm(friendIds: UserId[], term: string): Promise<Set<UserId>> {
		const sanitizedTerm = safeValue(term.trim())

		const { data, error } = await supabase
			.from("user_profiles")
			.select("user_id")
			.in("user_id", friendIds)
			.or(`username.ilike.${sanitizedTerm},nickname.ilike.%${sanitizedTerm}%`)

		if (error) throw error

		return new Set(data.map(profile => profile.user_id))
	}

	return {
		sendFriendRequest,
		acceptFriendRequest,
		deleteRequest,
		deleteFriend,
		getUserFriends,
		getSentFriendRequests,
		getIncomeFriendRequests,
		filterFriendIdsByTerm,
	}
}
