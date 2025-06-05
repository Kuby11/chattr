import { Role, User } from "@prisma/client";
import { Exclude } from "class-transformer";

export class UserResponse implements User {
  id: string;

  username: string;

  @Exclude()
  password: string;

  email: string;

  role: Role;

  @Exclude()
  createdAt: Date;

  updatedAt: Date;

  isBlocked: boolean;

  constructor(user: User) {
		Object.assign(this, user);
	}
}
