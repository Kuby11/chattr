export type GiphyRating = "g" | "pg" | "pg-13" | "r"

export interface GiphyImage {
	url: string
	width: string
	height: string
	size?: string
	mp4?: string
	webp?: string
}

export interface GiphyGif {
	id: string
	title: string
	url: string
	slug: string
	images: {
		original: GiphyImage
		downsized: GiphyImage
		fixed_height: GiphyImage
		fixed_height_small: GiphyImage
		preview_gif: GiphyImage
	}
}

export interface GiphyPagination {
	total_count: number
	count: number
	offset: number
}

export interface GiphyListResponse {
	data: GiphyGif[]
	pagination: GiphyPagination
}

export interface GiphySearchParams {
	q: string
	limit?: number
	offset?: number
	rating?: GiphyRating
	lang?: string
}

export interface GiphyTrendingParams {
	limit?: number
	offset?: number
	rating?: GiphyRating
}

/** Payload ready for a feature layer to send (e.g. as a chat message). */
export interface GiphySendPayload {
	id: string
	title: string
	url: string
	previewUrl: string
	width: number
	height: number
}
