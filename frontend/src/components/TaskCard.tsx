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

// カード本体。ネイティブのHTML5 Drag and Drop APIで直接ドラッグの配線をする。
// カード同士の隙間（見た目上のgap）を、当たり判定としてはこのカード自身の下側パディングとして
// 持たせている。隙間がどのカードにも属さない「無所属地帯」になると、そこにドロップしたときに
// カラム全体のドロップ処理（＝末尾へ追加）まで素通りしてしまい、挿入位置がずれてしまうため。
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
      className={`pb-2.5 ${isDragging ? "opacity-50" : ""}`}
    >
      <div
        className={`${CARD_CLASS} transition-shadow hover:shadow-md`}
        style={
          dropIndicator === "before"
            ? { boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1), inset 0 3px 0 0 #2b4c7e" }
            : dropIndicator === "after"
              ? { boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1), inset 0 -3px 0 0 #2b4c7e" }
              : undefined
        }
      >
        <TaskCardBody task={task} onEditClick={onEditClick} />
      </div>
    </div>
  );
}
