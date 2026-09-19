const isMobileHeaderDrawerOpen = ref(false)

export function useHeaderDrawer() {
	const close = () => {
		isMobileHeaderDrawerOpen.value = false
	}

	return {
		isOpen: isMobileHeaderDrawerOpen,
		close,
	}
}