export interface User {
	id: string;
	username: string;
	password: string;
	email: string;
	role: UserRole;
	createdAt: Date;
	updatedAt: Date;
	isBlocked: boolean; 
}

export enum UserRole {
	'ADMIN',
	'USER',
}
