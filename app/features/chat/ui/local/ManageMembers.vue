<script setup lang="ts">
import type { Enums, Tables } from '@shared/types';
import { useProfileStore, useProfile } from '@features/profile';
import { useBreakpoint } from '@shared/composables';
import { useChat } from '../../composables/useChat';
import ChatMemberButton from './ChatMemberButton.vue';

const props = defineProps<{
	chatId: string,
	chatMembers: Tables<"chat_members">[]
}>()

const emit = defineEmits<{
	(e: 'member-updated', member: Tables<"chat_members">): void
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const { sm: isMobile } = useBreakpoint()

const { updateMemberRole, updateMemberMute, removeGroupMember } = useChat()
const { findUserProfiles } = useProfile()
const { userProfile } = storeToRefs(useProfileStore())
const toast = useToast()

const searchQuery = ref('')

const currentUserId = computed(() => userProfile.value?.user_id)

const currentMember = computed(() => {
	const uid = currentUserId.value
	if (!uid) return undefined
	return props.chatMembers.find(member => member.user_id === uid)
})

const currentMemberRole = computed<Enums<"member_role"> | undefined>(() => currentMember.value?.role)

const canManageGroup = computed(() => {
	return currentMemberRole.value === 'OWNER' || currentMemberRole.value === 'ADMIN'
})

const visibleMembers = computed(() => {
	const uid = currentUserId.value
	return props.chatMembers.filter(member =>
		member.user_id !== uid
	)
})

const { data: memberProfiles } = useAsyncData(
	`manage-members-${props.chatId}`,
	async () => {
		const members = visibleMembers.value
		if (!members.length) return {}

		const profiles = await findUserProfiles(members.map(member => member.user_id))
		return Object.fromEntries(profiles.map(profile => [profile.user_id, profile]))
	},
	{
		watch: [() => props.chatId, visibleMembers]
	}
)

const filteredMembers = computed(() => {
	const query = searchQuery.value.trim().toLowerCase()
	if (!query) return visibleMembers.value

	return visibleMembers.value.filter(member => {
		const profile = memberProfiles.value?.[member.user_id]
		const haystack = `${profile?.nickname ?? ''} ${profile?.username ?? ''}`.toLowerCase()
		return haystack.includes(query)
	})
})

async function onMemberRoleChange(memberId: string, role: Enums<"member_role">) {
	try {
		const updatedMember = await updateMemberRole(memberId, role)
		emit('member-updated', updatedMember)
		toast.add({
			title: `Member role updated to ${role.toLowerCase()}`,
			icon: 'lucide:check-circle-2',
			color: 'success'
		})
	} catch (err) {
		console.error('Failed to update member role:', err)
		toast.add({
			title: 'Failed to update member role',
			description: err instanceof Error ? err.message : 'An error occurred while changing the role',
			icon: 'lucide:alert-circle',
			color: 'error'
		})
	}
}

async function onMemberMuteChange(memberId: string, mutedUntil: string | null) {
	try {
		const updatedMember = await updateMemberMute(memberId, mutedUntil)
		emit('member-updated', updatedMember)
		toast.add({
			title: mutedUntil
				? `Member muted until ${new Date(mutedUntil).toLocaleString()}`
				: 'Member unmuted',
			icon: mutedUntil ? 'lucide:bell-off' : 'lucide:bell-ring',
			color: mutedUntil ? 'warning' : 'success'
		})
	} catch (err) {
		console.error('Failed to update member mute:', err)
		toast.add({
			title: 'Failed to update member mute',
			description: err instanceof Error ? err.message : 'An error occurred while changing the mute',
			icon: 'lucide:alert-circle',
			color: 'error'
		})
	}
}

async function onMemberRemove(memberId: string) {
	try {
		await removeGroupMember(props.chatId, memberId)
		toast.add({
			title: 'Member removed from group',
			icon: 'lucide:user-x',
			color: 'success'
		})
	} catch (err) {
		console.error('Failed to remove member:', err)
		toast.add({
			title: 'Failed to remove member',
			description: err instanceof Error ? err.message : 'An error occurred while removing the member',
			icon: 'lucide:alert-circle',
			color: 'error'
		})
	}
}
</script>

<template>
	<UModal
		v-model:open="isOpen"
		title="Manage Members"
		description="Owners and admins can change member roles."
:ui="{
			content: 'sm:max-w-md p-6!',
			header: 'border-none pb-2'
		}"
		:fullscreen="isMobile"
	>
		<template #body>
			<div class="flex flex-col gap-2">
				<UInput
					v-model="searchQuery"
					placeholder="search members"
					icon="lucide:search"
					:ui="{ base: 'ring-default' }"
				/>

				<div class="flex max-h-80 flex-col gap-2 overflow-y-auto">
					<ChatMemberButton
						v-for="member in filteredMembers"
						:key="member.id"
						chat-type="GROUP"
						:member-data="member"
						:current-user-id="currentUserId"
						:current-member-role="currentMemberRole"
						:can-manage-group="canManageGroup"
						:on-role-change="onMemberRoleChange"
						:on-mute-change="onMemberMuteChange"
						:on-remove="onMemberRemove"
					/>
				</div>

				<p
					v-if="!filteredMembers.length"
					class="text-sm text-center text-muted py-4"
				>
					no members found
				</p>
			</div>
		</template>
	</UModal>
</template>
