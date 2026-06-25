# タスク管理アプリ（Trello風カンバンボード）

タスクをカンバンボード形式で視覚的に管理し、作業の進捗を把握しやすくするWebアプリケーションです。

## 機能

- **カンバンボード表示** — 「未着手」「進行中」「完了」の3カラムでタスクを管理
- **タスクのCRUD操作** — タスクの追加・編集・削除
- **ドラッグ＆ドロップ** — カラム間のタスク移動、カラム内の並び替え
- **期限管理** — 期限の設定、期限切れタスクの視覚的な警告表示（赤字 + 警告マーク）
- **期限順ソート** — カラムごとに期限が近い順に並び替え（トグル切り替え）
- **データ永続化** — バックエンドAPI経由でデータベースに保存

## 技術スタック

| 領域 | 技術 | バージョン |
|------|------|-----------|
| フロントエンド | React + TypeScript | React 19.2 / TypeScript 6.0 |
| ビルドツール（フロントエンド） | Vite | 8.1 |
| ビルドツール（バックエンド） | Gradle | 9.5 |
| CSS | Tailwind CSS | 4.3 |
| バックエンド | Java + Spring Boot | Java 25 / Spring Boot 4.0 |
| データベース | PostgreSQL | 17 |
| コンテナ | Docker Compose | - |

## プロジェクト構成

```
TaskManagement/
├── backend/          # Spring Boot バックエンド
│   └── src/
│       ├── main/java/com/example/taskmanagement/
│       │   ├── task/           # タスク関連（Controller, Service, Repository, Entity）
│       │   └── TaskmanagementApplication.java
│       └── main/resources/
│           └── db/migration/   # Flywayマイグレーション
├── frontend/         # React フロントエンド
│   └── src/
│       ├── api/                # APIクライアント
│       ├── components/         # UIコンポーネント（Board, Column, TaskCard, Header）
│       ├── types/              # 型定義
│       ├── App.tsx
│       └── main.tsx
├── docs/             # 設計ドキュメント
│   ├── 要件定義書.md
│   ├── 機能要件.md
│   ├── 画面設計.md
│   └── データベース設計.md
├── prototype/        # HTMLプロトタイプ
└── docker-compose.yml
```

## 開発環境のセットアップ

### 前提条件

- Java 25
- Node.js
- Docker / Docker Compose

### 起動手順

DB、バックエンド、フロントエンドの順に起動します。

```bash
# 1. データベースを起動
docker compose up -d

# 2. バックエンドを起動（ポート8080）
cd backend
./gradlew bootRun

# 3. フロントエンドを起動（ポート5173）
cd frontend
npm install
npm run dev
```

ブラウザで http://localhost:5173 にアクセスしてアプリを確認できます。

### デフォルトポート

| サービス | ポート |
|---------|--------|
| PostgreSQL | 5432 |
| バックエンド（Spring Boot） | 8080 |
| フロントエンド（Vite） | 5173 |

## API

バックエンドはRESTful APIを提供しています。

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/tasks` | 全タスク取得 |
| GET | `/api/tasks/{id}` | タスク個別取得 |

> 今後、タスクの作成・更新・削除APIを追加予定です。

## ドキュメント

詳細な設計ドキュメントは [docs/](docs/) ディレクトリにあります。

- [要件定義書](docs/要件定義書.md) — プロジェクトの背景・目的・機能概要・非機能要件
- [機能要件](docs/機能要件.md) — ユースケース一覧・機能要件詳細・受け入れ条件
- [画面設計](docs/画面設計.md) — 画面一覧・ワイヤーフレーム・画面遷移図
- [データベース設計](docs/データベース設計.md) — ER図・テーブル定義
