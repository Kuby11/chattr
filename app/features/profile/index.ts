import ProfileButton from './ui/public/ProfileButton.vue'
import ProfileContent from './ui/local/ProfileContent.vue'
import ProfilePopoverContent from './ui/public/ProfilePopoverContent.vue'

const UserCard = defineAsyncComponent(() => import('./ui/public/UserCard.vue'))

export { ProfileButton, ProfileContent, ProfilePopoverContent, UserCard }

export * from './composables/useProfileOverlay'
export * from './composables/useProfile'
export * from './stores/profileStore'
export * from './api/useProfileApi'
export * from './types/ProfileUpdatePayload'
export { getProfileAssetUrl } from './utils/getProfileAssetUrl'
