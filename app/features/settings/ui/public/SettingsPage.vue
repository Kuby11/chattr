<script setup lang="ts">
import { ROUTE_TOKENS } from '@shared/configs';
import { useBreakpoint } from '@shared/composables';

const { lg } = useBreakpoint()

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
		
		<div class="w-full h-full overflow-y-auto pt-0 px-4 xs:px-6 sm:px-8 lg:pt-8 flex flex-col">
			<div 
				v-if="lg" 
				class="lg:hidden sticky -mx-4 xs:-mx-6 sm:-mx-8 top-0 z-10 bg-background/80 backdrop-blur-xl px-4 xs:px-6 sm:px-8 py-3 sm:py-4 mb-4 sm:mb-6 flex gap-2 border-b border-default"
			>
				<LazyLinkButton
					v-for="route in settingsRoutes"
					:key="route.to"
					:to="route.to"
					:label="route.label"
					:icon="route.icon"
					size="lg"
					class="flex-1 md:flex-none justify-center px-2"
				/>
			</div>
			<slot/>
		</div>
	</div>
</template>
