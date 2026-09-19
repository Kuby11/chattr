import type { Ref } from 'vue'

type UseMessageScrollOptions = {
	scrollContainer: Ref<HTMLElement | null>
	hasMore: Ref<boolean>
	loadingMore: Ref<boolean>
	loadMore: () => Promise<unknown>
	onScrollUpdate: () => void
}

export function useMessageScroll(options: UseMessageScrollOptions) {
	const { scrollContainer, hasMore, loadingMore, loadMore, onScrollUpdate } = options

	const isNearBottom = ref(true)
	const unseenCount = ref(0)
	const isFetchingMore = ref(false)

	const showJumpToBottom = computed(() => unseenCount.value > 0)

	const transitionName = computed(() => {
		if (isFetchingMore.value || loadingMore.value) return ''
		return 'message-bubble'
	})

	const jumpBottomButtonStyle = computed(() => {
		return `
			absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 transition-all ease-out
			rounded-full bg-elevated/90 backdrop-blur-xl border border-accented/50 shadow-md text-muted 
			hover:text-primary cursor-pointer ${showJumpToBottom.value ? 'bottom-19 opacity-100' : 'bottom-10 opacity-0'}
		`
	})

	const checkNearBottom = (threshold = 100) => {
		const el = scrollContainer.value
		if (!el) return true
		return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
	}

	const scrollToBottom = (smooth = true) => {
		const el = scrollContainer.value
		if (!el) return

		el.scrollTo({
			top: el.scrollHeight,
			behavior: smooth ? "smooth" : "auto",
		})

		isNearBottom.value = true
		unseenCount.value = 0
	}

	const handleGifLoaded = () => {
		const el = scrollContainer.value
		if (!el) return
		if (checkNearBottom(350)) {
			scrollToBottom(true)
		}
		nextTick(onScrollUpdate)
	}

	async function handleScroll() {
		const el = scrollContainer.value
		if (!el) return

		isNearBottom.value = checkNearBottom()

		if (isNearBottom.value) {
			unseenCount.value = 0
		}

		if (el.scrollTop < 150 && hasMore.value && !loadingMore.value && !isFetchingMore.value) {
			isFetchingMore.value = true
			const prevScrollHeight = el.scrollHeight
			const prevScrollTop = el.scrollTop

			await loadMore()
			await nextTick()

			const newScrollHeight = el.scrollHeight
			el.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight)

			await nextTick()
			isFetchingMore.value = false
		}

		onScrollUpdate()
	}

	return {
		isNearBottom,
		unseenCount,
		showJumpToBottom,
		isFetchingMore,
		transitionName,
		jumpBottomButtonStyle,
		checkNearBottom,
		scrollToBottom,
		handleScroll,
		handleGifLoaded,
	}
}