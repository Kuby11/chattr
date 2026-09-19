<script setup lang="ts">
import type { AvatarProps } from '#ui/types'
import type { Tables } from '@shared/types';
import { getChatAssetUrl } from '../../utils/getChatAssetUrl';

const props = defineProps<AvatarProps & { chatType: Tables<"chats">['type'] }>()

const icon = computed(() => {
	if(props.chatType === 'DIRECT'){
		return !props.alt && 'lucide:user'
	}
	return 'lucide:users'
})
const resolvedSrc = computed(() => getChatAssetUrl(props.src))

</script>

<template>
	<UAvatar 
		v-bind="props"
		:alt="props.alt?.[0]"
		:src="resolvedSrc"
		:icon
		class="bg-primary outline-black *:text-inverted!" 
	/>
</template>
