import { defineStore } from "pinia"

export const useAuthStore = defineStore('authStore', () => {
	const supabaseUserSession = useSupabaseUser()
	const supabaseAuthSession = useSupabaseSession()

	const userSession = computed(() => supabaseUserSession.value)
	const isUserAuth = computed(() => !!supabaseAuthSession.value)

	return {
		userSession,
		isUserAuth,
	}
})
