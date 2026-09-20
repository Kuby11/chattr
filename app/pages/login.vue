<script setup lang="ts">
import type { AuthFormField, AuthFormInputField, FormSubmitEvent } from '@nuxt/ui';
import { useAuth } from '@features/auth'
import { useSubmit } from '~/shared/composables/useSubmit'
import z from 'zod';
import { ROUTE_TOKENS } from '@shared/configs';

definePageMeta({
	layout: "auth",
	middleware: "guest",
})

useHead({
	title: 'Login | Chattr'
})

const auth = useAuth()
const submitHandler = useSubmit()

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string('Password is required').min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

const fields: AuthFormField[] = [
	{
		name: 'email',
		type: 'email',
		label: 'Email',
		placeholder: 'Enter your email',
		required: true
	},
	{
		name: 'password',
		label: 'Password',
		type: 'password',
		placeholder: 'Enter your password',
		required: true
	}
]

async function onSubmit(event: FormSubmitEvent<Schema>) {
	await auth.signIn({
		email: event.data.email,
		password: event.data.password,
		options: {
			redirectTo: ROUTE_TOKENS.HOME
		}
	})
}

</script>

<template>
	<UPageCard class="w-[clamp(20rem,80%,25rem)]">
		<UAuthForm
			:disabled="submitHandler.isSubmitting.value"
			:loading="submitHandler.isSubmitting.value"
			:schema="schema"
			:fields="fields as AuthFormInputField[]"
			title="Welcome back!"
			icon="ix:user-key"
			@submit="submitHandler.handleSubmit(() => onSubmit($event))"
		>
			<template #description>
				<p>
					Don't have an account?
					<ULink :to="ROUTE_TOKENS.REGISTER" class="text-primary font-medium">Sign up.</ULink>
				</p>
			</template>

			<template #password-hint>
				<ULink :to="ROUTE_TOKENS.FORGOT_PASSWORD" class="text-primary font-medium" tabindex="-1">Forgot password?</ULink>
			</template>

			<template #validation>
				<UAlert
					v-if="submitHandler.serverError.value"
					color="error"
					icon="i-lucide-info"
					:title="submitHandler.serverError.value"
				/>
			</template>
		</UAuthForm>
	</UPageCard>
</template>
