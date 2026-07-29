import { useEffect, useState } from "react";
import type { Task } from "../types/task";

interface TaskCardProps {
  task: Task;
  onEditClick: (task: Task) => void;
  isDragging: boolean;
  dropIndicator: "before" | "after" | null;
  onDragStart: () => void;
  onDragEnd: () => void;
  onCardDragOver: (before: boolean) => void;
  onCardDrop: () => void;
}

// カード共通の見た目（クラス）
const CARD_CLASS = "relative rounded-lg bg-white px-3.5 py-3 shadow-sm";

// 期限が今日より前（過去）かどうかを判定する
function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  return due < today;
}

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
          draggable={false}
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

// マウントされてから一定時間（0.5秒）経ったかどうかを返す。
// 「ドラッグ中に、たった今この場所に生まれたばかりのカードかどうか」の判定に使う。
function useMountStatus() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  return isMounted;
}

// カード本体。ネイティブのHTML5 Drag and Drop APIで直接ドラッグの配線をする。
export function TaskCard({
  task,
  onEditClick,
  isDragging,
  dropIndicator,
  onDragStart,
  onDragEnd,
  onCardDragOver,
  onCardDrop,
}: TaskCardProps) {
  const mounted = useMountStatus();
  // ドラッグ中、かつこの場所にできたばかり（別カラムから移ってきた直後）のカードだけ
  // フェードインさせ、「パッと切り替わる」印象をやわらげる
  const isNewlyMountedWhileDragging = isDragging && !mounted;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragOver={(e) => {
        if (isDragging) return; // 自分自身の上はスキップ
        e.preventDefault();
        e.stopPropagation(); // カラム側のハイライトを抑制
        const rect = e.currentTarget.getBoundingClientRect();
        const before = e.clientY < rect.top + rect.height / 2;
        onCardDragOver(before);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation(); // カラムへのバブリングを止める
        if (isDragging) return; // 自分自身の上にドロップされた場合は何もしない
        onCardDrop();
      }}
      className={`${CARD_CLASS} transition-shadow hover:shadow-md ${
        isDragging ? "opacity-50" : ""
      } ${isNewlyMountedWhileDragging ? "animate-fade-in" : ""} ${
        dropIndicator === "before" ? "border-t-[3px] border-t-[#2b4c7e] pt-[7px]" : ""
      } ${dropIndicator === "after" ? "border-b-[3px] border-b-[#2b4c7e] pb-[7px]" : ""}`}
    >
      <TaskCardBody task={task} onEditClick={onEditClick} />
    </div>
  );
}
