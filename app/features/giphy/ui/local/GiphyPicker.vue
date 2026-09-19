<script setup lang="ts">
import { useGiphy } from "../../composables/useGiphy"
import type { GiphyGif, GiphySendPayload } from "../../types/giphy"

const emit = defineEmits<{
	select: [payload: GiphySendPayload]
}>()

const {
	results,
	pending,
	error,
	hasMore,
	search,
	loadTrending,
	loadMore,
	sendGif,
	reset,
} = useGiphy()

const searchInput = ref("")
const gridRef = useTemplateRef<HTMLElement>("grid")

async function showDefault() {
	await loadTrending({ limit: 24 })
}

const runSearch = useDebounceFn(async (value: string) => {
	const q = value.trim()
	if (!q) {
		await showDefault()
		return
	}
	await search({ q, limit: 24 })
}, 350)

watch(searchInput, (value) => {
	runSearch(value)
})

onMounted(() => {
	if (!results.value.length) {
		showDefault()
	}
})

function onSelect(gif: GiphyGif) {
	emit("select", sendGif(gif))
}

async function onGridScroll() {
	const el = gridRef.value
	if (!el || pending.value || !hasMore.value) return

	const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80
	if (nearBottom) {
		await loadMore(24)
	}
}

onScopeDispose(() => {
	reset()
})
</script>

<template>
	<div class="flex flex-col w-[min(22rem,calc(100vw-2rem))] h-88 bg-default overflow-hidden">
		<div class="p-2 border-b border-default shrink-0">
			<UInput
				v-model="searchInput"
				icon="lucide:search"
				placeholder="Search GIFs"
				size="md"
				autofocus
				:ui="{ root: 'w-full' }"
			/>
		</div>

		<div
			ref="grid"
			class="flex-1 overflow-y-auto p-2"
			@scroll="onGridScroll"
		>
			<p v-if="error" class="text-sm text-error px-1 py-2">
				{{ error }}
			</p>

			<div
				v-else-if="!pending && !results.length"
				class="h-full min-h-40 flex items-center justify-center text-sm text-muted"
			>
				No GIFs found
			</div>

			<div
				v-else
				class="columns-2 gap-2"
			>
				<button
					v-for="gif in results"
					:key="gif.id"
					type="button"
					class="mb-2 w-full break-inside-avoid rounded-lg overflow-hidden bg-elevated hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-primary"
					:aria-label="gif.title || 'Select GIF'"
					@click="onSelect(gif)"
				>
					<img
						:src="gif.images.fixed_height_small?.url || gif.images.fixed_height.url"
						:alt="gif.title"
						class="w-full h-auto block"
						loading="lazy"
					>
				</button>
			</div>

			<div v-if="pending" class="flex justify-center py-3">
				<UIcon name="lucide:loader-circle" class="size-5 animate-spin text-muted" />
			</div>
		</div>

		<a
			href="https://giphy.com/"
			target="_blank"
			rel="noopener noreferrer"
			class="px-2 py-1.5 border-t border-default shrink-0 text-[0.65rem] tracking-wide uppercase text-muted hover:text-default transition-colors text-right"
		>
			Powered by GIPHY
		</a>
	</div>
</template>
