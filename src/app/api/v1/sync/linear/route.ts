import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/token";
import { auth } from "@/lib/auth/config";
import { unauthorized, badRequest, internalError } from "@/lib/utils/errors";
import { LinearService, agentboardToLinearPriority } from "@/lib/integrations/linear";
import { TaskService } from "@/lib/services/task.service";
import { db } from "@/lib/db";
import { tasks, organizations, users } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

/**
 * POST /api/v1/sync/linear — Push tasks to Linear
 * Body: { taskIds?: string[] } — if empty, syncs all tasks with no linearId
 */
export async function POST(request: NextRequest) {
  try {
    const orgId = await resolveOrgId(request);
    if (!orgId) return unauthorized();

    const apiKey = process.env.LINEAR_API_KEY;
    const teamId = process.env.LINEAR_TEAM_ID;
    if (!apiKey || !teamId) {
      return badRequest("Linear integration not configured");
    }

    const linear = new LinearService(apiKey, teamId);
    const body = await request.json().catch(() => ({}));
    const taskIds = body.taskIds as string[] | undefined;

    // Get tasks to sync
    const conditions = [eq(tasks.orgId, orgId)];
    if (taskIds?.length) {
      // Sync specific tasks
    } else {
      // Sync all tasks without a linearId
      conditions.push(isNotNull(tasks.title));
    }

    const tasksToSync = await db
      .select()
      .from(tasks)
      .where(and(...conditions));

    const results = [];
    for (const task of tasksToSync) {
      try {
        if (task.linearId) {
          // Update existing Linear issue
          const stateId = await linear.mapStatusToStateId(task.status || "backlog");
          await linear.updateIssue(task.linearId, {
            title: task.title,
            description: task.description || undefined,
            priority: agentboardToLinearPriority(task.priority || 0),
            stateId,
          });
          results.push({ taskId: task.id, action: "updated", linearId: task.linearId });
        } else {
          // Create new Linear issue
          const issue = await linear.createIssue({
            title: task.title,
            description: task.description,
            priority: task.priority || 0,
            labels: task.labels || [],
          });

          // Update task with Linear info
          await TaskService.update(
            task.id,
            { linearId: issue.id, linearUrl: issue.url },
            { id: "system", type: "agent", orgId }
          );

          results.push({ taskId: task.id, action: "created", linearId: issue.id, linearUrl: issue.url });
        }
      } catch (err) {
        results.push({ taskId: task.id, action: "error", error: String(err) });
      }
    }

    return NextResponse.json({ data: { synced: results.length, results } });
  } catch (error) {
    console.error("POST /api/v1/sync/linear error:", error);
    return internalError();
  }
}

/**
 * GET /api/v1/sync/linear/status — Get sync status
 */
export async function GET(request: NextRequest) {
  try {
    const orgId = await resolveOrgId(request);
    if (!orgId) return unauthorized();

    const allTasks = await db
      .select({ id: tasks.id, linearId: tasks.linearId })
      .from(tasks)
      .where(eq(tasks.orgId, orgId));

    const synced = allTasks.filter((t) => t.linearId).length;
    const unsynced = allTasks.filter((t) => !t.linearId).length;

    return NextResponse.json({
      data: {
        configured: !!(process.env.LINEAR_API_KEY && process.env.LINEAR_TEAM_ID),
        totalTasks: allTasks.length,
        synced,
        unsynced,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/sync/linear/status error:", error);
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
