<script setup lang="ts">
import { LazySearchInput } from '#components';
import { useFriendshipStore, FriendRequestButton, FriendRequestsSlideOver } from '@features/friendship'
import { UserCard } from '@features/profile';
import { useCurrentRoute } from '@shared/composables';

definePageMeta({
	middleware: "auth",
	layout: "main"
})

useHead({
	title: 'Friends | Chattr'
})

const { setCurrentRoute } = useCurrentRoute()

setCurrentRoute({
	route: 'friends',
	icon: 'lucide:users'
})

const route = useRoute()
const friendshipStore = useFriendshipStore()

const filterTerm = computed(() => route.query.term?.toString() ?? '')

const { data, pending, execute, clear } = useAsyncData(
	'friends',
	() => friendshipStore.filterFriends(filterTerm.value), 
	{
		watch: [() => friendshipStore.friends],
	},
)

onScopeDispose(clear)
</script>

<template>
	<div class="p-4 flex flex-col gap-4 h-full min-h-0 overflow-y-auto">
		<div class="flex justify-between items-center">
			<h2 class="text-2xl font-medium">your friends</h2>
			
			<FriendRequestsSlideOver >
				<UTooltip :text="'your friend requests'" :ui="{ content: 'text-sm p-2' }">
					<WithCountBadge :value="[...friendshipStore.incomeRequests, ...friendshipStore.sentRequests].length">
						<UButton icon="lucide:user-plus" variant="soft" color="neutral" size="md" />
					</WithCountBadge>
				</UTooltip>
			</FriendRequestsSlideOver>
		</div>

		<LazySearchInput
			:search-callback="execute" 
			:search-term="filterTerm" 
			class="mb-4"
		/>
		
		<UPageList class="gap-3">
			<ItemList 
				v-if="data && friendshipStore.friends"
				:data="data"
				:loading="pending"
				:item-key="friend => friend.friendId"
				:ui="{ empty: 'hidden'}"
			>
				<template #default="listItem">
					<UserCard
						:key="listItem.friendId"
						:user-id="listItem.friendId"
						:target="'_blank'"
						variant="subtle"
					>
						<FriendRequestButton
							:user-id="listItem.friendId"
							class="w-full justify-start"
						/>
					</UserCard>
				</template>

				<template #loading>
					<AppLoader class="mx-auto"/>
				</template>
			</ItemList>
		</UPageList>
	</div>
</template>
