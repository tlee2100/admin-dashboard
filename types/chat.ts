export type SenderType = "VISITOR" | "AGENT";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: SenderType;
  content: string;
  createdAt: string;
  status?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  reactions?: Record<string, string[]>;
}

export interface Conversation {
  id: string;
  siteId: number;
  status: "OPEN" | "PAUSED" | "CLOSED";
  visitorName: string;
  visitorEmail: string;
  lastActivityAt: string;
  latestMessage?: ChatMessage;
}
