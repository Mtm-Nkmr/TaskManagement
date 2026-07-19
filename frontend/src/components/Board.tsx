import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "../types/task";
import { fetchTasks, createTask, updateTask, updateTaskPosition } from "../api/taskApi";
import { sortByDueDate } from "../utils/sortByDueDate";
import { Column } from "./Column";
import { TaskCardOverlay } from "./TaskCard";
import { TaskFormModal } from "./TaskFormModal";

// 表示するカラムの順番
const COLUMN_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

// カラムごとにタスクを小分けにした状態の型（例: { todo: [...], in_progress: [...], done: [...] }）
type Board = Record<TaskStatus, Task[]>;

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
  // ドラッグ中のカード（DragOverlayで分身として表示する）
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  // カラムごとに「今、期限順で表示中かどうか」を覚えておく（boardの中身自体は常に手動順のまま）
  const [dueDateSorted, setDueDateSorted] = useState<Record<TaskStatus, boolean>>({
    todo: false,
    in_progress: false,
    done: false,
  });

  // 「今画面に表示されている並び」を返す。期限順ソート中のカラムなら期限順に並べ替えた配列、
  // そうでなければそのままの配列。ドラッグ操作は常にこの"見た目の並び"を基準に計算する。
  function getDisplayTasks(status: TaskStatus, source: Board): Task[] {
    return dueDateSorted[status] ? sortByDueDate(source[status]) : source[status];
  }

  // 8px以上ポインタを動かしたときだけドラッグ開始とみなす（クリック操作と区別するため）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // 直前の衝突判定結果を覚えておく（レイアウトが変わって一瞬当たり判定が
  // 見つからなくなる瞬間の"穴埋め"に使い、判定のガタつきを防ぐ）
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  // カラムを跨いだ直後だけtrueになるフラグ（boardが更新された次のフレームでリセットする）
  const recentlyMovedToNewContainer = useRef(false);
  // 判定関数の中から最新のboardを読むための参照。
  // useCallbackの依存配列にboardを直接入れると、boardが更新されるたびに
  // 判定関数そのものが作り直されてdnd-kit側の再セットアップを引き起こし、
  // 無限ループの原因になったため、refで参照だけ渡すようにしている。
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [board]);

  // 2段構えの衝突判定:
  // ① まずカーソルが乗っているものを探す（乗っていなければ矩形の重なりで補う）
  // ② それがカラム自体なら、そのカラムの中で一番近いカードに絞り込む
  // ③ どこにも当たらなかった瞬間は、前回の判定結果（lastOverId）を使って穴埋めする
  const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
    const board = boardRef.current;
    const pointerCollisions = pointerWithin(args);
    const collisions = pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
    let overId = getFirstCollision(collisions, "id");

    if (overId != null) {
      if (COLUMN_ORDER.includes(overId as TaskStatus)) {
        const columnTasks = board[overId as TaskStatus];
        if (columnTasks.length > 0) {
          const cardIds = new Set(columnTasks.map((t) => t.id));
          overId =
            closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter((c) => cardIds.has(c.id)),
            })[0]?.id ?? overId;
        }
      }
      lastOverId.current = overId;
      return [{ id: overId }];
    }

    if (recentlyMovedToNewContainer.current) {
      lastOverId.current = args.active.id;
    }

    return lastOverId.current ? [{ id: lastOverId.current }] : [];
  }, []);

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

  // つかんだ瞬間に、そのカードを覚えておく（分身の表示に使う）
  function handleDragStart(event: DragStartEvent) {
    const task = COLUMN_ORDER.flatMap((s) => board[s]).find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  // ドラッグ中ずっと呼ばれる。掴んでいるカードが「別のカラム」に入った瞬間だけ、
  // board上でそのカードを移動先カラムに移す（＝リアルタイムに場所が空くプレビュー）。
  // 同一カラム内の並び替えはdnd-kitが自動でやるので、ここでは何もしない。
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    setBoard((prev) => {
      // 掴んでいるカードが今いるカラム
      const fromStatus = COLUMN_ORDER.find((s) => prev[s].some((t) => t.id === active.id));
      if (!fromStatus) return prev;

      // ドロップ先が「カラム自体」か「別のカードの上」かを判定して、移動先カラムを求める
      const overTask = COLUMN_ORDER.flatMap((s) => prev[s]).find((t) => t.id === over.id);
      const toStatus = COLUMN_ORDER.find((s) => s === over.id) ?? overTask?.status;

      // 同じカラム内なら何もしない（prevをそのまま返すと再描画も起きずループしない）
      if (!toStatus || fromStatus === toStatus) return prev;

      const activeTask = prev[fromStatus].find((t) => t.id === active.id);
      if (!activeTask) return prev;

      // 挿入位置: カードの上に来たら、そのカードの「下端」を基準に手前／後ろを決める。
      // 真ん中を基準にすると、カーソルがカードの中心付近にあるだけで判定が
      // 入れ替わり続けてしまうため、下端を基準にして揺れにくくする。
      // 移動先カラムが期限順ソート中なら、見えている期限順の並びを基準にする
      const dest = getDisplayTasks(toStatus, prev);
      let insertIndex = dest.length;
      if (overTask) {
        const overIndex = dest.findIndex((t) => t.id === overTask.id);
        const activeRect = active.rect.current.translated ?? active.rect.current.initial;
        const isBelowOverItem = (activeRect?.top ?? 0) > over.rect.top + over.rect.height;
        insertIndex = overIndex >= 0 ? overIndex + (isBelowOverItem ? 1 : 0) : dest.length;
      }
      const movedTask = { ...activeTask, status: toStatus };

      // カラムを跨いだことを記録しておく（衝突判定側の穴埋めに使う）
      recentlyMovedToNewContainer.current = true;

      return {
        ...prev,
        [fromStatus]: prev[fromStatus].filter((t) => t.id !== activeTask.id),
        [toStatus]: [...dest.slice(0, insertIndex), movedTask, ...dest.slice(insertIndex)],
      };
    });
  }

  // ドロップされた瞬間に、最終的な並びを確定してローカル（board）に反映し、サーバーに保存する。
  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null); // 分身を消す
    const { active, over } = event;
    if (!over) return;

    // activeがどのカラムにいるかを探す
    const fromStatus = COLUMN_ORDER.find((s) => board[s].some((t) => t.id === active.id));
    if (!fromStatus) return;
    const activeTask = board[fromStatus].find((t) => t.id === active.id);
    if (!activeTask) return;

    // ドロップ先が「カラム自体」か「別のカードの上」かを判定
    const overTask = COLUMN_ORDER.flatMap((s) => board[s]).find((t) => t.id === over.id);
    const overStatus = COLUMN_ORDER.find((s) => s === over.id) ?? overTask?.status;
    if (!overStatus) return;

    if (fromStatus === overStatus) {
      // 同一カラム内: 見えている並び（期限順ソート中ならその並び）を基準にarrayMoveで入れ替える。
      // ドロップした結果が、そのまま新しい手動順として確定する
      const column = getDisplayTasks(overStatus, board);
      const oldIndex = column.findIndex((t) => t.id === activeTask.id);
      const overIndex = overTask
        ? column.findIndex((t) => t.id === overTask.id)
        : column.length - 1;
      const newColumn = arrayMove(column, oldIndex, overIndex);
      setBoard((prev) => ({ ...prev, [overStatus]: newColumn }));
      // 手動で並び替えたので、このカラムの期限順ソートは解除する
      setDueDateSorted((prev) => ({ ...prev, [overStatus]: false }));

      const newIndex = newColumn.findIndex((c) => c.id === activeTask.id);
      persistPosition(activeTask.id, overStatus, newIndex);
    } else {
      // カラム間の移動: 移動先カラムの見えている並び（期限順ソート中ならその並び）を基準に挿入する
      const dest = getDisplayTasks(overStatus, board).filter((t) => t.id !== activeTask.id);
      let insertIndex = dest.length;
      if (overTask) {
        // カードの上に落ちた場合、その上半分なら手前、下半分なら後ろに入れる
        const overIndex = dest.findIndex((t) => t.id === overTask.id);
        const activeRect = active.rect.current.translated ?? active.rect.current.initial;
        const activeCenterY = (activeRect?.top ?? 0) + (activeRect?.height ?? 0) / 2;
        const overMidY = over.rect.top + over.rect.height / 2;
        insertIndex = activeCenterY > overMidY ? overIndex + 1 : overIndex;
      }
      const movedTask = { ...activeTask, status: overStatus };
      const newColumn = [...dest];
      newColumn.splice(insertIndex, 0, movedTask);
      setBoard((prev) => ({
        ...prev,
        [fromStatus]: prev[fromStatus].filter((t) => t.id !== activeTask.id),
        [overStatus]: newColumn,
      }));
      // 移動元・移動先の両方のカラムで並びが変わったので、両方の期限順ソートを解除する
      setDueDateSorted((prev) => ({ ...prev, [fromStatus]: false, [overStatus]: false }));

      persistPosition(activeTask.id, overStatus, insertIndex);
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
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex flex-1 items-start gap-5 overflow-x-auto p-6">
        {COLUMN_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={board[status]}
            isDueDateSorted={dueDateSorted[status]}
            onToggleDueDateSort={(s) =>
              setDueDateSorted((prev) => ({ ...prev, [s]: !prev[s] }))
            }
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
      {/* ドラッグ中だけ、マウスに追従する分身を表示する */}
      <DragOverlay>{activeTask ? <TaskCardOverlay task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
}
