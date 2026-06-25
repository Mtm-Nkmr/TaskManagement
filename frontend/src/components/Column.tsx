import type { Task, TaskStatus } from "../types/task";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
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

export function Column({ status, tasks }: ColumnProps) {
  const style = COLUMN_STYLE[status];

  // カラム内は sortOrder の昇順で並べる
  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex w-75 min-w-75 flex-shrink-0 flex-col rounded-xl bg-slate-200 p-4">
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
      <div className="flex min-h-20 flex-col gap-2.5">
        {sortedTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
