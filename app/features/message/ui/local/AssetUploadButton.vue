<script setup lang="ts">
import type { ButtonProps } from "#ui/types"
import { useAssetPreviews } from "../../composables/useAssetPreviews"

const props = withDefaults(
	defineProps<
		Omit<ButtonProps, "icon" | "label"> & {
			label?: string
		}
	>(),
	{
		label: undefined,
		variant: "ghost",
		color: "neutral",
		size: "md",
	}
)

const assets = defineModel<File[]>({ default: () => [] })
const assetPreviews = useAssetPreviews(assets)

const emit = defineEmits<{
	attach: [files: File[]]
}>()

const inputRef = useTemplateRef<HTMLInputElement>("inputRef")

const toast = useToast()
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024

function openPicker() {
	inputRef.value?.click()
}

function onFilesChange(event: Event) {
	const input = event.target as HTMLInputElement
	const files = Array.from(input.files ?? [])

	if (!files.length)
		return

	const validFiles: File[] = []
	for (const file of files) {
		if (file.size > MAX_FILE_SIZE_BYTES) {
			const sizeInMb = (file.size / (1024 * 1024)).toFixed(1)
			toast.add({
				title: "File size exceeds 15MB limit",
				description: `"${file.name}" is ${sizeInMb}MB. Maximum allowed media size is 15MB.`,
				icon: "lucide:alert-circle",
				color: "error"
			})
		} else {
			validFiles.push(file)
		}
	}

	if (validFiles.length > 0) {
		assets.value = [...assets.value, ...validFiles]
		emit("attach", validFiles)
	}

	input.value = ""
}

function removeAsset(index: number) {
	assets.value = assets.value.filter((_, i) => i !== index)
}

function isVideo(file: File) {
	return file.type.startsWith("video/")
}

function isImage(file: File) {
	return file.type.startsWith("image/")
}
</script>

<template>
	<UPopover
		:content="{ side: 'top', align: 'end', sideOffset: 8 }"
		:ui="{ content: 'p-0 overflow-hidden rounded-xl ring ring-default' }"
	>
		<UButton
			v-bind="props"
			icon="lucide:paperclip"
			color="neutral"
			variant="soft"
			:label="label"
			:aria-label="label || 'Attach images or videos'"
		/>

		<template #content>
			<div class="flex flex-col gap-2 p-3 w-80 max-h-96 overflow-y-scroll scrollbar-thin">
				<UButton
					icon="lucide:plus"
					color="neutral"
					variant="soft"
					label="add images or videos"
					class="w-full"
					@click="openPicker"
				/>

				<p v-if="!assets.length" class="text-xs text-dimmed text-center py-4">
					no assets attached yet
				</p>

				<div
					v-for="(file, index) in assets"
					:key="index"
					class="flex items-center gap-2 p-1.5 rounded-lg bg-muted/50"
				>
					<video
						v-if="isVideo(file)"
						:src="assetPreviews[index]"
						class="size-10 rounded-md object-cover shrink-0 bg-black"
						muted
						preload="metadata"
					/>

					<img
						v-else-if="isImage(file)"
						:src="assetPreviews[index]"
						class="size-10 rounded-md object-cover shrink-0 bg-black"
						alt=""
					>

					<UIcon v-else name="lucide:file" class="size-10 shrink-0 text-muted p-1.5 bg-muted/50 rounded-md" />

					<span class="flex-1 text-sm truncate">{{ file.name }}</span>

					<UButton
						icon="lucide:x"
						size="xs"
						variant="ghost"
						color="neutral"
						:aria-label="`remove ${file.name}`"
						@click="removeAsset(index)"
					/>
				</div>
			</div>

			<input
				ref="inputRef"
				type="file"
				accept="image/*,video/*"
				multiple
				class="hidden"
				@change="onFilesChange"
			>
		</template>
	</UPopover>
</template>
