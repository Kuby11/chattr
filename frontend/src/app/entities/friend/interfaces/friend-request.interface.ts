import { User } from "../../user"

export interface FriendRequest {
	id: string,
	status: REQUEST_STATUS,
	
	senderId: string,
	sender: User

	receiverId: string,
	receiver: User

	createdAt: string,
	updatedAt: string,
}

export type REQUEST_STATUS = "ACCEPTED" | "DECLINED" | "PENDING"
