<script setup lang="ts">
import { useMessageStore } from '../../stores/messageStore';
import MessageFormPreview from './MessageFormPreview.vue';
import type { ChatId } from '@shared/types';

const props = defineProps<{ chatId: ChatId }>()

const messageStore = useMessageStore()
const editingMessage = computed(() => messageStore.getEditing(props.chatId))
</script>

<template>
	<MessageFormPreview
		:condition="!!editingMessage"
		title="Editing message"
		icon="lucide:pencil"
		@click="messageStore.resetEdit(props.chatId)"
	>
		<span class="text-ellipsis whitespace-nowrap max-w-[calc(100%-3rem)] overflow-hidden">
			{{ editingMessage?.content }}
		</span>
	</MessageFormPreview>
</template>
