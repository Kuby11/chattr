import { signalStore, withState, withMethods, patchState } from '@ngrx/signals'
import { Profile, ProfileService } from '.'
import { inject } from '@angular/core';

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
    loadProfile: () => {
      const profileService = inject(ProfileService)
      profileService.getCurrentProfile()
      .subscribe((profile: Profile) => {
        patchState(state, { profile })
      })
    },
		setCurrentProfile: (profile: Profile ) => patchState(state, { profile }),
		resetCurrentProfile: () => patchState(state, initialValue)
	}))
)
