import type { FriendshipId, UserId } from "@shared/types"
import { useFeature } from "@shared/composables"
import { useFriendshipStore } from "../stores/friendshipStore"
import { createFriendshipApi } from "../api/friendshipApi"

export const useFriendship = () => {
	const friendshipStore = useFriendshipStore()
	const { useProfile } = useFeature('profile')
	const { getCurrentUserId } = useProfile()
	const friendshipService = createFriendshipApi(useSupabaseClient())

	async function sendFriendRequest(userId: UserId){
		if(friendshipStore.sentRequests.some(req => req.receiver_id === userId)) 
			throw new Error("already have sent friend request to this user!")

		const requesterId = getCurrentUserId()
		if (!requesterId) throw new Error("Sign in to send friend requests")

		const friendRequest = await friendshipService.sendFriendRequest(userId, requesterId)

		friendshipStore.addRequest('sent', friendRequest)
	}

	async function acceptFriendRequest(requestId: FriendshipId) {
		const friendRequest = await friendshipService.acceptFriendRequest(requestId)
	
		friendshipStore.addFriend(friendRequest.requester_id)
		friendshipStore.removeRequest('income', requestId)
	}

	async function rejectFriendRequest(requestId: FriendshipId) {		
		if(!friendshipStore.hasRequest('income', requestId))
			return
		
		const friendRequest = await friendshipService.deleteRequest(requestId)
		
		friendshipStore.removeRequest('income', friendRequest.id)
	}
	
	async function cancelFriendRequest(requestId: FriendshipId){
		if(!friendshipStore.hasRequest('sent', requestId))
			return
		
		const friendRequest = await friendshipService.deleteRequest(requestId)

		friendshipStore.removeRequest('sent', friendRequest.id)
	}
	
	async function deleteFriend(friendId: UserId) {
		if(!friendshipStore.isFriend(friendId))
			return
	
		await friendshipService.deleteFriend(friendId)

		friendshipStore.removeFriend(friendId)
	}

	function getFriends() {
		return friendshipStore.friends
	}

	function getFriendIds() {
		return friendshipStore.friends.map(friend => friend.friendId)
	}

	function getIncomeRequests() {
		return friendshipStore.incomeRequests
	}

	function getSentRequests() {
		return friendshipStore.sentRequests
	}

	function friendshipStatus(userId: UserId) {
		return friendshipStore.friendshipStatus(userId)
	}

	function filterFriends(term: string) {
		return friendshipStore.filterFriends(term)
	}

	return {
		getFriends,
		getFriendIds,
		getIncomeRequests,
		getSentRequests,
		friendshipStatus,
		filterFriends,
		isFriend: friendshipStore.isFriend,
		sendFriendRequest,
		acceptFriendRequest,
		rejectFriendRequest,
		cancelFriendRequest,
		deleteFriend,
	}
}
