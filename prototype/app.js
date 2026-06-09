'use strict';

// ===== サンプルデータ =====
let nextId = 5;
let tasks = [
  { id: 1, title: 'デザインモックアップの確認', status: 'todo',        due_date: '2026-06-15', sort_order: 0 },
  { id: 2, title: 'APIエンドポイントの設計',     status: 'todo',        due_date: '2026-06-03', sort_order: 1 },
  { id: 3, title: 'データベーススキーマの作成',   status: 'in_progress', due_date: '2026-06-08', sort_order: 0 },
  { id: 4, title: 'フロントエンド実装',           status: 'in_progress', due_date: null,         sort_order: 1 },
  { id: 5, title: '要件定義書の作成',             status: 'done',        due_date: '2026-05-30', sort_order: 0 },
];

// ===== 状態 =====
const sortedByDue = { todo: false, in_progress: false, done: false };
let editingTaskId  = null;
let addingStatus   = null;
let deletingTaskId = null;
let draggingTaskId = null;
// ドラッグ中にカード上でホバーしている位置情報
// { cardId: number, before: boolean } | null
let dragOverInfo   = null;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
  renderBoard();
});

// ===== 描画 =====
function renderBoard() {
  const statuses = ['todo', 'in_progress', 'done'];
  statuses.forEach(status => {
    const container = document.getElementById(`cards-${status}`);
    const countEl   = document.getElementById(`count-${status}`);
    const filtered  = tasks.filter(t => t.status === status);

    let ordered = [...filtered];
    if (sortedByDue[status]) {
      ordered.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
    } else {
      ordered.sort((a, b) => a.sort_order - b.sort_order);
    }

    container.innerHTML = '';
    ordered.forEach(task => container.appendChild(createCard(task)));
    countEl.textContent = filtered.length;
  });
}

function createCard(task) {
  const card = document.createElement('div');
  card.className   = 'card';
  card.draggable   = true;
  card.dataset.id  = task.id;

  // ── ドラッグ開始 / 終了 ──
  card.addEventListener('dragstart', e => {
    draggingTaskId = task.id;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => card.classList.add('dragging'), 0);
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    clearDropIndicators();
  });

  // ── カード上でのホバー：挿入位置インジケーター ──
  card.addEventListener('dragover', e => {
    if (draggingTaskId === task.id) return; // 自分自身はスキップ
    e.preventDefault();
    e.stopPropagation(); // カラム側の drag-over クラスを抑制
    e.dataTransfer.dropEffect = 'move';

    const rect   = card.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;

    clearDropIndicators();
    card.classList.add(before ? 'drop-before' : 'drop-after');
    dragOverInfo = { cardId: task.id, before };
  });

  card.addEventListener('dragleave', e => {
    // カードの外に出たときだけクリア（子要素への移動は無視）
    if (!card.contains(e.relatedTarget)) {
      card.classList.remove('drop-before', 'drop-after');
      dragOverInfo = null;
    }
  });

  // ── カード上でドロップ（カラムにバブルアップさせない） ──
  card.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    applyDrop(task.status);
  });

  // ── HTML 組み立て ──
  const today = new Date().toISOString().slice(0, 10);
  let dueText  = '期限なし';
  let dueClass = 'no-date';

  if (task.due_date) {
    dueText  = `期限: ${task.due_date}`;
    dueClass = task.due_date < today ? 'overdue' : '';
  }

  const overdueLabel = (task.due_date && task.due_date < today) ? ' ⚠ 期限切れ' : '';

  card.innerHTML = `
    <p class="card__title">${escapeHtml(task.title)}</p>
    <p class="card__due ${dueClass}">${escapeHtml(dueText)}${overdueLabel}</p>
    <div class="card__actions">
      <button class="btn btn--edit" onclick="openEditModal(${task.id})">編集</button>
      <button class="btn btn--card-delete" onclick="openDeleteDialog(${task.id})">削除</button>
    </div>
  `;

  return card;
}

// ===== 並び替え（カラム個別） =====
function toggleColumnSort(status) {
  sortedByDue[status] = !sortedByDue[status];
  const btn = document.getElementById(`sort-${status}`);
  btn.classList.toggle('active', sortedByDue[status]);
  btn.textContent = sortedByDue[status] ? '追加順' : '期限順';
  renderBoard();
}

// ===== タスク追加モーダル =====
function openAddModal(status) {
  editingTaskId = null;
  addingStatus  = status;
  document.getElementById('modalTitle').textContent  = 'タスクを追加';
  document.getElementById('taskTitleInput').value    = '';
  document.getElementById('taskDueDateInput').value  = '';
  clearFormError();
  document.getElementById('taskModalOverlay').classList.add('open');
  document.getElementById('taskTitleInput').focus();
}

// ===== タスク編集モーダル =====
function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingTaskId = id;
  addingStatus  = null;
  document.getElementById('modalTitle').textContent  = 'タスクを編集';
  document.getElementById('taskTitleInput').value    = task.title;
  document.getElementById('taskDueDateInput').value  = task.due_date || '';
  clearFormError();
  document.getElementById('taskModalOverlay').classList.add('open');
  document.getElementById('taskTitleInput').focus();
}

function closeTaskModal() {
  document.getElementById('taskModalOverlay').classList.remove('open');
  editingTaskId = null;
  addingStatus  = null;
}

// ===== タスク保存 =====
function saveTask() {
  const title    = document.getElementById('taskTitleInput').value.trim();
  const due_date = document.getElementById('taskDueDateInput').value || null;

  if (!title) { showFormError(); return; }

  if (editingTaskId !== null) {
    const task = tasks.find(t => t.id === editingTaskId);
    if (task) { task.title = title; task.due_date = due_date; }
  } else {
    const maxOrder = tasks
      .filter(t => t.status === addingStatus)
      .reduce((m, t) => Math.max(m, t.sort_order), -1);
    tasks.push({ id: ++nextId, title, status: addingStatus, due_date, sort_order: maxOrder + 1 });
  }

  closeTaskModal();
  renderBoard();
}

function showFormError() {
  document.getElementById('taskTitleInput').classList.add('error');
  document.getElementById('titleError').classList.add('visible');
}

function clearFormError() {
  document.getElementById('taskTitleInput').classList.remove('error');
  document.getElementById('titleError').classList.remove('visible');
}

// ===== 削除確認ダイアログ =====
function openDeleteDialog(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  deletingTaskId = id;
  document.getElementById('deleteTaskName').textContent = task.title;
  document.getElementById('deleteDialogOverlay').classList.add('open');
}

function closeDeleteDialog() {
  document.getElementById('deleteDialogOverlay').classList.remove('open');
  deletingTaskId = null;
}

function confirmDelete() {
  tasks = tasks.filter(t => t.id !== deletingTaskId);
  closeDeleteDialog();
  renderBoard();
}

// ===== ドラッグ＆ドロップ（カラム側） =====
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

// カラムの空き領域へのドロップ（カード上は card の drop が処理する）
function handleDrop(e, newStatus) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  applyDrop(newStatus);
}

// ドロップの共通処理
function applyDrop(newStatus) {
  if (draggingTaskId === null) return;
  const task = tasks.find(t => t.id === draggingTaskId);
  if (!task) return;

  const isCrossColumn = task.status !== newStatus;

  // 期限ソートが有効なカラムへドロップしたらソートを解除して手動順に戻す
  if (sortedByDue[newStatus]) {
    // 現在の表示順を sort_order に焼き付けてからソート解除
    const btn = document.getElementById(`sort-${newStatus}`);
    let order = 0;
    tasks
      .filter(t => t.status === newStatus)
      .sort((a, b) => a.due_date && b.due_date ? a.due_date.localeCompare(b.due_date) : (!a.due_date ? 1 : -1))
      .forEach(t => { t.sort_order = order++; });
    sortedByDue[newStatus] = false;
    btn.classList.remove('active');
    btn.textContent = '期限順';
  }

  if (dragOverInfo) {
    // カード上にドロップ → 指定位置に挿入
    const { cardId, before } = dragOverInfo;
    task.status = newStatus;

    const columnTasks = tasks
      .filter(t => t.status === newStatus && t.id !== task.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const targetIdx  = columnTasks.findIndex(t => t.id === cardId);
    const insertIdx  = before ? targetIdx : targetIdx + 1;
    columnTasks.splice(insertIdx < 0 ? columnTasks.length : insertIdx, 0, task);
    columnTasks.forEach((t, i) => { t.sort_order = i; });
  } else {
    // カラムの空き領域にドロップ → 末尾に追加
    task.status = newStatus;
    const maxOrder = tasks
      .filter(t => t.status === newStatus && t.id !== task.id)
      .reduce((m, t) => Math.max(m, t.sort_order), -1);
    task.sort_order = maxOrder + 1;
  }

  draggingTaskId = null;
  dragOverInfo   = null;
  clearDropIndicators();
  renderBoard();
}

// ===== ユーティリティ =====
function clearDropIndicators() {
  document.querySelectorAll('.drop-before, .drop-after').forEach(el => {
    el.classList.remove('drop-before', 'drop-after');
  });
  document.querySelectorAll('.column__cards').forEach(c => c.classList.remove('drag-over'));
}

document.addEventListener('dragend', clearDropIndicators);

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
