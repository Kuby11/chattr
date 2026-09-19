import type { Tables, UserId } from "@shared/types"

export type UserPresencePayload = {
	user_id: UserId
	online_at: string
}

export const useUserPresenceStore = defineStore('userPresenceStore', () => {
	const onlineUsers = ref<Map<UserId, UserPresencePayload>>(new Map())
	const userPresenceRows = ref<Map<UserId, Tables<"user_presence">>>(new Map())

	function setOnlineUsers(users: Map<UserId, UserPresencePayload>) {
		onlineUsers.value = users
	}

	function upsertUserPresenceRow(row: Tables<"user_presence">) {
		userPresenceRows.value.set(row.user_id, row)
	}

	function clearAll() {
		onlineUsers.value = new Map()
		userPresenceRows.value = new Map()
	}

	return {
		onlineUsers,
		userPresenceRows,
		setOnlineUsers,
		upsertUserPresenceRow,
		clearAll,
	}
})