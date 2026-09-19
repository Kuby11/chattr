<script setup lang="ts">
import { useDownload, useBreakpoint } from '../composables';
import { STATE_TOKENS } from '../configs';
import { formatBytes } from '../utils';

export interface MediaGalleryItem {
	url: string
	type?: string 
	size: number,
}

const props = withDefaults(defineProps<{
	media: MediaGalleryItem[]
	class?: string,
	startIndex?: number
}>(), {
	class: '',
	startIndex: 0
})

const { md: isSmallerDevice } = useBreakpoint()

function isVideoUrl(url: string) {
	const withoutQuery = url.split("?")[0] ?? ""
	const extension = withoutQuery.split(".").pop()?.toLowerCase() ?? ""
	return STATE_TOKENS.VIDEO_EXTENSIONS.includes(extension as never)
}

function isBlobUrl(url: string) {
	return url.startsWith("blob:")
}

function isVideoItem(item: MediaGalleryItem) {
	return item.type === 'video' || item.type?.startsWith('video/') || isVideoUrl(item.url)
}

const isOpen = ref(false)
const currentIndex = ref(props.startIndex)
type VideoPlayerInstance = { pause: () => void, focus: () => void }
const videoPlayers = new Map<number, VideoPlayerInstance>()
let focusFrame: number | null = null
let focusTimer: ReturnType<typeof setTimeout> | null = null
let isDisposed = false

const mediaCount = computed(() => props.media.length)

function focusCurrentVideo() {
	const player = videoPlayers.get(currentIndex.value)
	if (player?.focus) {
		player.focus()
		return true
	}
	return false
}

function scheduleFocusFrame() {
	if (focusFrame !== null) cancelAnimationFrame(focusFrame)
	focusFrame = requestAnimationFrame(() => {
		focusFrame = null
		if (!isDisposed) focusCurrentVideo()
	})
}

function scheduleFocusTimer() {
	if (focusTimer) clearTimeout(focusTimer)
	focusTimer = setTimeout(() => {
		focusTimer = null
		if (!isDisposed) focusCurrentVideo()
	}, 100)
}

function openAt(index: number) {
	currentIndex.value = index
	isOpen.value = true
	nextTick(() => {
		if (isDisposed) return
		focusCurrentVideo()
		scheduleFocusFrame()
		scheduleFocusTimer()
	})
}

function onWrapperKeydown(event: KeyboardEvent, index: number) {
	if (event.target !== event.currentTarget) return
	openAt(index)
}

function navigateToMedia(index: number) {
	currentIndex.value = index
}

function onCarouselKeydownCapture(event: KeyboardEvent) {
	if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') 
		return
	if ((event.target as HTMLElement | null)?.closest?.('[data-video-player]')) 
		return
	event.stopImmediatePropagation()
}

function setVideoPlayer(index: number, player: unknown) {
	if (player) {
		videoPlayers.set(index, player as VideoPlayerInstance)
	} else {
		videoPlayers.delete(index)
	}
}

function pauseInactiveVideos(activeIndex?: number) {
	for (const [index, player] of videoPlayers) {
		if (index !== activeIndex) player.pause()
	}
}

const { downloadFile, downloadFiles } = useDownload()

async function downloadCurrentMedia() {
	const current = props.media[currentIndex.value]
	if (!current) return
	await downloadFile(current.url)
}

async function downloadAllMedia() {
	const urls = props.media.map(item => item.url)
	await downloadFiles(urls)
}

watch(currentIndex, () => {
	pauseInactiveVideos()
	if (isOpen.value) {
		nextTick(() => {
			if (isDisposed) return
			focusCurrentVideo()
			scheduleFocusFrame()
		})
	}
})

watch(isOpen, (open) => { if (!open) pauseInactiveVideos() })

onUnmounted(() => {
	isDisposed = true
	if (focusFrame !== null) cancelAnimationFrame(focusFrame)
	if (focusTimer) clearTimeout(focusTimer)
	focusFrame = null
	focusTimer = null
	videoPlayers.clear()
})

defineExpose({ openAt })
</script>

<template>
	<div
		role="button"
		tabindex="0"
		:class="['h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl ', $props.class]"
		@click="openAt(startIndex)"
		@keydown.enter="onWrapperKeydown($event, startIndex)"
		@keydown.space.prevent="onWrapperKeydown($event, startIndex)"
	>
		<slot />
	</div>

	<UModal
		v-model:open="isOpen"
		dismissible
		:ui="{
			content: 'h-full max-w-250 bg-transparent border-0! ring-0! outline-0! p-0! px-2 sm:px-4 mx-auto',
			header: 'border-none',
			close: 'hidden',
			body: 'p-0 h-full flex justify-center',
			overlay: 'bg-default/75 backdrop-blur-xs flex items-center justify-center'
		}"
		fullscreen
	>
		<template #body>
			<div class="fixed top-3 right-3 sm:top-6 sm:right-6 z-20 flex items-center gap-1.5 sm:gap-2">
				<UButton
					icon="lucide:download"
					color="neutral"
					variant="subtle"
					:size="isSmallerDevice ? 'sm' : 'md'"
					aria-label="Download Current Media"
					:label="isSmallerDevice ? formatBytes(media[currentIndex]?.size ?? 0) : `Download (${formatBytes(media[currentIndex]?.size ?? 0)})`"
					@click="downloadCurrentMedia"
				/>
				<UButton
					v-if="mediaCount > 1"
					icon="lucide:folder-down"
					color="neutral"
					variant="subtle"
					:size="isSmallerDevice ? 'sm' : 'md'"
					:label="isSmallerDevice ? 'All' : 'Download All'"
					aria-label="Download All Media"
					@click="downloadAllMedia"
				/>
				<UButton
					icon="lucide:x"
					color="neutral"
					variant="subtle"
					:size="isSmallerDevice ? 'sm' : 'md'"
					aria-label="Close"
					@click="isOpen = false"
				/>
			</div>

			<div class="relative flex flex-col p-2">
				<UCarousel
					v-slot="{ item, index }"
					loop
					auto-height
					:arrows="mediaCount > 1"
					:items="media"
					:next="{ size: isSmallerDevice ? 'sm' : 'xl' }"
					:prev="{ size: isSmallerDevice ? 'sm' : 'xl' }"
					:start-index="currentIndex"
					:watch-drag="isSmallerDevice"
					:breakpoints="{
						'(min-width: 769px)': { watchDrag: false },
						'(max-width: 768px)': { watchDrag: true }
					}"
					:ui="{
						root: 'h-full max-w-200',
						dots: 'static mt-3 sm:mt-4', 
						item: 'w-full h-[55vh] sm:h-[65vh] md:h-[70vh]!',
						container: 'h-full',
						prev: 'start-2 sm:-start-15! not-sm:hidden',
						next: 'end-2 sm:-end-15! not-sm:hidden'
					}"
					@keydown.capture="onCarouselKeydownCapture"
					@select="navigateToMedia"
				>
					<div class="flex items-center justify-center w-full h-full px-2 sm:px-4">
						<AppVideoPlayer
							v-if="isVideoItem(item)"
							:ref="player => setVideoPlayer(index, player)"
							:src="item.url"
							class="max-w-full max-h-[55vh] sm:max-h-[65vh] md:max-h-[70vh] rounded-lg bg-black"
						/>

						<img
							v-else-if="isBlobUrl(item.url)"
							:src="item.url"
							:alt="`media attachment${index + 1}`"
							draggable="false"
							class="max-w-full max-h-[55vh] sm:max-h-[65vh] md:max-h-[70vh] rounded-lg object-contain select-none pointer-events-none sm:pointer-events-auto"
						>
						
						<NuxtImg
							v-else
							:src="item.url"
							:alt="`media attachment ${index + 1}`"
							draggable="false"
							class="max-w-full max-h-[55vh] sm:max-h-[65vh] md:max-h-[70vh] rounded-lg object-contain select-none pointer-events-none sm:pointer-events-auto"
						/>
					</div>
				</UCarousel>

				<UCarousel
					v-if="mediaCount > 1"
					v-slot="{ item, index }"
					:start-index="currentIndex"
					:items="media"
					:ui="{
						root: 'py-2 sm:py-4 min-w-20 border border-muted rounded-xl bg-muted flex gap-1.5 sm:gap-2 justify-between max-w-[85vw] sm:max-w-sm overflow-x-auto scrollbar-none mx-auto',
						container: '',
						item: 'first:ml-2 sm:first:ml-4 mr-1 last:mr-2 sm:last:mr-4 max-w-9 sm:max-w-11'
					}"
					@keydown.capture="onCarouselKeydownCapture"
				>
					<div
						class="size-9 sm:size-11 brightness-25 opacity-75 hover:brightness-100 hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
						:class="{ 'brightness-100 opacity-100': currentIndex === index }"
						@click="navigateToMedia(index)"
					>
						<video v-if="isVideoItem(item)" :src="item.url" class="mb-1 sm:mb-2 size-8 sm:size-10 min-w-8 sm:min-w-10 object-cover rounded-lg" loading="lazy" />

						<img v-else :src="item.url" class="rounded-lg size-8 sm:size-10 object-cover" loading="lazy" draggable="false">
					</div>
				</UCarousel>

				<div v-if="mediaCount > 1" class="py-1 sm:py-2 px-3 sm:px-4 min-w-14 text-center mx-auto border border-muted rounded-xl bg-muted text-xs sm:text-sm text-white/80 mt-2 sm:mt-4">
					<span>{{ currentIndex + 1 }} / {{ mediaCount }}</span>
				</div>
			</div>
		</template>
	</UModal>
</template>
