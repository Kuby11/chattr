<script setup lang="ts">
import { LazySearchInput } from '#components'
import { useFriendshipStore, FriendRequestButton } from '@features/friendship'
import { useProfile, UserCard } from '@features/profile'
import { useCurrentRoute } from '@shared/composables';

definePageMeta({
	middleware: 'auth',
	layout: 'main'
})

useHead({
	title: 'Search | Chattr'
})

const { setCurrentRoute } = useCurrentRoute()

setCurrentRoute({
	route: 'search',
	icon: 'lucide:search'
})

const route = useRoute()
const user = useProfile()

const { friendshipStatus } = useFriendshipStore()

const searchTerm = computed(() => route.query.term?.toString())

const { data, pending, execute } = useLazyAsyncData(
	`search-term-${searchTerm.value}`,
	() => user.searchUserProfiles(searchTerm.value!), 
	{ immediate: false }
)

const getFriendshipStatus = (userId: string) => {
	const status = friendshipStatus(userId)

	switch (status){
		case 'IS_FRIEND':
			return 'your friend'
		case 'PENDING_REQUEST':
			return 'have sent friend request to you'
		case 'SENT_REQUEST':
			return 'sent friend request'
		case 'YOURSELF':
			return 'your profile'
		case 'NOT_FRIEND':
			return ''
		default:
			return ''
	}
}

onMounted(() => {
	if(route.query.term) {
		execute()
	}
})

</script>

<template>
	<div class="flex flex-col gap-4 p-4 h-full min-h-0 overflow-y-auto">
		<h2 class="text-2xl font-medium">search</h2>
		<LazySearchInput :search-callback="execute"  :search-term="searchTerm" class="mb-4"/>
		<ItemList 
			v-if="data"
			:data="data"
			:loading="pending"
			:item-key="(item) => item.user_id"
			:ui="{ empty: `text-lg text-dimmed ${!route.query.term && 'hidden'}` }"
		>
			<template #default="listItem">
				<UserCard
					:key="listItem.user_id"
					:user-id="listItem.user_id"
					:target="'_blank'"
					variant="subtle"
				>
					<template #meta>
						<p class="ml-4 text-dimmed not-sm:text-xs">{{ getFriendshipStatus(listItem.user_id) }}</p>
					</template>

					<FriendRequestButton
						:user-id="listItem.user_id"
						class="w-full justify-start"
					/>
				</UserCard>
			</template>

			<template #loading>
				<AppLoader class="mx-auto"/>
			</template>
		</ItemList>
	</div>
</template>
