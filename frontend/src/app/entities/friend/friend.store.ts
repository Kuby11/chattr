import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals'
import { Friend } from './interfaces/friend.interface';
import { inject } from '@angular/core';
import { FriendService } from './friend.service';
import { delay, filter, map, tap, throttle } from 'rxjs';
import { FriendRequest } from './interfaces/friend-request.interface';

const initialValue: { 
	friends: Friend[], 
	friendRequests: FriendRequest[],
	isLoading: boolean
} = {
  friends: [],
	friendRequests: [],
	isLoading: false
};

export const friendsStore = signalStore(
	{ providedIn: 'root' },
	withState(initialValue),
	withMethods(state => {
		const api = inject(FriendService)
		
		return {
			loadFriends: () => {
				let friends: undefined | Friend[] = undefined
				api.getFriends()
				.subscribe((friendRes: Friend[])=>{
					friends = friendRes
					patchState(state, { friends })
				})
			},
			removeFriend(friendId: string){
				const friends = state.friends()?.filter(item => item.friendOf.id !== friendId)
				api.removeFriend(friendId)
				.pipe(
					delay(50),
					tap(()=>{
						patchState(state, { friends })
					})
				)
				.subscribe(()=> patchState(state, { friends }))
			},

			isFriend(id: string){
				if(state.friends()?.length === 0) {
					this.loadFriends()
				}
				return state.friends()?.find((friend) => friend.friendOf.id === id)
			},

			getFriendRequests(){
				patchState(state, { isLoading: true })
				api.getFriendRequests()
				.pipe(
					map(requests => requests.filter(request => request.status === 'PENDING'))
				)
				.subscribe(friendRequests => patchState(state, { friendRequests, isLoading: false }))
			},

			acceptFriendRequest(requestId: string){
				const friendRequests = state.friendRequests().filter(request => request.id !== requestId) 
				api.acceptFriendRequest(requestId)
				.subscribe(()=> patchState(state, { friendRequests }))
			},

			declineFriendRequest(requestId: string){
				const friendRequests = state.friendRequests().filter(request => request.id !== requestId) 
				api.acceptFriendRequest(requestId)
				.subscribe(()=> patchState(state, { friendRequests }))
			},

			cancelFriendRequest(requestId: string){
				const friendRequests = state.friendRequests().filter(request => request.id !== requestId) 
				api.cancelFriendRequest(requestId)
				.subscribe(()=> patchState(state, { friendRequests }))
			}
		}
	}),
)
