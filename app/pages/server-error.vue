<script setup lang="ts">
import { ROUTE_TOKENS, STATE_TOKENS } from '@shared/configs'

definePageMeta({
	layout: false
})

function retry() {
	const returnPath = sessionStorage.getItem(STATE_TOKENS.SUPABASE_ERROR_RETURN)
	sessionStorage.removeItem(STATE_TOKENS.SUPABASE_ERROR_RETURN)

	if (returnPath) {
		window.location.href = returnPath
		return
	}

	window.location.reload()
}
</script>

<template>
	<div class="h-dvh w-full flex flex-col items-center justify-center gap-5 px-4 text-center">
		<UIcon name="lucide:server-crash" class="size-20 text-muted" />

		<div class="space-y-2">
			<h1 class="text-3xl font-bold">server problem</h1>
			<p class="text-muted max-w-md">
				we're having trouble reaching our servers right now. this might be temporary — please try again in a moment.
			</p>
		</div>

		<div class="flex gap-2">
			<UButton
				icon="lucide:refresh-cw"
				@click="retry"
			>
				try again
			</UButton>

			<UButton
				:to="ROUTE_TOKENS.HOME"
				icon="lucide:house"
				variant="soft"
				color="neutral"
			>
				go home
			</UButton>
		</div>
	</div>
</template>
