<script setup lang="ts">
import type { ChatId, Tables } from '@shared/types';
import { STATE_TOKENS } from '@shared/configs';
import { createReusableTemplate } from '@vueuse/core';
import { useBreakpoint, useCachedData } from '@shared/composables';
import { useProfileStore } from '@features/profile';
import { useMessage } from '../../composables/useMessage';
import { useMessageApi } from '../../api/messageApi';
import type { ClientMessage } from '../../types/clientMessage';

type PinnedMediaItem = { url: string; type: 'image' | 'video'; size: number }

const props = defineProps<{
	chatId: ChatId
	class?: string
}>()

const isOpen = ref(false)
const { sm: isSm } = useBreakpoint()

const [DefineListTemplate, ReuseListTemplate] = createReusableTemplate()
const [DefineTriggerTemplate, ReuseTriggerTemplate] = createReusableTemplate()

const { userProfile } = storeToRefs(useProfileStore())
const { chatMessages, getSenderProfile } = useMessage(props.chatId)
const { fetchPinnedMessages } = useMessageApi(props.chatId)

function isVideoUrl(url: string) {
	const withoutQuery = url.split("?")[0] ?? ""
	const extension = withoutQuery.split(".").pop()?.toLowerCase() ?? ""
	return STATE_TOKENS.VIDEO_EXTENSIONS.includes(extension as never)
}

function mediaOf(msg: ClientMessage | Tables<'messages'>): PinnedMediaItem[] {
	if ('media' in msg && msg.media?.length) {
		return msg.media.map(m => ({
			url: m.url,
			type: m.type === 'video' || m.type.startsWith('video/') || isVideoUrl(m.url) ? 'video' : 'image',
			size: m.size
		}))
	}

	if ('media_urls' in msg && msg.media_urls?.length) {
		return msg.media_urls.map(url => ({
			url,
			type: isVideoUrl(url) ? 'video' : 'image',
			size: 0
		}))
	}

	return []
}

const fetchedPinned = ref<Tables<"messages">[]>([])

useCachedData(
	`pinned-messages-${props.chatId}`,
	async () => {
		const { data, error } = await fetchPinnedMessages(props.chatId)
		if (error || !data) return null
		fetchedPinned.value = data
		return data
	},
	{
		watch: [() => props.chatId],
	}
)

const pinnedMessagesContentRef = useTemplateRef<HTMLElement>('pinned-messages-content')
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

const pinnedMessages = computed<(ClientMessage | Tables<'messages'>)[]>(() => {
	const storePinned = (chatMessages.value ?? [])
		.filter(msg => !!msg.pinned_at)

	const storeIds = new Set(storePinned.map(m => m.id))
	const extraFetched = fetchedPinned.value
		.filter(msg => !storeIds.has(msg.id) && !!msg.pinned_at)

	return [...storePinned, ...extraFetched]
		.sort((a, b) => new Date(a.pinned_at!).getTime() - new Date(b.pinned_at!).getTime())
})

const mediaByMessage = computed(() => {
	const map = new Map<string, PinnedMediaItem[]>()
	for (const msg of pinnedMessages.value) {
		map.set(msg.id, mediaOf(msg))
	}
	return map
})

function displayedMedia(media: PinnedMediaItem[]) {
	return media.slice(0, 4)
}

function remainingMediaCount(media: PinnedMediaItem[]) {
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

const senderProfiles = ref(new Map<string, Tables<"user_profiles">>())

function senderName(senderId: string) {
	const profile = senderProfiles.value.get(senderId)
	if (!profile) return '…'
	return profile.user_id === userProfile.value?.user_id ? 'you' : profile.nickname
}

function senderAvatar(senderId: string) {
	return senderProfiles.value.get(senderId)?.avatar_url ?? ''
}

async function scrollToBottom() {
	const el = pinnedMessagesContentRef.value
	if (!el) return

	await nextTick()
	el.scrollTo({ top: el.scrollHeight })
}

function scrollToMessage(messageId: string) {
	isOpen.value = false

	scheduleTimeout(() => {
		const el = document.getElementById(`message-${messageId}`)
		if (!el) return

		el.scrollIntoView({ behavior: 'smooth', block: 'center' })

		const bubbleTarget = el.querySelector('.message-bubble') ?? el
		bubbleTarget.classList.add('ring-2', 'ring-primary', 'transition-all', 'duration-300')
		scheduleTimeout(() => {
			bubbleTarget.classList.remove('ring-2', 'ring-primary')
		}, 1500)
	}, 150)
}

watch(pinnedMessages, async (messages) => {
	const senderIds = [...new Set(messages.map(msg => msg.sender_id))]
	const missingIds = senderIds.filter(id => !senderProfiles.value.has(id))

	await Promise.all(
		missingIds.map(async id => {
			try {
				const profile = await getSenderProfile(id)
				senderProfiles.value.set(id, profile)
			} catch {
				senderProfiles.value.set(id, userProfile.value!)
			}
		})
	)
}, { immediate: true })

watch(pinnedMessagesContentRef, (el) => {
	if (el) scrollToBottom()
})

watch(() => pinnedMessages.value.length, () => {
	scrollToBottom()
})

watch(isOpen, async (open) => {
	if (open) {
		await nextTick()
		scrollToBottom()
	}
})
</script>

<template>
	<DefineTriggerTemplate>
		<UTooltip
			:delay-duration="700"
			text="Pinned messages"
			:ui="{ content: 'not-sm:hidden' }"
		>
			<UButton
				:ui="{ label: 'sm:hidden' }"
				variant="soft"
				color="neutral"
				icon="lucide:pin"
				label="pinned messages"
				:class="['w-full justify-start sm:w-auto sm:justify-center', props.class]"
			/>
		</UTooltip>
	</DefineTriggerTemplate>

	<DefineListTemplate>
		<div v-if="pinnedMessages.length" class="flex flex-col gap-2.5 sm:gap-3 p-3 sm:p-4">
			<div
				v-for="message in pinnedMessages"
				:key="message.id"
				class="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-elevated/50 cursor-pointer active:bg-elevated/90 hover:bg-elevated/80 transition-colors"
				@click="scrollToMessage(message.id)"
			>
				<UAvatar
					:src="senderAvatar(message.sender_id)"
					size="sm"
					class="sm:size-8 shrink-0 mt-0.5"
					:alt="senderName(message.sender_id)"
				/>
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<span class="text-xs font-semibold truncate">{{ senderName(message.sender_id) }}</span>
						<NuxtTime
							:datetime="message.pinned_at!"
							class="ml-auto text-xs text-dimmed shrink-0"
							:hour12="false"
							hour="numeric"
							minute="numeric"
						/>
					</div>

					<template v-if="mediaByMessage.get(message.id)?.length">
						<MediaCarousel
							:ref="carousel => setCarouselRef(message.id, carousel)"
							:media="mediaByMessage.get(message.id)!"
							:start-index="0"
							class="mt-1.5"
						>
							<div class="flex flex-wrap gap-1.5 my-2">
								<div
									v-for="(item, index) in displayedMedia(mediaByMessage.get(message.id)!)"
									:key="item.url"
									class="relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-lg bg-black/10"
									@click.stop="openMedia(message.id, index)"
								>
									<img
										v-if="item.type === 'image'"
										:src="item.url"
										class="size-full object-cover"
										:alt="`pinned attachment ${index + 1}`"
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
									class="size-12 sm:size-14 shrink-0 flex items-center justify-center rounded-lg bg-elevated text-xs sm:text-sm font-semibold text-dimmed"
								>
									+{{ remainingMediaCount(mediaByMessage.get(message.id)!) }}
								</div>
							</div>
						</MediaCarousel>
					</template>

					<img
						v-if="message.type === 'GIF'"
						:src="message.content"
						class="mt-1 max-h-32 max-w-full rounded-lg"
						alt="pinned gif"
						@load="scrollToBottom"
					>
					<pre v-else-if="message.content" class="mt-1 text-sm font-sans whitespace-pre-wrap wrap-break-word max-h-24 sm:max-h-20 overflow-y-auto scrollbar-none">{{ message.content }}</pre>
				</div>
			</div>
		</div>

		<div v-else class="flex flex-col items-center justify-center gap-2 py-12 text-dimmed">
			<UIcon name="lucide:pin-off" size="32" />
			<span class="text-sm">no pinned messages</span>
		</div>
	</DefineListTemplate>

	<div v-if="isSm" :class="props.class">
		<div class="w-full cursor-pointer" @click="isOpen = true">
			<ReuseTriggerTemplate />
		</div>

		<UModal
			v-model:open="isOpen"
			fullscreen
			:title="`pinned messages (${pinnedMessages.length})`"
			:ui="{
				content: 'h-dvh max-h-dvh flex flex-col bg-default overflow-hidden',
				header: 'px-4 py-3 border-b border-default flex items-center justify-between min-h-12',
				title: 'text-base font-semibold flex items-center gap-2',
				body: 'flex-1 min-h-0 overflow-hidden p-0',
			}"
		>
			<template #title>
				<div class="flex items-center gap-2">
					<UIcon name="lucide:pin" class="size-4 text-primary" />
					<span class="text-sm font-semibold">pinned messages</span>
					<UBadge variant="subtle" color="neutral" size="sm">{{ pinnedMessages.length }}</UBadge>
				</div>
			</template>

			<template #body>
				<div ref="pinned-messages-content" class="h-full overflow-y-auto scrollbar-thin">
					<ReuseListTemplate />
				</div>
			</template>
		</UModal>
	</div>

	<UPopover
		v-else
		v-model:open="isOpen"
		:content="{ side: 'bottom', align: 'end' }"
		:class="props.class"
	>
		<ReuseTriggerTemplate />

		<template #content>
			<div
				ref="pinned-messages-content"
				class="w-[min(25rem,calc(100vw-2rem))] max-h-[min(26rem,calc(100dvh-6rem))] bg-muted/25 relative z-100 overflow-y-auto scrollbar-thin"
			>
				<div class="sticky top-0 z-10 bg-muted/25 backdrop-blur-2xl flex items-center gap-2 p-3 sm:p-4 border-b border-default">
					<UIcon name="lucide:pin" class="text-dimmed" />
					<span class="text-sm font-semibold">pinned messages</span>
					<span class="ml-auto text-xs text-dimmed">{{ pinnedMessages.length }}</span>
				</div>

				<ReuseListTemplate />
			</div>
		</template>
	</UPopover>
</template>
