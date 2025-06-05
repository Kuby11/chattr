import { MaxLength, IsEmail, IsString, Length } from "class-validator";

export class LoginDto {
	@Length(3, 20)
  @IsString()
	username?: string;
	
	@MaxLength(254)
  @IsEmail()
	@IsString()
  email?: string;

  @Length(8, 50)
  @IsString()
  password: string;	
}
