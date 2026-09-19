<script setup lang="ts">
import type { FormSubmitEvent, InputProps } from '#ui/types'
import { modifiedUI } from '@shared/utils';

const props = defineProps<InputProps & { searchCallback?: () => void}>()
const searchTerm = defineModel('searchTerm', { type: String ,default: '' })

const route = useRoute()
const router = useRouter()
const inputUi = modifiedUI<InputProps['ui']>({ root: "w-full", base: 'py-3' }, props.ui )

const formState = ref({
	term: searchTerm
})

const onSubmit = async (event: FormSubmitEvent<{ term: string }>) => {
	if(route.query.term === event.data.term || !event.data.term.trim())
		return;

	await router.push({ query: { term: event.data.term } })

	if(props.searchCallback)
		props.searchCallback()
}

</script>

<template>
	<search class="contents">
		<UForm :state="formState" @submit="onSubmit">
			<UInput
				v-bind="$attrs"
				v-model="formState.term"
				:ui="inputUi"
				:variant="$props.variant || 'subtle'"
				icon="lucide:search"
				size="xl"
				placeholder="search"
			/>
		</UForm>
	</search>
</template>
