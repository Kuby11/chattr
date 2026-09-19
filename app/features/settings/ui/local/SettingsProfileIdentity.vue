<script setup lang="ts">
const props = defineProps<{
	nickname: string
	username: string
	bio: string | null
}>()

const emit = defineEmits<{
	viewProfile: []
}>()
</script>

<template>
	<h3 class="mt-3 text-2xl font-semibold tracking-tight leading-tight">{{ props.nickname }}</h3>
	<span class="text-sm text-muted">@{{ props.username }}</span>

	<p class="mt-4 text-sm wrap-break-word font-sans whitespace-pre-wrap text-toned">
		{{ props.bio ?? 'no bio yet' }}
	</p>

	<button
		type="button"
		class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary cursor-pointer hover:underline"
		@click="emit('viewProfile')"
	>
		view full profile
		<UIcon name="lucide:arrow-up-right" class="size-3.5" />
	</button>
</template>
