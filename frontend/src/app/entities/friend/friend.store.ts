import { signalStore, withState, withMethods, patchState } from '@ngrx/signals'
import { Friend } from './friend.interface';
import { inject } from '@angular/core';
import { FriendService } from './friend.service';

const initialValue: { friends: Friend[] | undefined } = {
  friends: undefined,
};

export const friendsStore = signalStore(
	{ providedIn: 'root' },
	withState(initialValue),
	withMethods((state) => ({
		loadFriends: () => {
			const friendService = inject(FriendService)
			let friends: undefined | Friend[] = undefined
			friendService.getCurrentFriends()
				.subscribe((friendRes: Friend[])=>{
					friends = friendRes
					patchState(state, { friends })
				})
		},
	}))
)
