export * from './composables/useUserPresence'
export { createUserPresenceApi } from './api/userPresenceApi'

const userPresenceLabel = defineAsyncComponent(() => import('./ui/public/userPresenceLabel.vue'))
const PresenceAvatar = defineAsyncComponent(() => import('./ui/public/PresenceAvatar.vue'))

export { userPresenceLabel, PresenceAvatar }
