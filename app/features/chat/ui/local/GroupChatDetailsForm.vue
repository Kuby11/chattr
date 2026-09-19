<script setup lang="ts">
const name = defineModel<string>('name', { default: '' })
const description = defineModel<string>('description', { default: '' })
</script>

<template>
	<div class="flex flex-col gap-4">
		<UFormField
			label="Group Name"
			name="name"
			required
			:help="`${name.length}/30 characters (min. 2)`"
		>
			<UInput
				v-model="name"
				maxlength="30"
				placeholder="Enter group name"
				icon="lucide:users"
				class="w-full"
			/>
		</UFormField>

		<UFormField
			label="Group Description"
			name="description"
			:help="`${description.length}/150 characters`"
		>
			<UTextarea
				v-model="description"
				maxlength="150"
				placeholder="Describe what this group is about..."
				:rows="3"
				:ui="{ base: 'resize-none', root: 'w-full' }"
			/>
		</UFormField>
	</div>
</template>