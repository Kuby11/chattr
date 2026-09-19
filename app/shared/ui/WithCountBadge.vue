<script setup lang="ts">

withDefaults(defineProps<{
		value?: number,
		align?: 'top' | 'bottom',
		justify?: 'left' | 'right',
		includeZero?: boolean,
		class?: string
	}>(),
	{ align: 'top', justify: 'left', includeZero: false, value: 0 }
)

</script>

<template>
	<div class="relative w-fit h-fit"	>
		<div 
			v-if="$props.includeZero || $props.value > 0" 
			:class="[
				'h-5 w-5 z-10 aspect-square rounded-full absolute bg-primary text-inverted text-sm font-medium flex items-center justify-center', 
				$props.align === 'top' ? '-top-2' : '-bottom-2',
				$props.justify === 'left' ? '-left-2' : '-right-2',
			]">
			{{value}}
		</div>
		<slot />
	</div>
</template>
