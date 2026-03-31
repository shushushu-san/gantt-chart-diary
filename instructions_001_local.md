# 開発環境セットアップ・起動・終了手順

## 前提条件

| ツール | バージョン | 確認コマンド |
| --- | --- | --- |
| Node.js | v18以上 | `node -v` |
| npm | v9以上 | `npm -v` |
| PostgreSQL | v14以上 | `psql --version` |
| Git | 任意 | `git --version` |

---

## 初回セットアップ

### 1. リポジトリをクローン

```powershell
git clone <リポジトリURL>
cd gantt-chart-diary
```

### 2. 依存パッケージをインストール

```powershell
npm install
```

### 3. 環境変数を設定

`.env.local` をプロジェクトルートに作成し、以下を記入する。

```env
# データベース接続URL
# 例: postgresql://ユーザー名:パスワード@localhost:5432/gantt_diary
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/gantt_diary

# NextAuth（任意の文字列。本番環境では必ず長いランダム文字列にすること）
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# AIプロバイダー設定（cloud または local）
AI_PROVIDER=cloud

# クラウドAI使用時（AI_PROVIDER=cloud の場合）
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# ローカルLLM使用時（AI_PROVIDER=local の場合）
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

> `.env.local` は `.gitignore` に含まれており、リポジトリには保存されない。

### 4. PostgreSQLにデータベースを作成

```powershell
psql -U postgres -c "CREATE DATABASE gantt_diary;"
```

### 5. Prismaクライアントを生成・マイグレーションを実行

```powershell
# 型定義の生成
npx prisma generate

# テーブルをDBに作成
npx prisma migrate dev --name init
```

---

## 起動手順

```powershell
npm run dev
```

起動後、ブラウザで以下のURLを開く。

```txt
http://localhost:3000
```

| URL | 画面 |
| --- | --- |
| `http://localhost:3000` | ホーム |
| `http://localhost:3000/login` | ログイン |
| `http://localhost:3000/register` | アカウント登録 |
| `http://localhost:3000/dashboard` | ダッシュボード（要ログイン） |
| `http://localhost:3000/projects` | プロジェクト一覧（要ログイン） |

---

## 終了手順

開発サーバーを停止するには、サーバーを起動したターミナルで以下を入力する。

```txt
Ctrl + C
```

確認プロンプトが表示された場合は `Y` を入力してEnterを押す。

---

## その他のコマンド

| コマンド | 内容 |
| --- | --- |
| `npm run build` | 本番用ビルドを生成 |
| `npm run start` | 本番ビルドを起動 |
| `npm run lint` | ESLintによるコードチェック |
| `npx prisma generate` | スキーマ変更後に型定義を再生成 |
| `npx prisma migrate dev` | スキーマ変更をDBに反映 |
| `npx prisma studio` | ブラウザでDBデータを閲覧・編集 |

---

## トラブルシューティング

### `npm run dev` でエラーが出る

```powershell
# 依存パッケージを再インストール
Remove-Item -Recurse -Force node_modules
npm install
```

### Prismaの型エラーが出る

```powershell
npx prisma generate
```

その後、VS Code で `Ctrl + Shift + P` → `TypeScript: Restart TS Server` を実行する。

### DBに接続できない

- `.env.local` の `DATABASE_URL` が正しいか確認する
- PostgreSQLが起動しているか確認する（`pg_isready`）
