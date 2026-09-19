import type {
	GiphyGif,
	GiphyListResponse,
	GiphySearchParams,
	GiphySendPayload,
	GiphyTrendingParams,
} from "../types/giphy"

const GIPHY_API_BASE = "https://api.giphy.com/v1/gifs"

export const useGiphyApi = () => {
	const config = useRuntimeConfig()

	function getApiKey() {
		const key = config.public.giphyKey
		if (!key) {
			throw new Error("Missing Giphy API key. Set GIPHY_KEY in your environment.")
		}
		return key as string
	}

	async function request(
		path: string,
		params: Record<string, string | number | undefined>
	) {
		const query = new URLSearchParams({
			api_key: getApiKey(),
		})

		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== "") {
				query.set(key, String(value))
			}
		}

		return $fetch<GiphyListResponse>(`${GIPHY_API_BASE}${path}?${query.toString()}`)
	}

	function searchGifs({
		q,
		limit = 25,
		offset = 0,
		rating = "pg-13",
		lang = "en",
	}: GiphySearchParams) {
		return request("/search", { q, limit, offset, rating, lang })
	}

	function getTrendingGifs({
		limit = 25,
		offset = 0,
		rating = "pg-13",
	}: GiphyTrendingParams = {}) {
		return request("/trending", { limit, offset, rating })
	}

	async function getGifById(id: string) {
		const key = getApiKey()
		const response = await $fetch<{ data: GiphyGif }>(
			`${GIPHY_API_BASE}/${id}?api_key=${encodeURIComponent(key)}`
		)
		return response.data
	}

	function toSendPayload(gif: GiphyGif): GiphySendPayload {
		const image = gif.images.original
		const preview = gif.images.fixed_height ?? gif.images.downsized

		return {
			id: gif.id,
			title: gif.title,
			url: image.url,
			previewUrl: preview.url,
			width: Number(image.width) || 0,
			height: Number(image.height) || 0,
		}
	}

	return {
		searchGifs,
		getTrendingGifs,
		getGifById,
		toSendPayload,
	}
}
