import { isCuid } from "@paralleldrive/cuid2";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class CreateMessageDto {

	@IsString()
	@Length(1,5000)
	@IsNotEmpty()
	content: string;

	@IsString()
	roomId: string

}
