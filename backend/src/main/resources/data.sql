INSERT INTO tasks (title, status, due_date, sort_order, created_at, updated_at)
SELECT '買い物リストを作成する', 'todo', '2026-07-01', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = '買い物リストを作成する');

INSERT INTO tasks (title, status, due_date, sort_order, created_at, updated_at)
SELECT 'レポートを書く', 'todo', '2026-07-05', 2, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'レポートを書く');

INSERT INTO tasks (title, status, due_date, sort_order, created_at, updated_at)
SELECT 'プレゼン資料を準備する', 'in_progress', '2026-06-25', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'プレゼン資料を準備する');

INSERT INTO tasks (title, status, due_date, sort_order, created_at, updated_at)
SELECT 'コードレビューを実施する', 'in_progress', NULL, 2, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'コードレビューを実施する');

INSERT INTO tasks (title, status, due_date, sort_order, created_at, updated_at)
SELECT 'ミーティング議事録をまとめる', 'done', '2026-06-15', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'ミーティング議事録をまとめる');
