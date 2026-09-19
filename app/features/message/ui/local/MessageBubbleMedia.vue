<script setup lang="ts">
import { STATE_TOKENS } from '@shared/configs';
import type { ClientMessage } from '../../types/clientMessage';
import { formatBytes } from '@shared/utils';

const props = withDefaults(defineProps<{
	messageData: ClientMessage
	isOwn?: boolean
}>(), {
	isOwn: false
})

const emit = defineEmits<{'media-loaded': [] }>()

function isVideoUrl(url: string) {
	const withoutQuery = url.split("?")[0] ?? ""
	const extension = withoutQuery.split(".").pop()?.toLowerCase() ?? ""
	return STATE_TOKENS.VIDEO_EXTENSIONS.includes(extension as never)
}

function isVideoItem(item: { url: string; type: string }) {
	return item.type === 'video' || item.type.startsWith('video/') || isVideoUrl(item.url)
}

const mediaList = computed(() => props.messageData.media ?? [])

const mediaCount = computed(() => mediaList.value.length)
const isUploading = computed(() => !!props.messageData.is_uploading)

const mediaGalleryRef = useTemplateRef<{ openAt: (index: number) => void }>("mediaGallery")

function openGallery(index: number) {
	if (isUploading.value) return
	mediaGalleryRef.value?.openAt(index)
}

function onVideoClick(event: MouseEvent, index: number) {
	if (isUploading.value) return
	if (event.target !== event.currentTarget) return
	openGallery(index)
}

function onVideoLoadedMetadata(event: Event) {
	const video = event.currentTarget as HTMLVideoElement
	if (video.readyState >= 1) {
		video.currentTime = 0.01
	}
}

const gridLayoutClass = computed(() => {
	const count = mediaCount.value
	if (count === 1) return 'grid-cols-1 max-w-[80vw] sm:max-w-100'
	return 'grid-cols-2 max-w-[80vw] sm:max-w-115'
})

const displayedMedia = computed(() => {
	if (mediaCount.value <= 4) return mediaList.value
	return mediaList.value.slice(0, 4)
})

const remainingCount = computed(() => {
	if (mediaCount.value > 4) return mediaCount.value - 3
	return 0
})

function getItemWrapperClass(index: number, count: number) {
	if (count === 1) {
		return 'col-span-1 w-full max-h-60 sm:max-h-85 overflow-hidden rounded-lg sm:rounded-xl bg-black/5'
	}
	if (count === 2) {
		return 'col-span-1 aspect-4/3 overflow-hidden rounded-md sm:rounded-lg bg-black/10'
	}
	if (count === 3) {
		if (index === 0)
			 return 'col-span-2 aspect-2/1 overflow-hidden rounded-md sm:rounded-lg bg-black/10'
		return 'col-span-1 aspect-square overflow-hidden rounded-md sm:rounded-lg bg-black/10'
	}
	return 'col-span-1 aspect-square overflow-hidden rounded-md sm:rounded-lg bg-black/10'
}

function getItemMediaClass(count: number) {
	if (count === 1) {
		return 'w-full h-auto max-h-60 sm:max-h-85 object-contain cursor-pointer rounded-lg sm:rounded-xl'
	}
}
</script>

<template>
	<MediaCarousel
		v-if="mediaCount > 0"
		ref="mediaGallery"
		:media="mediaList"
		:class="isUploading ? 'pointer-events-none' : ''"
	>
		<div
			:class="[
				'relative grid gap-1 sm:gap-1.5 w-full overflow-hidden rounded-lg sm:rounded-xl',
				gridLayoutClass,
				isOwn && 'ml-auto'
			]"
		>
			<div
				v-for="(item, index) in displayedMedia"
				:key="item.url"
				:class="[
					getItemWrapperClass(index, mediaCount),
					'relative flex items-center justify-center group/media [&>video,img]:object-cover [&>video,img]:w-full [&>video,img]:h-full'
				]"
				@click.stop="openGallery(index)"
			>
				<img
					v-if="item.url.startsWith('blob:') && !isVideoItem(item)"
					:class="getItemMediaClass(mediaCount)"
					:alt="`attachment ${index + 1}`"
					:src="item.url"
					@load="emit('media-loaded')"
				>

				<NuxtImg
					v-else-if="!isVideoItem(item)"
					:class="getItemMediaClass(mediaCount)"
					:alt="`attachment ${index + 1}`"
					:src="item.url"
					@load="emit('media-loaded')"
				/>
				
				<template v-else>
					<video
						:class="[getItemMediaClass(mediaCount), 'bg-black']"
						:src="item.url"
						:preload="item.url.startsWith('blob:') ? 'auto' : 'metadata'"
						muted
						playsinline
						@click.stop="onVideoClick($event, index)"
						@loadedmetadata="onVideoLoadedMetadata"
						@loadeddata="emit('media-loaded')"
					/>

					<div class="bg-black/25 backdrop-blur-md p-2 sm:p-2.5 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
						<UIcon name="lucide:play" class="size-4 sm:size-5 text-white"/>
					</div>
				</template>

				<span class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/25 backdrop-blur-md text-white rounded-md sm:rounded-xl text-[11px] sm:text-xs pointer-events-none z-10">
					{{ formatBytes(item.size) }}
				</span>

				<div
					v-if="index === 3 && remainingCount > 0"
					class="absolute inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center rounded-md sm:rounded-lg text-white font-bold text-lg sm:text-xl cursor-pointer group-hover/media:bg-black/45 transition-colors"
				>
					+{{ remainingCount }}
				</div>
			</div>

			<div
				v-if="isUploading"
				class="
					min-h-10 absolute inset-0 bg-black/45 backdrop-blur-xs flex flex-col items-center 
					justify-center gap-1.5 rounded-xl z-10 text-white select-none pointer-events-none
				"
			>
				<UIcon name="lucide:loader-2" class="animate-spin text-white" size="24" />
				<span class="text-xs font-medium bg-black/40 px-2.5 py-0.5 rounded-full border border-white/20">Uploading media...</span>
			</div>

			<div
				v-if="messageData.is_error"
				class="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 rounded-xl z-10 text-white select-none pointer-events-none"
			>
				<UIcon name="lucide:alert-circle" class="text-red-400" size="24" />
				<span class="text-xs font-medium text-red-300">Upload failed</span>
			</div>
		</div>
	</MediaCarousel>
</template>
