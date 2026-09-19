<script setup lang="ts">
import type { Enums, Tables } from '@shared/types';
import { useProfile, useProfileOverlay, useProfileStore, getProfileAssetUrl } from '@features/profile';
import { useCachedData } from '@shared/composables';

const props = defineProps<{
	memberData: Tables<"chat_members">,
	chatType: Enums<"chat_type">,
	currentUserId?: string,
	currentMemberRole?: Enums<"member_role">,
	canManageGroup?: boolean,
	onRoleChange?: (memberId: string, role: Enums<"member_role">) => Promise<void> | void,
	onMuteChange?: (memberId: string, mutedUntil: string | null) => Promise<void> | void
	onRemove?: (memberId: string) => Promise<void> | void
}>()

const { findUserProfile } = useProfile()
const { open } = useProfileOverlay()
const { userProfile } = storeToRefs(useProfileStore())

const { data } = useCachedData(
	`chat-member-profile-${props.memberData.user_id}`,
	async () => {
		if (userProfile.value?.user_id === props.memberData.user_id) {
			return userProfile.value
		}

		return await findUserProfile(props.memberData.user_id)
	},
	{
		lazy: true,
		watch: [() => props.memberData.user_id, userProfile]
	}
)

const avatarUrl = computed(() => getProfileAssetUrl(data.value?.avatar_url))

const roleColor = computed(() => {
	if(props.memberData.role === 'OWNER') 
		return 'text-primary'
	if(props.memberData.role === 'ADMIN') 
		return 'text-default'
	else 
		return 'text-dimmed'
})

const isSelf = computed(() => props.memberData.user_id === props.currentUserId)

const canManageThisMember = computed(() => {
	if (!props.canManageGroup) return false
	if (isSelf.value) return false
	if (props.memberData.role === 'OWNER' && props.currentMemberRole !== 'OWNER') return false
	return true
})

const menuItems = computed(() => {
	const items = []

	if (props.memberData.role !== 'ADMIN') {
		items.push({
			label: 'Make admin',
			icon: 'lucide:shield',
			onSelect: () => changeRole('ADMIN')
		})
	}

	if (props.memberData.role !== 'MEMBER') {
		items.push({
			label: 'Make member',
			icon: 'lucide:user',
			onSelect: () => changeRole('MEMBER')
		})
	}

	if (isMuted.value) {
		items.push({
			label: mutedRemainingLabel.value ? `Unmute (${mutedRemainingLabel.value} left)` : 'Unmute',
			icon: 'lucide:bell-off',
			onSelect: () => unmuteMember()
		})
	} else {
		items.push({
			label: 'Mute',
			icon: 'lucide:bell',
			onSelect: () => (isMuteModalOpen.value = true)
		})
	}

	if (canKickThisMember.value) {
		items.push({
			label: 'Remove from group',
			icon: 'lucide:user-x',
			onSelect: () => (isRemoveModalOpen.value = true)
		})
	}

	return items
})

const isChangingRole = ref(false)

const canKickThisMember = computed(() => {
	if (!props.canManageGroup || isSelf.value) return false
	if (props.currentMemberRole === 'ADMIN')
		return props.memberData.role === 'MEMBER'
	return props.memberData.role !== 'OWNER'
})

async function changeRole(role: Enums<"member_role">) {
	if (!props.onRoleChange || isChangingRole.value) return
	try {
		isChangingRole.value = true
		await props.onRoleChange(props.memberData.id, role)
	} finally {
		isChangingRole.value = false
	}
}

const isMuted = computed(() => {
	if (!props.memberData.muted_until) return false
	return new Date(props.memberData.muted_until).getTime() > Date.now()
})

const mutedRemainingLabel = computed(() => {
	if (!isMuted.value || !props.memberData.muted_until) return ''
	const ms = new Date(props.memberData.muted_until).getTime() - Date.now()
	const totalMinutes = Math.max(1, Math.floor(ms / 60000))

	if (totalMinutes < 60) return `${totalMinutes}m`
	const totalHours = Math.floor(totalMinutes / 60)
	if (totalHours < 24) return `${totalHours}h`
	const days = Math.floor(totalHours / 24)
	const hours = totalHours % 24
	return hours ? `${days}d ${hours}h` : `${days}d`
})

const mutedUntilLabel = computed(() => {
	if (!props.memberData.muted_until) return ''
	return new Date(props.memberData.muted_until).toLocaleString()
})

const isMuteModalOpen = ref(false)
const muteDuration = ref(1)
type MuteUnit = 'm' | 'h' | 'd'
const muteUnit = ref<MuteUnit>('m')
const isMuting = ref(false)

const muteUnitItems = [
	{ label: 'minutes', value: 'm' },
	{ label: 'hours', value: 'h' },
	{ label: 'days', value: 'd' }
]

function resetMutePicker() {
	muteDuration.value = 1
	muteUnit.value = 'm'
}

function onMuteModalChange(open: boolean) {
	if (!open) {
		resetMutePicker()
	}
}

async function muteMember() {
	if (!props.onMuteChange || isMuting.value) return

	const multiplier = muteUnit.value === 'd'
		? 86400000
		: muteUnit.value === 'h'
			? 3600000
			: 60000

	const duration = Math.max(1, Number(muteDuration.value) || 1)
	const mutedUntil = new Date(Date.now() + duration * multiplier).toISOString()

	try {
		isMuting.value = true
		await props.onMuteChange(props.memberData.id, mutedUntil)
		isMuteModalOpen.value = false
	} finally {
		isMuting.value = false
	}
}

async function unmuteMember() {
	if (!props.onMuteChange || isMuting.value) return
	try {
		isMuting.value = true
		await props.onMuteChange(props.memberData.id, null)
	} finally {
		isMuting.value = false
	}
}

const isRemoveModalOpen = ref(false)
const isRemoving = ref(false)

async function removeMember() {
	if (!props.onRemove || isRemoving.value) return
	try {
		isRemoving.value = true
		await props.onRemove(props.memberData.id)
		isRemoveModalOpen.value = false
	} finally {
		isRemoving.value = false
	}
}
</script>

<template>
	<div v-if="data" class="w-full flex items-center gap-1">
		<UButton 
			as="div" 
			variant="soft" 
			color="neutral" 
			size="xl" 
			class="min-w-0 w-full p-3 cursor-pointer" 
			@click="open({ userProfile: data })"
		>
			<UAvatar 
				:src="avatarUrl"
				:alt="data.nickname"
			/>
			<span class="min-w-0 flex-1 truncate text-left">{{ data.nickname }}</span>

			<UDropdownMenu
				v-if="chatType === 'GROUP' && canManageThisMember"
				:items="menuItems"
				:ui="{ content: 'min-w-40' }"
			>
				<span
					:class="['ml-auto flex shrink-0 items-center gap-1 text-sm', roleColor]"
					@click.stop
				>
					<UIcon
						v-if="isMuted"
						name="lucide:bell-off"
						class="size-3.5 text-error"
					/>
					<span>{{ memberData.role.toLowerCase() }}</span>
					<UIcon v-if="isChangingRole" name="lucide:loader" class="size-4 animate-spin" />
					<UIcon v-else name="lucide:chevron-down" class="size-4" />
				</span>
			</UDropdownMenu>

			<span
				v-else-if="chatType === 'GROUP'"
				:class="['ml-auto flex shrink-0 items-center gap-1 text-sm', roleColor]"
			>
				<UTooltip
					v-if="isMuted"
					:text="`muted until ${mutedUntilLabel}`"
				>
					<span class="flex shrink-0 items-center">
						<UIcon name="lucide:bell-off" class="size-3.5 text-error" />
					</span>
				</UTooltip>
				<span>{{ memberData.role.toLowerCase() }}</span>
			</span>
		</UButton>
	</div>

	<USkeleton v-else class="w-full h-10"/>

	<UModal
		v-model:open="isMuteModalOpen"
		title="mute member"
		:ui="{ content: 'max-w-sm' }"
		@update:open="onMuteModalChange"
	>
		<template #content>
			<div class="flex flex-col gap-4">
				<p class="text-sm text-muted text-center">mute {{ data?.nickname }} for how long?</p>

				<div class="flex items-center gap-2">
					<UInputNumber
						v-model="muteDuration"
						:min="1"
						class="flex-1"
					/>
					<USelect
						v-model="muteUnit"
						:items="muteUnitItems"
						class="w-36"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<UButton
						label="cancel"
						color="neutral"
						variant="soft"
						class="justify-center"
						@click="isMuteModalOpen = false"
					/>
					<UButton
						label="mute"
						color="primary"
						icon="lucide:bell-off"
						class="justify-center"
						:loading="isMuting"
						@click="muteMember"
					/>
				</div>
			</div>
		</template>
	</UModal>

	<UModal
		v-model:open="isRemoveModalOpen"
		title="Remove member"
		description="This member will lose access to the group."
		:ui="{ content: 'max-w-sm p-6!', header: 'border-none' }"
	>
		<template #body>
			<div class="flex flex-col gap-4">
				<p class="text-sm text-muted text-center">
					Are you sure you want to remove {{ data?.nickname }} from the group?
				</p>

				<div class="grid grid-cols-2 gap-3">
					<UButton
						label="cancel"
						color="neutral"
						variant="soft"
						class="justify-center"
						:disabled="isRemoving"
						@click="isRemoveModalOpen = false"
					/>
					<UButton
						label="remove"
						color="error"
						icon="lucide:user-x"
						class="justify-center"
						:loading="isRemoving"
						@click="removeMember"
					/>
				</div>
			</div>
		</template>
	</UModal>
</template>
