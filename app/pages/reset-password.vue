<script setup lang="ts">
import { useAuth } from '@features/auth'
import { useRoute } from 'vue-router'
import { ROUTE_TOKENS } from '@shared/configs'


definePageMeta({
  layout: 'auth',
})

useHead({
  title: 'Reset password | Chattr'
})

const auth = useAuth()
const route = useRoute()
const toast = useToast()
const supabaseUser = useSupabaseUser()

const email = ref<string>((route.query.email as string | undefined) ?? '')
const code = ref<string>((route.query.token as string | undefined) ?? '')
const password = ref<string>('')
const confirmPassword = ref<string>('')
const isLoading = ref<boolean>(false)

const hasRecoverySession = computed(() => !!supabaseUser.value)

const passwordsMatch = computed(() => password.value === confirmPassword.value)

async function handleSubmit() {
  if (!password.value) {
    toast.add({
      title: 'Please enter a new password',
      icon: 'lucide:x',
      color: 'error'
    })
    return
  }

  if (!passwordsMatch.value) {
    toast.add({
      title: 'Passwords do not match!',
      icon: 'lucide:x',
      color: 'error'
    })
    return
  }

  isLoading.value = true
  try {
    if (!hasRecoverySession.value) {
      if (!email.value.trim()) {
        toast.add({
          title: 'Please enter your email',
          icon: 'lucide:x',
          color: 'error'
        })
        return
      }

      if (!code.value.trim()) {
        toast.add({
          title: 'Please enter the recovery code from your email',
          icon: 'lucide:x',
          color: 'error'
        })
        return
      }

      await auth.verifyRecoveryOtp({
        email: email.value.trim(),
        token: code.value.trim(),
      })
    }

    await auth.updatePassword(password.value)
    toast.add({
      title: 'Password reset successful! Please sign in again.',
      icon: 'lucide:check',
      color: 'success'
    })
    await auth.signOut()
  } catch (error: unknown) {
    console.error('Password reset error:', error)
    toast.add({
      title: error instanceof Error ? error.message : 'Something went wrong!',
      icon: 'lucide:x',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UPageCard class="w-[clamp(20rem,80%,25rem)]">
    <header class="flex flex-col gap-3 mb-8">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-semibold tracking-tight">Reset password</h1>
      </div>
      <p class="text-muted">
        {{ hasRecoverySession
          ? 'Choose a new password for your account'
          : 'Enter the recovery code from your email and choose a new password' }}
      </p>
    </header>

    <template #description>
      <p>We sent a password reset link to your email</p>
    </template>

    <UForm @submit="handleSubmit">
      <div class="flex flex-col gap-6">
        <template v-if="!hasRecoverySession">
          <UFormField label="Email" name="email">
            <UInput v-model="email" type="email" size="xl" placeholder="user@example.com" />
          </UFormField>

          <UFormField label="Recovery code" name="code">
            <UInput v-model="code" type="text" size="xl" placeholder="Enter the code from your email" />
          </UFormField>
        </template>

        <UFormField label="New password" name="password">
          <UInput v-model="password" type="password" size="xl" placeholder="Enter new password" />
        </UFormField>

        <UFormField label="Confirm new password" name="confirmPassword">
          <UInput v-model="confirmPassword" type="password" size="xl" placeholder="Confirm new password" />
        </UFormField>

        <div v-if="!passwordsMatch" class="text-error text-sm">Passwords do not match</div>

        <div class="flex gap-3 items-center">
          <UButton :disabled="isLoading" size="xl" type="submit">
            Reset password
          </UButton>

          <ULink :to="ROUTE_TOKENS.LOGIN" class="text-primary font-medium text-center h-fit">Sign in</ULink>
        </div>
      </div>
    </UForm>
  </UPageCard>
</template>
