<script setup lang="ts">
import { useProfileOverlay } from '@features/profile';
import type { Tables } from '@shared/types';

const props = defineProps<{
  forwarderProfile: Tables<"user_profiles">
}>()

const supabaseUser = useSupabaseUser()
const currentUserId = computed(() => supabaseUser.value?.id)
const { open } = useProfileOverlay()

const forwarderUsername = computed(() => {
  const targetId = props.forwarderProfile?.user_id
  if (targetId === currentUserId.value) return 'you'
  return props.forwarderProfile?.username ?? '...'
})

</script>

<template>
  <p class="relative z-200 flex items-center gap-1 text-xs mb-1">
    <span class="opacity-60 flex gap-1">
      <UIcon name="lucide:forward" size="14"/>
      forwarded from 
    </span>
    <span
      class="transition hover:underline cursor-pointer opacity-60 hover:opacity-100"
      @click="open({ userProfile: forwarderProfile! })"
    >
      {{ forwarderUsername }} 
    </span>
  </p>
</template>
