import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "bg-slate-600" },
  todo: { label: "Todo", color: "bg-blue-600" },
  in_progress: { label: "In Progress", color: "bg-yellow-600" },
  review: { label: "Review", color: "bg-purple-600" },
  done: { label: "Done", color: "bg-green-600" },
};

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orgId = (session.user as any).orgId;
  if (!orgId) redirect("/boards");

  const allTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.orgId, orgId))
    .orderBy(desc(tasks.createdAt));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">All Tasks</h1>
        <p className="mt-1 text-slate-400">{allTasks.length} tasks total</p>
      </div>

      <div className="rounded-lg border border-slate-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {allTasks.map((task) => {
              const status = STATUS_LABELS[task.status || "backlog"];
              return (
                <tr
                  key={task.id}
                  className="border-b border-slate-800/50 transition hover:bg-slate-900"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-sm font-medium text-white hover:text-blue-400"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs text-white ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {task.priority || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {task.assigneeType === "agent" ? (
                      <span className="rounded bg-purple-600/20 px-2 py-0.5 text-xs text-purple-400">
                        Agent
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Human</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(task.createdAt!).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
