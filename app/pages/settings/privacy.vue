<script setup lang="ts">
import { SettingsPage, SettingsPasswordForm, usePrivacySettings, type PresencePolicy } from '@features/settings'
import { useCurrentRoute } from '@shared/composables'

definePageMeta({
	middleware: 'auth',
	layout: 'main'
})

useHead({
	title: 'Privacy settings | Chattr'
})

const { setCurrentRoute } = useCurrentRoute()

setCurrentRoute({
	route: 'settings/privacy',
	icon: 'lucide:shield-check'
})

const toast = useToast()

const {
	presencePolicy,
	isLoading,
	isSaving,
	loadError,
	loadPresencePolicy,
	savePresencePolicy,
} = usePrivacySettings()

const presenceOptions: Array<{ label: string; value: PresencePolicy; description: string }> = [
	{
		label: 'Everyone',
		value: 'EVERYONE',
		description: 'Anyone on Chattr can see when you are online.'
	},
	{
		label: 'Friends only',
		value: 'FRIENDS',
		description: 'Only people you have accepted as friends can see your status.'
	},
	{
		label: 'Nobody',
		value: 'NOBODY',
		description: 'Your online status and last seen time stay private.'
	},
]

function isPresencePolicy(value: string): value is PresencePolicy {
	return presenceOptions.some(option => option.value === value)
}

async function handlePresencePolicyChange(value: unknown) {
	if (typeof value !== 'string') return
	if (!isPresencePolicy(value) || value === presencePolicy.value) return

	try {
		await savePresencePolicy(value)
		toast.add({
			title: 'privacy settings updated',
			icon: 'lucide:check',
			color: 'success'
		})
	} catch (error) {
		console.error('Failed to update privacy settings:', error)
		toast.add({
			title: 'could not update privacy settings',
			description: 'Please try again in a moment.',
			icon: 'lucide:x',
			color: 'error'
		})
	}
}

onMounted(loadPresencePolicy)
</script>

<template>
	<SettingsPage>
		<div class="max-w-3xl flex flex-col gap-5 sm:gap-8 pb-6 sm:pb-8">
			<header class="flex flex-col gap-2 sm:gap-3">
				<h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">Privacy settings</h1>
				<p class="text-muted">choose what you share with other people on Chattr</p>
			</header>

			<section class="flex flex-col gap-3">
				<div>
					<h2 class="text-lg font-medium">Presence</h2>
					<p class="text-sm text-muted mt-1">Control who can see when you are online or recently active.</p>
				</div>

				<UPageCard variant="subtle" class="rounded-2xl">
					<div class="flex items-start gap-3">
						<div class="flex items-center justify-center size-9 shrink-0 rounded-lg bg-primary/15 text-primary">
							<UIcon name="lucide:activity" class="size-4.5" />
						</div>
						<div class="min-w-0 flex-1">
							<h3 class="font-medium">Who can see your online status?</h3>
							<p class="text-sm text-muted mt-1">This also controls visibility of your last seen time.</p>

							<USkeleton v-if="isLoading" class="h-20 w-full mt-5 rounded-xl" />
							<URadioGroup
								v-else
								:model-value="presencePolicy"
								:items="presenceOptions"
								:disabled="isSaving"
								class="mt-5"
								@update:model-value="handlePresencePolicyChange"
							/>

							<UAlert
								v-if="loadError"
								class="mt-5"
								color="warning"
								variant="subtle"
								icon="lucide:triangle-alert"
								title="We could not load your current setting."
								description="The default visibility is shown until you reload the page."
							/>
						</div>
					</div>
				</UPageCard>
			</section>

			<section class="flex flex-col gap-3">
				<div>
					<h2 class="text-lg font-medium">Password</h2>
					<p class="text-sm text-muted mt-1">Change the password you use to sign in to Chattr.</p>
				</div>

				<SettingsPasswordForm />
			</section>

			<UAlert
				color="neutral"
				variant="subtle"
				icon="lucide:lock-keyhole"
				title="Your privacy choices apply immediately."
				description="You can come back here at any time to change who can see your presence."
			/>
		</div>
	</SettingsPage>
</template>
