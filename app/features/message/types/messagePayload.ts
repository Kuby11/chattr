import type { TablesInsert } from "@shared/types";

export type MessagePayload = Omit<
	TablesInsert<'messages'>,
	'id' | 'sender_id' | 'sent_at' | 'updated_at' | 'deleted_at' | 'pinned_at' | 'seen_at'
>
