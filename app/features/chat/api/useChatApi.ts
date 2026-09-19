import type { ChatId, Tables } from "@shared/types"
import type { ChatCreatePayload } from "../types/ChatPayload"
import { parseDirectId } from "../utils/directId"

export const useChatApi = () => {
	const supabase = useSupabaseClient()

	async function removeStorageFolder(bucket: string, folder: string) {
		const paths: string[] = []
		let offset = 0
		const pageSize = 1000

		while (true) {
			const { data, error } = await supabase.storage
				.from(bucket)
				.list(folder, {
					limit: pageSize,
					offset,
					sortBy: { column: 'name', order: 'asc' },
				})

			if (error) throw error

			for (const item of data ?? []) {
				if (item.id) paths.push(`${folder}/${item.name}`)
			}

			if (!data || data.length < pageSize) break
			offset += data.length
		}

		for (let index = 0; index < paths.length; index += pageSize) {
			const batch = paths.slice(index, index + pageSize)
			const { error } = await supabase.storage.from(bucket).remove(batch)
			if (error) throw error
		}
	}

	async function fetchChats() {
		const { data: { session } } = await supabase.auth.getSession()
		if (!session?.user) return []

		const { data: memberships, error: membersError } = await supabase
			.from("chat_members")
			.select("chat_id")
			.eq("user_id", session.user.id)

		if (membersError) throw membersError
		if (!memberships.length) return []

		const { data, error } = await supabase
			.from("chats")
			.select("*")
			.in("id", memberships.map(m => m.chat_id))

		if (error) throw error

		return data
	}

	async function createChat(chat: ChatCreatePayload) {
		const safeChat: ChatCreatePayload = {
			...chat,
			type: chat.type === "GROUP" ? "GROUP" : "DIRECT",
		}

		const { data, error } = await supabase
			.from("chats")
			.insert(safeChat)
			.select("*")
			.single()

		if (error) throw error

		return data
	}

	async function createDirectChat(userA: string, userB: string) {
		const { data: chatId, error: rpcError } = await supabase.rpc('create_direct_chat', {
			p_user_a: userA,
			p_user_b: userB,
		})

		if (rpcError) throw rpcError
		if (!chatId) throw new Error('create_direct_chat did not return a chat id')

		const { data, error } = await supabase
			.from('chats')
			.select('*')
			.eq('id', chatId)
			.single()

		if (error) throw error

		return data
	}

	async function deleteChat(chatId: ChatId) {
		await Promise.all([
			removeStorageFolder('chat-assets', String(chatId)),
			removeStorageFolder('chat-media', String(chatId)),
		])

		const { data, error } = await supabase
			.from("chats")
			.delete()
			.eq('id', chatId)
			.select('id')
			.maybeSingle()

		if (error) throw error
		if (!data) {
			throw new Error("Chat was not deleted. It may no longer exist or your account may not have permission to delete it.")
		}

		return data
	}

	async function findChat(id: ChatId) {
		const { data, error } = await supabase
			.from("chats")
			.select("*")
			.eq('id', id)
			.maybeSingle()

		if (error) throw error

		return data
	}

	async function findChatByDirectId(directId: string) {
		const { data, error } = await supabase
			.from("chats")
			.select("*")
			.eq('direct_id', directId)
			.maybeSingle()

		if (error) throw error

		return data
	}

	async function resolveDirectChat(directId: string) {
		const byDirectId = await findChatByDirectId(directId).catch(() => null)
		if (byDirectId) return byDirectId

		const members = parseDirectId(directId)
		if (!members) return null

		const [first, second] = members
		const { data: legacy, error: legacyError } = await supabase
			.from("chats")
			.select("*")
			.eq('type', 'DIRECT')
			.in('name', [`${first}__${second}`, `${second}__${first}`])
			.limit(1)
			.maybeSingle()

		if (legacyError) throw legacyError
		if (!legacy) return null
		if (legacy.direct_id) return legacy

		try {
			return await updateChat(legacy.id, { direct_id: directId })
		} catch (error) {
			const code = (error as { code?: string })?.code
			const status = (error as { status?: number })?.status
			if (code !== "23505" && status !== 409) throw error

			return (await findChatByDirectId(directId).catch(() => null)) ?? legacy
		}
	}

	async function updateChat(id: ChatId, payload: Partial<Tables<"chats">>) {
		const { data, error } = await supabase
			.from("chats")
			.update(payload)
			.eq('id', id)
			.select("*")
			.single()

		if (error) throw error

		return data
	}

	async function uploadChatAsset(chatId: ChatId, file: File, prefix: 'avatar' | 'cover') {
		const { data: { session } } = await supabase.auth.getSession()
		if (!session?.user) throw new Error("Unauthorized")

		const { data: existing } = await supabase.storage
			.from("chat-assets")
			.list(String(chatId))

		if (existing?.length) {
			const oldFiles = existing
				.filter(f => f.name.startsWith(`${prefix}-`))
				.map(f => `${chatId}/${f.name}`)

			if (oldFiles.length) {
				await supabase.storage.from("chat-assets").remove(oldFiles)
			}
		}

		const imageName = file.name.replace(/\s+/g, '_')
		const path = `${chatId}/${prefix}-${imageName}`

		const { error } = await supabase.storage
			.from("chat-assets")
			.upload(path, file, {
				upsert: true,
				cacheControl: "max-age=3600"
			})

		if (error) throw error

		return path
	}


	return {
		fetchChats,
		findChat,
		findChatByDirectId,
		resolveDirectChat,
		createChat,
		createDirectChat,
		updateChat,
		deleteChat,
		uploadChatAsset
	}
}
