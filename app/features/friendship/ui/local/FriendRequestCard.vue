<script setup lang="ts">
import type { FriendshipId, UserId } from '@shared/types';
import { useProfile } from '@features/profile'
import { useFriendship } from '../../composables/useFriendship'

const props = defineProps<{
	requestId: FriendshipId,
	userId: UserId,
	variant: "income" | "sent"
}>()

const { cancelFriendRequest, acceptFriendRequest, rejectFriendRequest } = useFriendship()
const { findUserProfile } = useProfile()

const { data: userData } = useLazyAsyncData(`friendRequest-${props.requestId}`,async () => findUserProfile(props.userId))

</script>

<template>
	<UPageCard 
		v-if="userData" 
		:ui="{ 
			root: 'cursor-pointer', 
			body: 'flex w-full justify-between items-center' 
		}"
		variant="outline" 
		target="_blank"
	> 
		<template #body>
			<UPopover :content="{ side: 'bottom', align: 'start' }" >
				<UUser
					:name="userData.nickname"
					:description="userData.bio!"
					:ui="{
						root: 'pointer-events-auto',
						avatar: 'cursor-pointer',
						name: 'cursor-pointer hover:text-primary'
					}"
					:avatar="{
						alt: userData.username,
						src: userData.avatar_url!
					}"
					size="xl"
				/>

				<template #content>
					<ProfilePopoverContent :profile="userData" />
				</template>
			</UPopover>
			<div class="flex gap-2 relative z-100">
				<template v-if="$props.variant === 'income'">
					<UTooltip text="reject request" :ui="{ text: 'text-error' }">
						<UButton 
							variant="soft" 
							size="lg" 
							icon="lucide:user-x" 
							color="error"
							@click="rejectFriendRequest($props.requestId)"
						/>
					</UTooltip>

					<UTooltip text="accept request" :ui="{ text: 'text-primary' }">
						<UButton 
							variant="soft" 
							size="lg" 
							icon="lucide:user-plus" 
							color="primary"
							@click="acceptFriendRequest($props.requestId)"
						/>
					</UTooltip>
				</template>
				<UTooltip v-else text="cancel request" :ui="{ text: 'text-error' }">
					<UButton 
						variant="soft" 
						size="lg" 
						icon="lucide:x" 
						color="error"
						@click="cancelFriendRequest($props.requestId)"
					/>
				</UTooltip>
			</div>
		</template>
	</UPageCard>
	<USkeleton v-else class="w-full rounded-lg h-22"/>
</template>
