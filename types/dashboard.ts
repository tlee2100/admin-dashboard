export interface SiteStats {
  total: number;
  status: {
    pending: number;
    completed: number;
    failed: number;
  };
}

export interface DocumentStats {
  total: number;
  status: {
    pending: number;
    processing: number;
    ready: number;
    failed: number;
  };
}

export interface UserStats {
  total: number;
  roles: {
    admin: number;
    agent: number;
  };
}

export interface MessageTrendItem {
  label: string;
  count: number;
}

export interface DocumentTypeBreakdownItem {
  name: string;
  count: number;
}

export interface ChatStats {
  totalConversations: number;
  avgResponseTime: string;
  messagesTrend: MessageTrendItem[];
  documentTypeBreakdown: DocumentTypeBreakdownItem[];
}

export interface SystemStats {
  backendOnline: boolean;
  websocketConnected: boolean;
  apiVersion: string;
}

export interface DashboardStatsData {
  sites: SiteStats;
  documents: DocumentStats;
  users: UserStats;
  chat: ChatStats;
  system: SystemStats;
}
