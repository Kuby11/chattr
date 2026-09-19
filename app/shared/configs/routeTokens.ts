export const ROUTE_TOKENS = {
	HOME: '/',
	LOGIN: '/login',
	REGISTER: '/register',
	CONFIRM: '/confirm',
	SERVER_ERROR: '/server-error',
	FRIENDS: '/friends',
	SEARCH: '/search',
	CHAT: (chatId: string) => `/chat/${chatId}`,
	INVITE: (token: string) => `/invite/${token}`,
	SETTINGS: {
		PROFILE: '/settings/profile',
		APPEARANCE: '/settings/appearance',
		PRIVACY: '/settings/privacy'
	}
} as const
