import { IsOptional, IsString, Length } from "class-validator";

export class UpdateProfileDto {
	
	@Length(2, 30)
	@IsString()
	@IsOptional()
	displayName?: string;
	
	@Length(1, 400)
	@IsOptional()
	@IsString()
	bio?: string;
	
	
	@IsOptional()
	avatar?: string;

}
