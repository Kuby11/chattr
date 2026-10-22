<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useAuth } from '@features/auth'
import z from 'zod'
import { ROUTE_TOKENS } from '~/shared/configs'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

useHead({
	title: 'confirm | Chattr'
})

const auth = useAuth()
const route = useRoute()

const serverError = ref<string | null>(null)
const isSubmitting = ref<boolean>(false)

const handleSubmit = async (submitFn: () => Promise<unknown>) => {
  isSubmitting.value = true
  serverError.value = null

  try {
    await submitFn()
  } catch (error) {
    serverError.value = error instanceof Error ? error.message : String(error)
  } finally {
    isSubmitting.value = false
  }
}

const schema = z.object({
  token: z.array(z.string(), 'please enter a code!').length(8, 'enter a 8 digit code!')
})

type Schema = z.output<typeof schema>

const fields: AuthFormField[] = [
  {
    name: 'token',
    type: 'otp',
    required: true,
    otp: true,
    length: 8,
    placeholder: '○'
  }
]

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  if (!route.query.email) throw new Error('can`t get email!')

	const email = route.query.email?.toString()
	const verificationToken = event.data.token.join('')

	await auth.verifyOtp({
		email,
		token: verificationToken,
		redirectTo: ROUTE_TOKENS.HOME
	})
}

</script>

<template>
	<UPageCard class="w-full max-w-md p-5">
		<UAuthForm
			:ui="{ otp: 'w-full flex justify-between' }"
			:disabled="isSubmitting"
			:loading="isSubmitting"
			:schema="schema"
			:fields="fields"
			title="enter a verification code to continue!"
			icon="i-lucide-user"
			@submit="handleSubmit(() => onSubmit($event))"
		>
			<template #validation>
				<UAlert
					v-if="serverError"
					color="error"
					icon="i-lucide-info"
					:title="serverError"
				/>
			</template>
		</UAuthForm>
	</UPageCard>
</template>
