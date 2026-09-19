import type { FriendshipId, Tables, UserId } from "@shared/types"
import { useProfileStore } from "@features/profile"
import { useAuth } from "@features/auth"
import { useFriendshipApi } from "../api/useFriendshipApi"
import type { FriendRequestType } from "../types/FriendRequestTypes"
import { defineStore } from "pinia"

export const useFriendshipStore = defineStore('friendshipStore', () => {
	const userStore = useProfileStore()
	const friendshipService = useFriendshipApi()
	const { onAuthStateChange } = useAuth()
	
	const friends = ref<{ friendId: Tables<"user_profiles">['id']}[]>([])
	const incomeRequests = ref<Tables<"friendships">[]>([])
	const sentRequests = ref<Tables<"friendships">[]>([])

	function hasRequest(hasIn: FriendRequestType,requestId: FriendshipId){
		const requests = hasIn === 'income' ? incomeRequests : sentRequests
		
		return requests.value.some(req => req.id === requestId)
	}

	function addRequest(pushTo: FriendRequestType, request: Tables<"friendships">){
		const requests = pushTo === 'income' ? incomeRequests : sentRequests
		
		requests.value.push(request)
	}

	function removeRequest(removeFrom: FriendRequestType, requestId: FriendshipId){
		const state = removeFrom === 'income' ? incomeRequests : sentRequests

		state.value = state.value.filter(req => req.id !== requestId)
	}

	function addFriend(id: UserId){
		friends.value = [...friends.value, { friendId: id }]
	}

	function removeFriend(id: UserId){
		friends.value = (friends.value ?? []).filter(({ friendId }) => friendId !== id)
	}

	function friendshipStatus(friendId: UserId){
		let status: "IS_FRIEND" | "SENT_REQUEST" | "PENDING_REQUEST" | "NOT_FRIEND" | "YOURSELF"

		switch (true) {
			case friendId === userStore.userProfile?.user_id:
				status = "YOURSELF" 
				break;
			case sentRequests.value.some(req => req.receiver_id === friendId):
				status = "SENT_REQUEST"
				break;
			case incomeRequests.value.some(req => req.requester_id === friendId):
				status = "PENDING_REQUEST"
				break;
			case friends.value?.some(friend => friend.friendId === friendId):
				status = "IS_FRIEND"
				break;
			default:
				status = "NOT_FRIEND"
				break;
		}

		return status
	}
	
	function isFriend(id: FriendshipId){
		return friends.value?.some(friend => friend.friendId === id)
	}

	async function filterFriends(term: string) {
		const currentFriends = friends.value ?? []
		const trimmedTerm = term.trim()

		if (!trimmedTerm) {
			return currentFriends
		}

		if (!currentFriends.length) {
			return []
		}

		const matchingIds = await friendshipService.filterFriendIdsByTerm(
			currentFriends.map(friend => friend.friendId),
			trimmedTerm
		)

		return currentFriends.filter(friend => matchingIds.has(friend.friendId))
	}

	watch(() => userStore.userProfile,() => {
		if(userStore.userProfile){
			Promise.all([
				friendshipService.getUserFriends(userStore.userProfile.user_id),
				friendshipService.getIncomeFriendRequests(),	
				friendshipService.getSentFriendRequests()
			])
			.then(([friendsData, incomeRequestsData, sentRequestsData]) => {
				friends.value = friendsData
				incomeRequests.value = incomeRequestsData 
				sentRequests.value = sentRequestsData
			})
			.catch((error) => {
				throw error
			})
		}
	}, { immediate: true })

	onAuthStateChange(async (event) => {
		if(event === 'SIGNED_OUT') {
			friends.value = []
			incomeRequests.value = []
			sentRequests.value = []
		}
	})

	return {
		friends,
		incomeRequests,
		sentRequests,
		hasRequest,
		addRequest,
		removeRequest,
		addFriend,
		removeFriend,
		isFriend,
		friendshipStatus,
		filterFriends
	}
})
