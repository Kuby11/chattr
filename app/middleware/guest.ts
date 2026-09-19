export default defineNuxtRouteMiddleware((_, from) => {
	const session = useSupabaseSession()

	if (session.value) {
		return navigateTo(from.fullPath)
	}
})
