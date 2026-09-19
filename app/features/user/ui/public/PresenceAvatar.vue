<script setup lang="ts">
import type { UserId } from '@shared/types'
import { useUserPresence } from '../../composables/useUserPresence'
import type { ChipProps } from '#ui/types'

const props = defineProps<{ userId?: UserId } & ChipProps>()

const { isOnlineVisible } = useUserPresence()

const isUserOnline = computed(() => (props.userId ? isOnlineVisible(props.userId) : false))
</script>

<template>
	<UChip
		v-model:show="isUserOnline"
		v-bind="$props"
		:ui="{
			root: 'w-fit h-fit',
			base: 'z-10'
		}"
		as="span"
		inset
		position="bottom-right"
	>
		<slot />
	</UChip>
</template>