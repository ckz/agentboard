import { db } from "@/lib/db";
import { apiTokens } from "@/lib/db/schema";
import { hashToken } from "@/lib/utils/crypto";
import { eq, and, or, isNull, gt } from "drizzle-orm";

export interface TokenAuthResult {
  valid: boolean;
  tokenId?: string;
  userId?: string;
  orgId?: string;
  scopes?: string[];
  agentType?: string | null;
  error?: string;
}

/**
 * Validate an API token from the Authorization header.
 * Returns token metadata if valid, or an error message.
 */
export async function validateApiToken(
  authHeader: string | null
): Promise<TokenAuthResult> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid Authorization header" };
  }

  const rawToken = authHeader.slice(7);
  const tokenHash = hashToken(rawToken);

  const [token] = await db
    .select()
    .from(apiTokens)
    .where(eq(apiTokens.tokenHash, tokenHash))
    .limit(1);

  if (!token) {
    return { valid: false, error: "Token not found" };
  }

  // Check expiration
  if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
    return { valid: false, error: "Token has expired" };
  }

  // Update last used timestamp
  await db
    .update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, token.id));

  return {
    valid: true,
    tokenId: token.id,
    userId: token.userId || undefined,
    orgId: token.orgId || undefined,
    scopes: token.scopes || ["read", "write"],
    agentType: token.agentType,
  };
}

/**
 * Extract actor info from request — supports both session and token auth.
 */
export async function authenticateRequest(
  request: Request
): Promise<
  | { type: "user"; userId: string; orgId: string }
  | { type: "agent"; tokenId: string; userId?: string; orgId: string; scopes: string[]; agentType?: string | null }
  | null
> {
  // Try API token first
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const result = await validateApiToken(authHeader);
    if (result.valid && result.orgId) {
      return {
        type: "agent",
        tokenId: result.tokenId!,
        userId: result.userId,
        orgId: result.orgId,
        scopes: result.scopes!,
        agentType: result.agentType,
      };
    }
  }

  // TODO: Try NextAuth session (cookie-based) for browser requests
  // This will be handled by the auth() function in route handlers

  return null;
}
