import type { Tables } from "~/shared/types/database.types";

export type ProfileUpdatePayload = Partial<
	Omit<
		Tables<"user_profiles">, 
		'id' | 'email' | 'username' | 'user_id' | 'created_at' | 'avatar_url' | 'cover_url'
	> 
	& { avatar: File, coverPicture: File}
>