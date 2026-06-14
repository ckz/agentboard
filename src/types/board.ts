export interface Board {
  id: string;
  orgId: string | null;
  name: string;
  description: string | null;
  isDefault: boolean | null;
  createdAt: Date | null;
}

export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  position: number;
  color: string | null;
  wipLimit: number | null;
}

export interface BoardWithColumns extends Board {
  columns: BoardColumn[];
}

export interface CreateBoardInput {
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface CreateColumnInput {
  name: string;
  position: number;
  color?: string;
  wipLimit?: number;
}
