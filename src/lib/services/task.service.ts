import { db } from "@/lib/db";
import { tasks, activity, comments } from "@/lib/db/schema";
import { eq, and, desc, sql, SQL } from "drizzle-orm";
import type { CreateTaskInput, UpdateTaskInput, MoveTaskInput, Task } from "@/types/task";

export class TaskService {
  /**
   * List tasks with optional filters.
   */
  static async list(params: {
    orgId: string;
    boardId?: string;
    status?: string;
    assigneeId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { orgId, boardId, status, assigneeId, limit = 50 } = params;

    const conditions: SQL[] = [eq(tasks.orgId, orgId)];
    if (boardId) conditions.push(eq(tasks.boardId, boardId));
    if (status) conditions.push(eq(tasks.status, status));
    if (assigneeId) conditions.push(eq(tasks.assigneeId, assigneeId));

    const where = and(...conditions);

    const results = await db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(desc(tasks.createdAt))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return { data, nextCursor, hasMore };
  }

  /**
   * Get a single task by ID.
   */
  static async getById(taskId: string, orgId: string) {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.orgId, orgId)))
      .limit(1);

    return task || null;
  }

  /**
   * Create a new task.
   */
  static async create(
    input: CreateTaskInput,
    actor: { id: string; type: "user" | "agent"; orgId: string }
  ) {
    // Get next position in column
    const [maxPos] = await db
      .select({ max: sql<number>`coalesce(max(${tasks.position}), 0)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.boardId, input.boardId),
          input.columnId ? eq(tasks.columnId, input.columnId) : sql`true`
        )
      );

    const [task] = await db
      .insert(tasks)
      .values({
        orgId: actor.orgId,
        boardId: input.boardId,
        columnId: input.columnId || input.boardId, // fallback
        title: input.title,
        description: input.description,
        status: input.status || "backlog",
        priority: input.priority || 0,
        assigneeId: input.assigneeId,
        assigneeType: input.assigneeType || "human",
        labels: input.labels || [],
        position: (maxPos?.max || 0) + 1,
        parentId: input.parentId,
        estimatedHours: input.estimatedHours,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        createdBy: actor.id,
        createdByType: actor.type,
      })
      .returning();

    // Log activity
    await db.insert(activity).values({
      taskId: task.id,
      actorId: actor.id,
      actorType: actor.type,
      action: "created",
      changes: { title: { old: null, new: task.title } },
    });

    return task;
  }

  /**
   * Update a task.
   */
  static async update(
    taskId: string,
    input: UpdateTaskInput,
    actor: { id: string; type: "user" | "agent"; orgId: string }
  ) {
    // Get current state for activity log
    const current = await this.getById(taskId, actor.orgId);
    if (!current) return null;

    const changes: Record<string, { old: unknown; new: unknown }> = {};
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined && (current as any)[key] !== value) {
        changes[key] = { old: (current as any)[key], new: value };
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) return current;

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, taskId), eq(tasks.orgId, actor.orgId)))
      .returning();

    // Log activity
    if (updated) {
      await db.insert(activity).values({
        taskId: updated.id,
        actorId: actor.id,
        actorType: actor.type,
        action: "updated",
        changes,
      });
    }

    return updated;
  }

  /**
   * Move a task to a different column/position.
   */
  static async move(
    taskId: string,
    input: MoveTaskInput,
    actor: { id: string; type: "user" | "agent"; orgId: string }
  ) {
    const current = await this.getById(taskId, actor.orgId);
    if (!current) return null;

    const [updated] = await db
      .update(tasks)
      .set({
        columnId: input.columnId,
        position: input.position,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.orgId, actor.orgId)))
      .returning();

    if (updated) {
      await db.insert(activity).values({
        taskId: updated.id,
        actorId: actor.id,
        actorType: actor.type,
        action: "moved",
        changes: {
          column: { old: current.columnId, new: input.columnId },
          position: { old: current.position, new: input.position },
        },
      });
    }

    return updated;
  }

  /**
   * Delete a task.
   */
  static async delete(taskId: string, orgId: string) {
    const [deleted] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.orgId, orgId)))
      .returning();
    return deleted;
  }

  /**
   * Add a comment to a task.
   */
  static async addComment(
    taskId: string,
    body: string,
    actor: { id: string; type: "user" | "agent" }
  ) {
    const [comment] = await db
      .insert(comments)
      .values({
        taskId,
        authorId: actor.id,
        authorType: actor.type,
        body,
      })
      .returning();

    await db.insert(activity).values({
      taskId,
      actorId: actor.id,
      actorType: actor.type,
      action: "commented",
      changes: { comment: { old: null, new: body } },
    });

    return comment;
  }

  /**
   * Get activity log for a task.
   */
  static async getActivity(taskId: string) {
    return db
      .select()
      .from(activity)
      .where(eq(activity.taskId, taskId))
      .orderBy(desc(activity.createdAt));
  }
}
