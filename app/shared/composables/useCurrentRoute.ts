export interface CurrentRouteState {
	route: string
	icon: string
}

const currentRoute = ref<CurrentRouteState>({
	route: 'home',
	icon: 'fluent:chat-24-filled'
})

export function useCurrentRoute() {
	const setCurrentRoute = (route: Partial<CurrentRouteState>) => {
		currentRoute.value = {
			...currentRoute.value,
			...route
		}
	}

	return {
		currentRoute,
		setCurrentRoute,
	}
}