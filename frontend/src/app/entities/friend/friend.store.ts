import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals'
import { Friend } from './friend.interface';
import { inject } from '@angular/core';
import { FriendService } from './friend.service';
import { delay, tap, throttle } from 'rxjs';

const initialValue: { friends: Friend[] | undefined } = {
  friends: undefined,
};

export const friendsStore = signalStore(
	{ providedIn: 'root' },
	withState(initialValue),
	withMethods(state => {
		const api = inject(FriendService)
		
		return {
			loadFriends: () => {
				let friends: undefined | Friend[] = undefined
				api.getCurrentFriends()
				.subscribe((friendRes: Friend[])=>{
					friends = friendRes
					patchState(state, { friends })
				})
			},
			removeFriend(friendId: string){
				const friends = state.friends()?.filter(item => item.friendOf.id != friendId)
				api.removeFriend(friendId)
				.pipe(
					delay(50),
					tap(()=>{
						patchState(state, { friends })
					})
				)
				.subscribe()
				patchState(state, { friends })
			}
		}
	}),
)
