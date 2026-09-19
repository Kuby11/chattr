<script setup>
import { useProfileStore, ProfileButton, useProfileOverlay } from '@features/profile';
import { SettingsButton } from '@features/settings';
import { AsideRoutes } from '@shared/configs';
import { useFriendshipStore } from '@features/friendship';
import { useMessageStore } from '@features/message';

const userStore = useProfileStore()
const profileOverlay = useProfileOverlay()
const friendshipStore = useFriendshipStore()
const messageStore = useMessageStore()

const friendRequestCount = computed(() => friendshipStore.incomeRequests.length)

const unreadMessagesCount = computed(() => {
	const uid = userStore.userProfile?.user_id
	if (!uid) return 0

	return Array.from(messageStore.messages.values()).reduce((total, messages) =>
		total + messages.reduce((count, message) =>
			count + (message.sender_id !== uid && !message.seen_at ? 1 : 0),
		0
		),
	0)
})

const routeBadgeCount = (routeName) => {
	if (routeName === 'friends') return friendRequestCount.value
	if (routeName === 'home') return unreadMessagesCount.value
	return 0
}

</script>

<template>
	<div class="flex flex-col h-dvh min-h-dvh w-full overflow-hidden">
		<AppHeader class="shrink-0 w-full">			
			<LinkButton
				v-for="route in AsideRoutes"
				:key="route.route"
				:icon="route.icon"
				:to="route.to"
				class="mt-4"
				:ui="{ base: 'gap-5 text-xl w-full' }"
			>
				<span class="flex-1 text-start">{{ route.route }}</span>
				<span
					v-if="routeBadgeCount(route.route) > 0"
					class="shrink-0 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-inverted text-xs font-medium leading-none"
				>
					{{ routeBadgeCount(route.route) > 9 ? '9+' : routeBadgeCount(route.route) }}
				</span>
			</LinkButton>
			
			<div class="flex justify-between w-full gap-2 mt-6">
				<template v-if="userStore.userProfile">
					<UUser
						:name="userStore.userProfile.nickname"
						:description="'@' + userStore.userProfile.username"
						:avatar="{ src: userStore.userProfile.avatar_url }"
						size="xl"
						target="_blank"
						@click="profileOverlay.open({ userProfile: userStore.userProfile })"
					/>
				</template>
				<USkeleton v-else class="w-9 aspect-square rounded-full"/>
			
				<SettingsButton class="aspect-square"/>
			</div>
		</AppHeader>

		<UMain class="w-full flex-1 min-h-0 overflow-hidden flex" :ui="{ base: 'min-h-0' }">
			<AppAside
			:user-profile="userStore.userProfile"
			:friend-request-count="friendRequestCount"
			:unread-messages-count="unreadMessagesCount"
		>
				<ProfileButton
					v-if="userStore.userProfile"
					:user-profile="userStore.userProfile"
					:content="{ side: 'right', align: 'end', sideOffset: 6 }"
				/>
				<USkeleton v-else class="mt-auto w-10 aspect-square rounded-full"/>

				<UTooltip
					text="settings"
					:content="{ side: 'right' }" 
					:ui="{ content: 'text-sm p-2' }"
				>
					<SettingsButton />
				</UTooltip>
			</AppAside>

			<div class="w-full h-full flex-1 min-w-0 min-h-0 border-l border-default overflow-hidden">
				<slot />
			</div>
		</UMain>
	</div>
</template>
