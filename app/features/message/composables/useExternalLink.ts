const LazyExternalLinkConfirmModal = defineAsyncComponent(() => import('../ui/local/ExternalLinkConfirmModal.vue'))

export const useExternalLinkConfirm = () => {
	const overlay = useOverlay()

	const externalLinkModal = overlay.create(LazyExternalLinkConfirmModal)

	const confirmExternalLink = (url: string): Promise<boolean> => {
		const instance = externalLinkModal.open({ url })

		return instance.result as Promise<boolean>
	}

	return { confirmExternalLink }
}

export function isExternalUrl(href: string): boolean {
	try {
		const url = new URL(String(href), window.location.href)
		return url.hostname !== window.location.hostname
	} catch {
		return false
	}
}