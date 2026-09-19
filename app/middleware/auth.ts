import { ROUTE_TOKENS } from "@shared/configs"

export default defineNuxtRouteMiddleware(async (to) => {
	const session = useSupabaseSession()

	await new Promise((resolve) => {
		if (session.value !== undefined) {
			resolve(true)
		} else {
			const unwatch = watch(session, () => {
				unwatch()
				resolve(true)
			}, { immediate: true })
		}
	})

	if (!session.value) {
		return navigateTo(ROUTE_TOKENS.LOGIN, { replace: true })
	}
})
