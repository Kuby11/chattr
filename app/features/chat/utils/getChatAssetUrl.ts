export function getChatAssetUrl(urlOrPath?: string | null, bucket = 'chat-assets'): string {
	if (!urlOrPath) return ''

	if (
		urlOrPath.startsWith('http://') ||
		urlOrPath.startsWith('https://') ||
		urlOrPath.startsWith('blob:') ||
		urlOrPath.startsWith('data:')
	) {
		return urlOrPath
	}

	try {
		const supabase = useSupabaseClient()
		const { data } = supabase.storage.from(bucket).getPublicUrl(urlOrPath)
		return data.publicUrl
	} catch {
		return urlOrPath
	}
}
