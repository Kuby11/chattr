import type { ChatId, Tables } from "@shared/types"

export const useChatMemberStore = defineStore("chatMemberStore", () => {
	const members = ref<Map<ChatId, Tables<"chat_members">[]>>(new Map())

	function setMembers(chatId: ChatId, list: Tables<"chat_members">[]) {
		members.value.set(chatId, list)
	}

	function upsertMember(chatId: ChatId, member: Partial<Tables<"chat_members">> & { id: string }) {
		const list = members.value.get(chatId)
		if (!list) return

		const index = list.findIndex(m => m.id === member.id)

		if (index !== -1) {
			list[index] = { ...list[index], ...member } as Tables<"chat_members">
		} else {
			list.push(member as Tables<"chat_members">)
		}

		members.value.set(chatId, [...list])
	}

	function removeMember(chatId: ChatId, memberId: string) {
		const list = members.value.get(chatId)
		if (!list) return

		members.value.set(chatId, list.filter(m => m.id !== memberId))
	}

	function clearMembers(chatId: ChatId) {
		members.value.delete(chatId)
	}

	return {
		members,
		setMembers,
		upsertMember,
		removeMember,
		clearMembers
	}
})
