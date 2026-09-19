<script setup lang="ts">
import { LogoutButton } from '@features/auth';
import { useProfile } from '../../composables/useProfile'
import { FriendRequestButton } from '@features/friendship';
import type { Tables } from '@shared/types';
import { useProfileOverlay } from '../../composables/useProfileOverlay'

defineProps<{ profile: Tables<"user_profiles"> }>()

const { isCurrentUser } = useProfile()
const profileOverlay = useProfileOverlay()

</script>

<template>
	<div
		v-if="$props.profile" 
		class="
			flex flex-col gap-2 w-60 h-90 p-4 relative overflow-hidden rounded
			after:absolute after:w-full 
			after:aspect-7/2 after:top-0 after:left-0 
			after:bg-linear-to-r after:from-primary/40 after:to-primary/20 after:rounded-t
		"
	>
		<NuxtImg
			v-if="$props.profile.cover_url"
			:src="$props.profile.cover_url"
			alt="Cover"
			class="absolute w-full aspect-7/2 top-0 left-0 object-cover rounded-t z-5"
		/>
		<UUser 
			size="3xl"
			orientation="vertical"
	    :name="$props.profile.nickname"
    	:description="'@' + $props.profile.username"
			:ui="{ 
				description: 'text-xs', 
				name: 'text-xl', 
				root: 'relative z-10 gap-1 mt-8', 
				avatar: 'ring-5 ring-bg' 
			}"
			:avatar="{ 
				key: $props.profile.id,
				src: $props.profile.avatar_url ?? '',
				alt: $props.profile.nickname
			}"
		/>
		<div class="flex flex-col gap-2 h-full justify-between z-10">
			<pre class="text-sm flex-1 font-sans">{{ $props.profile.bio ?? "no bio" }}</pre>
			<div class="flex flex-col gap-2">
				<LogoutButton 
					v-if="isCurrentUser($props.profile.user_id)"
					size="lg"
					variant="soft"
					color="neutral"
				/>
				<FriendRequestButton
					v-if="!isCurrentUser($props.profile.user_id)"
					:user-id="$props.profile.user_id"
				/>
				<UButton
					icon="lucide:circle-user-round"
					size="lg"
					variant="soft"
					color="neutral"
					label="view full profile"
					@click="profileOverlay.open({ userProfile: $props.profile })"
				/>
			</div>
		</div>
	</div>
</template>
