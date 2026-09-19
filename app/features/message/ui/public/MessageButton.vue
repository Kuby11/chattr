<script setup lang="ts">
import type { UserId } from '@shared/types'
import { ROUTE_TOKENS } from '@shared/configs'
import { buildDirectId } from '@features/chat'
import { useProfileStore } from '@features/profile'
import type { ButtonProps } from '#ui/types'

const props = defineProps<ButtonProps & {
	userId: UserId
}>()

const { userProfile } = storeToRefs(useProfileStore())
const supabaseUser = useSupabaseUser()
const toast = useToast()
const isNavigating = ref(false)

const currentUserId = computed(() => userProfile.value?.user_id || supabaseUser.value?.id)
const isSelf = computed(() => {
	if (!currentUserId.value || !props.userId) return false
	return currentUserId.value.toLowerCase() === props.userId.toLowerCase()
})

async function openDirectChat() {
	if (!props.userId || isSelf.value || isNavigating.value) return

	const current = currentUserId.value
	if (!current) {
		toast.add({ title: 'sign in to send messages', color: 'error' })
		return
	}

	try {
		isNavigating.value = true
		await navigateTo(ROUTE_TOKENS.CHAT(buildDirectId(current, props.userId)))
	} catch {
		toast.add({ title: 'could not open chat', color: 'error' })
	} finally {
		isNavigating.value = false
	}
}
</script>

<template>
	<UTooltip v-if="!isSelf" text="send message" :ui="{ text: 'text-primary' }">
		<UButton
			v-bind="$props"
			icon="lucide:message-circle"
			:size="$props.size ?? 'lg'"
			:variant="$props.variant ?? 'ghost'"
			:aria-label="label || 'send message'"
			:loading="isNavigating"
			@click="openDirectChat"
		/>
	</UTooltip>
</template>
