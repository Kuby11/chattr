export interface Friend {
	friendOf: {
		email: string,
		id: string,
		username: string,
		createdAt: string,
		profile: {
			avatar?: string,
			bio?: string,
			displayName: string
		}
	},
	createdAt: string
}
