import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Enums, Tables, UserId } from "@shared/types"
import type { UserPresencePayload } from '../stores/userPresenceStore'

type PresencePolicy = Enums<'user_presence_policy'>

const USER_PRESENCE_CHANNEL = 'presence-online'

let userPresenceChannel: RealtimeChannel | null = null
let activeUserId: UserId | null = null

export const useUserPresenceApi = () => {
	const supabase = useSupabaseClient()

	async function getCurrentUserId() {
		const { data: { session } } = await supabase.auth.getSession()
		return session?.user.id ?? null
	}

	async function findUserPresenceRecords(userIds: UserId[]) {
		if (!userIds.length) return []

		const { data, error } = await supabase
			.from("user_presence")
			.select("*")
			.in("user_id", userIds)

		if (error) throw error

		return data
	}

	async function findUserPresenceRecord(userId: string) {
		const { data, error } = await supabase
			.from("user_presence")
			.select("user_id")
			.eq("user_id", userId)
			.maybeSingle()

		if (error) throw error

		return data
	}

	async function findCurrentUserPresence(): Promise<Tables<'user_presence'> | null> {
		const userId = await getCurrentUserId()
		if (!userId) return null

		const { data, error } = await supabase
			.from('user_presence')
			.select('*')
			.eq('user_id', userId)
			.maybeSingle()

		if (error) throw error

		return data
	}

	async function updatePresencePolicy(policy: PresencePolicy): Promise<Tables<'user_presence'>> {
		const userId = await getCurrentUserId()
		if (!userId) throw new Error('user session is undefined')

		const existing = await findCurrentUserPresence()
		const query = existing
			? supabase
				.from('user_presence')
				.update({ presence_policy: policy })
				.eq('user_id', userId)
				.select('*')
				.single()
			: supabase
				.from('user_presence')
				.insert({
					user_id: userId,
					last_seen: new Date().toISOString(),
					presence_policy: policy,
				})
				.select('*')
				.single()

		const { data, error } = await query
		if (error) throw error

		return data
	}

	async function updateLastSeen(userId: string, lastSeen: string) {
		const { error } = await supabase
			.from("user_presence")
			.update({ last_seen: lastSeen })
			.eq("user_id", userId)

		if (error) throw error
	}

	async function createUserPresenceRecord(userId: string, lastSeen: string) {
		const { error } = await supabase
			.from("user_presence")
			.insert({
				user_id: userId,
				last_seen: lastSeen,
				presence_policy: "EVERYONE",
			})

		if (error) throw error
	}

	function subscribeUserPresence(
		userId: UserId,
		onSync: (users: Map<UserId, UserPresencePayload>) => void,
		onSubscribed?: () => void
	) {
		if (userPresenceChannel) {
			if (activeUserId === userId) return

			void supabase.removeChannel(userPresenceChannel).catch((error: unknown) => {
				console.warn('Failed to remove user presence channel:', error)
			})
			userPresenceChannel = null
			activeUserId = null
		}

		userPresenceChannel = supabase.channel(USER_PRESENCE_CHANNEL, {
			config: { presence: { key: userId } },
		})

		userPresenceChannel
			.on('presence', { event: 'sync' }, () => {
				if (!userPresenceChannel) return

				const state = userPresenceChannel.presenceState() as Record<string, UserPresencePayload[]>
				const next = new Map<UserId, UserPresencePayload>()

				for (const key of Object.keys(state)) {
					const payload = state[key]?.[0]
					if (payload?.user_id) next.set(payload.user_id, payload)
				}

				onSync(next)
			})
			.subscribe(async (status) => {
				if (status !== 'SUBSCRIBED' || !userPresenceChannel) return

				activeUserId = userId
				await userPresenceChannel.track({ user_id: userId, online_at: new Date().toISOString() })
				onSubscribed?.()
			})
	}

	function unsubscribeUserPresence() {
		if (userPresenceChannel) {
			void supabase.removeChannel(userPresenceChannel).catch((error: unknown) => {
				console.warn('Failed to remove user presence channel:', error)
			})
		}

		userPresenceChannel = null
		activeUserId = null
	}

	return {
		getCurrentUserId,
		findUserPresenceRecords,
		findUserPresenceRecord,
		findCurrentUserPresence,
		updatePresencePolicy,
		updateLastSeen,
		createUserPresenceRecord,
		subscribeUserPresence,
		unsubscribeUserPresence,
	}
}
