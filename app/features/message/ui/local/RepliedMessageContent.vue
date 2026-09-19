<script setup lang="ts">
import type { Tables } from '@shared/types';
import { useProfileOverlay } from '@features/profile';
import type { ClientMessage } from '../../types/clientMessage';

const props = defineProps<{
	isOwn: boolean
	replierProfile: Tables<"user_profiles">
	messageData: ClientMessage
}>()

const supabaseUser = useSupabaseUser()
const currentUserId = computed(() => supabaseUser.value?.id)
const profileOverlay = useProfileOverlay()
const highlightTimers = new Set<ReturnType<typeof setTimeout>>()

onUnmounted(() => {
	for (const timer of highlightTimers) clearTimeout(timer)
	highlightTimers.clear()
})

const isOwnReply = computed(() => {
	return props.messageData.sender_id === currentUserId.value
})

const computedStyle = computed(() => {
	const isGif = props.messageData.type === 'GIF'
	return `
		w-fit h-fit max-w-[85%] sm:max-w-3/4 rounded-lg sm:rounded-xl ${isGif ? '' : 'p-2 sm:p-3'} ${props.isOwn ? 'bg-primary text-inverted self-end' : 'bg-elevated'}
		mx-2 sm:mx-4 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-md mb-1.5 sm:mb-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer relative before:absolute before:h-full before:w-1.5 before:bg-elevated before:rounded-full before:top-0 
		${props.isOwn ? 'before:-right-3 sm:before:-right-4' : 'before:-left-3 sm:before:-left-4'} ${isOwnReply.value ? 'bg-primary text-inverted ' : 'bg-elevated! text-default!'}
	`
})

const replyingToUsername = computed(() => {
	if(props.replierProfile.user_id 
	=== currentUserId.value) {
		return 'you'
	}
	return props.replierProfile.username ?? '…'
})

function scrollToMessage(messageId: string) {
	const el = document.getElementById(`message-${messageId}`)
	if (!el) return

	el.scrollIntoView({ behavior: 'smooth', block: 'center' })

	const bubbleTarget = el.querySelector('.message-bubble') ?? el
	bubbleTarget.classList.add('ring-2', 'ring-primary', 'transition-all', 'duration-300')
	const highlightTimer = setTimeout(() => {
		highlightTimers.delete(highlightTimer)
		bubbleTarget.classList.remove('ring-2', 'ring-primary')
	}, 1500)
	highlightTimers.add(highlightTimer)
}

</script>

<template>
	<div class="flex flex-col gap-1.5 sm:gap-2">
		<h4 
			:class="['text-[11px] sm:text-xs text-muted w-fit cursor-pointer', isOwn && 'self-end']" 
			@click="profileOverlay.open({ userProfile: replierProfile })"
		>
			replying to {{ replyingToUsername ?? '…' }}
		</h4>

		<div :class="computedStyle" @click="scrollToMessage(messageData.id)">
			<img v-if="messageData.type === 'GIF'" :src="messageData.content" class="max-h-8 sm:max-h-10 max-w-full overflow-hidden inline-block">

			<pre v-else class="font-sans text-[11px] sm:text-xs text-ellipsis whitespace-nowrap max-h-5 max-w-full overflow-hidden inline-block">
				{{ messageData.content }}
			</pre>
		</div>
	</div>
</template>
