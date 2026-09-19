<script setup lang="ts">
import { ROUTE_TOKENS } from '@shared/configs';

const settingsRoutes = [
	{
		label: 'profile',
		to: ROUTE_TOKENS.SETTINGS.PROFILE,
		icon: 'lucide:circle-user'
	},
	{
		label: 'appearance',
		to: ROUTE_TOKENS.SETTINGS.APPEARANCE,
		icon: 'lucide:palette'
	},
	{
		label: 'privacy',
		to: ROUTE_TOKENS.SETTINGS.PRIVACY,
		icon: 'lucide:shield-check'
	},
]

</script>

<template>
	<div class="w-full h-full flex overflow-hidden">
		<div class="hidden lg:flex flex-col gap-2 w-[clamp(16rem,70%,24rem)] border-r border-default p-2">
			<LazyLinkButton
				v-for="route in settingsRoutes"
				:key="route.to"
				:to="route.to"
				:label="route.label"
				:icon="route.icon"
			/>
    </div>
		
		<div class="w-full h-full overflow-y-auto px-4 pt-4 sm:px-8 sm:pt-8 flex flex-col">
			<div class="lg:hidden flex gap-2 overflow-x-auto -mx-4 px-4 pb-4 border-b border-default mb-6">
				<LazyLinkButton
					v-for="route in settingsRoutes"
					:key="route.to"
					:to="route.to"
					:label="route.label"
					:icon="route.icon"
					class="shrink-0"
				/>
			</div>
			<slot/>
		</div>
	</div>
</template>
