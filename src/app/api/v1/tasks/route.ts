import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/lib/services/task.service";
import { authenticateRequest } from "@/lib/auth/token";
import { auth } from "@/lib/auth/config";
import { badRequest, unauthorized, internalError } from "@/lib/utils/errors";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/v1/tasks — List tasks
 * Supports: ?boardId=&status=&assigneeId=&limit=&cursor=
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await resolveOrgId(request);
    if (!orgId) return unauthorized();

    const params = request.nextUrl.searchParams;
    const result = await TaskService.list({
      orgId,
      boardId: params.get("boardId") || undefined,
      status: params.get("status") || undefined,
      assigneeId: params.get("assigneeId") || undefined,
      limit: params.get("limit") ? parseInt(params.get("limit")!) : undefined,
      cursor: params.get("cursor") || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/v1/tasks error:", error);
    return internalError();
  }
}

/**
 * POST /api/v1/tasks — Create a task
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await resolveActor(request);
    if (!actor) return unauthorized();

    const body = await request.json();
    if (!body.title || !body.boardId) {
      return badRequest("title and boardId are required");
    }

    const task = await TaskService.create(body, actor);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/v1/tasks error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message || "Internal server error" } },
      { status: 500 }
    );
  }
}

/**
 * Resolve org ID from either API token or session.
 */
async function resolveOrgId(request: NextRequest): Promise<string | null> {
  // Try API token
  const tokenAuth = await authenticateRequest(request);
  if (tokenAuth) return tokenAuth.orgId;

  // Try session
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

/**
 * Resolve actor info from either API token or session.
 */
async function resolveActor(
  request: NextRequest
): Promise<{ id: string; type: "user" | "agent"; orgId: string } | null> {
  // Try API token
  const tokenAuth = await authenticateRequest(request);
  if (tokenAuth && tokenAuth.type === "agent" && tokenAuth.orgId) {
    return {
      id: tokenAuth.tokenId || tokenAuth.userId || "unknown",
      type: "agent",
      orgId: tokenAuth.orgId,
    };
  }

  // Try session
  const session = await auth();
  if (session?.user?.id) {
    const [user] = await db
      .select({ id: users.id, orgId: users.orgId })
      .from(users)
      .where(eq(users.id, (session.user as any).id))
      .limit(1);
    if (user?.orgId) {
      return { id: user.id, type: "user", orgId: user.orgId };
    }
  }

  return null;
}
