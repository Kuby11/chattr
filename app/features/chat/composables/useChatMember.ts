import type { ChatId, Tables } from "@shared/types"
import { computed, toValue, type MaybeRefOrGetter } from "vue"
import { useChatMemberApi } from "../api/useChatMemberApi"
import { useChatMemberStore } from "../stores/memberStore"

export const useChatMember = (chatId: MaybeRefOrGetter<ChatId>) => {
	const currentChatId = computed(() => toValue(chatId))
	const memberService = useChatMemberApi(currentChatId.value)
	const memberStore = useChatMemberStore()

	const chatMembers = computed(() => memberStore.members.get(currentChatId.value))

	async function loadMembers(targetChatId: ChatId = currentChatId.value) {
		const rows = await memberService.fetchMembers(targetChatId)
		memberStore.setMembers(targetChatId, rows)
		return rows
	}

	function initChannel() {
		const targetChatId = currentChatId.value
		const channel = memberService.initChannel(targetChatId)

		memberService.onMemberChange("*", (member, event) => {
			if (!member.chat_id) return

			if (event === "DELETE") {
				memberStore.removeMember(member.chat_id, member.id)
				return
			}

			memberStore.upsertMember(member.chat_id, member as Tables<"chat_members">)
		}, "default", targetChatId)

		return channel
	}

	return {
		chatMembers,
		loadMembers,
		initChannel
	}
}
