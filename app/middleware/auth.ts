import { ROUTE_TOKENS } from "@shared/configs"

export default defineNuxtRouteMiddleware(async () => {
	const session = useSupabaseSession()

	if (!session.value) {
		return navigateTo(ROUTE_TOKENS.LOGIN)
	}
})
