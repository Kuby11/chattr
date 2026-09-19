<script setup lang="ts">
import type { Tables } from '@shared/types';
import { useHeaderDrawer } from '@shared/composables';

defineProps<{ userProfile: Tables<"user_profiles"> }>()

const headerDrawer = useHeaderDrawer()
const headerDrawerOpen = headerDrawer.isOpen

</script>

<template>
	<UHeader
		v-model:open="headerDrawerOpen"
		:ui="{
			root: 'shrink-0 lg:pl-8',
			container: 'max-w-none! gap-0',
			title: 'text-lg',
			content: 'w-full lg:hidden flex flex-col items-center justify-between px-6 sm:px-8 pb-8',
		}"
		mode="drawer"
		toggle-side="left"
	>
		<template #left>
			<div class="lg:flex hidden items-center gap-2">
				<UIcon name="chattr-logo" class="w-6 h-6 text-foreground"/>
				<h2 class="font-bold text-xl">chattr</h2>
			</div>
		</template>

		<template #content>
			<slot />
		</template>

		<CurrentRoute />

		<template #right>
			<UPopover :ui="{ content: 'sm:p-3 p-2 sm:max-w-md max-w-70' }">
				<UButton 
				variant="ghost"
				color="neutral"
				size="md"
				icon="lucide:info"
				class="p-1"
				/>
				<template #content>
					<h3 class="font-semibold sm:text-lg text-sm mb-2 text-center">this is a demo project!</h3>
					<p class="sm:text-sm text-xs text-center">the project is made just for a demonstrating and is not designed for handling heavy users load. every time the database hits limits all of the data will be reset so it can stay on free plan</p>
				</template>
			</UPopover>
		</template>
	</UHeader>
</template>