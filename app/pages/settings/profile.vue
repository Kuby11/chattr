<script setup lang="ts">
import { useProfileStore } from '@features/profile';
import { SettingsPage, SettingsProfileForm } from '@features/settings';
import { useCurrentRoute } from '@shared/composables';

definePageMeta({
	middleware: 'auth',
	layout: 'main'
})

useHead({
	title: 'Profile settings | Chattr'
})

const userStore = useProfileStore()
const { setCurrentRoute } = useCurrentRoute()

setCurrentRoute({
	route: 'settings/profile',
	icon: 'lucide:circle-user'
})

</script>

<template>
	<Suspense>
		<SettingsPage class="relative">
			<header class="flex flex-col gap-3 mb-8">
				<div class="flex items-center gap-3">
					<h1 class="text-3xl font-semibold tracking-tight">Profile settings</h1>
				</div>
				<p class="text-muted">change how others see you on chattr</p>
			</header>

			<div class="flex flex-col gap-8 flex-1">
				<SettingsProfileForm
					v-if="userStore.userProfile"
					:user-profile="userStore.userProfile"
				/>
				<USkeleton v-else class="max-w-200 h-181"/>
			</div>
		</SettingsPage>

		<template #fallback>
			loading...
		</template>
	</Suspense>
</template>
