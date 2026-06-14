import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { boards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function BoardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orgId = (session.user as any).orgId;
  if (!orgId) redirect("/login");

  const allBoards = await db
    .select()
    .from(boards)
    .where(eq(boards.orgId, orgId));

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Boards</h1>
          <p className="mt-1 text-slate-400">Manage your project boards</p>
        </div>
      </div>

      {allBoards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 p-12 text-center">
          <p className="text-lg text-slate-400">No boards yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Your board will appear here after login.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allBoards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="group rounded-lg border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-600"
            >
              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400">
                {board.name}
              </h3>
              {board.description && (
                <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                  {board.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2">
                {board.isDefault && (
                  <span className="rounded bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400">
                    Default
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  Created {new Date(board.createdAt!).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
