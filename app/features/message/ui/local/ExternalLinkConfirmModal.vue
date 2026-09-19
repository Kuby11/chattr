<script setup lang="ts">
defineProps<{ url: string }>()

const emit = defineEmits<{ close: [confirmed: boolean] }>()
</script>

<template>
	<UModal
		:close="{ onClick: () => emit('close', false) }"
		:ui="{ content: 'max-w-sm' }"
	>
		<template #content>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col items-center gap-2 text-center">
					<UIcon name="lucide:external-link" class="size-6 shrink-0 text-dimmed" />
					<h2 class="font-medium text-base">external link</h2>
					<p class="text-sm text-muted">this link will take you away from chattr. do you want to continue?</p>
					<a
						:href="url"
						target="_blank"
						rel="noopener noreferrer nofollow ugc"
						class="text-sm font-medium text-primary break-all underline decoration-primary"
					>
						{{ url }}
					</a>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<UButton
						label="cancel"
						color="neutral"
						variant="soft"
						class="justify-center"
						@click="emit('close', false)"
					/>
					<UButton
						label="continue"
						icon="lucide:external-link"
						class="justify-center"
						@click="emit('close', true)"
					/>
				</div>
			</div>
		</template>
	</UModal>
</template>