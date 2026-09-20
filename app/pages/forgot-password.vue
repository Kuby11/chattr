<script setup lang="ts">
import { useAuth } from '@features/auth'
import { useRouter } from 'vue-router'
import { ROUTE_TOKENS } from '@shared/configs'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

useHead({
  title: 'Forgot password | Chattr'
})

const auth = useAuth()
const router = useRouter()
const toast = useToast()

const email = ref('')
const isLoading = ref(false)

async function handleSubmit() {
  if (!email.value.trim()) {
    toast.add({
      title: 'Please enter your email',
      icon: 'lucide:x',
      color: 'error'
    })
    return
  }

  isLoading.value = true
  try {
    await auth.resetPassword({ email: email.value.trim() })
    toast.add({
      title: 'Password reset link sent to your email!',
      icon: 'lucide:check',
      color: 'success'
    })
    router.push('/')
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
        <h1 class="text-3xl font-semibold tracking-tight">Forgot password</h1>
      </div>
      <p class="text-muted">Enter your email address to receive a password reset link</p>
    </header>

    <template #description>
      <p>If an account with this email exists, we'll send a password reset link</p>
    </template>

    <div class="flex flex-col gap-6">
      <UFormField label="Email" name="email">
        <UInput v-model="email" type="email" size="xl" placeholder="user@example.com" />
      </UFormField>

      <UForm @submit="handleSubmit">
        <div class="flex gap-3 items-center">
          <UButton :disabled="isLoading" size="xl" type="submit">
            Send reset link
          </UButton>

          <ULink :to="ROUTE_TOKENS.LOGIN" class="text-primary font-medium text-center h-fit">Sign in</ULink>
        </div>
      </UForm>
    </div>
  </UPageCard>
</template>
