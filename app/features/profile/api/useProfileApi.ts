import type { Tables, UserId } from "@shared/types"
import { safeValue } from "@shared/utils"
import type { ProfileUpdatePayload } from "../types/ProfileUpdatePayload"

const PROFILE_ASSETS_BUCKET = 'profile-assets'

function getStoragePathFromUrl(url: string | null | undefined, bucket: string): string | null {
	if (!url) return null
	const marker = `/${bucket}/`
	const index = url.indexOf(marker)
	if (index === -1) return null
	const pathPart = url.slice(index + marker.length)
	const cleanPath = pathPart.split('?')[0]?.split('#')[0]
	if (!cleanPath) return null
	return decodeURIComponent(cleanPath)
}

export const useProfileApi = () => {
	const supabase = useSupabaseClient()

	async function searchUserProfiles(searchTerm: string) {
		const { data, error } = await supabase
			.from("user_profiles")
			.select("user_id")
			.or(`username.ilike.${safeValue(searchTerm)},nickname.ilike.%${safeValue(searchTerm)}%`)

		if (error) throw error

		return data
	}

	async function findUserProfile(id: string) {
		const { data, error } = await supabase
			.from("user_profiles")
			.select("*")
			.eq("user_id", id)
			.single()

		if (error) throw error

		return data
	}

	async function findUserProfiles(ids: UserId[]) {
		if (!ids.length) return []

		const { data, error } = await supabase
			.from("user_profiles")
			.select("*")
			.in("user_id", ids)

		if (error) throw error

		return data
	}

	async function updateUserProfile(changedFields: ProfileUpdatePayload) {
		const userId = (await supabase.auth.getSession()).data.session?.user.id

		if (!userId)
			throw new Error('user profile is undefined')

		const { avatar, coverPicture, ...fieldsWithoutPictures } = changedFields

		const updatedFields: Partial<Tables<"user_profiles">> = fieldsWithoutPictures

		let currentProfile: { avatar_url: string | null; cover_url: string | null } | null = null
		if (avatar || coverPicture) {
			const { data } = await supabase
				.from('user_profiles')
				.select('avatar_url, cover_url')
				.eq('user_id', userId)
				.maybeSingle()
			currentProfile = data
		}

		if (avatar) {
			const fileExt = avatar.name.split('.').pop()?.toLowerCase() || 'webp'
			const cleanName = avatar.name
				.replace(/\.[^/.]+$/, '')
				.replace(/[^a-zA-Z0-9_-]/g, '_')
			const avatarPath = `${userId}/avatar-${Date.now()}-${cleanName}.${fileExt}`

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from(PROFILE_ASSETS_BUCKET)
				.upload(avatarPath, avatar, {
					upsert: true,
					cacheControl: 'max-age=3600',
				})

			if (uploadError) throw uploadError

			const { data: { publicUrl } } = supabase.storage
				.from(PROFILE_ASSETS_BUCKET)
				.getPublicUrl(uploadData.path)

			updatedFields.avatar_url = publicUrl

			try {
				const { data: existingFiles } = await supabase.storage
					.from(PROFILE_ASSETS_BUCKET)
					.list(userId)

				const filesToDelete = (existingFiles || [])
					.filter(f => f.name && f.name.startsWith('avatar') && `${userId}/${f.name}` !== uploadData.path)
					.map(f => `${userId}/${f.name}`)

				const oldPath = getStoragePathFromUrl(currentProfile?.avatar_url, PROFILE_ASSETS_BUCKET)
				if (oldPath && oldPath !== uploadData.path && !filesToDelete.includes(oldPath)) {
					filesToDelete.push(oldPath)
				}

				if (filesToDelete.length > 0) {
					await supabase.storage
						.from(PROFILE_ASSETS_BUCKET)
						.remove(filesToDelete)
				}
			} catch (deleteError) {
				console.warn('Failed to delete old avatar file(s):', deleteError)
			}
		}

		if (coverPicture) {
			const fileExt = coverPicture.name.split('.').pop()?.toLowerCase() || 'webp'
			const cleanName = coverPicture.name
				.replace(/\.[^/.]+$/, '')
				.replace(/[^a-zA-Z0-9_-]/g, '_')
			const coverPath = `${userId}/cover-${Date.now()}-${cleanName}.${fileExt}`

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from(PROFILE_ASSETS_BUCKET)
				.upload(coverPath, coverPicture, {
					upsert: true,
					cacheControl: 'max-age=3600',
				})

			if (uploadError) throw uploadError

			const { data: { publicUrl } } = supabase.storage
				.from(PROFILE_ASSETS_BUCKET)
				.getPublicUrl(uploadData.path)

			updatedFields.cover_url = publicUrl

			try {
				const { data: existingFiles } = await supabase.storage
					.from(PROFILE_ASSETS_BUCKET)
					.list(userId)

				const filesToDelete = (existingFiles || [])
					.filter(f => f.name && f.name.startsWith('cover') && `${userId}/${f.name}` !== uploadData.path)
					.map(f => `${userId}/${f.name}`)

				const oldPath = getStoragePathFromUrl(currentProfile?.cover_url, PROFILE_ASSETS_BUCKET)
				if (oldPath && oldPath !== uploadData.path && !filesToDelete.includes(oldPath)) {
					filesToDelete.push(oldPath)
				}

				if (filesToDelete.length > 0) {
					await supabase.storage
						.from(PROFILE_ASSETS_BUCKET)
						.remove(filesToDelete)
				}
			} catch (deleteError) {
				console.warn('Failed to delete old cover file(s):', deleteError)
			}
		}

		const updatedFieldQueryKeys: string = Object.keys(updatedFields).join(', ') ?? ''

		if (updatedFieldQueryKeys.trim()) {
			const { error } = await supabase
				.from('user_profiles')
				.update(updatedFields)
				.select(updatedFieldQueryKeys)
				.eq('user_id', userId)
				.single()

			if (error) throw error
		}

		return updatedFields
	}

	async function fetchUserProfile() {
		const { data: { session } } = await supabase.auth.getSession()

		if (!session) return null

		const profile = await supabase
			.from("user_profiles")
			.select("*")
			.eq("user_id", session.user.id)
			.single()

		if (profile.error) throw profile.error

		return profile.data
	}

	return {
		findUserProfile,
		findUserProfiles,
		searchUserProfiles,
		updateUserProfile,
		fetchUserProfile
	}
}
