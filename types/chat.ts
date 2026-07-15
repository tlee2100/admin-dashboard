export type SenderType = "VISITOR" | "AGENT";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: SenderType;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  siteId: number;
  status: "OPEN" | "CLOSED";
  visitorName: string;
  visitorEmail: string;
}
