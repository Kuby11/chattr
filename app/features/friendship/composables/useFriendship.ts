import type { FriendshipId, UserId } from "@shared/types"
import { useFriendshipStore } from "../stores/friendshipStore"
import { useFriendshipApi } from "../api/useFriendshipApi"

export const useFriendship = () => {
	const friendshipStore = useFriendshipStore()
	const friendshipService = useFriendshipApi()

	async function sendFriendRequest(userId: UserId){
		if(friendshipStore.sentRequests.some(req => req.receiver_id === userId)) 
			throw new Error("already have sent friend request to this user!")

		const friendRequest = await friendshipService.sendFriendRequest(userId)

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

	return {
		isFriend: friendshipStore.isFriend,
		sendFriendRequest,
		acceptFriendRequest,
		rejectFriendRequest,
		cancelFriendRequest,
		deleteFriend,
	}
}
