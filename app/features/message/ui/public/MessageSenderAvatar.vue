<script setup lang="ts">
import type { UserId, ChatId } from '@shared/types';
import { useProfileStore, useProfileOverlay } from '@features/profile';
import { PresenceAvatar } from '@features/user';
import { useCachedData } from '@shared/composables';
import { getProfileAssetUrl } from '@features/profile';
import { useMessage } from '../../composables/useMessage';

const props = defineProps<{ senderId: UserId, userId: UserId, chatId: ChatId}>()

const supabaseUser = useSupabaseUser()
const profileOverlay = useProfileOverlay()
const { userProfile } = storeToRefs(useProfileStore())
const { getSenderProfile } = useMessage(props.chatId)

const currentUserId = computed(() => userProfile.value?.user_id || supabaseUser.value?.id)

const { data: senderProfile } = useCachedData(
	`message-avatar-${props.chatId}-${props.senderId}`,
	async () => {
    if (props.senderId === props.userId && userProfile.value) {
			return userProfile.value
		}

		try {
			return await getSenderProfile(props.senderId)
		} catch(error) {
			console.error(error)
			return null
		}
	},
	{
		watch: [currentUserId, userProfile],
	}
)

const avatarUrl = computed(() => getProfileAssetUrl(senderProfile.value?.avatar_url))

function openSenderProfile() {
	if (!senderProfile.value) return
	profileOverlay.open({ userProfile: senderProfile.value })
}

</script>

<template >
  <template v-if="senderProfile">
    <UTooltip
      :text="senderProfile.nickname || senderProfile.username"
      :content="{ side: 'bottom' }"
    >
      <UButton
        variant="ghost"
        color="neutral"
        class="rounded-full p-0 aspect-square cursor-pointer shrink-0"
        :aria-label="`open ${senderProfile.nickname || senderProfile.username}'s profile`"
        @click="openSenderProfile"
      >
        <PresenceAvatar
          :key="senderProfile.id"
          :user-id="senderProfile.user_id"
        >
          <UAvatar
            :src="avatarUrl"
            :alt="senderProfile.nickname"
            size="md"
            class="size-7 sm:size-8"
          />
        </PresenceAvatar>
      </UButton>
    </UTooltip>
  </template>
  <USkeleton v-else class="size-7 sm:size-8 rounded-full"/>
</template>
