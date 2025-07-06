import { User, UserRole } from "@prisma";
import { Exclude } from "class-transformer";

export class UserResponse implements User {
  id: string;

  username: string;

  @Exclude()
  password: string;

  email: string;

  role: UserRole;

  @Exclude()
  createdAt: Date;

  updatedAt: Date;

  isBlocked: boolean;

  constructor(user: User) {
		Object.assign(this, user);
	}
}
