"use client";

import { useState } from "react";
import { TaskCard } from "./task-card";
import type { Task } from "@/types/task";
import type { BoardColumn } from "@/types/board";

interface KanbanBoardProps {
  boardId: string;
  columns: BoardColumn[];
  initialTasks: Task[];
}

export function KanbanBoard({ boardId, columns, initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const tasksByColumn = columns.map((col) => ({
    ...col,
    tasks: tasks
      .filter((t) => t.columnId === col.id)
      .sort((a, b) => a.position - b.position),
  }));

  async function handleMoveTask(taskId: string, targetColumnId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, columnId: targetColumnId } : t
      )
    );

    try {
      await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId: targetColumnId }),
      });
    } catch {
      // Revert on error
      setTasks(initialTasks);
    }
  }

  async function handleCreateTask(columnId: string) {
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          boardId,
          columnId,
          status: columns.find((c) => c.id === columnId)?.name.toLowerCase().replace(" ", "_") || "backlog",
        }),
      });
      const { data } = await res.json();
      if (data) {
        setTasks((prev) => [...prev, data]);
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }

    setNewTaskTitle("");
    setShowNewTask(null);
  }

  return (
    <div className="flex flex-1 gap-4 overflow-x-auto p-6">
      {tasksByColumn.map((col) => (
        <div
          key={col.id}
          className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-slate-900"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedTask) {
              handleMoveTask(draggedTask.id, col.id);
              setDraggedTask(null);
            }
          }}
        >
          {/* Column header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: col.color || "#6b7280" }}
              />
              <h3 className="text-sm font-semibold text-white">{col.name}</h3>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
                {col.tasks.length}
              </span>
            </div>
            <button
              onClick={() => setShowNewTask(col.id)}
              className="text-slate-500 hover:text-white"
              title="Add task"
            >
              +
            </button>
          </div>

          {/* Tasks */}
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {col.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDragStart={() => setDraggedTask(task)}
              />
            ))}

            {/* New task form */}
            {showNewTask === col.id && (
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateTask(col.id);
                    if (e.key === "Escape") setShowNewTask(null);
                  }}
                  placeholder="Task title..."
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                  autoFocus
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleCreateTask(col.id)}
                    className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowNewTask(null)}
                    className="rounded px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
