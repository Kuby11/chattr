<script setup lang="ts">
import type { ButtonProps } from "#ui/types"
import GiphyPicker from "../local/GiphyPicker.vue"
import type { GiphySendPayload } from "../../types/giphy"

const props = withDefaults(
	defineProps<
		Omit<ButtonProps, "icon" | "label"> & {
			label?: string
		}
	>(),
	{
		label: undefined,
		variant: "ghost",
		color: "neutral",
		size: "md",
	}
)

const emit = defineEmits<{
	select: [payload: GiphySendPayload]
}>()

const open = ref(false)

function onSelect(payload: GiphySendPayload) {
	emit("select", payload)
	open.value = false
}
</script>

<template>
	<UPopover
		v-model:open="open"
		:content="{ side: 'top', align: 'end', sideOffset: 8 }"
		:ui="{ content: 'p-0 overflow-hidden rounded-xl ring ring-default' }"
	>
		<UButton
			v-bind="props"
			icon="hugeicons:gif-01"
			color="neutral"
			variant="soft"
			:label="label"
			:aria-label="label || 'Open GIF picker'"
		/>

		<template #content>
			<GiphyPicker @select="onSelect" />
		</template>
	</UPopover>
</template>
