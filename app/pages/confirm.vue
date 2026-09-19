<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useAuth } from '@features/auth'
import z from 'zod'
import { ROUTE_TOKENS } from '~/shared/configs'
import { useSubmit } from '@shared/composables'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

useHead({
	title: 'confirm | Chattr'
})

const auth = useAuth()
const submitHandler = useSubmit()
const route = useRoute()

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
			:disabled="submitHandler.isSubmitting.value"
			:loading="submitHandler.isSubmitting.value"
			:schema="schema"
			:fields="fields"
			title="enter a verification code to continue!"
			icon="i-lucide-user"
			@submit="submitHandler.handleSubmit(onSubmit($event))"
		>
			<template #validation>
				<UAlert
					v-if="submitHandler.serverError.value"
					color="error"
					icon="i-lucide-info"
					:title="submitHandler.serverError.value!"
				/>
			</template>
		</UAuthForm>
	</UPageCard>
</template>
