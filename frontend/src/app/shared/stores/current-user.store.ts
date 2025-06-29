import { signalStore, withState, withMethods, patchState } from '@ngrx/signals'
import { User, UserRole } from '../interfaces'

const initialValue: { user: User } = {
	user: {
		id: '',
		username: '',
		email: '',
		password: '',		
		role: 'USER' as unknown as UserRole,
		createdAt: new Date(),
		updatedAt: new Date(),
		isBlocked: false,
	},
};

export const currentUserStore = signalStore(
	{ providedIn: 'root' },
	withState(initialValue),
	withMethods((state) => ({
		setCurrentUser: (user: User ) => patchState(state, { user }),
		resetCurrentUser: () => patchState(state, initialValue)
	}))
)
