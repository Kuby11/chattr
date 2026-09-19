<script setup lang="ts">
import type { UserId } from '@shared/types'
import { useUserPresence } from '../../composables/useUserPresence'

const props = defineProps<{ userId: UserId, class?: string, onOnlineClass?: string }>()

const { isOnline, lastSeenAt, loadPresenceRows } = useUserPresence()

const isUserOnline = computed(() => (props.userId ? isOnline(props.userId) : false))
const lastSeen = computed(() => (props.userId ? lastSeenAt(props.userId) : null))

const computedClass = computed(() => 
	`text-xs text-dimmed truncate ${props.class} 
	${isUserOnline.value && (props.onOnlineClass, 'text-primary')}`
)

watch(
	() => props.userId,
	(id) => {
		if (id) loadPresenceRows([id])
	},
	{ immediate: true }
)
</script>

<template>
	<span v-if="isUserOnline" :class="computedClass">online</span>
	<span v-else-if="lastSeen" :class="computedClass">
		last seen <NuxtTime :datetime="lastSeen" relative :title="false" />
	</span>
	<span v-else :class="computedClass">was online</span>
</template>
