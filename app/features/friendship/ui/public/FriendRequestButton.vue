<script setup lang="ts">
import { useFriendshipStore } from '../../stores/friendshipStore'
import { useFriendship } from '../../composables/useFriendship'
import type { UserId } from '@shared/types';
import type { ButtonProps } from '#ui/types'

const props = withDefaults(
	defineProps<{ 
		userId: UserId,
		class?: string,
		compact?: boolean,
		variant?: ButtonProps["variant"]
	}>(),
	{ compact: false, variant: 'soft', class: '' }
)

const friendshipStore = useFriendshipStore()
const friendship = useFriendship()
const toast = useToast()

const isPending = ref<boolean>(false)

const friendshipStatus = computed(() => friendshipStore.friendshipStatus(props.userId))

const friendRequestData = computed(() => {
	if(friendshipStatus.value === 'SENT_REQUEST')
		return friendshipStore.sentRequests.find(req => req.receiver_id === props.userId)
	
	if(friendshipStatus.value === 'PENDING_REQUEST')
		return friendshipStore.incomeRequests.find(req => req.requester_id === props.userId)
})

const label = computed(() => {
	switch(friendshipStatus.value){
		case 'PENDING_REQUEST':
			return 'accept friend request'
		case 'SENT_REQUEST':
			return 'cancel friend request'
		case 'IS_FRIEND':
			return 'remove from friends'
		default:
			return 'send friend request'
	}
})

const icon = computed(() => {
	if(friendshipStatus.value === 'NOT_FRIEND' || friendshipStatus.value === 'PENDING_REQUEST') 
		return 'user-plus'

	return 'user-x'
})

async function sendFriendRequest(){
	await friendship.sendFriendRequest(props.userId)

	toast.add({ 
		title: `sent friend request!`, 
		icon: 'lucide:check'
	})
}

async function cancelFriendRequest(){
	if(!friendRequestData.value) 
		return

	await friendship.cancelFriendRequest(friendRequestData.value.id)

	toast.add({ 
		title: `canceled friend request!`, 
		icon: 'lucide:check'
	})
}

async function deleteFriend(){
	if(!friendship.isFriend(props.userId)) 
		return

	await friendship.deleteFriend(props.userId)

	toast.add({ 
		title: `successfully removed friend!`, 
		icon: 'lucide:check'
	})
}

async function acceptFriendRequest() {
	if(!friendRequestData.value) return

	await friendship.acceptFriendRequest(friendRequestData.value.id)

	toast.add({ 
		title: `accepted friend request!`, 
		icon: 'lucide:check'
	})
}

const onClick = async () => {	
	isPending.value = true

	try {
		switch(friendshipStatus.value){
			case 'SENT_REQUEST':
				return await cancelFriendRequest()
			case 'NOT_FRIEND':
				return await sendFriendRequest()
			case 'PENDING_REQUEST':
				return await acceptFriendRequest()
			case 'IS_FRIEND':
				return await deleteFriend()
		}
	} catch {
		toast.add({ 
			title: 'something went wrong!', 
			icon: 'lucide:x',
			color: 'error'
		})
	} finally {
		isPending.value = false
	}
}
</script>

<template>
	<template v-if="$props.compact">
		<UPopover>
			<UButton
				:icon="'lucide:' + icon"
				:class="$props.class"
				:loading="isPending"
				:variant="$props.variant"
				:color="friendshipStatus === 'IS_FRIEND' ? 'error' : 'neutral'"
				size="lg"
			/>
			<template #content>
				<UButton
					:label
					:class="['text-xs p-2', friendshipStatus === 'IS_FRIEND' && 'text-error' ]" 
					variant="soft"
					color="neutral"
					@click="onClick"
				/>
			</template>
		</UPopover>
	</template>

	<UButton
		v-else
		:label
		:icon="'lucide:' + icon"
		:class="$props.class"
		:loading="isPending"
		size="lg"
		variant="soft"
		color="neutral"
		@click="onClick"
	/>
</template>
