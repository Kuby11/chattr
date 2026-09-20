<script setup lang="ts">
import type { Tables } from '@shared/types'
import ImageCropperModal from '@shared/ui/ImageCropperModal.vue'
import GroupChatPreviewCard from './GroupChatPreviewCard.vue'
import GroupChatDetailsForm from './GroupChatDetailsForm.vue'
import { useChat } from '../../composables/useChat'
import { useBreakpoint } from '@shared/composables'

const props = defineProps<{
	chatData: Tables<"chats">
}>()

const emit = defineEmits<{
	(e: 'chat-updated', chat: Tables<"chats">): void
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const { updateGroupChat } = useChat()
const toast = useToast()

const { sm: isMobile } = useBreakpoint()

const name = ref('')
const description = ref('')
const avatarFile = ref<File | null>(null)
const coverFile = ref<File | null>(null)
const avatarPreviewUrl = ref('')
const coverPreviewUrl = ref('')
const removeAvatar = ref(false)
const removeCover = ref(false)
const isSaving = ref(false)

const isCropperOpen = ref(false)
const cropperMode = ref<'avatar' | 'cover'>('avatar')
const selectedRawAvatar = ref<File | string | null>(null)
const selectedRawCover = ref<File | string | null>(null)

const selectedRawFileName = computed(() => {
	const raw = cropperMode.value === 'avatar' ? selectedRawAvatar.value : selectedRawCover.value
	if (raw instanceof File) {
		const base = raw.name.replace(/\.[^/.]+$/, '')
		return `${base}.webp`
	}
	return cropperMode.value === 'avatar' ? 'avatar.webp' : 'cover.webp'
})

const avatarInputRef = ref<HTMLInputElement | null>(null)
const coverInputRef = ref<HTMLInputElement | null>(null)

function resetState() {
	if (!props.chatData) return
	name.value = props.chatData.name || ''
	description.value = props.chatData.description || ''
	avatarPreviewUrl.value = props.chatData.avatar_url || ''
	coverPreviewUrl.value = props.chatData.cover_url || ''
	avatarFile.value = null
	coverFile.value = null
	removeAvatar.value = false
	removeCover.value = false
	selectedRawAvatar.value = null
	selectedRawCover.value = null
}

function triggerAvatarSelect() {
	avatarInputRef.value?.click()
}

function triggerCoverSelect() {
	coverInputRef.value?.click()
}

function onAvatarSelected(event: Event) {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	if (!file) return

	selectedRawAvatar.value = file
	cropperMode.value = 'avatar'
	isCropperOpen.value = true
	input.value = ''
}

function onCoverSelected(event: Event) {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	if (!file) return

	selectedRawCover.value = file
	cropperMode.value = 'cover'
	isCropperOpen.value = true
	input.value = ''
}

function onCropped(croppedFile: File, previewUrl: string) {
	if (cropperMode.value === 'avatar') {
		avatarFile.value = croppedFile
		removeAvatar.value = false
		if (avatarPreviewUrl.value.startsWith('blob:')) {
			URL.revokeObjectURL(avatarPreviewUrl.value)
		}
		avatarPreviewUrl.value = previewUrl
	} else {
		coverFile.value = croppedFile
		removeCover.value = false
		if (coverPreviewUrl.value.startsWith('blob:')) {
			URL.revokeObjectURL(coverPreviewUrl.value)
		}
		coverPreviewUrl.value = previewUrl
	}
}

function onRemoveAvatar() {
	avatarFile.value = null
	selectedRawAvatar.value = null
	removeAvatar.value = true
	if (avatarPreviewUrl.value.startsWith('blob:')) {
		URL.revokeObjectURL(avatarPreviewUrl.value)
	}
	avatarPreviewUrl.value = ''
	if (avatarInputRef.value) avatarInputRef.value.value = ''
}

function onRemoveCover() {
	coverFile.value = null
	selectedRawCover.value = null
	removeCover.value = true
	if (coverPreviewUrl.value.startsWith('blob:')) {
		URL.revokeObjectURL(coverPreviewUrl.value)
	}
	coverPreviewUrl.value = ''
	if (coverInputRef.value) coverInputRef.value.value = ''
}

const hasChanges = computed(() => {
	if (!props.chatData) return false
	return (
		name.value.trim() !== (props.chatData.name || '').trim() ||
		description.value.trim() !== (props.chatData.description || '').trim() ||
		avatarFile.value !== null ||
		coverFile.value !== null ||
		(removeAvatar.value && !!props.chatData.avatar_url) ||
		(removeCover.value && !!props.chatData.cover_url)
	)
})

const isValid = computed(() => {
	const trimmed = name.value.trim()
	return trimmed.length >= 2 && trimmed.length <= 30
})

async function onSave() {
	if (!hasChanges.value || !isValid.value || isSaving.value) return

	try {
		isSaving.value = true

		const updatedChat = await updateGroupChat(props.chatData.id, {
			name: name.value.trim(),
			description: description.value.trim() || null,
			avatarFile: avatarFile.value,
			coverFile: coverFile.value,
			removeAvatar: removeAvatar.value,
			removeCover: removeCover.value,
		})

		toast.add({
			title: 'Group updated successfully!',
			icon: 'lucide:check-circle-2',
			color: 'success'
		})

		emit('chat-updated', updatedChat)
		isOpen.value = false
	} catch (error) {
		console.error("Failed to update group chat:", error)
		toast.add({
			title: 'Failed to update group chat',
			description: error instanceof Error ? error.message : 'An error occurred while saving changes',
			icon: 'lucide:alert-circle',
			color: 'error'
		})
	} finally {
		isSaving.value = false
	}
}

watch(() => [isOpen.value, props.chatData], ([open]) => {
	if (open) {
		resetState()
	}
}, { immediate: true })

onBeforeUnmount(() => {
	if (avatarPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl.value)
	if (coverPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(coverPreviewUrl.value)
})
</script>

<template>
	<UModal
		v-model:open="isOpen"
		title="Edit Group Chat"
		description="Admins and owner can customize group name, description, avatar, and cover."
		:ui="{
			content: 'sm:max-w-xl p-6!',
			header: 'border-none pb-2'
		}"
		:fullscreen="isMobile"
	>
		<template #body>
			<form class="flex flex-col gap-6" @submit.prevent="onSave">
				<input
					ref="avatarInputRef"
					type="file"
					accept="image/png,image/jpeg,image/webp,image/gif"
					class="hidden"
					@change="onAvatarSelected"
				>
				<input
					ref="coverInputRef"
					type="file"
					accept="image/png,image/jpeg,image/webp,image/gif"
					class="hidden"
					@change="onCoverSelected"
				>

				<GroupChatPreviewCard
					:name="name"
					:description="description"
					:avatar-preview-url="avatarPreviewUrl"
					:cover-preview-url="coverPreviewUrl"
					@select-avatar="triggerAvatarSelect"
					@remove-avatar="onRemoveAvatar"
					@select-cover="triggerCoverSelect"
					@remove-cover="onRemoveCover"
				/>

				<GroupChatDetailsForm
					v-model:name="name"
					v-model:description="description"
				/>

				<div class="flex items-center justify-end gap-3 pt-2">
					<UButton
						type="button"
						variant="ghost"
						color="neutral"
						label="Cancel"
						:disabled="isSaving"
						@click="isOpen = false"
					/>
					<UButton
						type="submit"
						color="primary"
						icon="lucide:check"
						label="Save Changes"
						:loading="isSaving"
						:disabled="!hasChanges || !isValid"
					/>
				</div>
			</form>
		</template>
	</UModal>

	<ImageCropperModal
		v-model:open="isCropperOpen"
		:image-source="cropperMode === 'avatar' ? selectedRawAvatar : selectedRawCover"
		:aspect-ratio="cropperMode === 'avatar' ? 1 : 7 / 2"
		:shape="cropperMode === 'avatar' ? 'circle' : 'rect'"
		:title="cropperMode === 'avatar' ? 'Crop Group Avatar' : 'Crop Group Cover'"
		:description="cropperMode === 'avatar' ? 'Position and zoom to crop your avatar' : 'Position and zoom to crop your cover banner (7:2)'"
		:file-name="selectedRawFileName"
		@crop="onCropped"
	/>
</template>
