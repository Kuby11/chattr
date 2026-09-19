<script setup lang="ts">
import type { ChatId, ChatMemberId, Tables } from '@shared/types';
import { useChat } from '../../composables/useChat';
import { useProfile } from '@features/profile';
import { ROUTE_TOKENS } from '~/shared/configs';
import { useChatStore } from '../../stores/chatStore';

const UNDO_DURATION_MS = 10_000

const props = defineProps<{
	chatId: ChatId
	chatMembers: Tables<"chat_members">[]
	currentUserId?: string
}>()

const { deleteChat, leaveGroup } = useChat()
const { findUserProfiles } = useProfile()
const chatStore = useChatStore()
const toast = useToast()
const router = useRouter()

const isOpen = ref(false)
const loading = ref(false)
const successorId = ref<ChatMemberId | null>(null)

const currentMember = computed(() => {
	const uid = props.currentUserId
	if (!uid) return null
	return props.chatMembers.find(member => member.user_id === uid) ?? null
})

const isOwner = computed(() => currentMember.value?.role === 'OWNER')

const shouldDeferLeave = computed(() =>
	currentMember.value?.role === 'MEMBER' || currentMember.value?.role === 'ADMIN'
)

const candidates = computed(() =>
	props.chatMembers.filter(member => member.user_id !== props.currentUserId)
)

const hasOtherMembers = computed(() => candidates.value.length > 0)

const { data: candidateProfiles } = useLazyAsyncData(
	`group-owner-successor-candidates-${props.chatId}`,
	async () => {
		if (!isOwner.value || !isOpen.value || !hasOtherMembers.value) return {}

		const ids = candidates.value.map(member => member.user_id)
		if (!ids.length) return {}

		const profiles = await findUserProfiles(ids)
		return Object.fromEntries(profiles.map(profile => [profile.user_id, profile]))
	},
	{
		watch: [candidates, isOwner, isOpen],
		immediate: false
	}
)

const canLeave = computed(() =>
	!isOwner.value || !hasOtherMembers.value || successorId.value != null
)

function onModalChange(open: boolean) {
	isOpen.value = open
	if (!open) {
		successorId.value = null
	}
}

async function handleLeave() {
	if (!canLeave.value) return

	loading.value = true
	isOpen.value = false

	try {
		if (!hasOtherMembers.value) {
			await deleteChat(props.chatId)
			navigateTo(ROUTE_TOKENS.HOME)
			return
		}

		if (isOwner.value && successorId.value) {
			const memberId = currentMember.value?.id
			if (!memberId) return
			await leaveGroup(props.chatId, memberId, successorId.value)
			navigateTo(ROUTE_TOKENS.HOME)
			return
		}

		if (shouldDeferLeave.value) {
			await performDeferredLeave()
			return
		}
	} catch (err) {
		console.error('Failed to leave group:', err)
		loading.value = false
		toast.add({
			title: 'Failed to leave group',
			description: err instanceof Error ? err.message : 'An error occurred while leaving the group',
			icon: 'lucide:alert-circle',
			color: 'error'
		})
	}
}

async function performDeferredLeave() {
	const memberId = currentMember.value?.id
	if (!memberId) {
		loading.value = false
		return
	}

	const chatIndex = chatStore.chats?.findIndex(c => c.id === props.chatId) ?? -1
	const chatSnapshot = chatStore.chats?.find(c => c.id === props.chatId)

	if (!chatSnapshot) {
		loading.value = false
		return
	}

	chatStore.removeChat(props.chatId)
	await navigateTo(ROUTE_TOKENS.HOME)
	loading.value = false

	let undone = false
	let commitTimer: ReturnType<typeof setTimeout> | null = null

	function cancelCommit() {
		if (commitTimer) {
			clearTimeout(commitTimer)
			commitTimer = null
		}
	}

	const toastId = `leave-undo-${props.chatId}`

	toast.add({
		id: toastId,
		title: 'You left the group',
		description: 'You can rejoin within 10 seconds.',
		icon: 'lucide:log-out',
		color: 'neutral',
		duration: UNDO_DURATION_MS,
		actions: [
			{
				label: 'Undo',
				color: 'primary',
				variant: 'solid',
				onClick: () => {
					if (undone) return
					undone = true
					cancelCommit()

					chatStore.restoreChat(chatSnapshot, chatIndex >= 0 ? chatIndex : undefined)

					router.push(ROUTE_TOKENS.CHAT(props.chatId as string))

					toast.remove(toastId)
					toast.add({
						title: 'You stayed in the group',
						icon: 'lucide:check-circle',
						color: 'success',
						duration: 3000
					})
				}
			}
		]
	})

	commitTimer = setTimeout(async () => {
		if (undone) return
		try {
			await leaveGroup(props.chatId, memberId, undefined)
		} catch (err) {
			console.error('Failed to commit leave to database:', err)
			chatStore.restoreChat(chatSnapshot, chatIndex >= 0 ? chatIndex : undefined)
			toast.add({
				title: 'Failed to leave group',
				description: err instanceof Error ? err.message : 'Something went wrong. You have been re-added.',
				icon: 'lucide:alert-circle',
				color: 'error'
			})
		}
	}, UNDO_DURATION_MS)
}
</script>

<template>
	<UButton
		variant="ghost"
		color="warning"
		icon="lucide:log-out"
		class="justify-start text-sm w-full"
		@click="isOpen = true"
	>
		leave group
	</UButton>

	<UModal
		v-model:open="isOpen"
		:ui="{ content: 'max-w-sm' }"
		@update:open="onModalChange"
	>
		<template #content>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col items-center gap-2">
					<div class="flex gap-1">
						<UIcon name="lucide:log-out" class="size-5 text-warning shrink-0 mt-0.5" />
						<p class="font-medium text-base">leave this group?</p>
					</div>
					<p class="text-sm text-center text-muted mt-1">
						<template v-if="!hasOtherMembers">
							you are the only member left. leaving will delete this group for everyone.
						</template>
						<template v-else-if="isOwner">
							you are the group owner. choose who becomes the new owner before you leave.
						</template>
						<template v-else>
							you will no longer receive messages from this group.
							<span class="font-medium">you have 10 seconds to undo</span> after leaving.
						</template>
					</p>
				</div>

				<div v-if="isOwner && hasOtherMembers" class="flex flex-col gap-2">
					<p class="text-sm text-dimmed">new group owner</p>
					<div class="flex max-h-48 flex-col gap-1 overflow-y-auto">
						<button
							v-for="member in candidates"
							:key="member.id"
							type="button"
							class="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors"
							:class="member.id === successorId
								? 'bg-primary/10 ring-1 ring-primary'
								: 'hover:bg-elevated'"
							:disabled="loading"
							@click="successorId = member.id"
						>
							<UAvatar
								:src="candidateProfiles?.[member.user_id]?.avatar_url ?? ''"
								:alt="candidateProfiles?.[member.user_id]?.nickname ?? member.user_id"
							/>
							<span class="min-w-0 flex-1 truncate text-sm">
								{{ candidateProfiles?.[member.user_id]?.nickname ?? member.user_id }}
							</span>
							<UIcon
								v-if="member.id === successorId"
								name="lucide:check"
								class="size-4 text-primary shrink-0"
							/>
						</button>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<UButton
						label="cancel"
						color="neutral"
						variant="soft"
						class="justify-center"
						@click="isOpen = false"
					/>
					<UButton
						:label="!hasOtherMembers ? 'leave & delete chat' : isOwner ? 'transfer & leave' : 'leave group'"
						color="warning"
						:icon="!hasOtherMembers ? 'lucide:trash-2' : 'lucide:log-out'"
						class="justify-center"
						:loading="loading"
						:disabled="!canLeave"
						@click="handleLeave"
					/>
				</div>
			</div>
		</template>
	</UModal>
</template>
