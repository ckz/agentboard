import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { apiTokens, users } from "@/lib/db/schema";
import { generateToken } from "@/lib/utils/crypto";
import { unauthorized, badRequest, internalError } from "@/lib/utils/errors";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/v1/auth/token — List user's API tokens
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const userId = (session.user as any).id;
    const tokens = await db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        prefix: apiTokens.prefix,
        scopes: apiTokens.scopes,
        agentType: apiTokens.agentType,
        lastUsedAt: apiTokens.lastUsedAt,
        expiresAt: apiTokens.expiresAt,
        createdAt: apiTokens.createdAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.userId, userId))
      .orderBy(apiTokens.createdAt);

    return NextResponse.json({ data: tokens });
  } catch (error) {
    console.error("GET /api/v1/auth/token error:", error);
    return internalError();
  }
}

/**
 * POST /api/v1/auth/token — Create a new API token
 * Body: { name: string, agentType?: string, scopes?: string[], expiresAt?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const userId = (session.user as any).id;
    const body = await request.json();

    if (!body.name) return badRequest("name is required");

    // Get user's org
    const [user] = await db
      .select({ orgId: users.orgId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.orgId) return badRequest("User has no organization");

    const { raw, hash, prefix } = generateToken();

    const [token] = await db
      .insert(apiTokens)
      .values({
        userId,
        orgId: user.orgId,
        name: body.name,
        tokenHash: hash,
        prefix,
        scopes: body.scopes || ["read", "write"],
        agentType: body.agentType || null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      })
      .returning();

    // Return the raw token ONCE — user must copy it now
    return NextResponse.json({
      data: {
        id: token.id,
        name: token.name,
        token: raw, // shown only once
        prefix: token.prefix,
        scopes: token.scopes,
        agentType: token.agentType,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/auth/token error:", error);
    return internalError();
  }
}

/**
 * DELETE /api/v1/auth/token — Revoke a token
 * Query: ?id=<token-id>
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const userId = (session.user as any).id;
    const tokenId = request.nextUrl.searchParams.get("id");
    if (!tokenId) return badRequest("id is required");

    const [deleted] = await db
      .delete(apiTokens)
      .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, userId)))
      .returning();

    if (!deleted) return badRequest("Token not found or not owned by you");

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("DELETE /api/v1/auth/token error:", error);
    return internalError();
  }
}
