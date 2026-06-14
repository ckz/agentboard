import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  real,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Organizations ──────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  linearTeamId: text("linear_team_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Users ──────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").unique().notNull(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    googleId: text("google_id").unique(),
    orgId: uuid("org_id").references(() => organizations.id),
    role: text("role").default("member"), // owner | admin | member
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_users_org").on(table.orgId)]
);

// ── API Tokens (for AI agents) ─────────────────────────────────

export const apiTokens = pgTable(
  "api_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    orgId: uuid("org_id").references(() => organizations.id),
    name: text("name").notNull(), // "Claude Code Agent", "Codex Bot"
    tokenHash: text("token_hash").unique().notNull(), // SHA-256
    prefix: text("prefix").notNull(), // first 8 chars for display
    scopes: text("scopes").array().default(["read", "write"]),
    agentType: text("agent_type"), // claude-code | codex | custom
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_tokens_hash").on(table.tokenHash),
    index("idx_tokens_org").on(table.orgId),
  ]
);

// ── Boards ─────────────────────────────────────────────────────

export const boards = pgTable(
  "boards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id),
    name: text("name").notNull(),
    description: text("description"),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_boards_org").on(table.orgId)]
);

// ── Columns (board lanes) ──────────────────────────────────────

export const columns = pgTable(
  "columns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boardId: uuid("board_id")
      .references(() => boards.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(), // "Backlog", "In Progress", "Done"
    position: integer("position").notNull(),
    color: text("color"),
    wipLimit: integer("wip_limit"), // work-in-progress limit
  },
  (table) => [index("idx_columns_board").on(table.boardId)]
);

// ── Tasks ──────────────────────────────────────────────────────

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id),
    boardId: uuid("board_id").references(() => boards.id),
    columnId: uuid("column_id").references(() => columns.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").default("backlog"), // backlog | todo | in_progress | review | done
    priority: integer("priority").default(0), // 0=none, 1=low, 2=medium, 3=high, 4=urgent
    assigneeId: uuid("assignee_id").references(() => users.id),
    assigneeType: text("assignee_type").default("human"), // human | agent
    labels: text("labels").array(),
    position: integer("position").notNull(),
    parentId: uuid("parent_id").references((): any => tasks.id), // subtasks
    linearId: text("linear_id"), // Linear issue ID for sync
    linearUrl: text("linear_url"),
    githubPrUrl: text("github_pr_url"),
    estimatedHours: real("estimated_hours"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdBy: uuid("created_by"), // user_id or token_id
    createdByType: text("created_by_type").default("user"), // user | agent
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_tasks_board").on(table.boardId),
    index("idx_tasks_column").on(table.columnId),
    index("idx_tasks_assignee").on(table.assigneeId),
    index("idx_tasks_linear").on(table.linearId),
    index("idx_tasks_status").on(table.status),
    index("idx_tasks_org").on(table.orgId),
  ]
);

// ── Activity (audit trail) ─────────────────────────────────────

export const activity = pgTable(
  "activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").references(() => tasks.id),
    actorId: uuid("actor_id"), // user_id or token_id
    actorType: text("actor_type").notNull(), // user | agent
    action: text("action").notNull(), // created | updated | moved | commented | assigned
    changes: jsonb("changes"), // {field: {old, new}}
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_activity_task").on(table.taskId)]
);

// ── Comments ───────────────────────────────────────────────────

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").references(() => tasks.id),
    authorId: uuid("author_id"),
    authorType: text("author_type").notNull(), // user | agent
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_comments_task").on(table.taskId)]
);

// ── Relations ──────────────────────────────────────────────────

export const organizationRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  boards: many(boards),
  tasks: many(tasks),
  apiTokens: many(apiTokens),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
  assignedTasks: many(tasks),
  apiTokens: many(apiTokens),
}));

export const boardRelations = relations(boards, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [boards.orgId],
    references: [organizations.id],
  }),
  columns: many(columns),
  tasks: many(tasks),
}));

export const columnRelations = relations(columns, ({ one, many }) => ({
  board: one(boards, {
    fields: [columns.boardId],
    references: [boards.id],
  }),
  tasks: many(tasks),
}));

export const taskRelations = relations(tasks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tasks.orgId],
    references: [organizations.id],
  }),
  board: one(boards, {
    fields: [tasks.boardId],
    references: [boards.id],
  }),
  column: one(columns, {
    fields: [tasks.columnId],
    references: [columns.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  parent: one(tasks, {
    fields: [tasks.parentId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  subtasks: many(tasks, { relationName: "subtasks" }),
  activities: many(activity),
  comments: many(comments),
}));

export const activityRelations = relations(activity, ({ one }) => ({
  task: one(tasks, {
    fields: [activity.taskId],
    references: [tasks.id],
  }),
}));

export const commentRelations = relations(comments, ({ one }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
}));

export const apiTokenRelations = relations(apiTokens, ({ one }) => ({
  user: one(users, {
    fields: [apiTokens.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [apiTokens.orgId],
    references: [organizations.id],
  }),
}));
