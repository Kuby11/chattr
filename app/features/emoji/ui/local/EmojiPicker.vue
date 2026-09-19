<script setup lang="ts">
import { allEmojis, emojiCategories } from "../../data/emojis"

const emit = defineEmits<{
	select: [emoji: string]
}>()

const searchInput = ref("")
const activeCategory = ref(emojiCategories[0]?.label ?? "")

const filteredEmojis = computed(() => {
	const q = searchInput.value.trim().toLowerCase()

	if (q) {
		return allEmojis.filter(emoji =>
			emoji.name.toLowerCase().includes(q) ||
			emoji.keywords.some(keyword => keyword.includes(q))
		)
	}

	return emojiCategories.find(category => category.label === activeCategory.value)?.emojis ?? []
})

function onSelect(emoji: string) {
	emit("select", emoji)
}

function selectCategory(label: string) {
	activeCategory.value = label
	searchInput.value = ""
}
</script>

<template>
	<div class="flex flex-col w-[min(22rem,calc(100vw-2rem))] h-88 bg-default overflow-hidden">
		<div class="p-2 border-b border-default shrink-0">
			<UInput
				v-model="searchInput"
				icon="lucide:search"
				placeholder="Search emojis"
				size="md"
				autofocus
				:ui="{ root: 'w-full' }"
			/>
		</div>

		<div
			v-if="!searchInput.trim()"
			class="shrink-0 flex gap-1 overflow-x-auto scrollbar-none px-2 py-1.5 border-b border-default"
		>
			<button
				v-for="category in emojiCategories"
				:key="category.label"
				type="button"
				class="shrink-0 px-2 py-1 rounded-full text-xs capitalize transition-colors focus-visible:outline-2 focus-visible:outline-primary"
				:class="activeCategory === category.label
					? 'bg-primary text-inverted'
					: 'text-muted hover:text-default hover:bg-elevated'" 	
				@click="selectCategory(category.label)"
			>
				{{ category.label }}
			</button>
		</div>

		<div class="flex-1 overflow-y-auto scrollbar-none p-2">
			<div
				v-if="!filteredEmojis.length"
				class="h-full min-h-40 flex items-center justify-center text-sm text-muted"
			>
				No emojis found
			</div>

			<div
				v-else
				class="grid grid-cols-8 gap-1"
			>
				<button
					v-for="emoji in filteredEmojis"
					:key="emoji.emoji"
					type="button"
					class="aspect-square flex items-center justify-center text-2xl rounded-lg hover:bg-elevated transition-colors focus-visible:outline-2 focus-visible:outline-primary"
					:title="emoji.name"
					:aria-label="emoji.name"
					@click="onSelect(emoji.emoji)"
				>
					{{ emoji.emoji }}
				</button>
			</div>
		</div>
	</div>
</template>
