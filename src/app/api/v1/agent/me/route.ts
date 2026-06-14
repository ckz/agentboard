import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/token";
import { unauthorized, badRequest, internalError } from "@/lib/utils/errors";
import { db } from "@/lib/db";
import { apiTokens, tasks } from "@/lib/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { generateToken } from "@/lib/utils/crypto";

/**
 * GET /api/v1/agent/me — Agent self-identification
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth || auth.type !== "agent") return unauthorized();

    const [token] = await db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.id, auth.tokenId))
      .limit(1);

    return NextResponse.json({
      data: {
        tokenId: auth.tokenId,
        name: token?.name || "Unknown Agent",
        agentType: auth.agentType,
        orgId: auth.orgId,
        scopes: auth.scopes,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/agent/me error:", error);
    return internalError();
  }
}

/**
 * POST /api/v1/agent/batch — Batch operations
 * Body: { operations: [{ action: "create"|"update"|"move", ... }] }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth || auth.type !== "agent") return unauthorized();
    if (!auth.scopes.includes("write")) {
      return badRequest("Token requires 'write' scope");
    }

    const body = await request.json();
    const operations = body.operations;
    if (!Array.isArray(operations)) {
      return badRequest("operations must be an array");
    }

    const results = [];
    for (const op of operations.slice(0, 50)) { // max 50 ops per batch
      try {
        if (op.action === "create") {
          const [task] = await db
            .insert(tasks)
            .values({
              orgId: auth.orgId,
              boardId: op.boardId,
              columnId: op.columnId || op.boardId,
              title: op.title,
              description: op.description,
              status: op.status || "backlog",
              priority: op.priority || 0,
              labels: op.labels || [],
              position: op.position || 0,
              createdBy: auth.tokenId,
              createdByType: "agent",
            })
            .returning();
          results.push({ success: true, data: task });
        } else if (op.action === "update" && op.id) {
          const [task] = await db
            .update(tasks)
            .set({ ...op.fields, updatedAt: new Date() })
            .where(and(eq(tasks.id, op.id), eq(tasks.orgId, auth.orgId)))
            .returning();
          results.push({ success: !!task, data: task });
        } else {
          results.push({ success: false, error: "Invalid operation" });
        }
      } catch (opError) {
        results.push({ success: false, error: String(opError) });
      }
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("POST /api/v1/agent/batch error:", error);
    return internalError();
  }
}
