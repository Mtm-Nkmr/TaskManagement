import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../types/task";

interface TaskCardProps {
  task: Task;
  onEditClick: (task: Task) => void;
}

// カード共通の見た目（クラス）。
// transform を使うホバー効果（浮き上がり）は付けない —— dnd-kitのドラッグ用transformと
// 競合してカクつくため。ホバー演出は transform を使わない「影の変化」で表現する。
const CARD_CLASS = "relative rounded-lg bg-white px-3.5 py-3 shadow-sm";

// 期限が今日より前（過去）かどうかを判定する
function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  return due < today;
}

// カードの中身（表示専用の部品）。ドラッグの配線は持たないので、
// 通常のカードにも、ドラッグ中の分身（DragOverlay）にも使い回せる。
function TaskCardBody({ task, onEditClick }: { task: Task; onEditClick?: (task: Task) => void }) {
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
    <>
      {onEditClick && (
        <button
          type="button"
          onClick={() => onEditClick(task)}
          className="absolute right-2 top-2 text-xs text-gray-400 hover:text-blue-600"
        >
          編集
        </button>
      )}
      <p className="mb-1.5 break-all pr-10 text-sm font-medium leading-snug text-gray-800">
        {title}
      </p>
      <p className={`text-xs ${dueClass}`}>{dueLabel}</p>
    </>
  );
}

// 通常のカード。つかんで動かせるように useSortable の配線を持つ。
export function TaskCard({ task, onEditClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      {...attributes}
      {...listeners}
      className={`${CARD_CLASS} transition-shadow hover:shadow-md`}
    >
      <TaskCardBody task={task} onEditClick={onEditClick} />
    </div>
  );
}

// ドラッグ中に表示する分身。マウスにピタッと追従する見た目専用のカード。
export function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className={`${CARD_CLASS} cursor-grabbing shadow-lg`}>
      <TaskCardBody task={task} />
    </div>
  );
}
