export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = 0 | 1 | 2 | 3 | 4;
export type AssigneeType = "human" | "agent";
export type ActorType = "user" | "agent";

export interface Task {
  id: string;
  orgId: string | null;
  boardId: string | null;
  columnId: string | null;
  title: string;
  description: string | null;
  status: string | null;
  priority: number | null;
  assigneeId: string | null;
  assigneeType: string | null;
  labels: string[] | null;
  position: number;
  parentId: string | null;
  linearId: string | null;
  linearUrl: string | null;
  githubPrUrl: string | null;
  estimatedHours: number | null;
  dueDate: Date | null;
  createdBy: string | null;
  createdByType: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  boardId: string;
  columnId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  assigneeType?: AssigneeType;
  labels?: string[];
  parentId?: string;
  estimatedHours?: number;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  assigneeType?: AssigneeType;
  labels?: string[];
  columnId?: string;
  position?: number;
  linearId?: string;
  linearUrl?: string;
  githubPrUrl?: string;
  estimatedHours?: number;
  dueDate?: string;
}

export interface MoveTaskInput {
  columnId: string;
  position: number;
}
