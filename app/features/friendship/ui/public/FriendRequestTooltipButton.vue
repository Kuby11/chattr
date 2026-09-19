<script setup lang="ts">
import { useFriendshipStore } from '../../stores/friendshipStore';
import { useFriendship } from '../../composables/useFriendship'
import type { UserId } from '~/shared/types/tableIds';

const props = defineProps<{ 
	userId: UserId,
	class?: string, 
}>()

const friendshipStore = useFriendshipStore()
const { sendFriendRequest } = useFriendship()
const toast = useToast()

const isPending = ref<boolean>(false)

const friendshipStatus = computed(() => friendshipStore.friendshipStatus(props.userId))

const onClick = () => {		
	if(friendshipStatus.value === 'NOT_FRIEND'){
		isPending.value = true

		sendFriendRequest(props.userId)
			.then(() => {
				toast.add({ 
					title: `sent friend request!`, 
					icon: 'lucide:check'
				})
			})
			.catch(() => {
				toast.add({ 
					title: 'error while sending request!', 
					icon: 'lucide:x',
					color: 'error'
				})
			})
			.finally(() => isPending.value = false)
	}
}

</script>

<template>
	<UTooltip 
		:text="friendshipStatus === 'NOT_FRIEND' ?'send friend request' : ''" 
		:ui="{ text: friendshipStatus === 'NOT_FRIEND' ? 'text-primary' : 'text-dimmed' }"
	>
		<UButton
			:icon="friendshipStatus === 'NOT_FRIEND' ? 'lucide:user-plus' : 'lucide:user-check'"
			:color="friendshipStatus === 'NOT_FRIEND' ? 'primary' : 'neutral'"
			:class="[friendshipStatus === 'NOT_FRIEND' ? 'text-primary' : 'text-dimmed', $props.class]"
			:loading="isPending"
			variant="ghost"
			size="lg"
			@click="onClick"
		/>
	</UTooltip>
</template>
