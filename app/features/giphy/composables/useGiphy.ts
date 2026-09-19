import { useGiphyApi } from "../api/useGiphyApi"
import { useGiphyStore } from "../stores/giphyStore"
import type { GiphyGif, GiphySearchParams, GiphyTrendingParams } from "../types/giphy"

export const useGiphy = () => {
	const giphyService = useGiphyApi()
	const giphyStore = useGiphyStore()

	async function search(params: GiphySearchParams | string, append = false) {
		const searchParams: GiphySearchParams =
			typeof params === "string" ? { q: params } : params

		if (!searchParams.q.trim()) {
			giphyStore.setResults([])
			return []
		}

		giphyStore.pending = true
		giphyStore.error = null
		giphyStore.query = searchParams.q

		try {
			const response = await giphyService.searchGifs({
				...searchParams,
				offset: append ? giphyStore.offset : searchParams.offset ?? 0,
			})
			giphyStore.setResults(response.data, response.pagination, append)
			return response.data
		} catch (err) {
			giphyStore.error = err instanceof Error ? err.message : "Failed to search GIFs"
			throw err
		} finally {
			giphyStore.pending = false
		}
	}

	async function loadTrending(params: GiphyTrendingParams = {}, append = false) {
		giphyStore.pending = true
		giphyStore.error = null
		giphyStore.query = ""

		try {
			const response = await giphyService.getTrendingGifs({
				...params,
				offset: append ? giphyStore.offset : params.offset ?? 0,
			})
			giphyStore.setResults(response.data, response.pagination, append)
			return response.data
		} catch (err) {
			giphyStore.error = err instanceof Error ? err.message : "Failed to load trending GIFs"
			throw err
		} finally {
			giphyStore.pending = false
		}
	}

	async function loadMore(limit = 25) {
		if (giphyStore.pending) return []
		if (giphyStore.offset >= giphyStore.totalCount) return []

		if (giphyStore.query) {
			return search({ q: giphyStore.query, limit }, true)
		}

		return loadTrending({ limit }, true)
	}

	/** Selects a GIF and returns a send-ready payload for feature layers. */
	function sendGif(gif: GiphyGif) {
		const payload = giphyService.toSendPayload(gif)
		giphyStore.selectGif(gif, payload)
		return payload
	}

	function clearSentGif() {
		giphyStore.clearSelection()
	}

	return {
		query: computed(() => giphyStore.query),
		results: computed(() => giphyStore.results),
		selectedGif: computed(() => giphyStore.selectedGif),
		selectedPayload: computed(() => giphyStore.selectedPayload),
		pending: computed(() => giphyStore.pending),
		error: computed(() => giphyStore.error),
		hasMore: computed(() => giphyStore.offset < giphyStore.totalCount),
		search,
		loadTrending,
		loadMore,
		sendGif,
		clearSentGif,
		getGifById: giphyService.getGifById,
		toSendPayload: giphyService.toSendPayload,
		reset: giphyStore.reset,
	}
}
