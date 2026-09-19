<script setup lang="ts">
import { ROUTE_TOKENS } from '@shared/configs'
import { useAuthStore } from '@features/auth'
import { useChatStore } from '../../stores/chatStore'
import { useChatInvite } from '../../composables/useChatInvite'
import { getChatAssetUrl } from '../../utils/getChatAssetUrl'
import ChatAvatar from './ChatAvatar.vue'

const props = defineProps<{
	token: string
}>()

const route = useRoute()
const authStore = useAuthStore()
const chatStore = useChatStore()
const toast = useToast()
const { fetchInviteByToken, fetchMemberCount, checkMembership, joinByInvite } = useChatInvite()

const joining = ref(false)
const joinError = ref<string | null>(null)

const tokenRef = computed(() => props.token || (route.params.token as string) || '')

const { data: inviteData, status, pending } = await useAsyncData(
	() => `chat-invite-${tokenRef.value}`,
	async () => {
		if (!tokenRef.value) return null
		const invite = await fetchInviteByToken(tokenRef.value)
		if (!invite) return null
		const memberCount = invite.chat_id ? await fetchMemberCount(invite.chat_id) : 0
		return {
			invite,
			memberCount
		}
	},
	{
		watch: [tokenRef]
	}
)

const chat = computed(() => inviteData.value?.invite?.chats ?? null)
const memberCount = computed(() => inviteData.value?.memberCount ?? 0)

const isLoading = computed(() => status.value === 'pending')

const isExpired = computed(() => {
	if (!inviteData.value?.invite?.expires_at) return false
	return new Date(inviteData.value.invite.expires_at).getTime() <= Date.now()
})

const isInvalid = computed(() => 
	!isLoading.value && (!inviteData.value?.invite || !inviteData.value.invite.chats || isExpired.value)
)

const supabaseUser = useSupabaseUser()
const isMemberInDb = ref(false)

const isAlreadyMember = computed(() => {
	const chatId = chat.value?.id
	if (!chatId) return false

	if (chatStore.chats?.some(c => c.id === chatId)) {
		return true
	}

	return isMemberInDb.value
})


const isAuthenticated = computed(() => {
	return authStore.isUserAuth || !!supabaseUser.value || !!authStore.userSession
})

const coverUrl = computed(() => {
	if (!chat.value?.cover_url) return ''
	return getChatAssetUrl(chat.value.cover_url, 'chat-assets')
})

async function handleAction() {
	if (isAlreadyMember.value) {
		return
	}

	if (!isAuthenticated.value) {
		await navigateTo({
			path: ROUTE_TOKENS.LOGIN,
			query: { redirect: route.fullPath }
		})
		return
	}

	joining.value = true
	joinError.value = null

	try {
		const chatId = await joinByInvite(tokenRef.value)
		if (chat.value) {
			chatStore.addChats([chat.value])
		}
		toast.add({
			title: 'Joined group!',
			description: `Welcome to ${chat.value?.name || 'the group'}!`,
			color: 'success'
		})
		const routeChatId = chat.value?.type === 'DIRECT'
			? (chat.value.direct_id ?? chatId)
			: chatId
		await navigateTo(ROUTE_TOKENS.CHAT(routeChatId))
	} catch (err: unknown) {
		console.error('Failed to join chat', err)
		const msg = err instanceof Error ? err.message : 'Failed to join group chat. The invite may have expired.'
		joinError.value = msg
		toast.add({
			title: 'Failed to join',
			description: msg,
			color: 'error'
		})
	} finally {
		joining.value = false
	}
}


watch(
	[() => chat.value?.id, () => authStore.userSession?.id, () => supabaseUser.value?.id, () => chatStore.chats],
	async () => {
		isMemberInDb.value = await checkMembership(chat.value?.id)
	},
	{ immediate: true }
)

</script>

<template>
	<div class="w-full max-w-md mx-auto flex flex-col items-center">
		<UCard v-if="isLoading || pending" class="w-full overflow-hidden">
			<div class="space-y-4 p-2">
				<USkeleton class="h-28 w-full rounded-lg" />
				<div class="flex items-center gap-3">
					<USkeleton class="size-14 rounded-full" />
					<div class="space-y-2 flex-1">
						<USkeleton class="h-5 w-3/4" />
						<USkeleton class="h-4 w-1/2" />
					</div>
				</div>
				<USkeleton class="h-10 w-full rounded-lg mt-4" />
			</div>
		</UCard>

		<UCard
			v-else-if="isInvalid"
			class="w-full border-red-500/20 bg-red-500/5 shadow-xl shadow-red-500/5 overflow-hidden text-center"
		>
			<div class="flex flex-col items-center py-6 px-4 gap-4">
				<div class="size-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 ring-8 ring-red-500/5">
					<UIcon name="lucide:link-2-off" class="size-8" />
				</div>

				<div class="space-y-1.5">
					<h1 class="text-xl font-bold tracking-tight">
						{{ isExpired ? 'Invite Link Expired' : 'Invalid Invite Link' }}
					</h1>
					<p class="text-sm text-dimmed max-w-xs mx-auto">
						{{ isExpired 
							? 'This invitation link has expired and can no longer be used to join the group.'
							: 'This invitation link is not valid or the chat no longer exists.'
						}}
					</p>
				</div>

				<p class="text-xs text-dimmed/80">
					Ask an owner or admin of the group for a new invite link.
				</p>

				<UButton
					label="Back to Home"
					icon="lucide:arrow-left"
					variant="soft"
					color="neutral"
					size="lg"
					class="mt-2"
					:to="ROUTE_TOKENS.HOME"
				/>
			</div>
		</UCard>

		<div v-else-if="chat" class="w-full flex flex-col gap-4">
			<UCard class="w-full overflow-hidden shadow-xl" :ui="{ body: 'p-0 sm:p-0' }">
				<div class="relative h-32 w-full bg-primary/20 overflow-hidden">
					<NuxtImg
						v-if="coverUrl"
						:src="coverUrl"
						alt="Group cover"
						class="size-full object-cover"
					/>
					<div
						v-else
						class="size-full bg-linear-to-br from-primary/35 via-primary/15 to-transparent"
					/>
					<div class="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
				</div>

				<div class="relative px-6 pb-6 pt-0 flex flex-col items-center text-center">
					<div class="-mt-12 mb-3">
						<ChatAvatar
							:src="chat.avatar_url ?? ''"
							:alt="chat.name ?? undefined"
							:chat-type="chat.type"
							:ui="{ root: 'size-24 text-4xl ring-4 ring-default shadow-lg' }"
						/>
					</div>

					<span class="text-xs font-medium uppercase tracking-wider text-primary mb-1">
						Group Chat Invitation
					</span>

					<h1 class="text-2xl font-bold tracking-tight text-highlighted wrap-break-word max-w-full">
						{{ chat.name }}
					</h1>

					<div class="flex items-center gap-1.5 text-xs text-dimmed mt-1.5 mb-3">
						<UIcon name="lucide:users" class="size-3.5" />
						<span>{{ memberCount }} {{ memberCount === 1 ? 'member' : 'members' }}</span>
					</div>

					<p
						v-if="chat.description"
						class="text-sm text-dimmed whitespace-pre-wrap max-h-28 overflow-y-auto mb-2 text-center"
					>
						{{ chat.description }}
					</p>

					<UAlert
						v-if="joinError"
						color="error"
						icon="lucide:alert-circle"
						:title="joinError"
						class="mt-4 w-full text-left"
					/>
				</div>
			</UCard>

			<UButton
				v-if="isAlreadyMember"
				disabled
				label="you're already in the chat"
				color="neutral"
				variant="subtle"
				size="xl"
				block
				class="font-semibold shadow-md"
			/>
			<UButton
				v-else-if="!isAuthenticated"
				label="Sign in to Join"
				icon="lucide:log-in"
				color="primary"
				size="xl"
				block
				class="font-semibold shadow-md cursor-pointer"
				@click="handleAction"
			/>
			<UButton
				v-else
				label="Join Group"
				icon="lucide:user-plus"
				color="primary"
				size="xl"
				block
				:loading="joining"
				class="font-semibold shadow-md cursor-pointer"
				@click="handleAction"
			/>
		</div>
	</div>
</template>
