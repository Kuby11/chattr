<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui';
import { modifiedUI } from '@shared/utils';
import { ROUTE_TOKENS } from '@shared/configs';

const props = defineProps<ButtonProps>()

const buttonUi = modifiedUI<ButtonProps['ui']>({
	base: 'group cursor-pointer aspect-square items-center justify-center',
	leadingIcon: 'group-hover:rotate-180 group-hover:duration-1000',
	...props.ui
})

</script>

<template>
	<UButton
		v-bind="$props"
		icon="lets-icons:setting-fill"
		size="xl"
		color="neutral"
		variant="ghost"
		:ui="buttonUi"
		:to="ROUTE_TOKENS.SETTINGS.PROFILE"
	/>
</template>
