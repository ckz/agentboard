import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tasks, activity, comments, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [user] = await db
    .select({ orgId: users.orgId })
    .from(users)
    .where(eq(users.id, (session.user as any).id))
    .limit(1);

  if (!user?.orgId) redirect("/boards");

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.orgId, user.orgId)))
    .limit(1);

  if (!task) notFound();

  const taskActivity = await db
    .select()
    .from(activity)
    .where(eq(activity.taskId, task.id))
    .orderBy(desc(activity.createdAt))
    .limit(20);

  const taskComments = await db
    .select()
    .from(comments)
    .where(eq(comments.taskId, task.id))
    .orderBy(desc(comments.createdAt));

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">{task.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300">
              {task.status}
            </span>
            {(task.priority ?? 0) > 0 && (
              <span className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300">
                Priority: {task.priority}
              </span>
            )}
            {task.assigneeType === "agent" && (
              <span className="rounded bg-purple-600/20 px-2 py-1 text-xs text-purple-400">
                Agent Task
              </span>
            )}
            {task.linearId && (
              <a
                href={task.linearUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-violet-600/20 px-2 py-1 text-xs text-violet-400 hover:underline"
              >
                Linear: {task.linearId}
              </a>
            )}
            {task.githubPrUrl && (
              <a
                href={task.githubPrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-green-600/20 px-2 py-1 text-xs text-green-400 hover:underline"
              >
                GitHub PR
              </a>
            )}
          </div>
        </div>

        {task.description && (
          <div className="mb-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-400">Description</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-300">
              {task.description}
            </p>
          </div>
        )}

        {/* Comments */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold text-slate-400">
            Comments ({taskComments.length})
          </h2>
          <div className="space-y-3">
            {taskComments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border border-slate-800 bg-slate-900 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    {comment.authorType === "agent" ? "Agent" : "User"}
                  </span>
                  <span className="text-xs text-slate-600">
                    {new Date(comment.createdAt!).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{comment.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-slate-400">Activity</h2>
          <div className="space-y-2">
            {taskActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 text-xs text-slate-500"
              >
                <span className="text-slate-600">
                  {new Date(entry.createdAt!).toLocaleString()}
                </span>
                <span className="text-slate-400">
                  {entry.actorType === "agent" ? "Agent" : "User"}
                </span>
                <span>{entry.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
