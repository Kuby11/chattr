<script setup lang="ts">
import type { Tables } from '@shared/types';
import { ROUTE_TOKENS } from '@shared/configs';

const props = withDefaults(defineProps<{
	userProfile: Tables<"user_profiles">,
	friendRequestCount?: number,
	unreadMessagesCount?: number
}>(), {
	friendRequestCount: 0,
	unreadMessagesCount: 0
})

const routeBadgeCount = (routeName: string): number => {
	if (routeName === 'friends') return props.friendRequestCount
	if (routeName === 'home') return props.unreadMessagesCount
	return 0
}

interface Route {
	icon: string
	route: string
	to: string
}

const asideRoutes: Route[] = [
	{
		icon: "fluent:chat-24-filled",
		route: "home",
		to: ROUTE_TOKENS.HOME
	},
	{
		icon: "lucide:users",
		route: "friends",
		to: ROUTE_TOKENS.FRIENDS
	},
	{
		icon: "lucide:search",
		route: "search",
		to: ROUTE_TOKENS.SEARCH
	},
]

</script>

<template>
	<div class="hidden lg:flex w-fit h-full p-2 flex-col gap-2">
		<LinkButton
			v-for="route in asideRoutes"
			:key="route.route"
			:icon="route.icon"
			:to="route.to"
			:tooltip-text="route.route"
			:ui="{ base: 'w-full justify-between gap-2' }"
		>
			<span
				v-if="routeBadgeCount(route.route) > 0"
				class="shrink-0 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-inverted text-xs font-medium leading-none"
			>
				{{ routeBadgeCount(route.route) > 9 ? '9+' : routeBadgeCount(route.route) }}
			</span>
		</LinkButton>

		<div class="mt-auto flex flex-col gap-2">
			<slot />
		</div>
	</div>
</template>
