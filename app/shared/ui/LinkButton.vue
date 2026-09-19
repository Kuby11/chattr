<script setup lang="ts">
import type { ButtonProps } from '#ui/types'

withDefaults(
	defineProps<ButtonProps & {
		to: string,
		activeColor?: ButtonProps['color'],
		activeVariant?: ButtonProps['variant'],
		activeClass?: string,
		tooltipText?: string
	}>(),
	{ 
		activeVariant: 'soft', 
		activeColor: 'primary', 
		variant: 'ghost',
		color: 'neutral',
		size: 'xl'
	}
)

const route = useRoute()
	
const isActivePath = (link: string) => {
	if(route.path.startsWith(link) && link !== '/' 
		|| route.path === '/' && link === '/'
	){
		return true
	} else {
		return false
	}
}

</script>
<template>
	<template v-if="$props.tooltipText">
		<TooltipRoot>
			<UTooltip
				:text="$props.tooltipText"
				:content="{ side: 'right' }"
				:ui="{ content: `text-sm p-2 ${isActivePath($props.to) && 'text-'+ $props.activeColor }` }"
			>
				<UButton
					:class="[$props.class, $props.activeClass, 'cursor-pointer']"
					v-bind="$props"
					:icon
					:to
					:color="isActivePath($props.to) ? $props.activeColor : $props.color"
					:variant="isActivePath($props.to) ? $props.activeVariant : $props.variant"
				/>
			</UTooltip>
		</TooltipRoot>
	</template>

	<UButton 
		v-else
		:class="[$props.class, $props.activeClass, 'cursor-pointer']"
		v-bind="$props"
		:icon
		:to
		:color="isActivePath($props.to) ? $props.activeColor : $props.color"
		:variant="isActivePath($props.to) ? $props.activeVariant : $props.variant"
	>
		<slot />
	</UButton>
</template>
		