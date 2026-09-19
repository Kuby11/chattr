<script setup lang="ts">
import type { ChatId } from '@shared/types';
import type { ClientMessage } from '../../types/clientMessage';
import { STATE_TOKENS } from '@shared/configs';
import { useMessage } from '../../composables/useMessage';
import { useBreakpoint } from '@shared/composables';

const props = defineProps<{
	chatId: ChatId
	open: boolean
	initialQuery?: string
}>()

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const isOpen = computed({
	get: () => props.open,
	set: (val: boolean) => emit('update:open', val)
})

const { searchMessages, getSenderProfile } = useMessage(props.chatId)

const { sm: isMobile } = useBreakpoint()

const searchQuery = ref('')
const results = ref<ClientMessage[]>([])
const isLoading = ref(false)
const hasMore = ref(true)
const cursor = ref<string | undefined>(undefined)
const SEARCH_PAGE_SIZE = 30
const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>()

function scheduleTimeout(callback: () => void, delay: number) {
	const timer = setTimeout(() => {
		pendingTimeouts.delete(timer)
		callback()
	}, delay)
	pendingTimeouts.add(timer)
}

onUnmounted(() => {
	for (const timer of pendingTimeouts) clearTimeout(timer)
	pendingTimeouts.clear()
})

async function runSearch(reset = true) {
	const q = searchQuery.value.trim()
	if (!q) return

	if (reset) {
		results.value = []
		cursor.value = undefined
		hasMore.value = true
	}

	if (isLoading.value || !hasMore.value) return

	isLoading.value = true
	try {
		const { items, cursor: nextCursor, hasMore: more } = await searchMessages(q, props.chatId, {
			limit: SEARCH_PAGE_SIZE,
			before: cursor.value
		})
		results.value = reset ? items : [...results.value, ...items]
		cursor.value = nextCursor ?? undefined
		hasMore.value = more
	} finally {
		isLoading.value = false
	}
}

function onSearchSubmit() {
	if (!searchQuery.value.trim()) return
	runSearch(true)
}

type SearchMediaItem = { url: string; type: 'image' | 'video'; size: number }

function isVideoUrl(url: string) {
	const withoutQuery = url.split("?")[0] ?? ""
	const extension = withoutQuery.split(".").pop()?.toLowerCase() ?? ""
	return STATE_TOKENS.VIDEO_EXTENSIONS.includes(extension as never)
}

function mediaOf(msg: ClientMessage): SearchMediaItem[] {
	return (msg.media ?? []).map(m => ({
		url: m.url,
		type: m.type === 'video' || m.type.startsWith('video/') || isVideoUrl(m.url) ? 'video' : 'image',
		size: m.size
	}))
}

const mediaByMessage = computed(() => {
	const map = new Map<string, SearchMediaItem[]>()
	for (const msg of results.value) {
		map.set(msg.id, mediaOf(msg))
	}
	return map
})

function displayedMedia(media: SearchMediaItem[]) {
	return media.slice(0, 4)
}

function remainingMediaCount(media: SearchMediaItem[]) {
	if (media.length > 4)
		return media.length - 4
	return 0
}

function onVideoLoadedMetadata(event: Event) {
	const video = event.currentTarget as HTMLVideoElement
	if (video.readyState >= 1) {
		video.currentTime = 0.01
	}
}

type CarouselInstance = { openAt: (index: number) => void }
const carouselRefs = new Map<string, CarouselInstance>()

function setCarouselRef(messageId: string, carousel: unknown) {
	if (carousel) {
		carouselRefs.set(messageId, carousel as CarouselInstance)
	} else {
		carouselRefs.delete(messageId)
	}
}

function openMedia(messageId: string, index: number) {
	carouselRefs.get(messageId)?.openAt(index)
}

let skipNextDebounce = false

const debouncedSearch = useDebounceFn(() => runSearch(true), 400)

watch(searchQuery, () => {
	if (skipNextDebounce) {
		skipNextDebounce = false
		return
	}

	const q = searchQuery.value.trim()
	if (!q) {
		results.value = []
		cursor.value = undefined
		hasMore.value = true
		return
	}

	debouncedSearch()
})

watch(() => props.open, (open) => {
	if (open && props.initialQuery) {
		skipNextDebounce = true
		searchQuery.value = props.initialQuery
		runSearch(true)
	}
})

function onUpdateOpen(val: boolean) {
	if (!val) {
		results.value = []
		searchQuery.value = ''
		cursor.value = undefined
		hasMore.value = true
	}
	isOpen.value = val
}

function scrollToMessage(messageId: string) {
	const el = document.getElementById(`message-${messageId}`)
	if (!el) return

	isOpen.value = false
	results.value = []
	searchQuery.value = ''

	scheduleTimeout(() => {
		el.scrollIntoView({ behavior: 'smooth', block: 'center' })

		const bubbleTarget = el.querySelector('.message-bubble') ?? el
		bubbleTarget.classList.add('ring-2', 'ring-primary', 'transition-all', 'duration-300')
		scheduleTimeout(() => {
			bubbleTarget.classList.remove('ring-2', 'ring-primary')
		}, 1500)
	}, 150)
}

const senderProfiles = ref(new Map<string, { nickname?: string; avatar_url?: string | null }>())

watch(results, async (messages) => {
	const senderIds = [...new Set(messages.map(msg => msg.sender_id))]
	const missingIds = senderIds.filter(id => !senderProfiles.value.has(id))

	await Promise.all(
		missingIds.map(async id => {
			try {
				const profile = await getSenderProfile(id)
				senderProfiles.value.set(id, {
					nickname: profile?.nickname ?? '…',
					avatar_url: profile?.avatar_url ?? ''
				})
			} catch {
				senderProfiles.value.set(id, { nickname: '…', avatar_url: '' })
			}
		})
	)
}, { immediate: true })
</script>

<template>
	<UModal
		v-model:open="isOpen"
		description="Search messages"
		:ui="{
			content: 'sm:max-w-xl p-2!',
			header: 'border-none!',
			description: 'text-sm'
		}"
		:fullscreen="isMobile"
		@update:open="onUpdateOpen"
	>
		<template #body>
			<div class="flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<UInput
						v-model="searchQuery"
						placeholder="Search..."
						icon="lucide:search"
						class="flex-1"
						:ui="{ base: 'ring-default' }"
						:loading="isLoading"
						@keydown.enter.prevent="onSearchSubmit"
					/>
				</div>

				<div class="flex flex-col gap-1 max-h-90 overflow-y-auto pr-1">
					<p v-if="!isLoading && results.length === 0" class="text-muted text-sm text-center py-4">
						No messages found
					</p>

					<button
						v-for="message in results"
						:key="message.id"
						class="flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer hover:bg-elevated/50 text-left"
						@click="scrollToMessage(message.id)"
					>
						<UAvatar
							size="sm"
							:src="senderProfiles.get(message.sender_id)?.avatar_url ?? ''"
							:alt="senderProfiles.get(message.sender_id)?.nickname ?? 'user'"
						/>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="text-sm font-semibold truncate">
									{{ senderProfiles.get(message.sender_id)?.nickname ?? '…' }}
								</span>
								<NuxtTime
									:datetime="message.sent_at"
									class="ml-auto text-xs text-dimmed shrink-0"
									:hour12="false"
									hour="numeric"
									minute="numeric"
								/>
							</div>
							<p class="text-sm text-muted mt-0.5 truncate">
								{{ message.content }}
							</p>

							<template v-if="mediaByMessage.get(message.id)?.length">
								<MediaCarousel
									:ref="carousel => setCarouselRef(message.id, carousel)"
									:media="mediaByMessage.get(message.id)!"
									:start-index="0"
									class="mt-1"
								>
									<div class="flex flex-wrap gap-1.5 mt-2">
										<div
											v-for="(item, index) in displayedMedia(mediaByMessage.get(message.id)!)"
											:key="item.url"
											class="relative size-14 shrink-0 overflow-hidden rounded-lg bg-black/10"
											@click.stop="openMedia(message.id, index)"
										>
											<img
												v-if="item.type === 'image'"
												:src="item.url"
												class="size-full object-cover"
												:alt="`search attachment ${index + 1}`"
												loading="lazy"
											>
											<video
												v-else
												:src="item.url"
												:preload="item.url.startsWith('blob:') ? 'auto' : 'metadata'"
												muted
												playsinline
												class="size-full object-cover bg-black"
												@loadedmetadata="onVideoLoadedMetadata"
											/>
											<div
												v-if="item.type === 'video'"
												class="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none"
											>
												<UIcon name="lucide:play" class="size-4 text-white" />
											</div>
										</div>
										<div
											v-if="remainingMediaCount(mediaByMessage.get(message.id)!) > 0"
											class="size-14 shrink-0 flex items-center justify-center rounded-lg bg-elevated text-sm font-semibold text-dimmed"
										>
											+{{ remainingMediaCount(mediaByMessage.get(message.id)!) }}
										</div>
									</div>
								</MediaCarousel>
							</template>
						</div>
					</button>
				</div>

				<UButton
					v-if="hasMore && results.length > 0"
					label="load more"
					color="neutral"
					variant="soft"
					:loading="isLoading"
					class="w-full"
					@click="runSearch(false)"
				/>
			</div>
		</template>
	</UModal>
</template>
