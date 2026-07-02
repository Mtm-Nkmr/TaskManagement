// タスクのステータス（カンバンの3カラムに対応）
export type TaskStatus = "todo" | "in_progress" | "done";

// バックエンドの Task エンティティに対応する型
// （GET /api/tasks のレスポンス1件の形）
export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  dueDate: string | null; // "YYYY-MM-DD" 形式、期限なしは null
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// POST /api/tasks のリクエストボディに対応する型
export interface CreateTaskInput {
  title: string;
  status: TaskStatus;
  dueDate: string | null;
}
