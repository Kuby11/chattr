<script setup lang="ts">
import type { Tables } from '@shared/types';
import { useBreakpoint } from '@shared/composables';
import ProfileContent from './ProfileContent.vue';

defineProps<{ userProfile: Tables<'user_profiles'> }>()
const open = defineModel<boolean>('open', { default: false })

const breakpoints = useBreakpoint()

</script>

<template>
	<UDrawer
		v-if="breakpoints.xs"
		v-model:open="open"
		should-scale-background
		set-background-color-on-scale
		:ui="{ 
			overlay: 'z-[60]', 
			content: 'z-[61] min-h-130', 
			handle: 'mb-2' 
		}"
	>
    <template #content>
      <ProfileContent :user-profile="$props.userProfile"/>
    </template>
  </UDrawer>

	<UModal
		v-else
		v-model:open="open"
		:ui="{ overlay: 'z-[60]', content: 'z-[61] max-w-2xl not-xs:p-0 h-[clamp(25rem,85vh,50rem)]' }"
	>
		<template #content>
			<ProfileContent :user-profile="$props.userProfile"/>
		</template>
	</UModal>
</template>
