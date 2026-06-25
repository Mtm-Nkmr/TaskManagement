import type { Task } from "../types/task";

interface TaskCardProps {
  task: Task;
}

// 期限が今日より前（過去）かどうかを判定する
function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  return due < today;
}

export function TaskCard({ task }: TaskCardProps) {
  const { title, dueDate } = task;

  // 期限表示の文言とスタイルを決める
  let dueLabel: string;
  let dueClass: string;
  if (dueDate === null) {
    dueLabel = "期限なし";
    dueClass = "text-gray-400 italic";
  } else if (isOverdue(dueDate)) {
    dueLabel = `期限: ${dueDate}（期限切れ）`;
    dueClass = "text-red-500 font-bold";
  } else {
    dueLabel = `期限: ${dueDate}`;
    dueClass = "text-gray-500";
  }

  return (
    <div className="rounded-lg bg-white px-3.5 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="mb-1.5 break-all text-sm font-medium leading-snug text-gray-800">
        {title}
      </p>
      <p className={`text-xs ${dueClass}`}>{dueLabel}</p>
    </div>
  );
}
