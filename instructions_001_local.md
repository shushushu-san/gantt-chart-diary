# 開発環境セットアップ・起動・終了手順

## 前提条件

| ツール | バージョン | 確認コマンド |
| --- | --- | --- |
| Node.js | v18以上 | `node -v` |
| npm | v9以上 | `npm -v` |
| Git | 任意 | `git --version` |

> **PostgreSQL はローカル不要。** DBには [Supabase](https://supabase.com)（無料クラウドPostgreSQL）を使用しているため、ローカルへのPostgreSQLインストールは不要。

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
# データベース接続URL（Supabase の接続文字列を貼り付ける）
# 取得場所: Supabase ダッシュボード → Connect → URI
DATABASE_URL=postgresql://postgres:パスワード@db.xxxx.supabase.co:5432/postgres

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

#### Supabase で DATABASE_URL を取得する手順

1. [https://supabase.com](https://supabase.com) でプロジェクトを作成
2. ダッシュボード上部の **「Connect」** ボタンをクリック
3. **「Connection string」→「URI」** をコピーして `.env.local` に貼り付ける
4. `[YOUR-PASSWORD]` の部分をプロジェクト作成時に設定したパスワードに書き換える

### 4. Prismaクライアントを生成・マイグレーションを実行

```powershell
# 型定義の生成
npx prisma generate

# テーブルをDBに作成（初回）
$env:DATABASE_URL="postgresql://..."
npx prisma migrate dev --name init
```

> PowerShell は `.env.local` を自動で読み込まないため、`$env:DATABASE_URL=` で明示的に設定してから実行する。

---

## 起動手順

```powershell
npm run dev
```

起動後、ブラウザで以下のURLを開く。

```txt
http://localhost:3000
```

> ポート `3000` が使用中の場合、Next.js は自動で `3001`, `3002`... と空きポートを使用する。起動ログに表示されるURLを確認すること。

| URL | 画面 |
| --- | --- |
| `http://localhost:3000` | ホーム（未ログイン時は `/login` へリダイレクト） |
| `http://localhost:3000/login` | ログイン |
| `http://localhost:3000/register` | アカウント登録 |
| `http://localhost:3000/dashboard` | ダッシュボード（要ログイン） |
| `http://localhost:3000/projects/[id]` | プロジェクト詳細・ガントチャート（要ログイン） |

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

## AI設定手順

ログイン後、プロジェクト画面の左サイドバー下部にある **「AI設定」** ボタンから設定する。

| 選択肢 | 内容 | 必要な準備 |
| --- | --- | --- |
| **使用しない**（デフォルト） | AI解析なし。日付・タイトルは手動入力 | なし |
| **Cloud API (OpenAI)** | OpenAIのAPIを使用 | APIキーを取得して入力 |
| **ローカルLLM (Ollama)** | PC上のOllamaを使用 | Ollamaのインストールとモデルのダウンロード |

### ローカルLLM (Ollama) を使う場合

```powershell
# 1. Ollama をインストール
winget install Ollama.Ollama

# 2. モデルをダウンロード（約4.7GB）
ollama pull llama3

# 3. 起動確認
curl http://localhost:11434/api/tags
```

設定画面で「ローカルLLM」を選択し、「**モデル取得**」ボタンを押すとインストール済みモデルの一覧が取得できる（ドロップダウンで選択）。

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

- `.env.local` の `DATABASE_URL` のパスワード部分に `[]` が残っていないか確認する
- Supabase ダッシュボードでプロジェクトがアクティブ（Pausedでない）か確認する
- パスワードを忘れた場合: Supabase → **Project Settings → Database → Reset database password**

### `prisma migrate dev` が失敗する

PowerShell では `.env.local` を自動で読み込まないため、以下の形式で実行する。

```powershell
$env:DATABASE_URL="postgresql://postgres:パスワード@db.xxxx.supabase.co:5432/postgres"
npx prisma migrate dev --name init
```
