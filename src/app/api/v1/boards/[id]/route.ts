import { NextRequest, NextResponse } from "next/server";
import { BoardService } from "@/lib/services/board.service";
import { authenticateRequest } from "@/lib/auth/token";
import { auth } from "@/lib/auth/config";
import { notFound, unauthorized, internalError } from "@/lib/utils/errors";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/v1/boards/:id — Get board with columns and tasks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await resolveOrgId(request);
    if (!orgId) return unauthorized();

    const { id } = await params;
    const board = await BoardService.getById(id, orgId);
    if (!board) return notFound();

    return NextResponse.json({ data: board });
  } catch (error) {
    console.error("GET /api/v1/boards/[id] error:", error);
    return internalError();
  }
}

/**
 * DELETE /api/v1/boards/:id — Delete board
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await resolveOrgId(request);
    if (!orgId) return unauthorized();

    const { id } = await params;
    const board = await BoardService.delete(id, orgId);
    if (!board) return notFound();

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("DELETE /api/v1/boards/[id] error:", error);
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
