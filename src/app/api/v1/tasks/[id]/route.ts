import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/lib/services/task.service";
import { authenticateRequest } from "@/lib/auth/token";
import { auth } from "@/lib/auth/config";
import { notFound, unauthorized, internalError } from "@/lib/utils/errors";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/v1/tasks/:id — Get task detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await resolveOrgId(request);
    if (!orgId) return unauthorized();

    const { id } = await params;
    const task = await TaskService.getById(id, orgId);
    if (!task) return notFound();

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("GET /api/v1/tasks/[id] error:", error);
    return internalError();
  }
}

/**
 * PATCH /api/v1/tasks/:id — Update task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await resolveActor(request);
    if (!actor) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const task = await TaskService.update(id, body, actor);
    if (!task) return notFound();

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("PATCH /api/v1/tasks/[id] error:", error);
    return internalError();
  }
}

/**
 * DELETE /api/v1/tasks/:id — Delete task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await resolveOrgId(request);
    if (!orgId) return unauthorized();

    const { id } = await params;
    const task = await TaskService.delete(id, orgId);
    if (!task) return notFound();

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("DELETE /api/v1/tasks/[id] error:", error);
    return internalError();
  }
}

// Reuse the same resolution helpers
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

async function resolveActor(
  request: NextRequest
): Promise<{ id: string; type: "user" | "agent"; orgId: string } | null> {
  const tokenAuth = await authenticateRequest(request);
  if (tokenAuth && tokenAuth.type === "agent" && tokenAuth.orgId) {
    return { id: tokenAuth.tokenId || tokenAuth.userId || "unknown", type: "agent", orgId: tokenAuth.orgId };
  }

  const session = await auth();
  if (session?.user?.id) {
    const [user] = await db
      .select({ id: users.id, orgId: users.orgId })
      .from(users)
      .where(eq(users.id, (session.user as any).id))
      .limit(1);
    if (user?.orgId) return { id: user.id, type: "user", orgId: user.orgId };
  }
  return null;
}
