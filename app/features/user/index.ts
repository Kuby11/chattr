export * from './composables/useUserPresence'
export * from './stores/userPresenceStore'
export { useUserPresenceApi } from './api/useUserPresenceApi'

const userPresenceLabel = defineAsyncComponent(() => import('./ui/public/userPresenceLabel.vue'))
const PresenceAvatar = defineAsyncComponent(() => import('./ui/public/PresenceAvatar.vue'))

export { userPresenceLabel, PresenceAvatar }
