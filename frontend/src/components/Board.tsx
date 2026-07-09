import { useEffect, useState } from "react";
import type { Task, TaskStatus } from "../types/task";
import { fetchTasks, createTask, updateTask } from "../api/taskApi";
import { Column } from "./Column";
import { TaskFormModal } from "./TaskFormModal";

// 表示するカラムの順番
const COLUMN_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

export function Board() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalStatus, setModalStatus] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks()
      .then((data) => setTasks(data))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "不明なエラーが発生しました");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-6 text-gray-500">読み込み中...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-500">エラー: {error}</p>;
  }

  return (
    <div className="flex flex-1 items-start gap-5 overflow-x-auto p-6">
      {COLUMN_ORDER.map((status) => (
        <Column
          key={status}
          status={status}
          tasks={tasks.filter((task) => task.status === status)}
          onAddClick={setModalStatus}
          onEditClick={setEditingTask}
        />
      ))}
      {(modalStatus !== null || editingTask !== null) && (
        <TaskFormModal
          editingTask={editingTask}
          onClose={() => {
            setModalStatus(null);
            setEditingTask(null);
          }}
          onSave={async (input) => {
            if (editingTask) {
              const updated = await updateTask(editingTask.id, input);
              setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
              setEditingTask(null);
            } else if (modalStatus) {
              const newTask = await createTask({ ...input, status: modalStatus });
              setTasks((prev) => [...prev, newTask]);
              setModalStatus(null);
            }
          }}
        />
      )}
    </div>
  );
}
