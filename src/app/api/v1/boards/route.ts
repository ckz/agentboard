import { NextRequest, NextResponse } from "next/server";
import { BoardService } from "@/lib/services/board.service";
import { authenticateRequest } from "@/lib/auth/token";
import { auth } from "@/lib/auth/config";
import { badRequest, unauthorized, internalError } from "@/lib/utils/errors";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/v1/boards — List boards
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await resolveOrgId(request);
    if (!orgId) return unauthorized();

    const result = await BoardService.list(orgId);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("GET /api/v1/boards error:", error);
    return internalError();
  }
}

/**
 * POST /api/v1/boards — Create board
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await resolveOrgId(request);
    if (!orgId) return unauthorized();

    const body = await request.json();
    if (!body.name) return badRequest("name is required");

    const board = await BoardService.create(body, orgId);
    return NextResponse.json({ data: board }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/boards error:", error);
    return internalError();
  }
}

async function resolveOrgId(request: NextRequest): Promise<string | null> {
  const tokenAuth = await authenticateRequest(request);
  if (tokenAuth) return tokenAuth.orgId;

  const session = await auth();
  if (session?.user?.id) {
    const [user] = await db
      .select({ orgId: users.orgId })
      .from(users)
      .where(eq(users.id, (session.user as any).id))
      .limit(1);
    if (user?.orgId) return user.orgId;
  }
  return null;
}
