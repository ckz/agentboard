import { db } from "@/lib/db";
import { boards, columns } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { CreateBoardInput, CreateColumnInput } from "@/types/board";

export class BoardService {
  /**
   * List all boards for an org.
   */
  static async list(orgId: string) {
    return db
      .select()
      .from(boards)
      .where(eq(boards.orgId, orgId))
      .orderBy(boards.createdAt);
  }

  /**
   * Get a board with its columns.
   */
  static async getById(boardId: string, orgId: string) {
    const [board] = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.orgId, orgId)))
      .limit(1);

    if (!board) return null;

    const cols = await db
      .select()
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .orderBy(asc(columns.position));

    return { ...board, columns: cols };
  }

  /**
   * Create a new board with default columns.
   */
  static async create(input: CreateBoardInput, orgId: string) {
    const [board] = await db
      .insert(boards)
      .values({
        orgId,
        name: input.name,
        description: input.description,
        isDefault: input.isDefault || false,
      })
      .returning();

    // Create default columns
    const defaultColumns = [
      { name: "Backlog", position: 0, color: "#6b7280" },
      { name: "Todo", position: 1, color: "#3b82f6" },
      { name: "In Progress", position: 2, color: "#f59e0b" },
      { name: "Review", position: 3, color: "#8b5cf6" },
      { name: "Done", position: 4, color: "#10b981" },
    ];

    await db.insert(columns).values(
      defaultColumns.map((col) => ({
        boardId: board.id,
        ...col,
      }))
    );

    return this.getById(board.id, orgId);
  }

  /**
   * Add a column to a board.
   */
  static async addColumn(boardId: string, input: CreateColumnInput, orgId: string) {
    // Verify board belongs to org
    const board = await this.getById(boardId, orgId);
    if (!board) return null;

    const [col] = await db
      .insert(columns)
      .values({
        boardId,
        name: input.name,
        position: input.position,
        color: input.color,
        wipLimit: input.wipLimit,
      })
      .returning();

    return col;
  }

  /**
   * Delete a board and its columns.
   */
  static async delete(boardId: string, orgId: string) {
    const [deleted] = await db
      .delete(boards)
      .where(and(eq(boards.id, boardId), eq(boards.orgId, orgId)))
      .returning();
    return deleted;
  }
}
