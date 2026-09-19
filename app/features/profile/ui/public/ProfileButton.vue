<script setup lang="ts">
import type { PopoverProps } from '#ui/types'
import ProfilePopoverContent from './ProfilePopoverContent.vue';
import { PresenceAvatar } from '@features/user';
import type { Tables } from '@shared/types';

defineProps<Pick<PopoverProps, 'class' | 'content'> & { userProfile: Tables<"user_profiles">}>()

</script>

<template>
	<UPopover :class="$props.class" :content="$props.content">
		<UButton
			variant="soft"
			color="neutral"
			class="rounded-full p-0 aspect-square flex justify-center items-center cursor-pointer"
		>
			<PresenceAvatar
				:key="$props.userProfile.id"
				:user-id="$props.userProfile.user_id"
			>
				<UAvatar
					:src="$props.userProfile.avatar_url!"
					:alt="$props.userProfile.nickname"
					size="lg"
				/>
			</PresenceAvatar>
		</UButton>

		<template #content>
			<ProfilePopoverContent :profile="$props.userProfile" />
		</template>
	</UPopover>
</template>
