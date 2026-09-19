<script setup lang="ts">
import { linkifyText } from '../../utils/linkifyText'
import { isExternalUrl, useExternalLinkConfirm } from '../../composables/useExternalLink'

const props = defineProps<{
	text: string
}>()

const renderedText = computed(() => linkifyText(props.text, 'underline font-semibold'))

const { confirmExternalLink } = useExternalLinkConfirm()

async function onLinkClick(event: MouseEvent) {
	const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a')
	if (!anchor?.href) return

	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
	if (!isExternalUrl(anchor.href)) return

	event.preventDefault()

	const confirmed = await confirmExternalLink(anchor.href)
	if (confirmed) {
		window.open(anchor.href, '_blank', 'noopener,noreferrer')
	}
}

</script>

<template>
  <pre
    class="resize-none font-sans whitespace-pre-wrap wrap-break-word w-full text-[13px] sm:text-sm leading-relaxed"
    @click="onLinkClick"
    v-html="renderedText"
  />
</template>
