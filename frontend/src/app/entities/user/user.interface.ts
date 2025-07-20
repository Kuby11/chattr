import { Profile } from "../profile";

export interface User {
	id: string;
	username: string;
	password: string;
	email: string;
	role: UserRole;
	profile?: Profile
	createdAt: Date;
	updatedAt: Date;
	isBlocked: boolean; 
}

export enum UserRole {
	'ADMIN',
	'USER',
}
