import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "../types/task";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddClick: (status: TaskStatus) => void;
  onEditClick: (task: Task) => void;
}

// ステータスごとの表示ラベルと色（プロトタイプの配色を踏襲）
const COLUMN_STYLE: Record<
  TaskStatus,
  { label: string; labelColor: string; countColor: string }
> = {
  todo: {
    label: "未着手",
    labelColor: "text-blue-700",
    countColor: "bg-blue-100 text-blue-700",
  },
  in_progress: {
    label: "進行中",
    labelColor: "text-amber-700",
    countColor: "bg-yellow-200 text-amber-800",
  },
  done: {
    label: "完了",
    labelColor: "text-green-800",
    countColor: "bg-green-200 text-green-800",
  },
};

export function Column({ status, tasks, onAddClick, onEditClick }: ColumnProps) {
  const style = COLUMN_STYLE[status];

  // 並び順は親（board）が管理するので、ここでは渡された順序をそのまま使う
  const sortedTasks = tasks;

  // このカラム自体を「カードをドロップできる場所」として登録する（idはstatus）
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className="flex w-75 min-w-75 flex-shrink-0 flex-col rounded-xl bg-slate-200 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`text-sm font-bold tracking-wide ${style.labelColor}`}>
          {style.label}
        </span>
        <span
          className={`min-w-6 rounded-xl px-2 py-0.5 text-center text-xs font-bold ${style.countColor}`}
        >
          {sortedTasks.length}
        </span>
      </div>
      {/* カラム内のタスク一覧を「並び替え可能なグループ」として登録する。
          id=status を付けることで、各カードが「どのカラムの子か」を衝突判定から辿れるようにする */}
      <SortableContext
        id={status}
        items={sortedTasks.map((task) => task.id)}
        strategy={rectSortingStrategy}
      >
        <div className="flex min-h-20 flex-col gap-2.5">
          {sortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} onEditClick={onEditClick} />
          ))}
        </div>
      </SortableContext>
      {status !== "done" && (
        <button
          type="button"
          onClick={() => onAddClick(status)}
          className="mt-2 w-full rounded-lg border border-dashed border-gray-300 p-2.5 text-sm text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
        >
          ＋ 追加
        </button>
      )}
    </div>
  );
}
