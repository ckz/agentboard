import { SQL, sql } from "drizzle-orm";

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export function parsePagination(params: URLSearchParams): PaginationParams {
  const cursor = params.get("cursor") || undefined;
  const limit = Math.min(
    parseInt(params.get("limit") || String(DEFAULT_LIMIT), 10),
    MAX_LIMIT
  );
  return { cursor, limit };
}

export function decodeCursor(cursor: string): Record<string, string> {
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString());
  } catch {
    return {};
  }
}

export function encodeCursor(data: Record<string, string>): string {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}
