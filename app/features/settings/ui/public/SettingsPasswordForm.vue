<script setup lang="ts">
import { useAuth } from '@features/auth'

const { updatePassword } = useAuth()
const toast = useToast()

const newPassword = ref('')
const confirmPassword = ref('')
const isSaving = ref(false)
const showPassword = ref(false)

const passwordsMatch = computed(() => newPassword.value === confirmPassword.value)
const isValid = computed(() =>
	newPassword.value.length >= 8
	&& confirmPassword.value.length >= 8
	&& passwordsMatch.value,
)

async function handleSubmit() {
	if (newPassword.value.length < 8 || confirmPassword.value.length < 8) {
		toast.add({
			title: 'Password must be at least 8 characters long',
			icon: 'lucide:x',
			color: 'error',
		})
		return
	}

	if (!passwordsMatch.value) {
		toast.add({
			title: 'Passwords do not match!',
			icon: 'lucide:x',
			color: 'error',
		})
		return
	}

	isSaving.value = true
	try {
		await updatePassword(newPassword.value)
		newPassword.value = ''
		confirmPassword.value = ''
		toast.add({
			title: 'Password changed successfully',
			icon: 'lucide:check',
			color: 'success',
		})
	} catch (error) {
		console.error('Failed to change password:', error)
		toast.add({
			title: error instanceof Error ? error.message : 'Could not change password',
			icon: 'lucide:x',
			color: 'error',
		})
	} finally {
		isSaving.value = false
	}
}
</script>

<template>
	<UPageCard variant="subtle" class="rounded-2xl">
		<div class="flex items-start gap-3">
			<div class="flex items-center justify-center size-9 shrink-0 rounded-lg bg-primary/15 text-primary">
				<UIcon name="lucide:key-round" class="size-4.5" />
			</div>
			<div class="min-w-0 flex-1">
				<h3 class="font-medium">Change your password</h3>
				<p class="text-sm text-muted mt-1">Use at least 8 characters. You will stay signed in on this device.</p>

				<UForm class="mt-5 flex flex-col gap-4" @submit="handleSubmit">
					<UFormField label="New password" name="newPassword">
						<UInput
							v-model="newPassword"
							:type="showPassword ? 'text' : 'password'"
							size="xl"
							class="w-full"
							placeholder="Enter new password"
							:disabled="isSaving"
						>
							<template #trailing>
								<UButton
									variant="link"
									color="neutral"
									:icon="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
									:aria-label="showPassword ? 'Hide passwords' : 'Show passwords'"
									:disabled="isSaving"
									@click="showPassword = !showPassword"
								/>
							</template>
						</UInput>
					</UFormField>

					<UFormField label="Confirm new password" name="confirmPassword">
						<UInput
							v-model="confirmPassword"
							:type="showPassword ? 'text' : 'password'"
							size="xl"
							class="w-full"
							placeholder="Confirm new password"
							:disabled="isSaving"
						>
							<template #trailing>
								<UButton
									variant="link"
									color="neutral"
									:icon="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
									:aria-label="showPassword ? 'Hide passwords' : 'Show passwords'"
									:disabled="isSaving"
									@click="showPassword = !showPassword"
								/>
							</template>
						</UInput>
					</UFormField>

					<p v-if="!passwordsMatch && confirmPassword" class="text-sm text-error">
						Passwords do not match
					</p>

					<div>
						<UButton
							type="submit"
							size="lg"
							icon="lucide:check"
							label="Change password"
							:loading="isSaving"
							:disabled="!isValid || isSaving"
						/>
					</div>
				</UForm>
			</div>
		</div>
	</UPageCard>
</template>
