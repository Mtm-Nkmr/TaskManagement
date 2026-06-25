import type { Task } from "../types/task";

// 全タスクを取得する。
// /api はViteのproxy設定によりバックエンド(http://localhost:8080)へ転送される。
export async function fetchTasks(): Promise<Task[]> {
  const response = await fetch("/api/tasks");
  if (!response.ok) {
    throw new Error(`タスクの取得に失敗しました (status: ${response.status})`);
  }
  return response.json();
}
