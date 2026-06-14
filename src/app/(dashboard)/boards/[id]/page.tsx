import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { boards, columns, tasks } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { KanbanBoard } from "@/components/board/kanban-board";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orgId = (session.user as any).orgId;
  if (!orgId) redirect("/boards");

  const { id } = await params;

  const [board] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, id), eq(boards.orgId, orgId)))
    .limit(1);

  if (!board) notFound();

  const boardColumns = await db
    .select()
    .from(columns)
    .where(eq(columns.boardId, board.id))
    .orderBy(asc(columns.position));

  const boardTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.boardId, board.id))
    .orderBy(asc(tasks.position));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-white">{board.name}</h1>
          {board.description && (
            <p className="mt-1 text-sm text-slate-400">{board.description}</p>
          )}
        </div>
      </div>
      <KanbanBoard
        boardId={board.id}
        columns={boardColumns}
        initialTasks={boardTasks}
      />
    </div>
  );
}
