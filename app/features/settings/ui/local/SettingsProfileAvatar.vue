<script setup lang="ts">
const props = defineProps<{
	src?: string | null
	alt: string
}>()

const emit = defineEmits<{
	select: [file: File]
}>()

const input = useTemplateRef<HTMLInputElement>('input')

function openFilePicker() {
	input.value?.click()
}

function onFileChange(event: Event) {
	const target = event.target
	if (!(target instanceof HTMLInputElement)) return

	const file = target.files?.[0]
	if (file) emit('select', file)

	target.value = ''
}
</script>

<template>
	<input
		ref="input"
		type="file"
		accept="image/*"
		class="hidden"
		@change="onFileChange"
	>

	<button
		type="button"
		class="group/avatar relative z-20 block size-18 rounded-full cursor-pointer overflow-hidden border-4 border-default bg-elevated shadow-md"
		aria-label="Change avatar image"
		@click="openFilePicker"
	>
		<UAvatar
			:src="props.src ?? undefined"
			:alt="props.alt"
			class="size-full text-2xl"
			:ui="{ fallback: 'text-2xl' }"
		/>
		<div class="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs opacity-0 transition-opacity duration-200 group-hover/avatar:opacity-100 text-white">
			<UIcon name="lucide:camera" class="size-5" />
		</div>
	</button>
</template>
