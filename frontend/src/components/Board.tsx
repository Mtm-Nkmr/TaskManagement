import { useEffect, useState } from "react";
import type { Task, TaskStatus } from "../types/task";
import { fetchTasks, createTask, updateTask, updateTaskPosition } from "../api/taskApi";
import { sortByDueDate } from "../utils/sortByDueDate";
import { Column } from "./Column";
import { TaskFormModal } from "./TaskFormModal";

// 表示するカラムの順番
const COLUMN_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

// カラムごとにタスクを小分けにした状態の型（例: { todo: [...], in_progress: [...], done: [...] }）
type Board = Record<TaskStatus, Task[]>;

// ドラッグ中にホバーしているカードと、その前/後どちらに挿入するか
interface DragOverInfo {
  taskId: number;
  before: boolean;
}

// APIから来る平らなタスク配列を、カラムごとの入れ子（board）に変換する。
// 各カラムの中は sortOrder の昇順で並べる（以降は配列の並び順そのものを正とする）
function groupTasks(tasks: Task[]): Board {
  const board: Board = { todo: [], in_progress: [], done: [] };
  for (const task of tasks) {
    board[task.status].push(task);
  }
  for (const status of COLUMN_ORDER) {
    board[status].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return board;
}

export function Board() {
  const [board, setBoard] = useState<Board>({ todo: [], in_progress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalStatus, setModalStatus] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  // カラムごとに「今、期限順で表示中かどうか」を覚えておく（boardの中身自体は常に手動順のまま）
  const [dueDateSorted, setDueDateSorted] = useState<Record<TaskStatus, boolean>>({
    todo: false,
    in_progress: false,
    done: false,
  });

  // ドラッグ中のカードID
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  // ドラッグ中にホバーしているカードと、その前/後どちらに挿入するか
  const [dragOverInfo, setDragOverInfo] = useState<DragOverInfo | null>(null);
  // ドラッグ中にホバーしているカラム（カードの上ではなく空き領域）
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  useEffect(() => {
    fetchTasks()
      .then((data) => setBoard(groupTasks(data)))
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

  function clearDragState() {
    setDraggingTaskId(null);
    setDragOverInfo(null);
    setDragOverColumn(null);
  }

  function handleCardDragStart(taskId: number) {
    setDraggingTaskId(taskId);
  }

  function handleCardDragOver(taskId: number, before: boolean) {
    setDragOverColumn(null);
    setDragOverInfo({ taskId, before });
  }

  function handleColumnDragOver(status: TaskStatus) {
    setDragOverColumn(status);
  }

  function handleCardDrop(status: TaskStatus, targetTaskId: number) {
    applyReorder(status, targetTaskId, dragOverInfo?.before ?? true);
    clearDragState();
  }

  function handleColumnDrop(status: TaskStatus) {
    applyReorder(status, null, false);
    clearDragState();
  }

  // ドロップされた瞬間に、最終的な並びを確定する（カラムをまたぐ移動もここで一緒に扱う）。
  // 移動先カラムが期限順表示中なら、その"見えている並び"を基準に挿入位置を決める。
  function applyReorder(status: TaskStatus, targetTaskId: number | null, before: boolean) {
    if (draggingTaskId === null) return;
    const fromStatus = COLUMN_ORDER.find((s) => board[s].some((t) => t.id === draggingTaskId));
    if (!fromStatus) return;

    const dragging = board[fromStatus].find((t) => t.id === draggingTaskId);
    if (!dragging) return;

    const isDestSorted = dueDateSorted[status];
    const destSource = isDestSorted ? sortByDueDate(board[status]) : board[status];
    const dest = destSource.filter((t) => t.id !== draggingTaskId);
    let insertIndex: number;
    if (targetTaskId === null) {
      insertIndex = dest.length;
    } else {
      const targetIndex = dest.findIndex((t) => t.id === targetTaskId);
      insertIndex = before ? targetIndex : targetIndex + 1;
    }

    const movedTask = { ...dragging, status };
    const newDest = [...dest];
    newDest.splice(insertIndex, 0, movedTask);

    setBoard((prev) => ({
      ...prev,
      ...(fromStatus !== status && { [fromStatus]: prev[fromStatus].filter((t) => t.id !== draggingTaskId) }),
      [status]: newDest,
    }));
    // 移動元・移動先とも手動で並びが変わったので、期限順ソートは解除する
    setDueDateSorted((prev) => ({ ...prev, [status]: false, [fromStatus]: false }));

    if (isDestSorted) {
      // 期限順表示から手動順に切り替わるので、今見えていた並び全体をDBへ焼き付ける
      // （バックエンドは1回の呼び出しにつき1枚しか位置を更新できないため、順番に呼ぶ）
      persistColumnOrder(newDest);
    } else {
      persistPosition(dragging.id, status, insertIndex);
    }
  }

  // カラム全体の並びをDBへ焼き付ける（期限順表示から手動順へ切り替わるときに使う）
  async function persistColumnOrder(orderedTasks: Task[]) {
    try {
      for (let i = 0; i < orderedTasks.length; i++) {
        await updateTaskPosition(orderedTasks[i].id, { status: orderedTasks[i].status, index: i });
      }
    } catch {
      fetchTasks()
        .then((data) => setBoard(groupTasks(data)))
        .catch(() => {});
      setError("タスクの移動に失敗しました");
    }
  }

  // サーバーに位置を保存する。失敗したらサーバーの状態を取り直して巻き戻す
  function persistPosition(id: number, status: TaskStatus, index: number) {
    updateTaskPosition(id, { status, index }).catch(() => {
      fetchTasks()
        .then((data) => setBoard(groupTasks(data)))
        .catch(() => {});
      setError("タスクの移動に失敗しました");
    });
  }

  return (
    <div className="flex flex-1 items-start gap-5 overflow-x-auto p-6">
      {COLUMN_ORDER.map((status) => (
        <Column
          key={status}
          status={status}
          tasks={board[status]}
          isDueDateSorted={dueDateSorted[status]}
          onToggleDueDateSort={(s) => setDueDateSorted((prev) => ({ ...prev, [s]: !prev[s] }))}
          onAddClick={setModalStatus}
          onEditClick={setEditingTask}
          draggingTaskId={draggingTaskId}
          dragOverInfo={dragOverInfo}
          dragOverColumn={dragOverColumn}
          onCardDragStart={handleCardDragStart}
          onCardDragOver={handleCardDragOver}
          onCardDrop={(taskId) => handleCardDrop(status, taskId)}
          onDragEnd={clearDragState}
          onColumnDragOver={handleColumnDragOver}
          onColumnDrop={handleColumnDrop}
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
              setBoard((prev) => ({
                ...prev,
                [updated.status]: prev[updated.status].map((t) =>
                  t.id === updated.id ? updated : t,
                ),
              }));
              setEditingTask(null);
            } else if (modalStatus) {
              const newTask = await createTask({ ...input, status: modalStatus });
              setBoard((prev) => ({
                ...prev,
                [newTask.status]: [...prev[newTask.status], newTask],
              }));
              setModalStatus(null);
            }
          }}
        />
      )}
    </div>
  );
}
