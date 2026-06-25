---
description: 開発サーバー（DB・バックエンド・フロントエンド）を起動する。ポート競合があれば既存プロセスを停止してからデフォルトポートで起動する。
---

## 開発サーバー起動スキル

以下の手順で開発環境を起動する。

### ルール（厳守）
- サーバーは必ず **デフォルトポート** で起動すること。別ポートでの一時起動は禁止。
  - PostgreSQL: `5432`
  - Spring Boot（バックエンド）: `8080`
  - Vite dev server（フロントエンド）: `5173`
- 起動前に `netstat -ano | grep "LISTENING" | grep ":<ポート番号> "` でポート使用状況を確認する
- ポートが使用中の場合、PIDを特定して `taskkill /PID <PID> /F` で停止してから起動する

### 起動手順（この順番で実行）

1. **DB起動**: プロジェクトルートで `docker compose up -d`
2. **バックエンド起動**: `cd backend && ./gradlew bootRun`（バックグラウンド実行）
   - 起動完了を `Started TaskmanagementApplication` のログで確認
3. **フロントエンド起動**: `cd frontend && npm run dev`（バックグラウンド実行）
   - ポート5173でLISTENINGになるのを確認

### 起動後の確認
- `curl -s http://localhost:8080/api/tasks` でAPIが200を返すこと
- `curl -s http://localhost:5173` でフロントのHTMLが返ること
- ブラウザで `http://localhost:5173` を開いて画面表示を目視確認
