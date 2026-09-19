<script setup lang="ts">
import { ChatInviteCard } from '@features/chat'

definePageMeta({
	layout: 'auth'
})

useHead({
	title: 'Group Invite | Chattr'
})

const route = useRoute()
const token = computed(() => (route.params.token as string) || '')
</script>

<template>
	<ChatInviteCard :token="token" />
</template>
