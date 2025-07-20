import { signalStore, withState, withMethods, patchState } from '@ngrx/signals'
import { Profile, ProfileService } from '.'
import { inject } from '@angular/core';

interface ProfileStore { 
  currentProfile: Profile,
  profiles: Profile[]
}

const initialValue: ProfileStore = {
  currentProfile: {
    displayName: '',
    id: '',
    avatar: '',
    userId: '',
    bio: ''
  },
  profiles: []
};

export const profileStore = signalStore(
	{ providedIn: 'root' },
	withState(initialValue),
	withMethods(state => {
    const api = inject(ProfileService)

    return {
      loadCurrentProfile: () => {
        api.getCurrentProfile()
        .subscribe((currentProfile: Profile) => {
          patchState(state, { currentProfile })
        })
      },
      setCurrentProfile: (currentProfile: Profile ) => patchState(state, { currentProfile }),
      resetCurrentProfile: () => patchState(state, initialValue),

      findProfiles: (searchQuery: string) => {
				api.findProfilesByQuery(searchQuery)
				.subscribe((profiles) => {
					patchState(state, { profiles })
				})
			},
    }
	})
)
