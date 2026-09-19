<script setup lang="ts">
import type { ChatId } from '@shared/types';
import { useChat } from '../../composables/useChat';
import { ROUTE_TOKENS } from '~/shared/configs';

const { deleteChat } = useChat()
const toast = useToast()

const props = defineProps<{ chatId: ChatId }>()

const isOpen = ref(false)
const countdown = ref(10)
const loading = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function clearTimer() {
	if (timer) {
		clearInterval(timer)
		timer = null
	}
}

function startCountdown() {
	clearTimer()
	countdown.value = 10
	timer = setInterval(() => {
		countdown.value--
		if (countdown.value <= 0) {
			clearTimer()
		}
	}, 1000)
}

watch(isOpen, (open) => {
	clearTimer()
	if (open) {
		startCountdown()
	}
})

onBeforeUnmount(() => clearTimer())

async function handleDelete() {
	if (loading.value) return
	loading.value = true
	try {
		await deleteChat(props.chatId)
		isOpen.value = false
		navigateTo(ROUTE_TOKENS.HOME)
	} catch (error) {
		console.error(error)
		toast.add({
			color: 'error',
			title: error instanceof Error ? error.message : 'could not delete chat'
		})
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<UButton
		variant="ghost"
		color="error"
		icon="lucide:trash-2"
		class="justify-start text-sm w-full"
		@click="isOpen = true"
	>
		delete chat
	</UButton>

	<UModal
		v-model:open="isOpen"
		:ui="{ content: 'max-w-sm' }"
	>
		<template #content>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col items-center gap-2">
					<div class="flex gap-1">
						<UIcon name="lucide:triangle-alert" class="size-5 text-error shrink-0 mt-0.5" />
						<p class="font-medium text-base">are you sure?</p>
					</div>
					<p class="text-sm text-center text-muted mt-1">this action is permanent and cannot be undone. all messages and media will be lost forever. <br> no way back.</p>
				</div>

				<p class="text-sm text-muted text-center">
					<template v-if="countdown > 0">
						confirm in <span class="font-bold text-error">{{ countdown }}s</span>
					</template>
					<template v-else>
						click to permanently delete
					</template>
				</p>

				<div class="grid grid-cols-2 gap-3">
					<UButton
						label="cancel"
						color="neutral"
						variant="soft"
						class="justify-center"
						@click="isOpen = false"
					/>
					<UButton
						label="delete forever"
						color="error"
						icon="lucide:trash-2"
						class="justify-center"
						size="sm"
						:disabled="countdown > 0"
						:loading="loading"
						@click="handleDelete"
					/>
				</div>
			</div>
		</template>
	</UModal>
</template>
