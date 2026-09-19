<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import z from 'zod';
import { useFriendshipStore } from '@features/friendship';
import { useProfile } from '@features/profile';
import { useChat } from '../../composables/useChat';

const toast = useToast()
const { createChat } = useChat()
const friendshipStore = useFriendshipStore()
const { findUserProfiles } = useProfile()

const schema = z.object({
	chatName: z
		.string('chat name is required!')
		.min(2, 'chat name must be longer than a 2 characters!')
		.max(30, 'chat name must be shorter than a 30 characters!'),
	chatDescription: z
		.string('chat description must be a string!')
		.max(100, 'chat description must be shorter than a 100 characters!')
		.nullable()
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
	chatName: '',
	chatDescription: null
})

const isPending = ref(false)
const selectedFriendIds = ref<string[]>([])
const friendSearchQuery = ref('')
const friendIds = computed(() => friendshipStore.friends.map(friend => friend.friendId))

const { data: friendProfiles, pending: friendsPending } = useLazyAsyncData(
	'chat-create-friends',
	() => findUserProfiles(friendIds.value),
	{
		watch: [friendIds],
		default: () => [],
	}
)

const filteredFriendProfiles = computed(() => {
	const query = friendSearchQuery.value.trim().toLowerCase()
	if (!query) return friendProfiles.value ?? []

	return (friendProfiles.value ?? []).filter(friend =>
		friend.nickname.toLowerCase().includes(query)
		|| friend.username.toLowerCase().includes(query)
	)
})

const selectedFriends = computed(() =>
	(friendProfiles.value ?? []).filter(friend => selectedFriendIds.value.includes(friend.user_id))
)

function isFriendSelected(friendId: string) {
	return selectedFriendIds.value.includes(friendId)
}

function toggleFriendSelection(friendId: string, isSelected: boolean) {
	if (isSelected) {
		if (!selectedFriendIds.value.includes(friendId))
			selectedFriendIds.value = [...selectedFriendIds.value, friendId]
		return
	}

	selectedFriendIds.value = selectedFriendIds.value.filter(id => id !== friendId)
}

function clearSelection() {
	selectedFriendIds.value = []
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
	try {
		isPending.value = true
		await createChat({
			type: 'GROUP',
			name: event.data.chatName,
			description: event.data.chatDescription,
			avatar_url: null,
			cover_url: null,
		}, selectedFriendIds.value)

		toast.add({
			color: 'success',
			title: 'successfully created chat!',
			description: 'invite some people to communicate!'
		})
	} catch {
		toast.add({
			color: 'error',
			title: 'something went wrong when creating chat!'
		})
	} finally {
		isPending.value = false
	}
}

</script>

<template>
	<UForm
		:state
		:schema
		:disabled="isPending"
		class="flex flex-col gap-4 lg:h-auto lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:grid-rows-[auto_auto] lg:gap-8"
		@submit="onSubmit"
	>
		<div class="order-1 shrink-0 lg:order-0 lg:col-start-2 lg:row-start-1">
			<div class="overflow-hidden rounded-xl border border-default bg-elevated/40 shadow-sm">
				<div class="relative h-20 bg-linear-to-r from-primary/30 via-primary/15 to-primary/5">
					<span class="absolute bottom-2 right-3 text-xs font-medium text-dimmed">group preview</span>
				</div>

				<div class="relative flex items-end justify-between px-4 pt-0 pb-2">
					<div class="-mt-10 flex -space-x-3">
						<div
							class="flex size-11 items-center justify-center rounded-full bg-primary ring-4 ring-bg"
						>
							<UIcon name="lucide:users-round" class="size-5 text-inverted" />
						</div>
					</div>

					<span class="text-xs text-dimmed">
						{{ selectedFriends.length }} member{{ selectedFriends.length === 1 ? '' : 's' }}
					</span>
				</div>

				<div class="-mt-1 px-4 pb-4">
					<h3 class="text-lg font-semibold tracking-tight text-default">
						{{ state.chatName.trim() || 'Group Name' }}
					</h3>
					<p class="mt-1 line-clamp-2 text-xs text-dimmed">
						{{ state.chatDescription?.trim() || 'No description provided' }}
					</p>
				</div>
			</div>
		</div>

		<div class="order-3 flex w-full flex-col gap-3 lg:order-0 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:w-auto">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-default">Add friends</span>
				<div v-if="selectedFriendIds.length" class="flex items-center gap-2">
					<span class="text-xs text-primary">{{ selectedFriendIds.length }} selected</span>
					<UButton
						type="button"
						size="xs"
						color="neutral"
						variant="ghost"
						label="clear"
						@click="clearSelection"
					/>
				</div>
			</div>

			<UInput
				v-model="friendSearchQuery"
				icon="lucide:search"
				placeholder="search friends"
				class="w-full"
			/>

			<div class="h-64 space-y-2 overflow-y-auto rounded-lg p-1 scrollbar-none lg:h-auto lg:flex-1">
				<template v-if="friendsPending">
					<USkeleton v-for="index in 6" :key="index" class="h-12 w-full" />
				</template>

				<template v-else-if="filteredFriendProfiles.length">
					<button
						v-for="friend in filteredFriendProfiles"
						:key="friend.user_id"
						type="button"
						:disabled="isPending"
						class="flex w-full items-center gap-3 rounded-lg p-2 text-left transition duration-150"
						:class="isFriendSelected(friend.user_id)
							? 'bg-primary/10 ring-1 ring-primary'
							: 'hover:bg-elevated/60'"
						@click="toggleFriendSelection(friend.user_id, !isFriendSelected(friend.user_id))"
					>
						<UAvatar
							:src="friend.avatar_url ?? ''"
							:alt="friend.nickname"
							:name="friend.nickname"
							size="md"
						/>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{{ friend.nickname }}</p>
							<p class="truncate text-xs text-dimmed">@{{ friend.username }}</p>
						</div>
						<UIcon
							:name="isFriendSelected(friend.user_id) ? 'lucide:check-circle-2' : 'lucide:circle'"
							class="size-5 shrink-0"
							:class="isFriendSelected(friend.user_id) ? 'text-primary' : 'text-dimmed'"
						/>
					</button>
				</template>

				<p v-else-if="friendProfiles?.length" class="p-2 text-sm text-dimmed">no friends found</p>
				<div v-else class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-default p-6 text-center">
					<UIcon name="lucide:user-plus" class="size-8 text-dimmed" />
					<p class="text-sm text-dimmed">no friends to add yet</p>
				</div>
			</div>
		</div>

		<div class="order-2 flex w-full min-w-0 flex-col gap-4 lg:order-0 lg:col-start-2 lg:row-start-2">
			<UFormField
				label="chat name"
				name="chatName"
				:help="`${state.chatName.length}/30 characters`"
			>
				<UInput
					v-model="state.chatName"
					required
					icon="lucide:type"
					placeholder="name your group"
					class="w-full"
				/>
			</UFormField>

			<UFormField
				label="chat description"
				name="chatDescription"
				:help="`${state.chatDescription?.length ?? 0}/100 characters`"
			>
				<UTextarea
					v-model="state.chatDescription as string"
					:rows="4"
					placeholder="what is this group about?"
					:ui="{ base: 'resize-none!', root: 'w-full' }"
				/>
			</UFormField>

			<UButton
				:disabled="isPending"
				:loading="isPending"
				class="w-full justify-center"
				size="lg"
				color="primary"
				icon="lucide:users-round"
				label="Create group"
				type="submit"
			/>
		</div>
	</UForm>
</template>
