import type { Ref } from 'vue'
import type { ClientMessage } from '../types/clientMessage'

export type GroupRunAvatar = {
	senderId: string
	firstId: string
	lastId: string
	top: number
	visible: boolean
}

type UseGroupRunAvatarsOptions = {
	chatMessages: () => ClientMessage[] | undefined
	isGroupChat: () => boolean
	currentUserId: () => string | undefined
	scrollContainer: Ref<HTMLElement | null>
	form: Ref<{ $el: HTMLElement } | null>
}

export function useGroupRunAvatars(options: UseGroupRunAvatarsOptions) {
	const { chatMessages, isGroupChat, currentUserId, scrollContainer, form } = options

	const runs = ref<GroupRunAvatar[]>([])
	const elementRefs = new Map<string, HTMLElement>()

	function setElementRef(key: string) {
		return (el: unknown) => {
			if (el) elementRefs.set(key, el as HTMLElement)
			else elementRefs.delete(key)
		}
	}

	function build() {
		const messages = chatMessages() ?? []
		const next: GroupRunAvatar[] = []
		let open: GroupRunAvatar | null = null

		for (const message of messages) {
			const isCandidate = isGroupChat()
				&& message.type !== 'INFO'
				&& message.sender_id !== currentUserId()

			if (isCandidate && open && open.senderId === message.sender_id) {
				open.lastId = message.id!
				continue
			}

			if (isCandidate) {
				open = { senderId: message.sender_id, firstId: message.id!, lastId: message.id!, top: 0, visible: false }
				next.push(open)
			} else {
				open = null
			}
		}

		runs.value = next
	}

	function update() {
		const container = scrollContainer.value
		if (!container) return

		for (const run of runs.value) {
			const firstEl = document.getElementById(`message-${run.firstId}`)
			const lastEl = document.getElementById(`message-${run.lastId}`)

			if (!firstEl || !lastEl) {
				run.visible = false
				continue
			}

			const firstTop = firstEl.offsetTop
			const lastBottom = lastEl.offsetTop + lastEl.offsetHeight
			const avatarEl = elementRefs.get(run.firstId)
			const avatarHeight = avatarEl?.offsetHeight || (window.innerWidth >= 640 ? 32 : 28)

			const scrollTop = container.scrollTop
			const viewportBottom = scrollTop + container.clientHeight
			const formEl = form.value?.$el as HTMLElement | undefined
			const formHeight = formEl?.offsetHeight || 56
			const visibleBottom = viewportBottom - formHeight

			const attachedTop = lastBottom - avatarHeight
			const pinnedTop = visibleBottom - avatarHeight
			const firstElBottom = firstTop + firstEl.offsetHeight
			const ridingFirst = firstElBottom >= visibleBottom

			run.top = attachedTop >= scrollTop && lastBottom <= visibleBottom
				? attachedTop
				: ridingFirst
					? firstElBottom - avatarHeight
					: pinnedTop
			run.visible = firstTop <= viewportBottom && lastBottom >= scrollTop
		}
	}

	return { runs, setElementRef, build, update }
}
