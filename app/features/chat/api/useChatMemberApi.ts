import type { ChatId, ChatMemberId, Enums, Tables, UserId } from "@shared/types"
import type { RealtimePostgresChangesPayload } from "@supabase/realtime-js"
import { isDirectId } from "../utils/directId"

type MemberChangeEvents = "INSERT" | "UPDATE" | "DELETE" | "*"
type MemberRecord = Partial<Tables<"chat_members">> & { id: string }
type MemberChangeCallback = (member: MemberRecord, event: Exclude<MemberChangeEvents, "*">) => void

type BroadcastMemberChange = {
	member: MemberRecord & { chat_id: ChatId }
	event: Exclude<MemberChangeEvents, "*">
}

const listeners = new Map<ChatId, Map<string, MemberChangeCallback>>()

function listenerKey(event: MemberChangeEvents, key: string) {
	return `${event}:${key}`
}

function getListeners(chatId: ChatId) {
	let callbacks = listeners.get(chatId)
	if (!callbacks) {
		callbacks = new Map()
		listeners.set(chatId, callbacks)
	}
	return callbacks
}

function dispatch(chatId: ChatId, member: MemberRecord, event: Exclude<MemberChangeEvents, "*">) {
	for (const [key, callback] of getListeners(chatId)) {
		if (key.startsWith(`${event}:`) || key.startsWith("*:"))
			callback(member, event)
	}
}

let chatMembersAuthReady: Promise<void> | null = null

function ensureChatMembersAuth() {
	if (!chatMembersAuthReady) {
		const supabase = useSupabaseClient()
		chatMembersAuthReady = supabase.realtime.setAuth()
	}
	return chatMembersAuthReady
}

function ensureChatMembersChannel(chatId: ChatId) {
	if (isDirectId(chatId))
		return null

	const supabase = useSupabaseClient()

	const channelName = `chat-members-channel:${chatId}`
	const topic = `realtime:${channelName}`

	const existing = supabase.getChannels().find(channel => channel.topic === topic)
	if (existing)
		return existing

	const channel = supabase
		.channel(channelName, {
			config: {
				private: true,
				broadcast: { self: false },
			},
		})
		.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "chat_members",
				filter: `chat_id=eq.${chatId}`
			},
			(payload) => {
				const change = payload as RealtimePostgresChangesPayload<{ [key: string]: unknown }>
				const event = change.eventType as Exclude<MemberChangeEvents, "*">
				const record = (event === "DELETE" ? change.old : change.new) as
					| (MemberRecord & { chat_id: ChatId })
					| undefined

				if (!record?.chat_id || !record.id)
					return

				dispatch(record.chat_id, record, event)
			}
		)
		.on("broadcast", { event: "member-updated" }, ({ payload }) => {
			const change: BroadcastMemberChange = payload as BroadcastMemberChange

			if (!change?.member?.chat_id || !change?.member?.id)
				return

			dispatch(change.member.chat_id, change.member, change.event)
		})

	void ensureChatMembersAuth().then(() => {
		channel.subscribe((status, err) => {
			if (status === "CHANNEL_ERROR") {
				console.error("chat members realtime channel error:", err)
			}
		})
	})

	return channel
}

export const useChatMemberApi = (chatId: ChatId = "" as ChatId) => {
	const supabase = useSupabaseClient()

	function initChannel(targetChatId?: ChatId) {
		return ensureChatMembersChannel(targetChatId ?? chatId)
	}

	function disposeChannel(targetChatId: ChatId = chatId) {
		listeners.delete(targetChatId)

		if (isDirectId(targetChatId)) return

		const channelName = `chat-members-channel:${targetChatId}`
		const topic = `realtime:${channelName}`
		const supabase = useSupabaseClient()
		const channel = supabase.getChannels().find(item => item.topic === topic)

		if (channel) {
			void supabase.removeChannel(channel).catch((error: unknown) => {
				console.warn("Failed to remove chat members channel:", error)
			})
		}
	}

	function onMemberChange(
		event: MemberChangeEvents,
		callback: MemberChangeCallback,
		key = "default",
		targetChatId: ChatId = chatId
	) {
		if (isDirectId(targetChatId))
			return () => { }

		ensureChatMembersChannel(targetChatId)
		const callbacks = getListeners(targetChatId)
		const id = listenerKey(event, key)

		if (callbacks.has(id))
			return () => { }

		callbacks.set(id, callback)

		return () => {
			callbacks.delete(id)
			if (!callbacks.size)
				listeners.delete(targetChatId)
		}
	}

	async function sendMemberChange(
		targetChatId: ChatId,
		member: MemberRecord,
		event: Exclude<MemberChangeEvents, "*">
	) {
		const channel = ensureChatMembersChannel(targetChatId)
		if (!channel) return

		try {
			await channel.send({
				type: "broadcast",
				event: "member-updated",
				payload: { member: { ...member, chat_id: targetChatId }, event } satisfies BroadcastMemberChange,
			})
		} catch (err) {
			console.warn("Failed to broadcast member change:", err)
		}
	}

	async function fetchMembers(targetChatId: ChatId) {
		if (isDirectId(targetChatId))
			return []

		const { data, error } = await supabase
			.from("chat_members")
			.select("*")
			.eq("chat_id", targetChatId)

		if (error) throw error

		return data
	}

	async function findMember(targetChatId: ChatId, memberId: ChatMemberId) {
		const { data, error } = await supabase
			.from('chat_members')
			.select('*')
			.eq('chat_id', targetChatId)
			.eq('id', memberId)
			.maybeSingle()

		if (error) throw error

		return data
	}

	async function addMembers(
		targetChatId: ChatId,
		memberIds: UserId[] = [],
		role: Enums<"member_role"> = "MEMBER"
	) {
		if (!memberIds.length) return

		const { data, error } = await supabase
			.from("chat_members")
			.upsert(memberIds.map(user_id => ({
				chat_id: targetChatId,
				user_id,
				role,
			})), {
				onConflict: "chat_id,user_id",
				ignoreDuplicates: true,
			})
			.select("*")

		if (error) throw error

		for (const member of data ?? []) {
			await sendMemberChange(targetChatId, member, "INSERT")
		}
	}

	async function updateMemberRole(memberId: ChatMemberId, role: Enums<"member_role">) {
		const { data, error } = await supabase
			.from("chat_members")
			.update({ role })
			.eq("id", memberId)
			.select("*")
			.single()

		if (error) throw error

		await sendMemberChange(data.chat_id, data, "UPDATE")

		return data
	}

	async function updateMemberMute(memberId: ChatMemberId, mutedUntil: string | null) {
		const { data, error } = await supabase
			.from("chat_members")
			.update({ muted_until: mutedUntil })
			.eq("id", memberId)
			.select("*")
			.single()

		if (error) throw error

		await sendMemberChange(data.chat_id, data, "UPDATE")

		return data
	}

	async function deleteChatMember(targetChatId: ChatId, memberId: ChatMemberId) {
		const { error } = await supabase
			.from("chat_members")
			.delete()
			.eq("id", memberId)

		if (error) throw error

		await sendMemberChange(targetChatId, { id: memberId }, "DELETE")
	}

	return {
		initChannel,
		disposeChannel,
		onMemberChange,
		sendMemberChange,
		fetchMembers,
		findMember,
		addMembers,
		updateMemberRole,
		updateMemberMute,
		deleteChatMember
	}
}
