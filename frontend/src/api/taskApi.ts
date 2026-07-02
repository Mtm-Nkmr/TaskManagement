import type { Task, CreateTaskInput } from "../types/task";

// 全タスクを取得する。
// /api はViteのproxy設定によりバックエンド(http://localhost:8080)へ転送される。
export async function fetchTasks(): Promise<Task[]> {
  const response = await fetch("/api/tasks");
  if (!response.ok) {
    throw new Error(`タスクの取得に失敗しました (status: ${response.status})`);
  }
  return response.json();
}

// タスクを新規作成する。
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.errors?.title ?? "タスクの作成に失敗しました");
  }
  return response.json();
}
