<script setup lang="ts">
import ChatAvatar from '../public/ChatAvatar.vue'
import { getChatAssetUrl } from '../../utils/getChatAssetUrl'

defineProps<{
	name: string
	description: string
	avatarPreviewUrl: string
	coverPreviewUrl: string
}>()

const emit = defineEmits<{
	'select-avatar': []
	'remove-avatar': []
	'select-cover': []
	'remove-cover': []
}>()
</script>

<template>
	<div class="overflow-hidden rounded-xl border border-default bg-elevated/40 shadow-sm transition">
		<div class="group relative aspect-7/2 w-full overflow-hidden bg-primary/20">
			<img
				v-if="coverPreviewUrl"
				:src="getChatAssetUrl(coverPreviewUrl)"
				alt="Cover preview"
				class="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
			>
			<div
				v-else
				class="size-full bg-linear-to-r from-primary/30 via-primary/20 to-primary/5 flex items-center justify-center text-xs text-dimmed font-medium"
			>
				<span>No cover set</span>
			</div>

			<div class="absolute inset-0 flex items-center justify-end gap-2 bg-black/40 p-3 opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100">
				<UButton
					type="button"
					size="xs"
					color="neutral"
					variant="soft"
					icon="lucide:image-plus"
					label="Change cover"
					@click="emit('select-cover')"
				/>
				<UButton
					v-if="coverPreviewUrl"
					type="button"
					size="xs"
					color="error"
					variant="soft"
					icon="lucide:trash-2"
					aria-label="Remove cover"
					@click="emit('remove-cover')"
				/>
			</div>
		</div>

		<div class="relative flex items-end justify-between px-4 pb-4 pt-1">
			<div class="group/avatar relative -mt-9">
				<ChatAvatar
					:src="avatarPreviewUrl"
					chat-type="GROUP"
					size="xl"
					:ui="{
						root: 'size-18 text-2xl ring-4 ring-bg relative z-10 shadow-md'
					}"
				/>

				<button
					type="button"
					class="absolute inset-0 z-20 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity duration-200 group-hover/avatar:opacity-100"
					title="Change avatar"
					@click="emit('select-avatar')"
				>
					<UIcon name="lucide:camera" class="size-6 text-white" />
				</button>
			</div>

			<div class="flex items-center gap-1.5 pt-2">
				<UButton
					type="button"
					size="xs"
					color="neutral"
					variant="ghost"
					icon="lucide:camera"
					label="Upload avatar"
					@click="emit('select-avatar')"
				/>
				<UButton
					v-if="avatarPreviewUrl"
					type="button"
					size="xs"
					color="error"
					variant="ghost"
					icon="lucide:trash-2"
					aria-label="Remove avatar"
					@click="emit('remove-avatar')"
				/>
			</div>
		</div>

		<div class="px-4 pb-4">
			<h3 class="text-lg font-semibold tracking-tight text-default">
				{{ name.trim() || 'Group Name' }}
			</h3>
			<p class="mt-1 line-clamp-2 text-xs text-dimmed">
				{{ description.trim() || 'No description provided' }}
			</p>
		</div>
	</div>
</template>
