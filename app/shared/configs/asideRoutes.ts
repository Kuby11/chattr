import { ROUTE_TOKENS } from "./routeTokens"

interface Route {
	icon: string
	route: string
	to: string
}

export const AsideRoutes: Route[] = [
	{
		icon: "fluent:chat-24-filled",
		route: "home",
		to: ROUTE_TOKENS.HOME
	},
	{
		icon: "lucide:users",
		route: "friends",
		to: ROUTE_TOKENS.FRIENDS
	},
	{
		icon: "lucide:search",
		route: "search",
		to: ROUTE_TOKENS.SEARCH
	},
] as const
