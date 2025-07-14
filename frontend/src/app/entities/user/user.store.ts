import { signalStore, withState, withMethods, patchState } from '@ngrx/signals'
import { User, UserService } from '.';
import { inject } from '@angular/core';

interface UserStore { 
	currentUser: User | undefined,
	users: User[] | undefined,
}

const initialValue: UserStore  = {
  currentUser: undefined,
	users: undefined
};

export const userStore = signalStore(
	{ providedIn: 'root' },
	withState(initialValue),
	withMethods(state => {
		const api = inject(UserService)
		return {			
			loadCurrentUser: () => {
				api.getMe()
				.subscribe((currentUser: User) => {
					patchState(state, { currentUser })
				})
			},
			setCurrentUser: (currentUser: User ) => patchState(state, { currentUser }),
			resetCurrentUser: () => patchState(state, initialValue),
			findUsers: (searchQuery: string) => {
				api.findUsersByQuery(searchQuery)
				.subscribe((usersRes) => {
					const users = usersRes
					patchState(state, { users })
				})
			},
		}
	})
)
