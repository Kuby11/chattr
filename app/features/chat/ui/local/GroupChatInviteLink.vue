<script setup lang="ts">
import { ROUTE_TOKENS } from '@shared/configs'
import type { ChatId, Tables } from '@shared/types';
import { useChatInviteApi } from '../../api/useChatInviteApi';

const props = defineProps<{ 
  chatId: ChatId, 
  chatType: Tables<"chats">['type'],
  currentMember: Tables<"chat_members"> 
}>()

const { getOrCreateInvite, fetchInviteByChatId } = useChatInviteApi()
const toast = useToast()

const inviteCopied = ref(false)
let inviteCopiedTimer: ReturnType<typeof setTimeout> | null = null

const isInviteManager = computed(() => {
	const role = props.currentMember?.role
	return role === 'OWNER' || role === 'ADMIN'
})

const canViewInvite = computed(() => {
	return props.chatType === 'GROUP' && !!props.currentMember
})

const inviteDataKey = computed(() =>
	`chat-invite-${props.chatId}-${canViewInvite.value ? 'member' : 'pending'}`
)

const { data: inviteData, pending: inviteLoading, clear: clearInviteData } = useAsyncData(
	inviteDataKey,
	async () => {
		if (!props.chatId || !canViewInvite.value) return null

		try {
		return isInviteManager.value
				? await getOrCreateInvite(props.chatId)
				: await fetchInviteByChatId(props.chatId)
		} catch (e) {
			console.error('Failed to load chat invite', e)
			return null
		}
	},
	{
		watch: [() => props.chatId, canViewInvite, isInviteManager],
		getCachedData: (key, nuxtApp) => {
			const cached = nuxtApp.payload.data[key] || nuxtApp.static.data[key]
			if (!cached) return undefined
			if (cached && cached.expires_at) {
				const expires = new Date(cached.expires_at)
				if (!Number.isNaN(expires.getTime()) && expires.getTime() <= Date.now()) {
					return undefined
				}
			}
			return cached
		},
	}
)

onScopeDispose(clearInviteData)

const inviteToken = computed(() => inviteData.value?.token ?? null)
const inviteExpiresAt = computed(() => inviteData.value?.expires_at ?? null)

const inviteExpiryLabel = computed(() => {
	if (!inviteExpiresAt.value) return null
	const expires = new Date(inviteExpiresAt.value)
	if (Number.isNaN(expires.getTime())) return null
	return expires.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})
})

async function copyTextToClipboard(text: string) {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text)
	}

	const textarea = document.createElement('textarea')
	textarea.value = text
	textarea.setAttribute('readonly', '')
	textarea.style.position = 'fixed'
	textarea.style.top = '0'
	textarea.style.left = '-9999px'
	textarea.style.opacity = '0'
	document.body.appendChild(textarea)

	try {
		textarea.focus()
		textarea.select()
		textarea.setSelectionRange(0, textarea.value.length)

		if (!document.execCommand('copy')) {
			throw new Error('Copy command was rejected')
		}
	} finally {
		document.body.removeChild(textarea)
	}
}

async function copyInviteLink() {
	if (!inviteToken.value) return
	const fullUrl = `${window.location.origin}${ROUTE_TOKENS.INVITE(inviteToken.value)}`
	try {
		await copyTextToClipboard(fullUrl)
		inviteCopied.value = true
		toast.add({
			title: 'Invite link copied!',
			description: 'Share it to invite people to this group',
			color: 'success'
		})
		if (inviteCopiedTimer) clearTimeout(inviteCopiedTimer)
		inviteCopiedTimer = setTimeout(() => {
			inviteCopied.value = false
			inviteCopiedTimer = null
		}, 2000)
	} catch {
		toast.add({
			title: 'Failed to copy link',
			color: 'error'
		})
	}
}

onUnmounted(() => {
	if (inviteCopiedTimer) clearTimeout(inviteCopiedTimer)
})

</script>

<template>
  <div v-if="canViewInvite" class="flex flex-col gap-1.5 w-full">
    <span class="text-xs font-medium text-dimmed uppercase tracking-wider">Invite Link</span>
    <button
      v-if="inviteToken && !inviteLoading"
      type="button"
      class="flex items-center gap-2 rounded-lg bg-elevated px-3 py-2 text-sm transition-colors hover:bg-elevated/80 w-full text-left cursor-pointer border border-default"
      @click="copyInviteLink"
    >
      <UIcon name="lucide:link" class="size-4 text-dimmed shrink-0" />
      <span class="truncate flex-1 font-mono text-xs text-dimmed select-all">invite/{{ inviteToken }}</span>
      <UIcon
        :name="inviteCopied ? 'lucide:check' : 'lucide:copy'"
        class="size-4 shrink-0 transition-all"
        :class="inviteCopied ? 'text-primary' : 'text-dimmed'"
      />
    </button>
    <div v-else-if="inviteLoading" class="flex items-center gap-2 text-xs text-dimmed py-2">
      <UIcon name="lucide:loader-2" class="size-3.5 animate-spin" />
      <span>Loading invite link...</span>
    </div>
    <span v-if="inviteExpiryLabel && inviteToken" class="text-[11px] text-dimmed">
      Expires {{ inviteExpiryLabel }}
    </span>
  </div>
</template>
