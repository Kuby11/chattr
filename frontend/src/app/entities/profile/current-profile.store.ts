import { signalStore, withState, withMethods, patchState } from '@ngrx/signals'
import { Profile } from '.'

const initialValue: { profile: Profile } = {
  profile: {
    id: '',
    displayName: '',
    avatar: '',
    bio: '',
    userId: '',
  },
};

export const currentProfileStore = signalStore(
	{ providedIn: 'root' },
	withState(initialValue),
	withMethods((state) => ({
		setCurrentProfile: (profile: Profile ) => patchState(state, { profile }),
		resetCurrentProfile: () => patchState(state, initialValue)
	}))
)
