import type { Tables } from "./database.types";

export type UserId = Tables<"user_profiles">["user_id"]

export type FriendshipId = Tables<"friendships">["id"]

export type ChatId = Tables<"chats">["id"]

export type MessageId = Tables<"messages">["id"]

export type ChatMemberId = Tables<"chat_members">["id"]
