<script setup lang="ts">
import type { ButtonProps } from '#ui/types'
import { useAuth } from '../../composables/useAuth';

defineProps<Omit<ButtonProps, 'label' | 'icon'>>()

const auth = useAuth()

</script>

<template >
	<UModal :ui="{ content: 'w-fit' }">
		<UButton v-bind="$props" label="logout" icon="lucide:log-out" />
		<template #content>
			<div class="flex flex-col gap-4 items-center">
				<h2 class="sm:text-xl text-lg whitespace-nowrap">are you sure to logout?</h2>
				<UButton 
					size="sm"
					label="yes!"
					block
					:ui="{ base: 'text-center text-lg', label: 'mx-auto font-medium' }"
					@click="auth.signOut()"
				/>
			</div>
		</template>
	</UModal>
</template>
