<script setup lang="ts">
import { STATE_TOKENS } from '@shared/configs';

const props = defineProps<{
	assets: File[]
	previews: string[]
}>()

const emit = defineEmits<{
	remove: [index: number]
}>()

const keys = new Map<File, number>()
let nextKey = 0

watch(
	() => props.assets,
	(files) => {
		const current = new Set(files)

		for (const [file] of keys) {
			if (!current.has(file)) keys.delete(file)
		}

		for (const file of files) {
			if (!keys.has(file)) keys.set(file, nextKey++)
		}
	},
	{ immediate: true }
)

const items = computed(() =>
	props.assets.map((file, index) => ({ key: keys.get(file)!, file, index }))
)

const hasAssets = computed(() => props.assets.length > 0)

function isVideoAsset(file: File) {
	if (file.type.startsWith("video/"))
		return true

	const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
	return STATE_TOKENS.VIDEO_EXTENSIONS.includes(ext as never)
}

const media = computed(() =>
	props.assets.map((file, index) => ({
		url: props.previews[index] ?? "",
		type: isVideoAsset(file) ? 'video' as const : 'image' as const,
		alt: file.name,
		size: file.size
	}))
)

const mediaGalleryRef = useTemplateRef<{ openAt: (index: number) => void }>("mediaGallery")

const failedImages = ref<Set<number>>(new Set())
const failedVideos = ref<Set<number>>(new Set())

function onImageError(index: number) {
	failedImages.value = new Set(failedImages.value).add(index)
}

function onVideoError(index: number) {
	failedVideos.value = new Set(failedVideos.value).add(index)
}

watch(
	() => props.assets,
	() => {
		failedImages.value = new Set()
		failedVideos.value = new Set()
	}
)
</script>

<template>
	<MediaCarousel v-if="hasAssets" ref="mediaGallery" :media>
		<TransitionGroup
			appear
			tag="div"
			name="asset"
			class="flex gap-2 w-full mb-2 p-2 overflow-x-auto scrollbar-none rounded-xl"
		>
			<div
				v-for="item in items"
				:key="item.key"
				class="relative transition duration-150 size-24 shrink-0 rounded-lg overflow-hidden bg-black cursor-pointer group ring-2 ring-transparent hover:ring-primary"
				role="button"
				:tabindex="0"
				@click.stop="mediaGalleryRef?.openAt(item.index)"
				@keydown.enter.stop="mediaGalleryRef?.openAt(item.index)"
			>
				<template v-if="isVideoAsset(item.file)">
					<div
						v-if="failedVideos.has(item.index)"
						class="w-full h-full flex items-center justify-center bg-black"
					>
						<UIcon name="lucide:file-video" class="size-8 text-white/50" />
					</div>

					<video
						v-else
						:src="previews[item.index]"
						class="w-full h-full object-cover"
						muted
						playsinline
						preload="auto"
						@error="onVideoError(item.index)"
					/>
				</template>

				<template v-else>
					<div
						v-if="failedImages.has(item.index)"
						class="w-full h-full flex items-center justify-center bg-black"
					>
						<UIcon name="lucide:file-image" class="size-8 text-white/50" />
					</div>

					<img
						v-else
						:src="previews[item.index]"
						:alt="item.file.name"
						class="w-full h-full object-cover"
						@error="onImageError(item.index)"
					>
				</template>

				<UButton
					icon="lucide:x"
					size="xs"
					color="neutral"
					variant="ghost"
					:ui="{ 
						base: 'size-5 absolute top-1 right-1 bg-muted/50! backdrop-blur-sm text-default! hover:text-inverted hover:bg-muted/50! p-0 flex items-center justify-center', 
						leadingIcon: 'size-4'
					}"
					:aria-label="`remove ${item.file.name}`"
					@click.stop="emit('remove', item.index)"
				/>

				<span 
					v-if="isVideoAsset(item.file)" 
					class="
						absolute top-1/2 left-1/2 -translate-1/2 group-hover:text-primary size-6 bg-muted/50 backdrop-blur-sm 
						flex items-center justify-center rounded-full transition
					"
				>
					<UIcon name="lucide:play" class="size-3.5" />
				</span>
			</div>
		</TransitionGroup>
	</MediaCarousel>
</template>

<style scoped>
.asset-enter-active,
.asset-leave-active {
	transition: opacity 0.2s ease, transform 0.2s ease, filter 0.1s ease;
}

.asset-move {
	transition: transform 0.2s ease;
}

.asset-enter-from,
.asset-leave-to {
	opacity: 0;
	filter: blur(20px);
	transform: scale(0.85);
}
</style>
