<script setup lang="ts">
import { useProfileOverlay } from '@features/profile'
import type { Tables } from '@shared/types'
import SettingsProfileAvatar from './SettingsProfileAvatar.vue'
import SettingsProfileCompactPreview from './SettingsProfileCompactPreview.vue'
import SettingsProfileCover from './SettingsProfileCover.vue'
import SettingsProfileIdentity from './SettingsProfileIdentity.vue'
import type { SettingsProfilePreviewFormState } from '../../types/SettingsProfilePreview.types'

const props = defineProps<{
	profile: Tables<'user_profiles'>
}>()

const emit = defineEmits<{
	selectAvatar: [file: File]
	selectCover: [file: File]
}>()

const formState = defineModel<SettingsProfilePreviewFormState>('formState', { required: true })
const profileOverlay = useProfileOverlay()

const avatarSrc = computed(() => formState.value.avatarPreview ?? props.profile.avatar_url)
const coverSrc = computed(() => formState.value.coverPreview ?? props.profile.cover_url)

function viewFullProfile() {
	profileOverlay.open({ userProfile: props.profile })
}
</script>

<template>
	<div class="flex flex-col w-full">
		<article class="flex flex-col w-full overflow-hidden rounded-2xl border border-default bg-elevated shadow-sm">
			<SettingsProfileCover
				:src="coverSrc"
				@select="emit('selectCover', $event)"
			/>

			<div class="flex flex-col gap-0.5 px-5 pt-1 pb-5 -mt-9">
				<SettingsProfileAvatar
					:src="avatarSrc"
					:alt="formState.nickname"
					@select="emit('selectAvatar', $event)"
				/>

				<SettingsProfileIdentity
					:nickname="formState.nickname"
					:username="props.profile.username"
					:bio="formState.bio"
					@view-profile="viewFullProfile"
				/>
			</div>
		</article>

		<p class="text-xs text-muted mt-3">Avatar & cover images up to 6MB</p>

		<SettingsProfileCompactPreview
			:profile="props.profile"
			:avatar-src="avatarSrc"
			:bio="formState.bio"
		/>
	</div>
</template>
