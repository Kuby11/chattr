import { signalStore, withState, withMethods, patchState } from '@ngrx/signals'
import { User, UserService } from '.';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

interface UserStore { 
	currentUser: User | null
	users: User[],
	isLoading: boolean
}

const initialValue: UserStore  = {
  currentUser: null,
	users: [],
	isLoading: false
};

export const userStore = signalStore(
	{ providedIn: 'root' },
	withState(initialValue),
	withMethods(state => {
		const api = inject(UserService)
		return {			
			loadCurrentUser: () => {
				patchState(state, { isLoading: true })
				api.getMe()
				.subscribe((currentUser: User) => {
					patchState(state, { currentUser, isLoading: false })
				})
			},
			setCurrentUser: (currentUser: User ) => patchState(state, { currentUser }),
			resetCurrentUser: () => patchState(state, initialValue),

			findUsers: (searchQuery: string) => {
				patchState(state, { isLoading: true }) 
				api.findUsersByQuery(searchQuery)
				.subscribe((users) => {
					patchState(state, { users, isLoading: false })
				})
			},

		}
	})
)
