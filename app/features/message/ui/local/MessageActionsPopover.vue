<script setup lang="ts">
import { useProfileStore } from '@features/profile';
import { useMessageStore } from '../../stores/messageStore';
import { useMessage } from '../../composables/useMessage';
import { useBreakpoint } from '@shared/composables';
import { useElementSize, onLongPress } from '@vueuse/core';
import type { ClientMessage } from '../../types/clientMessage';

const props = defineProps<{ messageData: ClientMessage, isOwn: boolean }>()

const messageStore = useMessageStore()
const { deleteMessage, pinOrUnpinMessage } = useMessage(props.messageData.chat_id)
const { userProfile } = storeToRefs(useProfileStore())

const { sm } = useBreakpoint()
const buttonSize = computed(() => sm ? 'md' : 'lg')

const popoverTargetRef = useTemplateRef<HTMLElement>("popoverTargetRef")
const mainViewRef = useTemplateRef<HTMLElement>('mainViewRef')
const infoViewRef = useTemplateRef<HTMLElement>('infoViewRef')

const isPopoverOpen = ref(false)
const wasPressed = ref(false)
let ignoreCloseUntil = 0

const clientTime = useState('client-time', () => Date.now())

const isPinModalOPen = ref(false)
const showInfo = ref(false)

const { height: mainHeight } = useElementSize(mainViewRef)
const { height: infoHeight } = useElementSize(infoViewRef)

const containerHeight = computed(() => {
	const current = showInfo.value ? infoHeight.value : mainHeight.value
	return current > 0 ? current : null
})

const cursorAnchor = ref({ x: 0, y: 0 })

const popoverReference = {
	getBoundingClientRect: () =>
		({
			width: 0,
			height: 0,
			x: cursorAnchor.value.x,
			y: cursorAnchor.value.y,
			top: cursorAnchor.value.y,
			left: cursorAnchor.value.x,
			right: cursorAnchor.value.x,
			bottom: cursorAnchor.value.y,
			toJSON: () => ({}),
		}) as DOMRect,
}

const updateAnchorCoordinates = (clientX: number, clientY: number) => {
	const padding = 12
	const maxX = typeof window !== 'undefined' ? Math.max(padding, window.innerWidth - padding) : clientX
	const maxY = typeof window !== 'undefined' ? Math.max(padding, window.innerHeight - padding) : clientY
	cursorAnchor.value = {
		x: Math.min(Math.max(clientX, padding), maxX),
		y: Math.min(Math.max(clientY, padding), maxY),
	}
}

const isPressing = ref(false)

const onBubblePointerDown = (event: PointerEvent) => {
	isPressing.value = true
	updateAnchorCoordinates(event.clientX, event.clientY)
}

const onBubblePointerUp = () => {
	isPressing.value = false
}

const onBubblePointerCancel = () => {
	isPressing.value = false
}

const triggerPressOpen = (event?: PointerEvent | MouseEvent | TouchEvent) => {
	if (!sm) return
	if (event) {
		if ('touches' in event && event.touches[0]) {
			updateAnchorCoordinates(event.touches[0].clientX, event.touches[0].clientY)
		} else if ('clientX' in event && typeof event.clientX === 'number') {
			updateAnchorCoordinates(event.clientX, event.clientY)
		}
	}
	wasPressed.value = true
	ignoreCloseUntil = Date.now() + 500
	isPopoverOpen.value = true
	if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
		navigator.vibrate(40)
	}
}

onLongPress(popoverTargetRef, (e) => {
	triggerPressOpen(e as PointerEvent)
}, {
	delay: 450,
})

const onContextMenu = (event: MouseEvent) => {
	if (sm) {
		event.preventDefault()
		triggerPressOpen(event)
	}
}

function onUpdateOpen(value: boolean) {
	if (sm) {
		if (!value) {
			if (Date.now() < ignoreCloseUntil) {
				return
			}
			isPopoverOpen.value = false
			return
		}
		if (wasPressed.value) {
			isPopoverOpen.value = true
			wasPressed.value = false
		}
		return
	}
	isPopoverOpen.value = value
}

watch(isPopoverOpen, (open) => {
	if (!open) {
		showInfo.value = false
	}
})

const canEditAndDelete = computed(() => {
	const TIME_LIMIT_IN_HOURS = 6
	
	const timeDiff = Math.floor((clientTime.value - new Date(props.messageData.sent_at).getTime()) / (1000 * 60 * 60))

	if (props.messageData.sender_id === userProfile.value?.user_id && timeDiff <= TIME_LIMIT_IN_HOURS)
		return true

	if(timeDiff >= TIME_LIMIT_IN_HOURS)
		return false

	return false
})

const hasContent = computed(() => !!props.messageData.content?.trim())

const canEdit = computed(() => canEditAndDelete.value && hasContent.value && props.messageData.type !== 'GIF')

const onReply = () => {
	messageStore.selectReply(props.messageData)
	isPopoverOpen.value = false
}

const onEdit = () => {
	messageStore.selectEdit(props.messageData)
	isPopoverOpen.value = false
}

const onDelete = () => {
	deleteMessage(props.messageData.id)
	isPopoverOpen.value = false
}

const onPin = () => {
	pinOrUnpinMessage(props.messageData.id, !isPinned.value)
	isPinModalOPen.value = false
	isPopoverOpen.value = false
}

const onCopy = async () => {
	try {
		await navigator.clipboard.writeText(props.messageData.content)
		isPopoverOpen.value = false
	} catch {
		console.error("error! couldn't copy message!")
	}
}

const onForward = () => {
	messageStore.selectForward(props.messageData)
	isPopoverOpen.value = false
}

const isPinned = computed(() => !!props.messageData.pinned_at)

onMounted(() => {
	clientTime.value = Date.now()
	const interval = setInterval(() => clientTime.value = Date.now(), 60000)
	
	onUnmounted(() => clearInterval(interval))
})

</script>

<template>
	<div
		v-if="messageData.is_uploading"
		class="w-full flex"
		:class="isOwn && 'justify-end'"
	>
		<slot />
	</div>

	<UPopover
		v-else
		:open="isPopoverOpen"
		:reference="popoverReference"
		:ui="{ content: 'flex flex-col gap-1 bg-transparent shadow-none rounded-xl ring-transparent max-w-[calc(100vw-1.5rem)]' }"
		:content="{
			side: 'bottom',
			align: isOwn ? 'end' : 'start',
			sideOffset: 4,
			collisionPadding: 12,
		}"
		@update:open="onUpdateOpen"
	>
		<div 
			ref="popoverTargetRef" 
			class="w-full flex hover:bg-elevated/50 active:bg-elevated/50 rounded-xl duration-200 transition-colors"
			:class="[
				isOwn && 'justify-end', 
				sm && 'select-none',
				(isPressing || isPopoverOpen) && 'bg-elevated/50'
			]"
			style="-webkit-touch-callout: none;"
			@pointerdown="onBubblePointerDown"
			@pointerup="onBubblePointerUp"
			@pointercancel="onBubblePointerCancel"
			@pointerleave="onBubblePointerCancel"
			@contextmenu="onContextMenu"
		>
			<slot />
		</div>
		
		<template #content>
			<div 
				class="w-38 sm:w-44 relative overflow-hidden bg-muted/70 backdrop-blur-2xl rounded-xl border border-accented transition-[height] duration-200 ease-in-out"
				:style="{ height: containerHeight ? `${(containerHeight / 16 ) + 1}rem` : 'auto' }"
			>								
				<div 
					class="flex items-start w-full transition-transform duration-200 ease-in-out"
					:style="{ transform: showInfo ? 'translateX(-100%)' : 'translateX(0%)' }"
				>
					<div ref="mainViewRef" class="w-38 sm:w-44 shrink-0 flex flex-col gap-0.5 sm:gap-1 p-1.5 sm:p-2 [&>button]:hover:bg-accented/50">
						<UButton 
							label="copy" 
							icon="lucide:files" 
							:size="buttonSize" 
							variant="ghost" 
							color="neutral" 
							@click="onCopy"
						/>

						<template v-if="canEditAndDelete">
							<UModal v-model:open="isPinModalOPen" :ui="{ content: 'grid grid-cols-2 gap-3 sm:gap-4 w-60 sm:w-70 max-w-[calc(100vw-2rem)]' }">
								<UButton 
									:label="isPinned ? 'unpin' : 'pin'" 
									:icon="isPinned ? 'lucide:pin-off' : 'lucide:pin'" 
									:size="buttonSize" 
									variant="ghost" 
									color="neutral"
								
								/>
						
							<template #content>
								<h3 class="text-center col-span-2 text-base sm:text-xl border-none">{{ isPinned ? 'unpin' : 'pin' }} this message?</h3>
								<UButton 
									label="cancel" 
									color="neutral" 
									variant="soft" 
									class="flex justify-center text-sm sm:text-lg hover:bg-elevated/70" 
									@click="() => isPinModalOPen = false"
								/>
								<UButton 
									:label="isPinned ? 'unpin' : 'pin'" 
									class="flex justify-center text-sm sm:text-lg hover:bg-elevated/70" 
									@click="onPin"
								/>
							</template>
							</UModal>
						
							<UButton label="forward" icon="lucide:send" :size="buttonSize" variant="ghost" color="neutral" @click="onForward"/>
						</template>

						<UButton label="info" icon="lucide:info" :size="buttonSize" variant="ghost" color="neutral" @click="showInfo = true" />
					</div>

					<div ref="infoViewRef" class="w-38 sm:w-44 shrink-0 flex flex-col gap-0.5 sm:gap-1 p-1.5 sm:p-2">
						<UButton 
							label="back" 
							icon="lucide:arrow-left" 
							:size="buttonSize" 
							variant="ghost" 
							color="neutral" 
							class="hover:bg-accented/50"
							@click="showInfo = false"
						/>

						<UButton 
							:ui="{ 
								base: 'grid grid-rows-2 grid-cols-[1rem_1fr] gap-x-2 sm:gap-x-3 gap-y-0 hover:bg-transparent! cursor-default py-0', 
								leadingIcon: 'row-span-2' 
							}" 
							icon="lucide:clock" 
							:size="buttonSize" 
							variant="ghost" 
							color="neutral"
						>
							<p class="text-xs sm:text-sm justify-self-start">date</p>
							<NuxtTime 
								:datetime="messageData.sent_at" 
								:hour12="false" 
								year="numeric" 
								month="numeric" 
								day="numeric" 
								hour="numeric" 
								minute="numeric"
								class="text-start text-[11px] sm:text-xs"
							/>
						</UButton>
					
						<span v-if="messageData.seen_at" class="flex items-center gap-1 text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-0.5 sm:py-1">
							<UIcon name="lucide:eye" size="14" class="size-3.5 sm:size-4 mr-1.5 sm:mr-2"/>
							seen at
							<NuxtTime :datetime="messageData.seen_at" :hour12="false" hour="numeric" minute="numeric"/>
						</span>
						
						<span v-if="messageData.edited_at" class="flex items-center gap-1 text-[11px] sm:text-xs px-2.5 sm:px-3.5 pt-0.5 sm:pt-1">
							<UIcon name="lucide:pencil" size="14" class="size-3.5 sm:size-4 mr-1.5 sm:mr-2"/>
							edited at
							<NuxtTime :datetime="messageData.edited_at" :hour12="false" hour="numeric" minute="numeric"/>
						</span>
						
						<span v-if="messageData.pinned_at" class="flex items-center gap-1 text-[11px] sm:text-xs px-2.5 sm:px-3.5 pt-0.5 sm:pt-1 pb-1.5 sm:pb-2">
							<UIcon name="lucide:pin" size="14" class="size-3.5 sm:size-4 mr-1.5 sm:mr-2"/>
							pinned at
							<NuxtTime :datetime="messageData.pinned_at" :hour12="false" hour="numeric" minute="numeric"/>
						</span>
					</div>
				</div>
			</div>
			
			<div class="[&>button]:hover:bg-accented/50 grid grid-cols-4 *:flex *:justify-center *:items-center gap-0.5 sm:gap-1 rounded-xl bg-muted/70 backdrop-blur-2xl border border-accented p-1">
				<UTooltip :delay-duration="700" text="reply">
					<UButton icon="lucide:reply" :size="buttonSize" variant="ghost" color="neutral" @click="onReply"/>
				</UTooltip>
				
				<template v-if="canEditAndDelete">
					<UTooltip v-if="canEdit" :delay-duration="700" text="edit">
						<UButton icon="lucide:pencil" :size="buttonSize" variant="ghost" color="neutral" @click="onEdit"/>
					</UTooltip>
					<UTooltip v-else :delay-duration="700" text="copy">
						<UButton icon="lucide:files" :size="buttonSize" variant="ghost" color="neutral" @click="onCopy"/>
					</UTooltip>
					<UTooltip :delay-duration="700" text="delete">
						<UButton icon="lucide:trash-2" :size="buttonSize" variant="ghost" color="neutral" @click="onDelete"/>
					</UTooltip>
				</template>

				<template v-else>
					<UTooltip :delay-duration="700" text="copy">
						<UButton icon="lucide:files" :size="buttonSize" variant="ghost" color="neutral" @click="onCopy"/>
					</UTooltip>
					<UModal v-model:open="isPinModalOPen" :ui="{ content: 'grid grid-cols-2 gap-3 sm:gap-4 w-60 sm:w-70 max-w-[calc(100vw-2rem)]' }">
						<UTooltip :delay-duration="700" :text="isPinned ? 'unpin' : 'pin'">
							<UButton 
								:icon="isPinned ? 'lucide:pin-off' : 'lucide:pin'" 
								:size="buttonSize" 
								variant="ghost" 
								color="neutral" 
							/>
						</UTooltip>
				
						<template #content>
							<h3 class="text-center col-span-2 text-base sm:text-xl border-none">
								{{ isPinned ? 'unpin' :  'pin'}} this message?
							</h3>
							<UButton 
								label="cancel" 
								color="neutral" 
								variant="soft" 
								class="flex justify-center text-sm sm:text-lg" 
								@click="() => isPinModalOPen = false"
							/>
							<UButton 
								:label="isPinned ? 'unpin' : 'pin'" 
								class="flex justify-center text-sm sm:text-lg" 
								@click="onPin"
							/>
						</template>
					</UModal>
				</template>
				
				<UButton icon="lucide:send" :size="buttonSize" variant="ghost" color="neutral" @click="onForward"/>
			</div>
		</template>
	</UPopover>
</template>
