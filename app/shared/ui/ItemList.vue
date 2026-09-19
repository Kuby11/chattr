<script setup lang="ts" generic="T">

withDefaults(defineProps<{
	class?: string,
	data: T[],
	itemKey: (key: T, index: number) => string | number,
	loading?: boolean,
	ui?: {
		empty?: string,
		loading?: string,
		item?: string
	}
}>(), { loading: false })

</script>

<template>
	<slot
		v-if="$props.data.length === 0"
		:class="ui?.empty"
		name="empty"
	>
		<p :class="['mx-auto py-2', ui?.empty]">no result</p>
	</slot>

	<slot
		v-else-if="$props.loading"
		:class="ui?.loading"
		name="loading"
	>
		<AppLoader :class="['mx-auto', ui?.loading]"/>
	</slot>

	<UPageList v-else :class="['grid lg:grid-cols-2 gap-2',$props.class]">
		<slot
			v-for="(itemData, index) in $props.data"
			v-bind="itemData"
			:class="ui?.item"
			:index
			:key="$props.itemKey(itemData, index)"
			name="default"
		/>
	</UPageList>
</template>
