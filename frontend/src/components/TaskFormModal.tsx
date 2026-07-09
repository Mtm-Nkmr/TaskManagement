import { useRef, useState } from "react";
import type { Task } from "../types/task";

interface TaskFormModalProps {
  // 編集対象のタスク。渡されれば編集モード、なければ追加モード
  editingTask?: Task | null;
  onSave: (input: { title: string; dueDate: string | null }) => void;
  onClose: () => void;
}

export function TaskFormModal({ editingTask, onSave, onClose }: TaskFormModalProps) {
  // 編集モードなら既存の値を初期値にする（なければ空）
  const [title, setTitle] = useState(editingTask?.title ?? "");
  const [dueDate, setDueDate] = useState(editingTask?.dueDate ?? "");
  const [titleError, setTitleError] = useState(false);
  // マウスを押した場所が背景自身だったかを覚えておく
  // （テキスト選択のドラッグが背景まではみ出て離された場合に誤って閉じないようにする）
  const mouseDownOnOverlay = useRef(false);

  function handleOverlayMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    mouseDownOnOverlay.current = e.target === e.currentTarget;
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && mouseDownOnOverlay.current) {
      onClose();
    }
  }

  function handleSave() {
    if (title.trim() === "") {
      setTitleError(true);
      return;
    }
    onSave({ title: title.trim(), dueDate: dueDate || null });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-xl text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
        <h2 className="mb-6 text-lg font-bold text-gray-800">
          {editingTask ? "タスクを編集" : "タスクを追加"}
        </h2>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError(false);
            }}
            placeholder="タスクのタイトルを入力"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          {titleError && (
            <p className="mt-1 text-xs text-red-500">タイトルを入力してください</p>
          )}
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            期限
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
