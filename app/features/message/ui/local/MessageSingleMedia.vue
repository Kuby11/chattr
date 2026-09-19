<script setup lang="ts">
import { STATE_TOKENS } from '@shared/configs';
import type { ClientMessage } from '../../types/clientMessage';
import { formatBytes } from '@shared/utils';

const props = defineProps<{ messageData: ClientMessage }>()

const emit = defineEmits<{ 'media-loaded': [] }>()

function isVideoUrl(url: string) {
	const withoutQuery = url.split("?")[0] ?? ""
	const extension = withoutQuery.split(".").pop()?.toLowerCase() ?? ""
	return STATE_TOKENS.VIDEO_EXTENSIONS.includes(extension as never)
}

const singleMediaUrl = computed(() =>
	props.messageData.media?.[0]?.url
)
const isUploading = computed(() => !!props.messageData.is_uploading)

const mediaType = computed<'GIF' | 'image' | 'video'>(() => {
	if (props.messageData.type === 'GIF') return 'GIF'
	const firstMedia = props.messageData.media?.[0]
	if (firstMedia?.type === 'video' || firstMedia?.type.startsWith('video/')) return 'video'
	if (singleMediaUrl.value && isVideoUrl(singleMediaUrl.value)) return 'video'
	return 'image'
})

const source = computed(() =>
	mediaType.value === 'GIF' ? props.messageData.content : singleMediaUrl.value
)

const mediaItem = computed(() => ({
	url: source.value ?? '',
	type: mediaType.value,
	size: props.messageData.media?.[0]?.size ?? 0,
	alt: ''
}))

const isVideoLoaded = ref(false)

function onVideoLoadedData() {
	isVideoLoaded.value = true
	emit('media-loaded')
}

function onVideoLoadedMetadata(event: Event) {
	const video = event.currentTarget as HTMLVideoElement
	if (video.readyState >= 1) {
		video.currentTime = 0.01
	}
}

const HOVER_PLAY_DELAY_MS = 500
const hoverTimers = new Map<HTMLVideoElement, ReturnType<typeof setTimeout>>()

function onVideoMouseEnter(event: MouseEvent) {
	const video = event.currentTarget as HTMLVideoElement | null
	if (!video) return

	if (hoverTimers.has(video)) {
		clearTimeout(hoverTimers.get(video)!)
	}

	const timer = setTimeout(() => {
		video.muted = true
		video.play().catch(() => {})
	}, HOVER_PLAY_DELAY_MS)

	hoverTimers.set(video, timer)
}

function onVideoMouseLeave(event: MouseEvent) {
	const video = event.currentTarget as HTMLVideoElement | null
	if (!video) return

	if (hoverTimers.has(video)) {
		clearTimeout(hoverTimers.get(video)!)
		hoverTimers.delete(video)
	}

	video.pause()
	video.currentTime = 0
}

onUnmounted(() => {
	hoverTimers.forEach(timer => clearTimeout(timer))
	hoverTimers.clear()
})

</script>

<template>
	<div class="relative w-full max-w-[85vw] sm:max-w-120 h-fit overflow-hidden group/single-media">
		<MediaCarousel 
			v-if="mediaItem.type !== 'GIF'"
			:key="source"
			:media="[mediaItem]" 
			:start-index="0" 
			:class="isUploading ? 'pointer-events-none' : ''"
		>
			<NuxtImg
				v-if="source && mediaType !== 'video'"
				:class="['rounded-lg sm:rounded-xl min-h-36 sm:min-h-55 max-h-55 sm:max-h-75 object-cover', isUploading && 'blur-sm brightness-50']"
				:alt="mediaType"
				placeholder
				:src="source"
				@load="emit('media-loaded')"
			/>

			<div v-else-if="source" class="relative w-full min-h-36 sm:min-h-50 h-fit max-h-55 sm:max-h-70 flex items-center justify-center">
				<video
					class="rounded-lg sm:rounded-xl w-full h-auto bg-black transition-all duration-300"
					:class="!isVideoLoaded && 'filter blur-md brightness-50 opacity-70 scale-103'"
					:src="source"
					:preload="source.startsWith('blob:') ? 'auto' : 'metadata'"
					muted
					playsinline
					@mouseenter="onVideoMouseEnter"
					@mouseleave="onVideoMouseLeave"
					@loadedmetadata="onVideoLoadedMetadata"
					@loadeddata="onVideoLoadedData"
				/>

				<div 
					v-if="!isVideoLoaded"
					class="absolute inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center rounded-lg sm:rounded-xl z-10 pointer-events-none"
				>
					<UIcon name="lucide:loader-2" class="animate-spin text-white size-8" />
				</div>
			</div>

			<div
				v-if="isUploading"
				class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-black/35 text-white pointer-events-none"
			>
				<UIcon name="lucide:loader-2" class="size-7 animate-spin" />
				<span class="rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium">Uploading media...</span>
			</div>
		</MediaCarousel>
		
		<template v-else>
			<NuxtImg
				class="rounded-lg sm:rounded-xl min-h-36 sm:min-h-55 max-h-55 sm:max-h-75"
				placeholder
				:alt="mediaType"
				:src="source"
				@load="emit('media-loaded')"
			/>
		</template>
		
		<span 
			v-if="mediaType !== 'GIF'"
			class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted/25 backdrop-blur-md text-white rounded-lg sm:rounded-xl text-xs sm:text-sm pointer-events-none z-10 duration-300"
			:class="mediaType === 'video' && 'group-hover/single-media:scale-80 group-hover/single-media:opacity-50 group-hover/single-media:top-1.25 group-hover/single-media:right-0.75'"
		>
			{{ formatBytes(mediaItem.size) }}
		</span>

		<span 
			class="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted/25 backdrop-blur-md text-white rounded-lg sm:rounded-xl text-xs sm:text-sm pointer-events-none z-10 duration-300"
			:class="mediaType === 'video' && 'group-hover/single-media:scale-80 group-hover/single-media:opacity-50 group-hover/single-media:top-1.25 group-hover/single-media:left-0.75'"
		>
			{{ mediaType }}
		</span>
		
		<div 
			v-if="mediaType === 'video' && isVideoLoaded && !isUploading" 
			class="group-hover/single-media:opacity-0 transition bg-black/25 backdrop-blur-md p-2.5 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
		>
			<UIcon name="lucide:play" class="size-5 text-white"/>
		</div>
	</div>
</template>
