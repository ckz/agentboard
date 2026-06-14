"use client";

import Link from "next/link";
import type { Task } from "@/types/task";

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "", color: "" },
  1: { label: "Low", color: "text-slate-400" },
  2: { label: "Medium", color: "text-yellow-400" },
  3: { label: "High", color: "text-orange-400" },
  4: { label: "Urgent", color: "text-red-400" },
};

interface TaskCardProps {
  task: Task;
  onDragStart: () => void;
}

export function TaskCard({ task, onDragStart }: TaskCardProps) {
  const priority = PRIORITY_LABELS[task.priority || 0];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group cursor-grab rounded-lg border border-slate-800 bg-slate-800/50 p-3 transition hover:border-slate-600 active:cursor-grabbing"
    >
      <Link href={`/tasks/${task.id}`} className="block">
        <h4 className="text-sm font-medium text-white line-clamp-2">
          {task.title}
        </h4>

        {task.description && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {priority.label && (
            <span className={`text-xs font-medium ${priority.color}`}>
              {priority.label}
            </span>
          )}

          {task.labels?.map((label) => (
            <span
              key={label}
              className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300"
            >
              {label}
            </span>
          ))}

          {task.assigneeType === "agent" && (
            <span className="rounded bg-purple-600/20 px-1.5 py-0.5 text-xs text-purple-400">
              Agent
            </span>
          )}

          {task.linearId && (
            <span className="rounded bg-violet-600/20 px-1.5 py-0.5 text-xs text-violet-400">
              Linear
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
