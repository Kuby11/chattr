<script setup lang="ts">
import type { ChatId } from '@shared/types';
import { useChatStore, ChatAvatar } from '@features/chat';
import { useMessageStore } from '../../stores/messageStore';
import { useMessage } from '../../composables/useMessage';

const messageStore = useMessageStore()
const chatStore = useChatStore()

const forwardingMessage = computed(() => messageStore.forwardingMessage)
const isOpen = computed({
	get: () => !!forwardingMessage.value,
	set: (val: boolean) => { if (!val) messageStore.resetForward() }
})

const searchQuery = ref('')
const selectedChatIds = ref<Set<ChatId>>(new Set())
const isForwarding = ref(false)

const filteredChats = computed(() => {
	if (!chatStore.chats) 
		return []

	const q = searchQuery.value.toLowerCase().trim()
	if (!q) 
		return chatStore.chats
	
	return chatStore.chats.filter(chat =>
		chat.name?.toLowerCase().includes(q)
	)
})

function toggleChat(chatId: ChatId) {
	if (selectedChatIds.value.has(chatId)) {
		selectedChatIds.value.delete(chatId)
	} else {
		selectedChatIds.value.add(chatId)
	}
}

function isSelected(chatId: ChatId) {
	return selectedChatIds.value.has(chatId)
}

async function onForward() {
	if (!forwardingMessage.value || selectedChatIds.value.size === 0) return

	isForwarding.value = true
	try {
		const { forwardMessage } = useMessage(forwardingMessage.value.chat_id)
		await forwardMessage(forwardingMessage.value, Array.from(selectedChatIds.value))
	} finally {
		isForwarding.value = false
		selectedChatIds.value.clear()
		searchQuery.value = ''
	}
}

const onClose = () => {
	messageStore.resetForward()
	selectedChatIds.value.clear()
	searchQuery.value = ''
}

const onUpdate = (val: boolean) => { if (!val) onClose()}

</script>

<template>
	<UModal
		v-model:open="isOpen"
		title="Forward message"
		description="Select chats to forward the message to"
		:ui="{
			content: 'sm:max-w-md',
			description: 'text-sm text-muted'
		}"
		@update:open="onUpdate"
	>
		<template #body>
			<div class="flex flex-col gap-3">
				<UInput
					v-model="searchQuery"
					placeholder="Search chats..."
					icon="lucide:search"
					:ui="{ base: 'ring-default' }"
				/>

				<div class="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
					<p v-if="filteredChats.length === 0" class="text-muted text-sm text-center py-4">
						No chats found
					</p>

					<button
						v-for="chat in filteredChats"
						:key="chat.id"
						class="flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer"
						:class="isSelected(chat.id) ? 'bg-primary/10' : 'hover:bg-elevated/50'"
						@click="toggleChat(chat.id)"
					>
						<ChatAvatar
							:src="chat.avatar_url ?? ''"
							:chat-type="chat.type"
							size="sm"
						/>
						<span class="flex-1 text-left truncate">{{ chat.name }}</span>
						<UIcon
							:name="isSelected(chat.id) ? 'lucide:check-circle-2' : 'lucide:circle'"
							:class="isSelected(chat.id) ? 'text-primary' : 'text-muted'"
							size="20"
						/>
					</button>
				</div>

				<div class="flex justify-between items-center pt-2 border-t border-muted/30">
					<span class="text-sm text-muted">
						{{ selectedChatIds.size }} chat{{ selectedChatIds.size !== 1 ? 's' : '' }} selected
					</span>
					<UButton
						label="Forward"
						icon="lucide:send"
						:disabled="selectedChatIds.size === 0"
						:loading="isForwarding"
						@click="onForward"
					/>
				</div>
			</div>
		</template>
	</UModal>
</template>
