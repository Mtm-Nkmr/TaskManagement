import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "../types/task";
import { fetchTasks, createTask, updateTask, updateTaskPosition } from "../api/taskApi";
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

  // 8px以上ポインタを動かしたときだけドラッグ開始とみなす（クリック操作と区別するため）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

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

  // ドロップされた瞬間に、最終的な並びを確定してローカルに反映し、サーバーに保存する。
  // 同一カラム内の並び替えはドラッグ中もSortableContextが自動でなめらかに動かしてくれる。
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overTask = tasks.find((t) => t.id === over.id);
    const overStatus = COLUMN_ORDER.find((s) => s === over.id) ?? overTask?.status;
    if (!overStatus) return;

    let newColumn: Task[];
    if (activeTask.status === overStatus) {
      // 同一カラム内: 位置決めはdnd-kit本体に任せ、arrayMoveで並びを入れ替えるだけ。
      // 移動先カラムの並び（自分自身を含む）
      const column = tasks
        .filter((t) => t.status === overStatus)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const oldIndex = column.findIndex((t) => t.id === activeTask.id);
      // カード上に落ちたらそのカードの位置へ。カラムの余白に落ちたら末尾へ
      const overIndex = overTask ? column.findIndex((t) => t.id === overTask.id) : column.length - 1;
      newColumn = arrayMove(column, oldIndex, overIndex);
    } else {
      // カラム間の移動: 移動先カラム（自分は含まない）の該当位置にactiveを挿入する
      const dest = tasks
        .filter((t) => t.status === overStatus && t.id !== activeTask.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      let insertIndex = dest.length;
      if (overTask) {
        // カードの上に落ちた場合、その上半分なら手前、下半分なら後ろに入れる
        // （これにより一番下のカードの下に落として最下段へ入れられる）
        const overIndex = dest.findIndex((t) => t.id === overTask.id);
        const activeRect = active.rect.current.translated ?? active.rect.current.initial;
        const activeCenterY = (activeRect?.top ?? 0) + (activeRect?.height ?? 0) / 2;
        const overMidY = over.rect.top + over.rect.height / 2;
        insertIndex = activeCenterY > overMidY ? overIndex + 1 : overIndex;
      }
      newColumn = [...dest];
      newColumn.splice(insertIndex, 0, activeTask);
    }

    const newIndex = newColumn.findIndex((c) => c.id === activeTask.id);

    // 先にローカルを最終形にしてから保存する（ドロップ後に跳ねて見えるのを防ぐ）
    setTasks((prev) =>
      prev.map((t) => {
        const i = newColumn.findIndex((c) => c.id === t.id);
        return i === -1 ? t : { ...t, status: overStatus, sortOrder: i };
      }),
    );

    updateTaskPosition(activeTask.id, { status: overStatus, index: newIndex }).catch(() => {
      // 保存に失敗したらサーバーの状態を取り直して巻き戻す
      fetchTasks()
        .then(setTasks)
        .catch(() => {});
      setError("タスクの移動に失敗しました");
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
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
    </DndContext>
  );
}
