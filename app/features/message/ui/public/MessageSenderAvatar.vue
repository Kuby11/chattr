<script setup lang="ts">
import type { UserId, ChatId } from '@shared/types';
import { PresenceAvatar } from '@features/user';
import { useCachedData } from '@shared/composables';
import { useFeature } from '@shared/composables';
import { useMessage } from '../../composables/useMessage';

const props = defineProps<{ senderId: UserId, userId?: UserId, chatId: ChatId}>()

const { useProfile, useProfileOverlay, getProfileAssetUrl } = useFeature('profile')
const { useAuth } = useFeature('auth')
const profileOverlay = useProfileOverlay()
const { getCurrentUserProfile, getCurrentUserId: getProfileUserId } = useProfile()
const { getCurrentUserId: getAuthUserId } = useAuth()
const { getSenderProfile } = useMessage(props.chatId)

const currentUserId = computed(() => getProfileUserId() ?? getAuthUserId())

const { data: senderProfile } = useCachedData(
	`message-avatar-${props.chatId}-${props.senderId}`,
	async () => {
		const currentProfile = getCurrentUserProfile()
    if (props.senderId === props.userId && currentProfile) {
			return currentProfile
		}

		try {
			return await getSenderProfile(props.senderId)
		} catch(error) {
			console.error(error)
			return null
		}
	},
	{
		watch: [currentUserId, () => getCurrentUserProfile()],
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
