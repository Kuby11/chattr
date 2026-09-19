<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import type { ChatId, Tables } from '@shared/types';
import { GiphyButton, type GiphySendPayload } from '@features/giphy';
import { EmojiButton } from '@features/emoji';
import z from 'zod';
import { useMessage } from '../../composables/useMessage';
import MessageReplying from '../local/MessageReplying.vue';
import { useMessageStore } from '../../stores/messageStore';
import { useTyping } from '../../composables/useTyping';
import MessageEditing from '../local/MessageEditing.vue';
import AssetUploadButton from '../local/AssetUploadButton.vue';
import { useAssetPreviews } from '../../composables/useAssetPreviews';
import MessageMediaPreview from '../local/MessageMediaPreview.vue';
import { toRef } from 'vue';

const props = defineProps<{
	chatId: ChatId
	mutedUntil?: string | null
}>()
const emit = defineEmits<{
	(e: 'chat-created', chat: Tables<"chats">): void
}>()
const assets = defineModel<File[]>('assets', { required: true })

const { getReplyingTo, resetReply, getEditing } = useMessageStore()
const chatId = toRef(props, 'chatId')
const { sendMessage, sendMessageWithMedia, editMessage } = useMessage(chatId)
const { notifyTyping, stopTyping } = useTyping(props.chatId)
const toast = useToast()
const isSending = ref(false)

const assetPreviews = useAssetPreviews(assets)

const messageInputRef = useTemplateRef<{ inputRef: HTMLInputElement }>('messageInput')

const now = ref(Date.now())
let muteTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
	muteTimer = setInterval(() => {
		now.value = Date.now()
	}, 30000)
})

onUnmounted(() => {
	if (muteTimer) {
		clearInterval(muteTimer)
		muteTimer = null
	}
})

const isMuted = computed(() => {
	if (!props.mutedUntil) return false
	return new Date(props.mutedUntil).getTime() > now.value
})

const mutedUntilLabel = computed(() => {
	if (!props.mutedUntil) return ''
	return new Date(props.mutedUntil).toLocaleString()
})

const schema = z.object({
	content: z
		.string('message content must be a string!')
		.max(5000, 'message too big! message must be less than a 5000 characters')
		.nullable()
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
	content: null
})

const canSubmit = computed(() => {
	if (isSending.value) return false

	if(state.content && state.content!.length >= 5000)
		return false

	const hasContent = !!state.content && !!state.content?.trim()
	const hasAssets = assets.value.length > 0

	return hasContent || hasAssets
})

const onSubmit = async ({ data }: FormSubmitEvent<Schema>) => {
	if(!canSubmit.value){
		return
	}

	const replyingTo = getReplyingTo(props.chatId)?.id

	stopTyping()

	if(getEditing(props.chatId)){
		await editMessage(getEditing(props.chatId)!.id, data.content!)
	} else {
		if(assets.value.length > 0){
			const filesToUpload = [...assets.value]
			const messageContent = data.content ?? ""

			state.content = null
			assets.value = []
			if(replyingTo){
				resetReply(props.chatId)
			}

			isSending.value = true
			sendMessageWithMedia({
				content: messageContent,
				chat_id: props.chatId,
				type: 'TEXTUAL',
				replying_to: replyingTo ?? null
			}, filesToUpload).then((ensured) => {
				if (ensured) emit('chat-created', ensured)
			}).catch(err => {
				console.error("Failed to send message with media:", err)
				toast.add({ color: 'error', title: 'could not send message' })
			}).finally(() => {
				isSending.value = false
			})
		} else {
			isSending.value = true
			try {
				const ensured = await sendMessage({
					content: data.content ?? "",
					chat_id: props.chatId,
					type: 'TEXTUAL',
					replying_to: replyingTo ?? null
				})

				if (ensured) {
					emit('chat-created', ensured)
				}

				if(replyingTo){
					resetReply(props.chatId)
				}

				state.content = null
			} catch (err) {
				console.error("Failed to send message:", err)
				toast.add({ color: 'error', title: 'could not send message' })
			} finally {
				isSending.value = false
			}
		}
	}
}

function removeAsset(index: number) {
	assets.value = assets.value.filter((_, i) => i !== index)
}

async function onGifSelect(payload: GiphySendPayload) {
	const replyingTo = getReplyingTo(props.chatId)?.id

	isSending.value = true
	try {
		const ensured = await sendMessage({
			content: payload.url,
			chat_id: props.chatId,
			type: 'GIF',
			replying_to: replyingTo ?? null,
		})

		if (ensured) {
			emit('chat-created', ensured)
		}

		state.content = null
	} catch (err) {
		console.error("Failed to send gif message:", err)
		toast.add({ color: 'error', title: 'could not send message' })
	} finally {
		isSending.value = false
	}
}

const lastEmojiCaret = ref<number | null>(null)

function onEmojiSelect(emoji: string) {
	const current = state.content ?? ""
	const input = messageInputRef.value?.inputRef
	const inputFocused = !!input && document.activeElement === input

	let start: number
	let end: number

	if (inputFocused) {
		start = input.selectionStart ?? current.length
		end = input.selectionEnd ?? start
	} else {
		start = lastEmojiCaret.value ?? current.length
		end = start
	}

	state.content = current.slice(0, start) + emoji + current.slice(end)
	lastEmojiCaret.value = start + emoji.length
}

watch(() => state.content, (value) => {
	if (value?.trim()) notifyTyping()
	else stopTyping()
})

watch(
	() => getReplyingTo(props.chatId), 
	(value) => {
		if(value && messageInputRef.value){
			messageInputRef.value.inputRef.focus()
		}
	}
)

watch(
	() => getEditing(props.chatId), 
	async (value) => {
		if(value && messageInputRef.value){
			state.content = value.content
			assets.value = []
			await nextTick()
			messageInputRef.value.inputRef.focus()
			const len = value.content?.length ?? 0
			messageInputRef.value.inputRef.setSelectionRange?.(len, len)
		} else {
			state.content = null
		}
	}
)
</script>

<template>
	<UForm 
		:schema 
		:state
		loading-auto
		@submit="onSubmit"
	>
		<UFormField name="content" class="relative" :ui="{ error: 'absolute z-10 -top-8' }">
			<template v-if="!isMuted">
				<MessageReplying :chat-id />

				<MessageEditing :chat-id />

				<div 
					class="
						transition relative z-210 bg-default w-full h-fit mb-2 rounded-xl ring ring-default outline-3
						outline-transparent focus-within:outline-primary/25 focus-within:ring-primary overflow-hidden"
				>
					<MessageMediaPreview
						v-if="assetPreviews"
						:assets="assets"
						:previews="assetPreviews"
						@remove="removeAsset"
					/>

					<UInput
						ref="messageInput"
						v-model="state.content as string"
						:ui="{ 
							root: 'w-full rounded-xl', 
							base: 'p-4 ring-transparent outline-transparent focus-within:ring-transparent! focus-within:outline-transparent!' 
						}" 
						placeholder="write message"
					/>
				</div>

				<div class="absolute right-2 bottom-2.5 z-220 flex gap-2">
					<EmojiButton @select="onEmojiSelect"/>
					<GiphyButton @select="onGifSelect"/>
					<AssetUploadButton v-model="assets"/>
		
					<UButton 
						:disabled="!canSubmit" 
						:color="canSubmit ? 'primary' : 'neutral'"
						:variant="canSubmit ? 'solid' : 'soft'"
						icon="lucide:send"
						type="submit" 
					/>
				</div>
			</template>

			<div
				v-else
				class="transition relative z-210 bg-default w-full h-fit mb-2 rounded-xl ring ring-default overflow-hidden"
			>
				<div class="flex flex-col items-center gap-1.5 p-4">
					<div class="flex gap-1 justify-center">
						<UIcon name="lucide:bell-off" class="size-5 text-error" />
						<p class="text-sm text-muted">you are muted</p>
					</div>
					<p class="text-sm text-muted">muted until {{ mutedUntilLabel }}</p>
				</div>
			</div>
		</UFormField>
	</UForm>
</template>
