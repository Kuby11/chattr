<script setup lang="ts">
import type { Tables } from '@shared/types';
import { MessageButton } from '@features/message';
import { useProfile } from '../../composables/useProfile';

defineProps<{ userProfile: Tables<"user_profiles"> }>()

const { isCurrentUser } = useProfile()

</script>

<template>
	<div v-if="userProfile" class="relative w-full h-full rounded-lg xs:border border-default overflow-hidden">
		<div class="relative aspect-7/2 w-full min-h-26 z-5 bg-linear-to-r from-primary/40 to-primary/20">
			<NuxtImg
				v-if="$props.userProfile.cover_url"
				:src="$props.userProfile.cover_url"
				alt="Cover"
				class="absolute inset-0 size-full object-cover"
			/>
			<div class="flex not-sm:flex-col gap-4 absolute sm:-bottom-28 -bottom-35 left-6 right-6 z-10 h-fit">
				<UUser
					orientation="vertical"
					:name="$props.userProfile.nickname"
					:description="'@' + $props.userProfile.username"
					:ui="{
						description: 'sm:text-base text-sm',
						name: 'sm:text-3xl text-2xl',
						avatar: 'ring-5 ring-bg sm:size-20 size-16'
					}"
					:avatar="{
						src: $props.userProfile.avatar_url ?? '',
						alt: $props.userProfile.nickname, 
						ui: { fallback: 'sm:text-4xl text-2xl' } 
					}"
				/>
				<div class="flex w-full">
					<p class="self-end h-fit flex items-start gap-1 text-muted sm:text-base text-sm">
						<UIcon name="lucide:calendar-days" class="size-5 aspect-square" />
						joined at
						<NuxtTime :datetime="$props.userProfile.created_at"/>
					</p>
					<MessageButton
						v-if="!isCurrentUser($props.userProfile.user_id)"
						:user-id="$props.userProfile.user_id"
						label="message"
						color="neutral"
						size="md"
						class="ml-auto self-end"
					/>
				</div>
			</div>
		</div>
		<div class="sm:mt-26 mt-32 w-full h-auto flex flex-col gap-2 p-6">
			<p class="text-base">{{ $props.userProfile.bio ?? "no bio" }}</p>
		</div>
	</div>
	<USkeleton v-else class="w-full h-full"/>
</template>
