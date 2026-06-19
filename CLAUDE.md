# CLAUDE.md - プロジェクトルール

## 開発ワークフロー（必須）

Claude Codeは以下のルールを必ず守ること。

### 1. GitHub Issueの作成

- 作業を始める前に、必ずGitHub Issueを作成する
- Issueには作業内容を簡潔に記載する
- `gh issue create` コマンドを使用する

### 2. フィーチャーブランチの作成

- mainブランチから新しいブランチを作成する
- ブランチ名の規則: `プレフィックス/<issue番号>-簡潔な説明`
- プレフィックス一覧:
  - `feature/` — 新機能
  - `fix/` — バグ修正
  - `docs/` — ドキュメント変更
  - `chore/` — 設定・雑務
  - `refactor/` — リファクタリング
- 例: `feature/5-add-task-api`, `fix/12-fix-db-connection`

### 3. mainブランチへの直接操作の禁止

- mainブランチに直接commitしない
- mainブランチに直接pushしない
- 必ずフィーチャーブランチで作業する

### 4. コミットメッセージ規則

- Conventional Commits形式で日本語で記述する
- 形式: `種類: 説明`
- 種類一覧:
  - `feat:` — 新機能
  - `fix:` — バグ修正
  - `docs:` — ドキュメント変更
  - `chore:` — 設定・雑務
  - `refactor:` — リファクタリング
  - `test:` — テスト追加・修正
- 例: `feat: タスク追加APIを実装`, `fix: データベース接続エラーを修正`

### 5. Pull Requestの作成

- 作業完了後、Pull Requestを作成してmainにマージする
- PRの本文にIssue番号を記載する（例: `Closes #5`）
- `gh pr create` コマンドを使用する
- マージ後、フィーチャーブランチを削除する

### 作業フローまとめ

```
1. gh issue create         → Issueを作成し番号を取得
2. git checkout -b feature/番号-説明  → ブランチ作成
3. コード変更 → commit → push
4. gh pr create            → PRを作成
5. gh pr merge             → mainにマージ
6. git checkout main && git pull  → mainを最新化
7. git branch -d feature/番号-説明  → ブランチ削除
```

## プロジェクト概要

- タスク管理Webアプリケーション（Trello風カンバンボード）
- バックエンド: Java + Spring Boot
- フロントエンド: React + TypeScript（予定）
- データベース: PostgreSQL
- 開発環境: Docker Compose

## プロジェクト構造

- `backend/` — Spring Boot バックエンド
- `docs/` — 要件定義・設計ドキュメント
- `prototype/` — HTMLプロトタイプ
- `docker-compose.yml` — 開発環境設定
