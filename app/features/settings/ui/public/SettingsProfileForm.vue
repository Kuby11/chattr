<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useProfile } from '@features/profile';
import type { Tables } from '@shared/types';
import ImageCropperModal from '@shared/ui/ImageCropperModal.vue';
import { SettingsProfilePreview } from '../..';
import { profileSettingsSchema, type ProfileSettingsSchema } from '../../utils/profileSettingsSchema';

const props = defineProps<{ userProfile: Tables<"user_profiles">}>()

const { updateUserProfile } = useProfile()
const toast = useToast()

const form = useTemplateRef('settingsProfileForm')

const state = reactive<{
	nickname: string
	bio: string | null
	avatar?: File
	avatarPreview?: string
	coverPicture?: File
	coverPreview?: string
}>({
	nickname: props.userProfile.nickname,
	bio: props.userProfile.bio,
	avatar: undefined,
	avatarPreview: props.userProfile.avatar_url || undefined,
	coverPicture: undefined,
	coverPreview: props.userProfile.cover_url || undefined,
})

const isCropperOpen = ref(false)
const cropperMode = ref<'avatar' | 'cover'>('avatar')
const selectedRawImage = ref<File | null>(null)

function revokeBlobUrl(url?: string) {
	if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

function setAvatarPreview(url?: string) {
	if (state.avatarPreview !== url) revokeBlobUrl(state.avatarPreview)
	state.avatarPreview = url
}

function setCoverPreview(url?: string) {
	if (state.coverPreview !== url) revokeBlobUrl(state.coverPreview)
	state.coverPreview = url
}

const cropperFileName = computed(() => {
	if (selectedRawImage.value) {
		const base = selectedRawImage.value.name.replace(/\.[^/.]+$/, '')
		return `${base}.webp`
	}
	return cropperMode.value === 'avatar' ? 'avatar.webp' : 'cover.webp'
})

function onCropped(file: File, previewUrl: string) {
	if (cropperMode.value === 'avatar') {
		state.avatar = file
		setAvatarPreview(previewUrl)
	} else {
		state.coverPicture = file
		setCoverPreview(previewUrl)
	}
}

function onAvatarSelected(file: File) {
	selectedRawImage.value = file
	cropperMode.value = 'avatar'
	isCropperOpen.value = true
}

function onCoverSelected(file: File) {
	selectedRawImage.value = file
	cropperMode.value = 'cover'
	isCropperOpen.value = true
}

const canSubmit = computed(() => {
	if(!props.userProfile || (form.value?.errors && form.value?.errors.length > 0)) 
		return false
	
	if (
		props.userProfile.nickname !== state.nickname || 
		(props.userProfile.bio ?? '') !== (state.bio ?? '') ||
		state.avatar ||
		state.coverPicture
	) {
		return true
	}

	return false
})

const isPending = ref(false)

const onSubmit = async (event: FormSubmitEvent<ProfileSettingsSchema>) => {
	if(!canSubmit.value) return
	
	try {
		isPending.value = true
		await updateUserProfile({
			...event.data,
			avatar: state.avatar,
			coverPicture: state.coverPicture
		})
		
		toast.add({
			title: 'profile updated successfully!',
			icon: 'lucide:check',
			color: 'success'
		})
	} catch (error) {
		console.error('Failed to update profile:', error)
		toast.add({
			title: 'something went wrong!',
			icon: 'lucide:x',
			color: 'error'
		})
	} finally {
		isPending.value = false
	}
}

const cancelChanges = () => {
	state.nickname = props.userProfile.nickname
	state.bio = props.userProfile.bio
	setAvatarPreview(props.userProfile.avatar_url ?? undefined)
	state.avatar = undefined
	setCoverPreview(props.userProfile.cover_url ?? undefined)
	state.coverPicture = undefined
}

watch(
	() => props.userProfile,
	(profile) => {
		if (profile) {
			state.nickname = profile.nickname
			state.bio = profile.bio
			setAvatarPreview(profile.avatar_url ?? undefined)
			state.avatar = undefined
			setCoverPreview(profile.cover_url ?? undefined)
			state.coverPicture = undefined
		}
	}
)

onBeforeUnmount(() => {
	revokeBlobUrl(state.avatarPreview)
	revokeBlobUrl(state.coverPreview)
})

</script>
<template>
	<UForm 
		ref="settingsProfileForm" 
		:schema="profileSettingsSchema"
		:state
		:disabled="isPending"
		:validate-on="['input']"
		:class="[isPending && 'opacity-50 *:pointer-events-none']"
		class="flex flex-col w-full flex-1 relative transition-opacity"
		@submit="onSubmit" 
	>
		<div class="grid grid-cols-1 md:grid-cols-[minmax(0,35rem)_minmax(0,20rem)] gap-5 sm:gap-8 items-start w-full">
			<div class="flex flex-col gap-4 sm:gap-5 md:max-w-140 max-w-full rounded-2xl border border-default bg-elevated p-4 sm:p-7 min-w-0">
				<header class="flex items-center gap-2.5">
					<div class="flex items-center justify-center size-9 rounded-lg bg-primary/15 text-primary">
						<UIcon name="lucide:user-round" class="size-4.5" />
					</div>
					<div>
						<h2 class="text-lg font-semibold leading-tight">Basic info</h2>
						<p class="text-xs text-muted">edit your public profile details</p>
					</div>
				</header>

				<div class="flex flex-col gap-4 sm:gap-6">
					<UFormField label="Nickname" name="nickname" :ui="{ label: 'text-sm font-medium mb-1.5' }">
						<UInput v-model="state.nickname" class="w-full" size="xl" :placeholder="props.userProfile.nickname">
							<template #leading>
								<UIcon name="lucide:at-sign" class="size-5 text-muted" />
							</template>
						</UInput>
					</UFormField>

					<UFormField label="Bio" name="bio" :ui="{ label: 'text-sm font-medium mb-1.5', description: 'text-xs' }" description="tell people a little about yourself">
						<UTextarea 
							v-model="state.bio as string" 
							:ui="{ base: 'resize-none leading-relaxed', root: 'w-full' }" 
							:rows="5"
							size="xl" 
							placeholder="Your biography"
						/> 
					</UFormField>
				</div>
			</div>

			<div class="min-w-0">
				<SettingsProfilePreview
					v-model:form-state="state"
					:profile="props.userProfile"
					@select-avatar="onAvatarSelected"
					@select-cover="onCoverSelected"
				/>
			</div>
		</div>

		<div class="border-default flex xs:justify-end gap-3 border-t sticky z-20 bottom-0 sm:-mx-8 -mx-4 sm:mt-auto mt-6 py-3 px-4 xs:px-8 bg-background/80 backdrop-blur-xl">
			<UButton 
				:disabled="!canSubmit" 
				class="w-full xs:w-auto justify-center" 
				size="xl" 
				color="neutral" 
				variant="outline" 
				icon="lucide:rotate-ccw"
				label="cancel changes" 
				@click="cancelChanges" 
			/>
			<UButton 
				:disabled="!canSubmit" 
				class="w-full xs:w-auto justify-center"
				type="submit" 
				size="xl" 
				icon="lucide:check"
				label="save changes" 
			/>
		</div>
	</UForm>

	<ImageCropperModal
		v-model:open="isCropperOpen"
		:image-source="selectedRawImage"
		:aspect-ratio="cropperMode === 'avatar' ? 1 : 7 / 2"
		:shape="cropperMode === 'avatar' ? 'circle' : 'rect'"
		:title="cropperMode === 'avatar' ? 'Crop Profile Avatar' : 'Crop Profile Cover'"
		:description="cropperMode === 'avatar' ? 'Position and zoom to crop your avatar' : 'Position and zoom to crop your cover banner (7:2)'"
		:file-name="cropperFileName"
		@crop="onCropped"
	/>
</template>
