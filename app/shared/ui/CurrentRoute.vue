<script setup lang="ts">
import { useCurrentRoute } from '@shared/composables';

defineProps<{
	class?: string, 
	ui?: { 
		base?: string, 
		label?: string, 
		icon?: string 
	}
}>()

const { currentRoute } = useCurrentRoute()

</script>

<template>
	<div :class="['flex items-end justify-center', $props.ui?.base, $props.class]">
		<UIcon :class="['m-1', $props.ui?.icon]" :name="currentRoute.icon"/>
		<h2 :class="['text-md h-fit', $props.ui?.label]">{{ currentRoute.route }}</h2>
	</div>
</template>