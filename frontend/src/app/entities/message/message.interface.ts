import { Profile } from "../profile";
import { User } from "../user";

export interface Message {
	id: string;
	content: string;
	chatId: string;
	senderId: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface MessageData {
	message: Message
	senderData: {
		senderInfo: User
		senderProfile: Profile
	}
}
