<script setup lang="ts">
import type { Tables } from '@shared/types';
import { formatBytes } from '@shared/utils';
import { STATE_TOKENS } from '@shared/configs';
import { useProfileOverlay } from '@features/profile';
import { useProfile, useProfileStore } from '@features/profile';
import { useCachedData } from '@shared/composables';
import { PresenceAvatar, userPresenceLabel } from '@features/user';
import { useMessage, useMessageStore } from '@features/message';
import type { ChatMediaItem } from '@features/message';
import { getChatAssetUrl } from '../../utils/getChatAssetUrl';
import ChatAvatar from './ChatAvatar.vue';
import ChatMemberButton from '../local/ChatMemberButton.vue';
import GroupChatInviteLink from '../local/GroupChatInviteLink.vue';

const props = defineProps<{
	chatData?: Tables<"chats"> | null,
	chatMembers?: Tables<"chat_members">[],
	loading: boolean,
	embedded?: boolean
}>()

const { open } = useProfileOverlay()
const { findUserProfile } = useProfile()
const { userProfile } = storeToRefs(useProfileStore())
const supabaseUser = useSupabaseUser()
const messageStore = useMessageStore()

const chatId = computed(() => props.chatData?.id)

const { fetchChatMedia } = useMessage(chatId.value ?? '')

const mediaItems = ref<ChatMediaItem[]>([])
const mediaLoading = ref(false)
const mediaHasMore = ref(true)
const mediaCursor = ref<string | undefined>(undefined)
const MEDIA_PAGE_SIZE = 30
let storeMediaUrls = new Set<string>()

const chatMessages = computed(() => messageStore.messages.get(chatId.value ?? '') ?? [])
const currentUserId = computed(() => userProfile.value?.user_id || supabaseUser.value?.id)

const otherMemberId = computed(() => {
	if (props.chatData?.type !== 'DIRECT')
		return undefined

	const activeUserId = currentUserId.value
	if (!activeUserId) return undefined

	const fromMembers = props.chatMembers?.find(member => member.user_id !== activeUserId)?.user_id
	if (fromMembers) return fromMembers

	if (props.chatData?.direct_id) {
		const ids = props.chatData.direct_id?.split("__")
		if (ids?.length === 2) {
			return ids[0] === activeUserId ? ids[1] : ids[0]
		}
	}

	return undefined
})

const { data: otherMemberProfile } = useCachedData(
	() => `other-member-${otherMemberId.value ?? props.chatData?.id ?? 'none'}`,
	async () => {
		if (props.chatData?.type !== 'DIRECT' || !otherMemberId.value) 
			return null

		return await findUserProfile(otherMemberId.value)
	},
	{
		watch: [otherMemberId, () => props.chatData?.id],
	}
)

const displayChatInfo = computed(() => {
	if (!props.chatData) {
		return {
			nickname: 'Chat',
			cover_url: '',
			avatar_url: '',
			description: ''
		}
	}

	if (props.chatData.type === 'DIRECT') {
		const member = otherMemberProfile.value
		const fallbackName = props.chatData.direct_id?.includes('__') ? (member?.nickname || member?.username || 'User') : 'Chat'

		return {
			nickname: fallbackName,
			avatar_url: member?.avatar_url ?? '',
			cover_url: member?.cover_url ? getChatAssetUrl(member.cover_url, 'profile-assets') : '',
			description: member?.bio ?? ''
		}
	}

	return {
		nickname: props.chatData.name || 'Chat',
		avatar_url: props.chatData.avatar_url ? getChatAssetUrl(props.chatData.avatar_url, 'chat-assets') : '',
		cover_url: props.chatData.cover_url ? getChatAssetUrl(props.chatData.cover_url, 'chat-assets') : '',
		description: props.chatData.description ?? ''
	}
})

const tabItems = computed(() => {
	const items = [
		{
			label: 'media',
			icon: 'lucide:images',
			slot: 'media'
		}
	]

	if(props.chatData?.type === 'GROUP'){
		items.unshift({
			label: 'members',
			icon: 'lucide:users',
			slot: 'members'
		})
	}

	return items
})

function isVideoUrl(url: string) {
	const withoutQuery = url.split("?")[0] ?? ""
	const extension = withoutQuery.split(".").pop()?.toLowerCase() ?? ""
	return STATE_TOKENS.VIDEO_EXTENSIONS.includes(extension as never)
}

function toChatMediaItem(media: { url: string; size: number; type: string }): ChatMediaItem {
	return {
		url: media.url,
		type: media.type === 'video' || media.type.startsWith('video/') || isVideoUrl(media.url) ? 'video' : 'image',
		size: media.size
	}
}

async function loadMedia(reset = false) {
	if (!chatId.value || mediaLoading.value) return

	if (reset) {
		mediaItems.value = []
		mediaCursor.value = undefined
		mediaHasMore.value = true
		storeMediaUrls.clear()
	}

	if (!mediaHasMore.value) return

	mediaLoading.value = true
	try {
		const { items, cursor, hasMore } = await fetchChatMedia(chatId.value, {
			limit: MEDIA_PAGE_SIZE,
			before: mediaCursor.value
		})

		const existing = new Set(mediaItems.value.map(item => item.url))
		for (const item of items) {
			if (existing.has(item.url)) continue
			existing.add(item.url)
			mediaItems.value.push(item)
		}
		mediaCursor.value = cursor ?? undefined
		mediaHasMore.value = hasMore
	} finally {
		mediaLoading.value = false
	}
}

const mediaGalleryRef = useTemplateRef<{ openAt: (index: number) => void }>("mediaGallery")

function openMedia(index: number) {
	mediaGalleryRef.value?.openAt(index)
}

function onVideoLoadedMetadata(event: Event) {
	const video = event.currentTarget as HTMLVideoElement
	if (video.readyState >= 1) {
		video.currentTime = 0.01
	}
}

const currentMember = computed(() => {
	const uid = currentUserId.value
	if (!uid) return undefined
	return props.chatMembers?.find(member => member.user_id === uid)
})

watch(chatId, () => loadMedia(true), { immediate: true })

watch(chatMessages, (messages) => {
	const existingUrls = new Set<string>()
	for (let i = 0; i < mediaItems.value.length; i++) {
		const item = mediaItems.value[i]
		if (item) existingUrls.add(item.url)
	}

	const currentStoreUrls = new Set<string>()
	const additions: ChatMediaItem[] = []

	for (const msg of messages) {
		if (!msg.media?.length) continue
		for (const media of msg.media) {
			if (media.url.startsWith('blob:')) continue
			currentStoreUrls.add(media.url)
			if (!existingUrls.has(media.url)) {
				existingUrls.add(media.url)
				additions.push(toChatMediaItem(media))
			}
		}
	}

	const removedUrls = new Set<string>()
	for (const url of storeMediaUrls) {
		if (!currentStoreUrls.has(url)) {
			removedUrls.add(url)
		}
	}

	storeMediaUrls = currentStoreUrls

	if (removedUrls.size > 0 && additions.length > 0) {
		mediaItems.value = [
			...additions.reverse(),
			...mediaItems.value.filter(item => !removedUrls.has(item.url))
		]
	} else if (removedUrls.size > 0) {
		mediaItems.value = mediaItems.value.filter(item => !removedUrls.has(item.url))
	} else if (additions.length > 0) {
		mediaItems.value = [...additions.reverse(), ...mediaItems.value]
	}
}, { immediate: true })


const rootClass = computed(() => props.embedded
	? 'bg-default h-full min-h-0 w-full flex flex-col items-center gap-5 overflow-y-auto p-2'
	: 'bg-muted/50 h-full min-h-0 border-l border-default max-w-90 hidden xl:flex flex-col items-center gap-5 overflow-y-auto'
)
</script>

<template>
	<article :class="rootClass">
		<template v-if="loading" >
			<USkeleton class="aspect-square rounded-full size-20 mt-10" />
			<USkeleton class="h-7.5 w-[70%] min-w-20 "/>
			<USkeleton class="w-[70%] min-w-20 h-40"/>
		</template>

		<template v-if="!chatData && !loading" >
			<UIcon name="lucide:circle-question-mark" class="size-16 text-dimmed mt-20" />
			<p class="text-dimmed">chat not found</p>
		</template>

		<div 
			v-if="chatData && !loading"
			class="w-full relative aspect-7/2 bg-primary/25 mb-70 overflow-visible">
			<NuxtImg
				v-if="displayChatInfo.cover_url"
				:src="displayChatInfo.cover_url"
				alt="Chat cover"
				class="absolute inset-0 size-full object-cover"
			/>
			<div v-else class="absolute inset-0 size-full bg-linear-to-r from-primary/40 to-primary/10" />

			<div class="absolute z-10 top-[calc(100%-2.75rem)] flex flex-col gap-2 w-full self-start p-4">
				<div class="flex items-end gap-4 mb-4">
					<PresenceAvatar
						v-if="chatData.type === 'DIRECT'"
						class="justify-start"
						size="2xl"
						:user-id="otherMemberId"
					>
						<ChatAvatar
							:src="displayChatInfo.avatar_url"
							:alt="displayChatInfo.nickname"
							:chat-type="chatData.type"
							:ui="{ root: 'size-15 text-3xl relative z-10 outline-4 outline-default!' }"
						/>
					</PresenceAvatar>
					<ChatAvatar
						v-else
						:src="displayChatInfo.avatar_url"
						:chat-type="chatData.type"
						:alt="displayChatInfo.nickname"
						:ui="{ root: 'size-15 text-3xl relative z-10 outline-4 outline-default!' }"
					/>
					<userPresenceLabel 
						v-if="chatData.type === 'DIRECT' && otherMemberId"
						class="text-sm!"
						:user-id="otherMemberId"
					/>
				</div>
				<h1 class="text-3xl font-medium">{{ displayChatInfo.nickname }}</h1>
				<pre class="font-sans text-sm  w-[70%] min-w-20 h-40 resize-none outline-none border-none">{{ displayChatInfo.description }}</pre>
			</div>
		</div>
		
		<GroupChatInviteLink
			v-if="currentMember && chatData"
			:chat-id="chatData.id"
			:chat-type="chatData.type"
			:current-member
			class="px-4"
		/>

		<UTabs 
			v-if="chatMembers" 
			:items="tabItems" 
			:unmount-on-hide="false" 
			:ui="{ 
				root: 'w-full p-4', 
				content: 'flex flex-col gap-2' 
			}"
		>
			<template v-if="chatData?.type === 'GROUP'" #members>
				<h2 class="mt-1 mb-2 text-lg">chat members: {{ chatMembers.length }}</h2>

				<ChatMemberButton
					v-for="member in chatMembers"
					:key="member.id"
					:chat-type="chatData!.type"
					:member-data="member"
				/>
			</template>

			<template #media>
				<div class="flex flex-col gap-3 w-full">
					<MediaCarousel
						v-if="mediaItems.length"
						ref="mediaGallery"
						class="grid grid-cols-3 gap-1"
						:media="mediaItems"
						:start-index="0"
					>
						<div
							v-for="(item, index) in mediaItems"
							:key="item.url"
							class="relative aspect-square shrink-0 overflow-hidden rounded-lg bg-black/10"
							@click.stop="openMedia(index)"
						>
							<NuxtImg
								v-if="item.type === 'image'"
								:src="item.url"
								class="size-full object-cover"
								:alt="`chat media ${index + 1}`"
								loading="lazy"
							/>
							<video
								v-else
								:src="item.url"
								preload="metadata"
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
							<span class="absolute bottom-1 right-1 px-1 py-0.5 bg-black/25 backdrop-blur-md text-white rounded text-[10px] pointer-events-none">
								{{ formatBytes(item.size) }}
							</span>
						</div>
					</MediaCarousel>

					<UButton
						v-if="mediaHasMore && mediaItems.length"
						label="load more"
						color="neutral"
						variant="soft"
						class="w-full"
						:loading="mediaLoading"
						@click="loadMedia()"
					/>

					<div v-if="mediaLoading && !mediaItems.length" class="flex justify-center py-8">
						<UIcon name="lucide:loader-2" class="size-6 animate-spin text-dimmed" />
					</div>

					<div v-if="!mediaItems.length && !mediaLoading" class="flex flex-col items-center gap-2 py-8 text-dimmed">
						<UIcon name="lucide:images" size="28" />
						<span class="text-sm">no media yet</span>
					</div>
				</div>
			</template>
		</UTabs>
		<USkeleton v-if="loading" class="w-full flex-1"/>

		<UButton 
			v-if="chatData && !loading && chatData?.type === 'DIRECT' && otherMemberProfile"
			label="view full profile" 
			size="xl" 
			color="neutral" 
			variant="soft" 
			class="w-[calc(100%-1rem)] flex justify-center backdrop-blur-xl mt-auto mb-2 sticky bottom-2"
			@click="open({ userProfile: otherMemberProfile })" 
		/>
	</article>
</template>
