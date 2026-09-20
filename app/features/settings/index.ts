const SettingsPage = defineAsyncComponent(() => import('./ui/public/SettingsPage.vue'))
const SettingsButton = defineAsyncComponent(() => import('./ui/public/SettingsButton.vue'))
const SettingsProfileForm = defineAsyncComponent(() => import('./ui/public/SettingsProfileForm.vue'))
const SettingsPasswordForm = defineAsyncComponent(() => import('./ui/public/SettingsPasswordForm.vue'))
const SettingsProfilePreview = defineAsyncComponent(() => import('./ui/local/SettingsProfilePreview.vue'))

export { usePrivacySettings } from './composables/usePrivacySettings'
export type { PresencePolicy } from './composables/usePrivacySettings'

export { SettingsButton, SettingsPage, SettingsProfileForm, SettingsPasswordForm, SettingsProfilePreview }
