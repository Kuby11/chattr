<script setup lang="ts">
defineProps<{ class?: string | (undefined | string)[] }>()

</script>

<template>
  <svg :class="['loader-icon',$props.class]" viewBox="25 25 50 50">
    <circle class="circle" r="20" cy="50" cx="50"></circle>
  </svg>
</template>


<style scoped>
@reference "../../assets/css/main.css";

.loader-icon {
	width: 3.25em;
	transform-origin: center;
	animation: rotate 2s linear infinite;
}

.circle {
	fill: none;
	stroke-width: 2;
	stroke-dasharray: 1, 200;
	stroke-dashoffset: 0;
	stroke-linecap: round;
	animation: dash 1.5s ease-in-out infinite;
	@apply stroke-primary;
}

@keyframes rotate {
	100% {
		transform: rotate(360deg);
	}
}

@keyframes dash {
	0% {
		stroke-dasharray: 1, 200;
		stroke-dashoffset: 0;
	}

	50% {
		stroke-dasharray: 90, 200;
		stroke-dashoffset: -35px;
	}

	100% {
		stroke-dashoffset: -125px;
	}
}

</style>
