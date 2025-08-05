import { User, UserRole } from "../user"

export interface Room {
	id: string
	clientId: string
	chatName?: string
	isGroup: boolean
	members: Member[]
	createdAt: string
}

export interface Member {
	id: string
	userId: string
	chatId: string
	user: User
	role: UserRole
}
