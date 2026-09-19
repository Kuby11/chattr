<script setup lang="ts">
import type { PageCardProps } from '#ui/types';
import type { UserId } from '@shared/types';
import { useProfileApi } from '../../api/useProfileApi';
import { useProfile } from '../../composables/useProfile';
import ProfilePopoverContent from './ProfilePopoverContent.vue';
import {MessageButton} from '@features/message';
import { modifiedUI } from '@shared/utils';

const props = defineProps< PageCardProps & { userId: UserId }>()

const pageCardUi = modifiedUI<PageCardProps['ui']>(
	{
		body: 'w-full flex justify-between items-center relative z-5',
		root: 'transition hover:bg-elevated hover:ring-accented'
	},
	props.ui
)

const { findUserProfile } = useProfileApi()
const { isCurrentUser } = useProfile()

const { data: userData } = useLazyAsyncData(`user-${props.userId}`,() => findUserProfile(props.userId))

</script>

<template>
	<UPageCard
		v-if="userData"
		v-bind="$props"
		:ui="pageCardUi"
		:variant="$props.variant || 'subtle'"
	>
		<template #body>
			<div class="flex min-w-0 items-center gap-2">
				<UPopover :content="{ side: 'bottom', align: 'start' }" >
					<UUser
						:name="userData.nickname"
						:description="userData.bio ?? ''"
						:ui="{
							root: 'pointer-events-auto',
							avatar: 'cursor-pointer',
							name: 'cursor-pointer hover:text-primary not-sm:text-sm',
							description: 'not-sm:text-xs 	'
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
				<slot name="meta" />
			</div>

			<UDropdownMenu
				v-if="$slots.default || (userData && !isCurrentUser(userData.user_id))"
				:content="{ side: 'bottom', align: 'end' }"
			>
				<UButton
					icon="lucide:ellipsis-vertical"
					variant="ghost"
					color="neutral"
					aria-label="user actions"
				/>

				<template #content-top>
					<div class="flex min-w-52 flex-col gap-2 p-2" @click.stop>
						<MessageButton
							v-if="!isCurrentUser(userData.user_id)"
							:user-id="userData.user_id"
							label="send message"
							class="w-full justify-start"
						/>
						<slot />
					</div>
				</template>
			</UDropdownMenu>
	
		</template>
	</UPageCard>
	<USkeleton v-else class="w-full rounded-lg h-22" />
</template>
