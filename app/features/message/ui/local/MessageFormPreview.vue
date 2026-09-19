<script setup lang="ts">

defineProps<{ 
  condition: boolean, 
  title: string, 
  icon?: string
}>()

const emit = defineEmits(['click'])

const handleClick = (event: unknown) => {
  emit('click', event)
}

</script>

<template>
	<Transition 
		tag="div" 
		name="formPreview"
	>
		<div
			v-if="condition"
			class="absolute bottom-[calc(100%+0.5rem)] z-230 py-2 px-4 min-h-17 grid grid-cols-[2rem_1fr] gap-1 bg-muted/70 backdrop-blur-lg items-center w-full rounded-xl border border-muted"
		>
			<UIcon :name="icon ?? 'lucide:pencil'" class="size-5 row-span-2 aspect-square"/>
			<h3 class="font-bold text-primary">{{ title }}</h3>

			<slot />
			
			<UButton
				icon="lucide:x"
				variant="ghost"
				color="neutral"
				size="sm"
				:ui="{ base: 'absolute right-1.5 top-1.5' }" 
				@click="handleClick"
			/>
		</div>
	</Transition>
</template>

<style scoped>

.formPreview-enter-active,
.formPreview-leave-active {
  transition: all 0.2s ease;
}
.formPreview-enter-from,
.formPreview-leave-to {
  opacity: 0;
  transform: translate3d(0, 0.35rem, 0);
}

</style>
