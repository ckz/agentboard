import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { linearToAgentboardPriority } from "@/lib/integrations/linear";
import { createHmac } from "crypto";

/**
 * POST /api/webhooks/linear — Receive Linear webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify webhook signature
    const signature = request.headers.get("linear-signature");
    const secret = process.env.LINEAR_WEBHOOK_SECRET;
    if (secret && signature) {
      const expected = createHmac("sha256", secret).update(body).digest("hex");
      if (signature !== expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const { action, type, data } = event;

    // Only handle issue events
    if (type === "Issue") {
      if (action === "update") {
        // Find matching task by linearId
        const [task] = await db
          .select()
          .from(tasks)
          .where(eq(tasks.linearId, data.id))
          .limit(1);

        if (task) {
          const updates: Record<string, unknown> = {};

          if (data.title && data.title !== task.title) updates.title = data.title;
          if (data.description !== undefined && data.description !== task.description) {
            updates.description = data.description;
          }
          if (data.priority !== undefined) {
            updates.priority = linearToAgentboardPriority(data.priority);
          }
          // Map Linear state to Agentboard status
          if (data.state?.type) {
            const stateMap: Record<string, string> = {
              backlog: "backlog",
              unstarted: "todo",
              started: "in_progress",
              completed: "done",
              canceled: "done",
            };
            updates.status = stateMap[data.state.type] || task.status;
          }

          if (Object.keys(updates).length > 0) {
            updates.updatedAt = new Date();
            await db.update(tasks).set(updates).where(eq(tasks.id, task.id));
          }
        }
      } else if (action === "create") {
        // Optionally create a task from a new Linear issue
        // For now, we only sync tasks created in Agentboard
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Linear webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
