import type { GiphyGif, GiphySendPayload } from "../types/giphy"

export const useGiphyStore = defineStore("giphyStore", () => {
	const query = ref("")
	const results = ref<GiphyGif[]>([])
	const selectedGif = ref<GiphyGif | null>(null)
	const selectedPayload = ref<GiphySendPayload | null>(null)
	const offset = ref(0)
	const totalCount = ref(0)
	const pending = ref(false)
	const error = ref<string | null>(null)

	function setResults(gifs: GiphyGif[], pagination?: { offset: number; total_count: number }, append = false) {
		results.value = append ? [...results.value, ...gifs] : gifs
		if (pagination) {
			offset.value = pagination.offset + gifs.length
			totalCount.value = pagination.total_count
		}
	}

	function selectGif(gif: GiphyGif | null, payload: GiphySendPayload | null = null) {
		selectedGif.value = gif
		selectedPayload.value = payload
	}

	function clearSelection() {
		selectedGif.value = null
		selectedPayload.value = null
	}

	function reset() {
		query.value = ""
		results.value = []
		offset.value = 0
		totalCount.value = 0
		error.value = null
		clearSelection()
	}

	return {
		query,
		results,
		selectedGif,
		selectedPayload,
		offset,
		totalCount,
		pending,
		error,
		setResults,
		selectGif,
		clearSelection,
		reset,
	}
})
