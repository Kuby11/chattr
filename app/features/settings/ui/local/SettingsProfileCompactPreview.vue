<script setup lang="ts">
import type { Tables } from '@shared/types'

const props = defineProps<{
	profile: Tables<'user_profiles'>
	avatarSrc?: string | null
	bio: string | null
}>()

const shortenedBio = computed(() => {
	if (!props.bio) return ''
	return props.bio.length > 26 ? `${props.bio.slice(0, 26)}...` : props.bio
})
</script>

<template>
	<UUser
		class="mt-5"
		:name="props.profile.nickname"
		:description="shortenedBio"
		:ui="{
			root: 'pointer-events-auto',
			avatar: 'cursor-pointer',
			name: 'cursor-pointer hover:text-primary'
		}"
		:avatar="{
			alt: props.profile.username,
			src: props.avatarSrc ?? undefined
		}"
		size="xl"
	/>
</template>
