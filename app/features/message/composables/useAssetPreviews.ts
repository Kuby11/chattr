export function useAssetPreviews(assets: Ref<File[]>) {
	const previews = ref<string[]>([])

	function revokeAll() {
		previews.value.forEach(url => URL.revokeObjectURL(url))
	}

	watch(
		assets,
		(files) => {
			revokeAll()
			previews.value = files.map(file => URL.createObjectURL(file))
		},
		{ immediate: true }
	)

	onScopeDispose(revokeAll)

	return previews
}
