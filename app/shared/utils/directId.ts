const DIRECT_ID_SEPARATOR = "__"

function normalizeUserId(userId: string): string {
	return userId.trim().toLowerCase()
}

export function buildDirectId(userIdA: string, userIdB: string): string {
	const [first, second] = [normalizeUserId(userIdA), normalizeUserId(userIdB)].sort()

	if (!first || !second) {
		throw new Error("Both user ids are required to build a direct chat id")
	}

	if (first === second) {
		throw new Error("Cannot build a direct chat id with yourself")
	}

	return `${first}${DIRECT_ID_SEPARATOR}${second}`
}

export function isDirectId(chatId: string): boolean {
	const parts = chatId.split(DIRECT_ID_SEPARATOR)
	return parts.length === 2 && parts.every(part => part.trim().length > 0)
}

export function parseDirectId(chatId: string): [string, string] | null {
	if (!isDirectId(chatId)) return null

	const [first, second] = chatId.split(DIRECT_ID_SEPARATOR) as [string, string]
	const normalized: [string, string] = [normalizeUserId(first), normalizeUserId(second)]

	if (!normalized[0] || !normalized[1]) return null

	return normalized
}

export function getDirectIdOtherUserId(chatId: string, currentUserId: string): string | null {
	const members = parseDirectId(chatId)
	if (!members) return null

	const current = normalizeUserId(currentUserId)
	if (current !== members[0] && current !== members[1]) return null

	return current === members[0] ? members[1] : members[0]
}
