import type { UserId } from '@shared/types'
import { useProfileStore } from '@features/profile'
import { useFriendshipStore } from '@features/friendship'
import { useUserPresenceStore } from '../stores/userPresenceStore'
import { useUserPresenceApi } from '../api/useUserPresenceApi'
import { getCurrentScope, onScopeDispose } from 'vue'

let presenceConsumerCount = 0
let presenceGeneration = 0
let authSubscription: { unsubscribe: () => void } | null = null

export const useUserPresence = () => {
	const supabase = useSupabaseClient()
	const userPresenceStore = useUserPresenceStore()
	const userPresenceApi = useUserPresenceApi()
	const profileStore = useProfileStore()
	const friendshipStore = useFriendshipStore()
	const { onlineUsers } = storeToRefs(userPresenceStore)

	async function touchOwnPresence() {
		const userId = await userPresenceApi.getCurrentUserId()
		if (!userId) return

		const now = new Date().toISOString()

		try {
			const existing = await userPresenceApi.findUserPresenceRecord(userId)

			if (existing) {
				await userPresenceApi.updateLastSeen(userId, now)
				return
			}

			await userPresenceApi.createUserPresenceRecord(userId, now)
		} catch (err) {
			console.error('Failed to touch user presence:', err)
		}
	}

	function subscribePresence(userId: string) {
		userPresenceApi.subscribeUserPresence(
			userId as UserId,
			userPresenceStore.setOnlineUsers,
			touchOwnPresence
		)
	}

	if (import.meta.client && getCurrentScope()) {
		presenceConsumerCount += 1

		if (!authSubscription) {
			const generation = ++presenceGeneration
			const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
				if (!presenceConsumerCount) return

				const userId = session?.user.id
				if (userId) {
					subscribePresence(userId)
				} else {
					userPresenceApi.unsubscribeUserPresence()
					userPresenceStore.clearAll()
				}
			})

			authSubscription = subscription
			userPresenceApi.getCurrentUserId().then((userId) => {
				if (generation === presenceGeneration && presenceConsumerCount && userId) {
					subscribePresence(userId)
				}
			})
		}

		onScopeDispose(() => {
			presenceConsumerCount = Math.max(0, presenceConsumerCount - 1)
			if (presenceConsumerCount) return

			presenceGeneration += 1
			authSubscription?.unsubscribe()
			authSubscription = null
			userPresenceApi.unsubscribeUserPresence()
			userPresenceStore.clearAll()
		})
	}

	function canSeeUserPresence(targetUserId: UserId) {
		if (targetUserId === profileStore.userProfile?.user_id) return true

		const row = userPresenceStore.userPresenceRows.get(targetUserId)
		if (!row) return true

		if (row.presence_policy === 'NOBODY') return false
		if (row.presence_policy === 'FRIENDS') return friendshipStore.isFriend(targetUserId)

		return true
	}

	function isOnline(targetUserId: UserId) {
		return userPresenceStore.onlineUsers.has(targetUserId)
	}

	function isOnlineVisible(targetUserId: UserId) {
		return isOnline(targetUserId) && canSeeUserPresence(targetUserId)
	}

	function lastSeenAt(targetUserId: UserId) {
		if (!canSeeUserPresence(targetUserId)) return null

		const online = userPresenceStore.onlineUsers.get(targetUserId)
		if (online) return online.online_at

		return userPresenceStore.userPresenceRows.get(targetUserId)?.last_seen ?? null
	}

	async function loadPresenceRows(userIds: UserId[]) {
		const missing = userIds.filter(id => !userPresenceStore.userPresenceRows.has(id))
		if (!missing.length) return

		try {
			const rows = await userPresenceApi.findUserPresenceRecords(missing)
			if (!presenceConsumerCount) return
			for (const row of rows) {
				userPresenceStore.upsertUserPresenceRow(row)
			}
		} catch (err) {
			console.error('Failed to load user presence rows:', err)
		}
	}

	return {
		onlineUsers,
		isOnline,
		isOnlineVisible,
		lastSeenAt,
		loadPresenceRows,
	}
}
