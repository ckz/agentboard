export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AgentInfo {
  tokenId: string;
  name: string;
  agentType: string | null;
  orgId: string;
  scopes: string[];
}
