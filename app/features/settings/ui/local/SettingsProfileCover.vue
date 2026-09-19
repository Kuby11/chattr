<script setup lang="ts">
const props = defineProps<{
	src?: string | null
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
		class="group/cover relative block w-full aspect-7/2 overflow-hidden bg-linear-to-r from-primary/50 to-primary/15 cursor-pointer"
		aria-label="Change cover image"
		@click="openFilePicker"
	>
		<img
			v-if="props.src"
			:src="props.src"
			alt="Profile cover"
			class="size-full object-cover transition-transform duration-300 group-hover/cover:scale-105"
		>
		<div class="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/45 backdrop-blur-xs opacity-0 transition-opacity duration-200 group-hover/cover:opacity-100 text-white">
			<UIcon name="lucide:camera" class="size-4" />
			<span class="text-xs font-medium">Change cover</span>
		</div>
		<div class="absolute top-2 right-2 z-10 flex items-center justify-center size-7 rounded-full bg-black/40 backdrop-blur-sm text-white transition-opacity duration-200 group-hover/cover:opacity-0">
			<UIcon name="lucide:pen" class="size-3.5" />
		</div>
	</button>
</template>
