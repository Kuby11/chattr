import type { TablesInsert } from "@shared/types";

export type ChatCreatePayload = Omit<TablesInsert<"chats">, 'id' | 'created_at' | 'updated_at'>

