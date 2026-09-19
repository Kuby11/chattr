<script setup lang="ts">
import { FriendRequestCard } from '../..';
import { useFriendshipStore } from '../../stores/friendshipStore'

const friendshipStore = useFriendshipStore()

const tabItems = computed(() => [
	{
		label: `income requests ${friendshipStore.incomeRequests.length}`,
		icon: 'lucide:users',
		slot: 'income'
	},
	{
		label: `sent requests ${friendshipStore.sentRequests.length}`,
		icon: 'lucide:user-plus',
		slot: 'sent'
	}
])

</script>

<template>
	<USlideover
		:close="{ color: 'primary', variant: 'ghost' }"
		:ui="{ close: 'start-4 end-auto' }"
		close-icon="i-lucide-arrow-left"
	>
		<slot />

		<template #body>
			<UTabs 
				:items="tabItems" 
				:unmount-on-hide="false"
				:ui="{
					root: 'not-sm:flex-col',
					trigger: 'not-sm:w-full not-sm:text-xs'
				}"
			>
				<template #income>
					<ItemList 
						:data="friendshipStore.incomeRequests" 
						:item-key="user => user.id"
						class="flex flex-col" 
					>
						<template #default="listItem">
							<FriendRequestCard 
								:key="listItem.id"
								:user-id="listItem.requester_id" 
								:request-id="listItem.id"
								variant="income"
							/>
						</template>
						
						<template #empty>
							<p class="mx-auto text-muted text-center mt-5">no requests</p>
						</template>
					</ItemList>
				</template>
				
				<template #sent>
					<ItemList 
						:data="friendshipStore.sentRequests" 
						:item-key="user => user.id"
						class="flex flex-col" 
					>
						<template #default="listItem">
							<FriendRequestCard 
								:user-id="listItem.receiver_id" 
								:request-id="listItem.id"
								variant="sent"
							/>
						</template>

						<template #empty>
							<p class="mx-auto text-muted text-center mt-5">no requests</p>
						</template>
					</ItemList>
				</template>
			</UTabs>
		</template>
	</USlideover>
</template>
