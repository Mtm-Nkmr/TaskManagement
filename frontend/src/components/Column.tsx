import type { Task, TaskStatus } from "../types/task";
import { sortByDueDate } from "../utils/sortByDueDate";
import { TaskCard } from "./TaskCard";

interface DragOverInfo {
  taskId: number;
  before: boolean;
}

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  isDueDateSorted: boolean;
  onToggleDueDateSort: (status: TaskStatus) => void;
  onAddClick: (status: TaskStatus) => void;
  onEditClick: (task: Task) => void;
  draggingTaskId: number | null;
  dragOverInfo: DragOverInfo | null;
  dragOverColumn: TaskStatus | null;
  onCardDragStart: (taskId: number) => void;
  onCardDragOver: (taskId: number, before: boolean) => void;
  onCardDrop: (taskId: number) => void;
  onDragEnd: () => void;
  onColumnDragOver: (status: TaskStatus) => void;
  onColumnDrop: (status: TaskStatus) => void;
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

export function Column({
  status,
  tasks,
  isDueDateSorted,
  onToggleDueDateSort,
  onAddClick,
  onEditClick,
  draggingTaskId,
  dragOverInfo,
  dragOverColumn,
  onCardDragStart,
  onCardDragOver,
  onCardDrop,
  onDragEnd,
  onColumnDragOver,
  onColumnDrop,
}: ColumnProps) {
  const style = COLUMN_STYLE[status];

  // 並び順は親（board）が管理するので、通常は渡された順序をそのまま使う。
  // 期限順ソートが有効なときだけ、表示直前に期限順へ並べ替える（boardの中身自体は変えない）
  const sortedTasks = isDueDateSorted ? sortByDueDate(tasks) : tasks;

  return (
    <div
      onDragEnter={(e) => e.preventDefault()}
      onDragOver={(e) => {
        e.preventDefault();
        onColumnDragOver(status);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onColumnDrop(status);
      }}
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
        <button
          type="button"
          onClick={() => onToggleDueDateSort(status)}
          className={`ml-auto rounded-md px-2 py-1 text-xs font-bold transition ${
            isDueDateSorted
              ? "bg-indigo-500 text-white"
              : "bg-white text-gray-500 hover:bg-gray-100"
          }`}
        >
          期限順
        </button>
      </div>
      {/* ハイライトの見た目だけをこのエリアに限定する。
          ドロップ自体は外側のカラムdiv全体（＋追加ボタンより下の余白も含む）で受け付ける */}
      <div
        className={`flex min-h-20 flex-col gap-2.5 rounded-lg transition ${
          dragOverColumn === status && !dragOverInfo
            ? "bg-[#dce3ea] outline outline-2 outline-dashed outline-[#90cdf4]"
            : ""
        }`}
      >
        {sortedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEditClick={onEditClick}
            isDragging={draggingTaskId === task.id}
            dropIndicator={
              dragOverInfo?.taskId === task.id ? (dragOverInfo.before ? "before" : "after") : null
            }
            onDragStart={() => onCardDragStart(task.id)}
            onDragEnd={onDragEnd}
            onCardDragOver={(before) => onCardDragOver(task.id, before)}
            onCardDrop={() => onCardDrop(task.id)}
          />
        ))}
      </div>
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
