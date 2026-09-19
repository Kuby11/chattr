export function getProfileAssetUrl(urlOrPath?: string | null): string {
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
		const { data } = supabase.storage.from('profile-assets').getPublicUrl(urlOrPath)
		return data.publicUrl
	} catch {
		return urlOrPath
	}
}
