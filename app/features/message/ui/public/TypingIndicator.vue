<script setup lang="ts">
defineProps<{
	label: string | null
}>()
</script>

<template>
	<Transition name="typing-indicator">
		<div
			v-if="label"
			class="h-4 max-h-4 flex items-center overflow-hidden text-xs text-muted gap-1.5 w-full"
		>
			<span class="inline-flex gap-0.5 shrink-0">
				<span class="typing-dot size-1 rounded-full bg-current opacity-70" />
				<span class="typing-dot size-1 rounded-full bg-current opacity-70" />
				<span class="typing-dot size-1 rounded-full bg-current opacity-70" />
			</span>
			<span class="truncate">{{ label }}</span>
		</div>
	</Transition>
</template>

<style scoped>
.typing-dot {
	animation: typing-bounce 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
	animation-delay: 0.15s;
}

.typing-dot:nth-child(3) {
	animation-delay: 0.3s;
}

@keyframes typing-bounce {
	0%,
	60%,
	100% {
		transform: translateY(0);
		opacity: 0.45;
	}
	30% {
		transform: translateY(-2px);
		opacity: 1;
	}
}

.typing-indicator-enter-active,
.typing-indicator-leave-active {
	transition:
		opacity 0.2s ease,
		transform 0.25s ease,
		max-height 0.25s ease;
}

.typing-indicator-enter-from,
.typing-indicator-leave-to {
	opacity: 0;
	transform: translateY(0.15rem);
	max-height: 0;
}
</style>
