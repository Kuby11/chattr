<script setup lang="ts">
import type { AuthFormField, AuthFormInputField, FormSubmitEvent } from '@nuxt/ui'
import { useAuth } from '@features/auth'
import { useSubmit } from '@shared/composables'
import { ROUTE_TOKENS } from '@shared/configs'
import z from 'zod'

definePageMeta({
	layout: "auth",
	middleware: "guest",
})

useHead({
	title: 'Register | Chattr'
})

const auth = useAuth()
const submitHandler = useSubmit()

const schema = z.object({
  username: z
    .string("username is required!")
		.min(3, "username should be at least 4 characters long!")
    .max(25, "username can be only 25 characters long!")
		.regex(/^(?=.*[A-Za-z])[A-Za-z0-9_]+$/, 
			"username can only contain latin characters, numbers, underscores and must contain at least 1 latin character!"
		)
    .nonoptional(),
  nickname: z
    .string("nickname is required!")
    .max(30, "nickname can be only 30 characters long!")
    .min(2, "nickname should be at least 4 characters long!")
    .nonoptional(),
  email: z
    .string("email is required!")
    .email('Invalid email'),
  password: z
    .string('Password is required')
    .min(8, 'Must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters')
})

type Schema = z.output<typeof schema>

const fields: AuthFormField[] = [
  {
    name: "username",
    label: "username",
    placeholder: "@user",
    type: "text",
    maxlength: 50,
    minlength: 4,
    required: true,
  },
  {
    name: "nickname",
    label: "nickname",
    placeholder: "user",
    type: "text",
    maxlength: 30,
    minlength: 2,
    required: true,
  },
	{
		name: 'email',
		type: 'email',
		label: 'Email',
		placeholder: 'user@gmail.com',
		required: true
	},
	{
		name: 'password',
		label: 'Password',
		type: 'password',
		placeholder: '*secure password*',
		required: true
	},
	{
		name: 'confirmPassword',
		label: 'Confirm Password',
		type: 'password',
		placeholder: '*confirm password*',
		required: true
	}
]

async function onSubmit(event: FormSubmitEvent<Schema>) {
	if (event.data.password !== event.data.confirmPassword) {
		useToast().add({
			title: 'Passwords do not match!',
			icon: 'lucide:x',
			color: 'error'
		})
		return
	}
	
	const signUp = await auth.signUp({
		email: event.data.email,
		password: event.data.password,
		username: event.data.username,
		nickname: event.data.nickname,
		options: {
			redirectTo: `confirm?email=${event.data.email}`,
		}
	})
	if (signUp.error) throw signUp.error
}

</script>

<template>
	<UPageCard class="w-[clamp(20rem,80%,25rem)]">
		<UAuthForm
			:disabled="submitHandler.isSubmitting.value"
			:loading="submitHandler.isSubmitting.value"
			:schema="schema"
			:fields="fields as AuthFormInputField[]"
			title="Welcome to chattr!"
			icon="ix:user"
			@submit="submitHandler.handleSubmit(onSubmit($event))"
		>
			<template #description>
				Already have an account? <ULink :to="	ROUTE_TOKENS.LOGIN" class="text-primary font-medium">Sign in</ULink>.
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
