export const useProfileOverlay = () => {
	const overlay = useOverlay()

	const LazyProfileOverlay = defineAsyncComponent(() => import('../ui/local/ProfileOverlay.vue'))

	const profileModal = overlay.create(LazyProfileOverlay)

	return {
		open: profileModal.open,
		close: profileModal.close,
	}
}
