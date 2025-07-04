import { signalStore, withState, withMethods, patchState } from '@ngrx/signals'
import { User } from '.';

const initialValue: { user: User | null } = {
  user: null
};

export const currentUserStore = signalStore(
	{ providedIn: 'root' },
	withState(initialValue),
	withMethods((state) => ({
		setCurrentUser: (user: User ) => patchState(state, { user }),
		resetCurrentUser: () => patchState(state, initialValue)
	}))
)
