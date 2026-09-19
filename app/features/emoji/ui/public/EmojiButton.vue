<script setup lang="ts">
import type { ButtonProps } from "#ui/types"
import EmojiPicker from "../local/EmojiPicker.vue"

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
	select: [emoji: string]
}>()

const open = ref(false)

function onSelect(emoji: string) {
	emit("select", emoji)
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
			icon="lucide:smile-plus"
			color="neutral"
			variant="soft"
			:label="label"
			:aria-label="label || 'Open emoji picker'"
		/>

		<template #content>
			<EmojiPicker @select="onSelect" />
		</template>
	</UPopover>
</template>
