<script setup lang="ts">
import type { ClientMessage } from '../../types/clientMessage'
import { useProfile } from '@features/profile'
import { useCachedData } from '@shared/composables'

const props = defineProps<{
	messageData: ClientMessage
}>()

const { findUserProfile } = useProfile()

const parsedInfo = computed(() => {
	const match = props.messageData.content?.trim().match(/^(.+?) has (joined|leaved)$/)
	if (!match?.[1] || !match[2]) return null

	return {
		targetId: match[1],
		event: match[2],
	}
})

const targetId = computed(() => parsedInfo.value?.targetId ?? null)
const profileKey = computed(() => targetId.value
	? `user-${targetId.value}`
	: `message-info-${props.messageData.id}`
)

const { data: targetProfile } = useCachedData(
	profileKey,
	async () => {
		if (!targetId.value) return null
		try {
			return await findUserProfile(targetId.value)
		} catch {
			return null
		}
	},
	{ watch: [targetId], lazy: true },
)

const targetName = computed(() =>
	targetProfile.value?.nickname
	?? targetProfile.value?.username
	?? targetId.value
)
</script>

<template>
	<div class="flex w-full justify-center px-4 py-1 text-center text-xs text-muted">
		<span v-if="parsedInfo">
			{{ targetName }} has {{ parsedInfo.event }}
		</span>
	</div>
</template>
