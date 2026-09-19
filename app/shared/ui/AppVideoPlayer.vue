<script setup lang="ts">

const props = withDefaults(defineProps<{
	src: string
	poster?: string
	title?: string
	autoplay?: boolean
	muted?: boolean
	loop?: boolean
	controls?: boolean
	preload?: 'none' | 'metadata' | 'auto'
	aspectRatio?: string
}>(), {
	poster: '',
	title: 'Video player',
	autoplay: false,
	muted: false,
	loop: false,
	controls: true,
	preload: 'metadata',
	aspectRatio: '16/9'
})

const emit = defineEmits<{
	play: []
	pause: []
	ended: []
	timeupdate: [currentTime: number]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const progressBarRef = ref<HTMLDivElement | null>(null)

const isPlaying = ref(false)
const isMuted = ref(props.muted)
const volume = ref(props.muted ? 0 : 1)
const previousVolume = ref(1)
const currentTime = ref(0)
const duration = ref(0)
const bufferedPercent = ref(0)
const isBuffering = ref(false)
const isFullscreen = ref(false)
const isPip = ref(false)
const playbackRate = ref(1)
const showControls = ref(true)
const isHovered = ref(false)
const isSeeking = ref(false)
const isPlayerFocused = ref(false)
const hoverTime = ref<number | null>(null)
const hoverPosition = ref(0)
const feedbackAction = ref<
	'play' | 'pause' | 'rewind' | 'forward' | 'volume-up' | 'volume-down' | 'volume-muted' | null
>(null)

const isPipSupported = computed(() => {
	if (import.meta.server) return false
	return 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled
})

function formatTime(seconds: number): string {
	if (isNaN(seconds) || seconds < 0) return '0:00'
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = Math.floor(seconds % 60)
	const formatNumber = (num: number) => num.toString().padStart(2, '0')

	if (h > 0) {
		return `${h}:${formatNumber(m)}:${formatNumber(s)}`
	}
	return `${m}:${formatNumber(s)}`
}

const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))
const formattedHoverTime = computed(() => hoverTime.value !== null ? formatTime(hoverTime.value) : '')

const progressPercent = computed(() => {
	if (!duration.value) return 0
	return Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100))
})

const volumeIcon = computed(() => {
	if (isMuted.value || volume.value === 0) return 'lucide:volume-x'
	if (volume.value < 0.5) return 'lucide:volume-1'
	return 'lucide:volume-2'
})

const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2]

let idleTimer: ReturnType<typeof setTimeout> | null = null
let feedbackTimer: ReturnType<typeof setTimeout> | null = null

function resetIdleTimer() {
	showControls.value = true
	if (idleTimer) {
		clearTimeout(idleTimer)
		idleTimer = null
	}
	if (isPlaying.value && !isHovered.value) {
		idleTimer = setTimeout(() => {
			showControls.value = false
			idleTimer = null
		}, 2500)
	}
}

function triggerFeedback(action: NonNullable<typeof feedbackAction.value>) {
	if (feedbackTimer) clearTimeout(feedbackTimer)
	feedbackAction.value = action
	feedbackTimer = setTimeout(() => {
		if (feedbackAction.value === action) {
			feedbackAction.value = null
		}
		feedbackTimer = null
	}, 600)
}

function onVideoClick() {
	containerRef.value?.focus({ preventScroll: true })
	togglePlay()
}

async function togglePlay() {
	if (!videoRef.value) return
	try {
		if (videoRef.value.paused) {
			await videoRef.value.play()
			triggerFeedback('play')
		} else {
			videoRef.value.pause()
			triggerFeedback('pause')
		}
	} catch (err) {
		console.error('Video playback error:', err)
	}
}

function pause() {
	videoRef.value?.pause()
}

function focus() {
	containerRef.value?.focus({ preventScroll: true })
}

function toggleMute() {
	if (isMuted.value || volume.value === 0) {
		volume.value = previousVolume.value || 1
	} else {
		previousVolume.value = volume.value
		volume.value = 0
	}
}

watch(volume, (newVal, oldVal) => {
	const clamped = Math.min(1, Math.max(0, newVal))
	if (clamped > 0) {
		previousVolume.value = clamped
	}
	const shouldMute = clamped === 0
	isMuted.value = shouldMute
	if (videoRef.value) {
		videoRef.value.volume = clamped
		videoRef.value.muted = shouldMute
	}

	if (oldVal !== undefined && clamped !== oldVal) {
		triggerFeedback(
			clamped === 0 ? 'volume-muted' : clamped > oldVal ? 'volume-up' : 'volume-down'
		)
	}
})

function seekTo(seconds: number) {
	if (!videoRef.value || !duration.value) return
	const clamped = Math.min(duration.value, Math.max(0, seconds))
	videoRef.value.currentTime = clamped
	currentTime.value = clamped
}

function setPlaybackSpeed(rate: number) {
	if (!videoRef.value) return
	videoRef.value.playbackRate = rate
	playbackRate.value = rate
}

async function toggleFullscreen() {
	if (!containerRef.value) return
	try {
		if (!document.fullscreenElement) {
			await containerRef.value.requestFullscreen()
		} else {
			await document.exitFullscreen()
		}
	} catch (err) {
		console.error('Fullscreen toggle failed:', err)
	}
}

async function togglePip() {
	if (!videoRef.value || !isPipSupported.value) return
	try {
		if (document.pictureInPictureElement) {
			await document.exitPictureInPicture()
		} else {
			await videoRef.value.requestPictureInPicture()
		}
	} catch (err) {
		console.error('Picture-in-picture toggle failed:', err)
	}
}

function updateHoverTime(event: MouseEvent) {
	if (!progressBarRef.value || !duration.value) return
	const rect = progressBarRef.value.getBoundingClientRect()
	const offsetX = Math.max(0, Math.min(event.clientX - rect.left, rect.width))
	const percent = offsetX / rect.width
	hoverPosition.value = offsetX
	hoverTime.value = percent * duration.value
}

function clearHoverTime() {
	hoverTime.value = null
}

function handleProgressClick(event: MouseEvent) {
	if (!progressBarRef.value || !duration.value) return
	const rect = progressBarRef.value.getBoundingClientRect()
	const percent = (event.clientX - rect.left) / rect.width
	const targetTime = percent * duration.value
	const direction = targetTime < currentTime.value ? 'rewind' : 'forward'
	seekTo(targetTime)
	triggerFeedback(direction)
}

function onTimeUpdate() {
	if (!videoRef.value || isSeeking.value) return
	currentTime.value = videoRef.value.currentTime
	emit('timeupdate', currentTime.value)
	updateBuffered()
}

function updateBuffered() {
	if (!videoRef.value || !duration.value) return
	const buf = videoRef.value.buffered
	if (buf.length > 0) {
		const current = videoRef.value.currentTime
		for (let i = 0; i < buf.length; i++) {
			if (buf.start(i) <= current && current <= buf.end(i)) {
				bufferedPercent.value = (buf.end(i) / duration.value) * 100
				return
			}
		}
	}
}

function onLoadedMetadata() {
	if (!videoRef.value) return
	duration.value = videoRef.value.duration
	updateBuffered()
}

function onPlay() {
	isPlaying.value = true
	resetIdleTimer()
	emit('play')
}

function onPause() {
	isPlaying.value = false
	showControls.value = true
	if (idleTimer) {
		clearTimeout(idleTimer)
		idleTimer = null
	}
	emit('pause')
}

function onEnded() {
	isPlaying.value = false
	showControls.value = true
	emit('ended')
}

const onWaiting = () => isBuffering.value = true

const onCanPlay = () => isBuffering.value = false

const onFullscreenChange = () => isFullscreen.value = !!document.fullscreenElement

const onPipEnter = () => isPip.value = true

const onPipLeave = () => isPip.value = false

function seekBy(seconds: number, feedback: 'rewind' | 'forward') {
	seekTo(currentTime.value + seconds)
	triggerFeedback(feedback)
}

function increaseVolume() {
	volume.value = Math.min(1, Math.round((volume.value + 0.1) * 100) / 100)
}

function decreaseVolume() {
	volume.value = Math.max(0, Math.round((volume.value - 0.1) * 100) / 100)
}

function onFocusOut(event: FocusEvent) {
	if (!containerRef.value?.contains(event.relatedTarget as Node | null)) {
		isPlayerFocused.value = false
	}
}

function onPlayerKeydown(event: KeyboardEvent) {
	if (!isPlayerFocused.value || event.shiftKey) return
	switch (event.key) {
		case 'ArrowLeft':
			seekBy(-5, 'rewind')
			break
		case 'ArrowRight':
			seekBy(5, 'forward')
			break
		case 'ArrowUp':
			increaseVolume()
			break
		case 'ArrowDown':
			decreaseVolume()
			break
		default:
			return
	}
	event.preventDefault()
	event.stopPropagation()
}

defineShortcuts({
	space: () => { if (isPlayerFocused.value) togglePlay() },
	k: () => { if (isPlayerFocused.value) togglePlay() },
	m: () => { if (isPlayerFocused.value) toggleMute() },
	f: () => { if (isPlayerFocused.value) toggleFullscreen() },
}, {
	layoutIndependent: true
})

onMounted(() => {
	document.addEventListener('fullscreenchange', onFullscreenChange)
	if (videoRef.value) {
		videoRef.value.addEventListener('enterpictureinpicture', onPipEnter)
		videoRef.value.addEventListener('leavepictureinpicture', onPipLeave)
	}
})

onUnmounted(() => {
	pause()
	document.removeEventListener('fullscreenchange', onFullscreenChange)
	if (videoRef.value) {
		videoRef.value.removeEventListener('enterpictureinpicture', onPipEnter)
		videoRef.value.removeEventListener('leavepictureinpicture', onPipLeave)
	}
	if (idleTimer) {
		clearTimeout(idleTimer)
		idleTimer = null
	}
	if (feedbackTimer) {
		clearTimeout(feedbackTimer)
		feedbackTimer = null
	}
})

watch(() => props.src, () => {
	currentTime.value = 0
	duration.value = 0
	isPlaying.value = false
	isBuffering.value = false
})

defineExpose({ pause, focus })
</script>

<template>
	<div
		ref="containerRef"
		role="region"
		data-video-player
		:aria-label="title"
		tabindex="0"
		class="group/player relative w-full overflow-hidden rounded-xl sm:rounded-2xl bg-black select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xl"
		:style="{ aspectRatio: isFullscreen ? 'auto' : aspectRatio }"
		@mousemove="resetIdleTimer"
		@mouseleave="showControls = !isPlaying"
		@touchstart.passive="resetIdleTimer"
		@focusin="isPlayerFocused = true"
		@focusout="onFocusOut"
		@keydown="onPlayerKeydown"
	>
		<video
			ref="videoRef"
			:src="src"
			:poster="poster"
			:autoplay="autoplay"
			:muted="muted"
			:loop="loop"
			:preload="preload"
			playsinline
			class="w-full h-full object-contain cursor-pointer"
			@click="onVideoClick"
			@timeupdate="onTimeUpdate"
			@loadedmetadata="onLoadedMetadata"
			@play="onPlay"
			@pause="onPause"
			@ended="onEnded"
			@waiting="onWaiting"
			@canplay="onCanPlay"
			@playing="onCanPlay"
		/>

		<div
			v-if="isBuffering"
			class="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center pointer-events-none z-20"
		>
			<UIcon name="lucide:loader-2" class="animate-spin text-white size-8 sm:size-12" />
		</div>

		<button
			v-if="!isPlaying && !isBuffering"
			type="button"
			aria-label="Play video"
			class="
				absolute inset-0 m-auto size-12 sm:size-16 rounded-full bg-muted/50 backdrop-blur-md border border-white/20 text-white 
				flex items-center justify-center shadow-2xl hover:bg-primary/70 transition-all duration-300 cursor-pointer z-20
			"
			@click.stop="togglePlay"
		>
			<UIcon name="lucide:play" class="size-6 sm:size-8 ml-0.5 sm:ml-1" />
		</button>

		<transition name="fade-scale">
			<div
				v-if="feedbackAction"
				class="absolute inset-0 m-auto size-14 sm:size-20 rounded-full bg-muted/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center pointer-events-none z-30"
			>
				<UIcon
					v-if="feedbackAction === 'play'"
					name="lucide:play"
					class="size-7 sm:size-10 ml-0.5 sm:ml-1"
				/>
				<UIcon
					v-else-if="feedbackAction === 'pause'"
					name="lucide:pause"
					class="size-7 sm:size-10"
				/>
				<UIcon
					v-else-if="feedbackAction === 'rewind'"
					name="lucide:rotate-ccw"
					class="size-7 sm:size-10"
				/>
				<UIcon
					v-else-if="feedbackAction === 'forward'"
					name="lucide:rotate-cw"
					class="size-7 sm:size-10"
				/>
				<UIcon
					v-else-if="feedbackAction === 'volume-up'"
					name="lucide:volume-2"
					class="size-7 sm:size-10"
				/>
				<UIcon
					v-else-if="feedbackAction === 'volume-down'"
					name="lucide:volume-1"
					class="size-7 sm:size-10"
				/>
				<UIcon
					v-else-if="feedbackAction === 'volume-muted'"
					name="lucide:volume-x"
					class="size-7 sm:size-10"
				/>
			</div>
		</transition>

		<div
			v-if="controls"
			class="absolute bottom-0 inset-x-0 z-30 flex flex-col gap-1.5 sm:gap-2 px-2 sm:px-3 pb-2 sm:pb-3 bg-linear-to-t from-black/90 via-black/50 to-transparent backdrop-blur-xs transition-opacity duration-300"
			:class="showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'"
		>
			<div
				ref="progressBarRef"
				role="slider"
				aria-label="Video seek bar"
				:aria-valuenow="currentTime"
				aria-valuemin="0"
				:aria-valuemax="duration"
				:aria-valuetext="`${formattedCurrentTime} of ${formattedDuration}`"
				tabindex="0"
				class="relative group/progress h-1.5 sm:h-2 hover:h-2.5 sm:hover:h-3 w-full bg-white/20 rounded-full cursor-pointer transition-all duration-200 before:absolute before:-inset-y-2 before:inset-x-0"
				@mousemove="updateHoverTime"
				@mouseleave="clearHoverTime"
				@click="handleProgressClick"
			>
				<div
					class="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full transition-all duration-150"
					:style="{ width: `${bufferedPercent}%` }"
				/>

				<div
					class="absolute top-0 bottom-0 left-0 bg-primary rounded-full"
					:style="{ width: `${progressPercent}%` }"
				>
					<div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-2.5 sm:size-3.5 rounded-full bg-white shadow-md scale-0 group-hover/progress:scale-100 transition-transform duration-150" />
				</div>

				<div
					v-if="hoverTime !== null"
					class="absolute -top-7 sm:-top-9 -translate-x-1/2 px-1.5 sm:px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[10px] sm:text-xs font-mono border border-white/10 shadow-lg pointer-events-none"
					:style="{ left: `${hoverPosition}px` }"
				>
					{{ formattedHoverTime }}
				</div>
			</div>

			<div class="flex items-center justify-between gap-1.5 sm:gap-2 text-white">
				<div class="flex items-center gap-1 sm:gap-3">
					<button
						type="button"
						:aria-label="isPlaying ? 'Pause' : 'Play'"
						class="p-1 sm:p-1.5 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						@click="togglePlay"
					>
						<UIcon :name="isPlaying ? 'lucide:pause' : 'lucide:play'" class="size-4 sm:size-5" />
					</button>

					<div class="group/volume flex items-center gap-0.5 sm:gap-1.5">
						<button
							type="button"
							:aria-label="isMuted ? 'Unmute' : 'Mute'"
							class="p-1 sm:p-1.5 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
							@click="toggleMute"
						>
							<UIcon :name="volumeIcon" class="size-4 sm:size-5" />
						</button>

						<div class="w-0 h-8 sm:h-10 group-hover/volume:w-16 sm:group-hover/volume:w-20 group-hover/volume:pr-1 sm:group-hover/volume:pr-2 overflow-hidden duration-300 flex items-center">
							<USlider
								v-model="volume"
								size="xs"
								aria-label="Volume slider"
								:ui="{
									thumb: 'bg-accented'
								}"
								:min="0"
								:max="1"
								:step="0.05"
							/>
						</div>
					</div>

					<div class="text-[10px] sm:text-xs font-mono text-white/90 select-none tracking-tight sm:tracking-normal whitespace-nowrap">
						<span>{{ formattedCurrentTime }}</span>
						<span class="mx-0.5 sm:mx-1 text-white/50">/</span>
						<span class="text-white/70">{{ formattedDuration }}</span>
					</div>
				</div>

				<div class="flex items-center gap-0.5 sm:gap-2">
					<UDropdownMenu
						:ui="{
							group: 'p-1.5 sm:p-2 bg-muted/50 backdrop-blur-xl',
							item: 'flex-row-reverse text-xs sm:text-sm'
						}"
						:items="speedOptions.map(rate => ({
							label: `${rate}x`,
							icon: playbackRate === rate ? 'lucide:check' : undefined,
							onSelect: () => setPlaybackSpeed(rate)
						}))"
					>
						<button
							type="button"
							aria-label="Playback speed"
							class="
								px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-lg hover:bg-white/15 text-white/90 transition-colors cursor-pointer 
								flex items-center gap-0.5 sm:gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
							"
						>
							<span>{{ playbackRate }}x</span>
						</button>
					</UDropdownMenu>

					<button
						v-if="isPipSupported"
						type="button"
						:aria-label="isPip ? 'Exit Picture in Picture' : 'Picture in Picture'"
						class="p-1 sm:p-1.5 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary not-sm:hidden"
						@click="togglePip"
					>
						<UIcon name="lucide:external-link" class="size-4 sm:size-5" />
					</button>

					<button
						type="button"
						:aria-label="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'"
						class="p-1 sm:p-1.5 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						@click="toggleFullscreen"
					>
						<UIcon :name="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'" class="size-4 sm:size-5" />
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-scale-enter-from {
	opacity: 0;
	transform: scale(0.6);
}

.fade-scale-leave-to {
	opacity: 0;
	transform: scale(1.4);
}
</style>
