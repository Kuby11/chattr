<script setup lang="ts">
import type { UserId } from '@shared/types';
import { useFriendship } from '../../composables/useFriendship';
import { useFriendshipStore } from '../../stores/friendshipStore';

const props = withDefaults(
	defineProps<{
		userId: UserId
		class?: string
	}>(),
	{ class: '' }
)

const friendshipStore = useFriendshipStore()
const friendship = useFriendship()
const toast = useToast()

const isPending = ref(false)

const status = computed(() => friendshipStore.friendshipStatus(props.userId))

const label = computed(() => {
	switch (status.value) {
		case 'SENT_REQUEST':
			return 'friend request sent'
		case 'PENDING_REQUEST':
			return 'accept friend request'
		default:
			return 'send friend request'
	}
})

const icon = computed(() => {
	if (status.value === 'SENT_REQUEST')
		return 'lucide:clock'

	return 'lucide:user-plus'
})

const disabled = computed(() => status.value === 'SENT_REQUEST')

async function onClick() {
	if (isPending.value || disabled.value) return
	isPending.value = true

	try {
		if (status.value === 'PENDING_REQUEST') {
			const request = friendshipStore.incomeRequests.find(req => req.requester_id === props.userId)
			if (request) await friendship.acceptFriendRequest(request.id)
		} else {
			await friendship.sendFriendRequest(props.userId)
		}

		toast.add({
			title: status.value === 'PENDING_REQUEST' ? 'accepted friend request!' : 'friend request sent!',
			icon: 'lucide:check'
		})
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
	<UButton
		v-if="status !== 'IS_FRIEND'"
		:icon="icon"
		:label
		variant="ghost"
		color="neutral"
		:disabled="disabled"
		:loading="isPending"
		:class="['justify-start text-sm w-full', $props.class]"
		@click="onClick"
	/>
</template>