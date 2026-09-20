import { ROUTE_TOKENS } from "@shared/configs"

export default defineNuxtRouteMiddleware(async () => {
	const sessionState = useSupabaseSession()
	if (sessionState.value) {
		return navigateTo(ROUTE_TOKENS.HOME, { replace: true })
	}

	const supabase = useSupabaseClient()
	const { data: { session } } = await supabase.auth.getSession()

	if (session) {
		return navigateTo(ROUTE_TOKENS.HOME, { replace: true })
	}
})
