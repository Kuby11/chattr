import { User } from "@prisma";
import { IsOptional, IsString, Length } from "class-validator";

export class ProfileDto {
	
	@Length(2, 30)
	@IsString()
	displayName: string;
	
	@Length(1, 400)
	@IsOptional()
	@IsString()
	bio?: string;
	
	
	@IsOptional()
	avatar?: string;

	user: User
}
