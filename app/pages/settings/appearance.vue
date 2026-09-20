<script setup lang="ts">
import { SettingsPage } from '@features/settings'
import { useCurrentRoute } from '@shared/composables'

definePageMeta({
	middleware: 'auth',
	layout: 'main'
})

useHead({
	title: 'Appearance settings | Chattr'
})

const { setCurrentRoute } = useCurrentRoute()
setCurrentRoute({
	route: 'settings/appearance',
	icon: 'lucide:palette'
})

const appConfig = useAppConfig()
const colorMode = useColorMode()

const storageKey = 'chattr-primary'

const primaryColors = [
	{ name: 'green', hex: '#22c55e' },
	{ name: 'emerald', hex: '#10b981' },
	{ name: 'teal', hex: '#14b8a6' },
	{ name: 'cyan', hex: '#06b6d4' },
	{ name: 'sky', hex: '#0ea5e9' },
	{ name: 'blue', hex: '#3b82f6' },
	{ name: 'indigo', hex: '#6366f1' },
	{ name: 'violet', hex: '#8b5cf6' },
	{ name: 'purple', hex: '#a855f7' },
	{ name: 'fuchsia', hex: '#d946ef' },
	{ name: 'pink', hex: '#ec4899' },
	{ name: 'rose', hex: '#f43f5e' },
	{ name: 'red', hex: '#ef4444' },
	{ name: 'orange', hex: '#f97316' },
	{ name: 'amber', hex: '#f59e0b' },
	{ name: 'lime', hex: '#84cc16' },
] as const

const activePrimary = ref<string>(appConfig.ui.colors.primary)

if (import.meta.client) {
	const stored = localStorage.getItem(storageKey)
	if (stored && stored !== appConfig.ui.colors.primary) {
		appConfig.ui.colors.primary = stored
		activePrimary.value = stored
	}
}

function selectPrimaryColor(name: string) {
	appConfig.ui.colors.primary = name
	activePrimary.value = name
	if (import.meta.client) {
		localStorage.setItem(storageKey, name)
	}
}

</script>

<template>
	<SettingsPage>
		<h1 class="text-2xl sm:text-3xl font-semibold">Appearance settings</h1>
		<p class="text-muted mb-6 sm:mb-10">customize the look of your app</p>

		<div class="flex flex-col gap-5 sm:gap-6 max-w-2xl">
			<section>
				<h2 class="text-lg font-medium mb-3">Mode</h2>
				<UPageCard variant="subtle">
					<div class="flex items-center justify-between gap-4">
						<div>
							<p class="font-medium">Dark mode</p>
							<p class="text-sm text-muted">{{ colorMode.value === 'dark' ? 'currently dark' : 'currently light' }}</p>
						</div>
						<UColorModeSwitch />
					</div>
				</UPageCard>
			</section>

			<section>
				<h2 class="text-lg font-medium mb-3">Primary color</h2>
				<UPageCard variant="subtle">
					<div class="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-3">
						<UButton
							v-for="color in primaryColors"
							:key="color.name"
							:aria-label="color.name"
							:style="{ backgroundColor: color.hex }"
							class="size-10 aspect-square rounded-full p-0 flex items-center justify-center"
							:class="[
								activePrimary === color.name && 'ring-2 ring-foreground ring-offset-2 ring-offset-elevated'
							]"
							@click="selectPrimaryColor(color.name)"
						>
							<UIcon
								v-if="activePrimary === color.name"
								name="lucide:check"
								class="size-4 text-white drop-shadow"
							/>
						</UButton>
					</div>
				</UPageCard>
			</section>
		</div>
	</SettingsPage>
</template>
