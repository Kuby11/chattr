import { signalStore, withState, withMethods, patchState } from '@ngrx/signals'
import { User, UserService } from '.';
import { inject } from '@angular/core';

const initialValue: { user: User | undefined } = {
  user: undefined
};

export const currentUserStore = signalStore(
	{ providedIn: 'root' },
	withState(initialValue),
	withMethods((state) => ({
		loadCurrentUser: () => {
			const userService = inject(UserService)
			userService.getMe()
			.subscribe((user: User) => {
				patchState(state, { user })
			})
		},
		setCurrentUser: (user: User ) => patchState(state, { user }),
		resetCurrentUser: () => patchState(state, initialValue)
	}))
)
