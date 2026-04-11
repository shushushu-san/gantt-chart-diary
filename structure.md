# プロジェクト構成解説

## ファイルツリー

```text
gantt-chart-diary/
│
├── .env.example                        # 必要な環境変数の一覧テンプレート
├── .gitignore                          # git 管理除外設定（node_modules・uploads 等）
├── next.config.ts                      # Next.js 設定
├── tailwind.config.ts                  # Tailwind CSS 設定（typography プラグイン含む）
├── postcss.config.js                   # PostCSS 設定（Tailwind のビルドに必要）
├── tsconfig.json                       # TypeScript 設定（@ パスエイリアス定義）
├── package.json                        # 依存パッケージ一覧・スクリプト定義
├── node_modules/                       # ※ gitignore済み。npm install で自動生成される依存パッケージ本体
├── uploads/                            # アップロードされたファイルの保存先（gitignore済み）
│   └── [project-name]/[subfolder]/     # プロジェクト名・サブフォルダ別に整理される
│
├── prisma/
│   ├── schema.prisma                   # データベーススキーマ定義
│   └── migrations/                     # マイグレーション履歴
│
└── src/
    ├── app/                            # Next.js App Router のルーティング層
    │   ├── globals.css                 # グローバルスタイル
    │   ├── layout.tsx                  # 全ページ共通レイアウト
    │   ├── page.tsx                    # トップページ（/）
    │   ├── (auth)/                     # 認証ページグループ（未ログインでもアクセス可）
    │   │   ├── layout.tsx              # 認証ページ共通レイアウト
    │   │   ├── login/page.tsx          # ログイン画面
    │   │   └── register/page.tsx       # アカウント登録画面
    │   ├── (dashboard)/                # ログイン必須ページグループ
    │   │   ├── layout.tsx              # ダッシュボード共通レイアウト（認証チェック）
    │   │   ├── dashboard/page.tsx      # ダッシュボードトップ
    │   │   └── projects/[id]/page.tsx  # プロジェクト詳細・ガントチャート表示
    │   └── api/
    │       ├── auth/
    │       │   ├── [...nextauth]/route.ts  # NextAuth ハンドラー
    │       │   └── register/route.ts       # アカウント登録 API
    │       ├── projects/
    │       │   ├── route.ts                # プロジェクト一覧取得・作成 API
    │       │   └── [id]/
    │       │       ├── route.ts            # プロジェクト取得・更新・削除 API
    │       │       ├── files/route.ts      # ファイルアップロード・AI解析 API
    │       │       ├── files/[fileId]/route.ts  # ファイル個別削除 API
    │       │       ├── tasks/route.ts      # ガントアイテム（タスク）手動作成 API
    │       │       └── tasks/[taskId]/route.ts  # ガントアイテム編集・削除 API
    │       ├── settings/
    │       │   └── ai/
    │       │       ├── route.ts            # AI設定 API（GET / PUT）
    │       │       └── models/route.ts     # Ollama インストール済みモデル一覧取得 API
    │       └── uploads/
    │           └── [...path]/route.ts      # アップロードファイル配信 API（認証付き）
    │
    ├── components/                     # UIコンポーネント
    │   ├── auth/
    │   │   └── LogoutButton.tsx        # ログアウトボタン
    │   ├── gantt/
    │   │   └── GanttChart.tsx          # ガントチャート表示（水平線＋イベントマーカー形式）
    │   ├── project/
    │   │   ├── EventEditModal.tsx      # ガントイベント編集・削除モーダル
    │   │   ├── FileViewer.tsx          # ファイル内容インライン表示パネル
    │   │   ├── NewProjectForm.tsx      # プロジェクト新規作成フォーム
    │   │   ├── NewTaskForm.tsx         # タスク（ガントアイテム）手動作成フォーム
    │   │   ├── ProjectCard.tsx         # ダッシュボードのプロジェクトカード（削除ボタン付き）
    │   │   ├── ProjectDeleteButton.tsx # プロジェクト削除ボタン（確認ダイアログ付き）
    │   │   ├── ProjectLayout.tsx       # プロジェクト詳細画面のクライアント統括コンポーネント
    │   │   └── ProjectSidebar.tsx      # 左サイドバー（ファイルツリー・ボタン・AI設定）
    │   ├── providers/
    │   │   └── SessionProvider.tsx     # NextAuth セッションコンテキストプロバイダー
    │   ├── settings/
    │   │   └── AISettingsModal.tsx     # AI設定モーダル（プロバイダー選択・APIキー入力）
    │   └── upload/
    │       ├── FileDropzone.tsx        # ファイルドロップUI（AI解析確認フォーム含む）
    │       └── FileList.tsx            # アップロード済みファイル一覧（削除ボタン付き）
    │
    ├── lib/                            # サーバーサイドのビジネスロジック
    │   ├── ai/
    │   │   ├── types.ts                # AIプロバイダーの型・インターフェース定義
    │   │   ├── prompts.ts              # LLMへ送るプロンプトのテンプレート
    │   │   ├── factory.ts              # プロバイダーのインスタンスを生成するファクトリー
    │   │   ├── server.ts               # API Route用ヘルパー（ユーザーDB設定からプロバイダーを生成）
    │   │   ├── index.ts                # lib/ai の外部向けエクスポート窓口
    │   │   └── providers/
    │   │       ├── openai.ts           # OpenAI API 実装
    │   │       └── ollama.ts           # Ollama（ローカルLLM）実装
    │   ├── auth/
    │   │   └── options.ts              # NextAuth.js の設定（認証方式・コールバック）
    │   └── db/
    │       └── prisma.ts               # Prisma クライアントのシングルトン
    │
    └── types/
        └── next-auth.d.ts              # NextAuth の型拡張（session.user.id を追加）
```

---

## 各ファイルの役割

### ルート設定ファイル

| ファイル | 役割 |
| ------- | ---- |
| `.env.example` | 動作に必要な環境変数の一覧。実際の値は `.env.local` に記入して使う（gitignore 済み） |
| `next.config.ts` | Next.js の動作設定。画像ドメインの許可などを追加していく |
| `tailwind.config.ts` | Tailwind CSS のカスタムテーマ・対象ファイルパスの設定 |
| `tsconfig.json` | TypeScript の設定。`@/*` → `src/*` のパスエイリアスを定義しており、`import @/lib/...` のような短いパスでインポートできる |
| `package.json` | 依存パッケージと `npm run dev`, `npm run db:migrate` などのスクリプトを定義 |
| `node_modules/` | `npm install` 実行時に自動生成される外部パッケージの保存フォルダ。**gitには含めない**（`.gitignore` 済み）。`package.json` さえあれば `npm install` で完全に再現できるため、リポジトリ管理は不要 |

---

### `node_modules/` — 外部パッケージ保存フォルダ

`npm install` を実行すると `package.json` の依存関係を読み込み、自動で生成されるフォルダ。

| 項目 | 内容 |
| ---- | ---- |
| **必須性** | アプリの実行には必要。ただし**リポジトリに含める必要はない** |
| **再生成方法** | `npm install` だけで完全に復元できる |
| **サイズ** | 数百 MB〜1 GB 以上になることが多い |
| **git 管理** | `.gitignore` に記載済みのため push されない |

> **リポジトリを clone した後にすること:**
>
> ```text
> npm install   ← これだけで node_modules が復元される
> ```

---

### `prisma/schema.prisma` — データベーススキーマ

アプリが扱う全テーブルを定義するファイル。変更後は `npx prisma migrate dev` でDBに適用し、`npx prisma generate` で型を再生成する。

| モデル | 役割 |
| ------ | ---- |
| `User` | ユーザー情報。メール・パスワードハッシュ・表示名を保持 |
| `Account` / `Session` / `VerificationToken` | NextAuth.js が使用する認証管理テーブル |
| `UserAIConfig` | ユーザーごとのAI設定（プロバイダー種別・APIキー・モデル名）。`User` と 1対1 |
| `Category` | ガントチャートのレーン（カテゴリ）。ユーザーがカスタム定義できる |
| `Project` | プロジェクト。複数の `Entry` と `ProjectFile` を持つ |
| `ProjectFile` | プロジェクトにアップロードされたファイル情報。`subfolder`（AI提案・ユーザー確認済みのフォルダ名）を持ち、`Entry` と1対多で紐づく |
| `Entry` | 日記エントリ本体。テキスト本文・ファイルURL・`Project`・`ProjectFile` と紐づく |
| `GanttItem` | ガントチャートのイベントマーカー1件分。`Entry` に紐づき、開始日・終了日・タイトル・summary・タグを持つ。水平線上の円マーカーとして表示され、ホバーでツールチップが出る |

---

### `src/app/` — ルーティング層

#### `layout.tsx`

全ページ共通のHTMLラッパー。フォント・メタ情報・共通UIをここに置く。

#### `page.tsx`

トップページ（`/`）。未ログイン時は `/login` へリダイレクトする。

#### `(auth)/` — 認証ページグループ

| ファイル | 役割 |
| ------- | ---- |
| `layout.tsx` | 認証ページ共通レイアウト |
| `login/page.tsx` | メールアドレス・パスワードによるログイン画面 |
| `register/page.tsx` | アカウント新規登録画面 |

#### `(dashboard)/` — ログイン必須ページグループ

| ファイル | 役割 |
| ------- | ---- |
| `layout.tsx` | 未ログイン時に `/login` へリダイレクト、ナビゲーション表示 |
| `dashboard/page.tsx` | ダッシュボードトップ。プロジェクト一覧を表示 |
| `projects/[id]/page.tsx` | プロジェクト詳細画面。ファイルアップロード・ガントチャート表示 |

#### API Routes

| ファイル | メソッド | 役割 |
| ------- | ------- | ---- |
| `api/auth/[...nextauth]/route.ts` | GET/POST | NextAuth のログイン・セッション処理 |
| `api/auth/register/route.ts` | POST | アカウント登録（bcryptハッシュ化して保存） |
| `api/projects/route.ts` | GET / POST | プロジェクト一覧取得・新規作成 |
| `api/projects/[id]/route.ts` | GET / PUT / DELETE | プロジェクト取得・更新・削除（削除時はuploadsフォルダも物理削除） |
| `api/projects/[id]/files/route.ts` | POST | ファイルアップロード・テキスト抽出・AI期間解析・要約・フォルダ提案 |
| `api/projects/[id]/files/[fileId]/route.ts` | DELETE | ファイル個別削除（DB + 実ファイル、紐付きEntryのfileIdはnullに） |
| `api/projects/[id]/tasks/route.ts` | POST | ガントアイテム（タスク）手動作成 |
| `api/projects/[id]/tasks/[taskId]/route.ts` | PUT / DELETE | ガントアイテム編集・削除 |
| `api/settings/ai/route.ts` | GET / PUT | ユーザーのAI設定取得・更新（デフォルトは「使用しない」） |
| `api/settings/ai/models/route.ts` | GET | OllamaのAPIからインストール済みモデル一覧を取得 |
| `api/uploads/[...path]/route.ts` | GET | 認証付きファイル配信（パストラバーサル防止あり） |

---

### `src/components/` — UIコンポーネント

| ファイル | 役割 |
| ------- | ---- |
| `auth/LogoutButton.tsx` | セッションを破棄してログアウトするボタン |
| `gantt/GanttChart.tsx` | ガントチャート表示。水平線＋イベント円マーカー形式。ホバーでツールチップ、クリックでファイル表示・編集トリガー。表示範囲はイベントデータから動的に計算 |
| `project/EventEditModal.tsx` | ガントイベントのタイトル・要約・開始日・終了日を編集するモーダル。削除ボタンも内包 |
| `project/FileViewer.tsx` | ガントチャート下部に表示されるファイルビューアー。PDF（iframe）・画像・Markdown（react-markdown）・テキスト（pre）・その他を判別して表示 |
| `project/NewProjectForm.tsx` | プロジェクト新規作成フォーム（名前・説明） |
| `project/NewTaskForm.tsx` | タスクを手動登録するフォーム（タイトル・開始日・終了日） |
| `project/ProjectCard.tsx` | ダッシュボードのプロジェクトカード。タスク数・ファイル数・削除ボタンを表示 |
| `project/ProjectDeleteButton.tsx` | プロジェクト削除ボタン。確認ダイアログを表示してから DELETE API を呼ぶ |
| `project/ProjectLayout.tsx` | プロジェクト詳細画面を統括するクライアントコンポーネント。`selectedFile`・`selectedEvent` 状態を一元管理し、サイドバー・ガントチャート・FileViewer・EventEditModal を連携させる |
| `project/ProjectSidebar.tsx` | 左サイドバー。フォルダツリー形式のファイル一覧（folderで分類・展開/折りたたみ）、「イベントを追加」「ファイルを追加」「AI設定」ボタンを配置。ファイルクリックで FileViewer を開く |
| `providers/SessionProvider.tsx` | NextAuth の SessionProvider をラップしてアプリ全体に提供 |
| `settings/AISettingsModal.tsx` | AI設定モーダル。「使用しない」「Cloud API (OpenAI)」「ローカルLLM (Ollama)」をラジオボタンで選択。Ollama選択時はモデル一覧取得ボタンでドロップダウンを動的生成 |
| `upload/FileDropzone.tsx` | ファイルドロップUI。アップロード後にAI解析結果（タイトル・フォルダ名・日付）を確認・修正できるフォームを表示。AI解析エラーも表示 |
| `upload/FileList.tsx` | アップロード済みファイル一覧。サブフォルダ表示・削除ボタン付き（削除確認ダイアログあり） |

---

### `src/lib/ai/` — AI処理層

AIプロバイダーを差し替え可能にするための抽象化レイヤー。**外から見えるインターフェースを固定し、実装だけを交換できる**設計になっている。

#### `types.ts` — 型・インターフェース定義

```text
AIProviderType: "none" | "cloud" | "local"

AIProvider（インターフェース）
├── extractPeriod()   テキストから開始・終了日を抽出
├── summarize()       タイトルと要約を生成
└── suggestFolder()   ファイル内容から保存先サブフォルダ名を提案
```

分類（classify）機能は持たない。`"none"` 選択時は AI 解析をスキップし、フォームに空値が表示される。全プロバイダーがこのインターフェースを実装するため、呼び出し側はプロバイダーの種類を意識しなくてよい。

#### `prompts.ts` — プロンプトテンプレート

LLMに渡すプロンプト文字列を生成する関数。OpenAI でも Ollama でも同じプロンプトを使う。`buildExtractPeriodPrompt()`・`buildSummarizePrompt()`・`buildSuggestFolderPrompt()` の3種を提供。LLMが JSON 以外の余計なテキストを返した場合にも対応できる `parseJSONResponse()` も含む。

#### `factory.ts` — プロバイダーファクトリー

設定オブジェクトを受け取り、対応するプロバイダーのインスタンスを返す。下記3つの生成方法を持つ。

| 関数 | 使いどころ |
| ---- | --------- |
| `createAIProvider(config)` | 設定オブジェクトを直接渡す低レベルAPI |
| `createAIProviderFromEnv()` | 環境変数（`.env.local`）から生成。ユーザー設定がない場合のデフォルト |
| `createAIProviderFromUserConfig(userConfig)` | DBから取得したユーザー設定オブジェクトから生成 |

#### `server.ts` — API Route 用ヘルパー

API Route 内で使う想定の関数 `getAIProviderForUser(userId)` を提供。  
DB からそのユーザーの設定を取得し、未登録なら環境変数のデフォルトにフォールバックする。

```text
API Route
└─ getAIProviderForUser(userId)
      ├─ DBにユーザー設定あり → createAIProviderFromUserConfig()
      └─ なし              → createAIProviderFromEnv()
```

#### `index.ts` — 外部向けエクスポート窓口

`lib/ai/` 配下の型・関数をまとめて再エクスポートする。外部からは `import { ... } from "@/lib/ai"` の1行でインポートできる。

#### `providers/openai.ts`

OpenAI Chat Completions API を呼び出す実装。`temperature: 0.1` で分類タスクの出力を安定させている。

#### `providers/ollama.ts`

ローカルで動作する Ollama の `/api/generate` を呼び出す実装。モデル名（llama3 / gemma3 等）は設定で変更可能。

---

### `src/lib/auth/options.ts` — 認証設定

NextAuth.js の設定ファイル。メールアドレス＋パスワードによるログインを実装。JWT セッションを使用し、`session.user.id` に DB の User ID をセットする。

### `src/lib/db/prisma.ts` — Prisma クライアント

Prisma クライアントのシングルトン。Next.js の開発時ホットリロードで接続が大量に作られないよう `globalThis` を利用している。

### `src/types/next-auth.d.ts` — NextAuth 型拡張

NextAuth のデフォルト型には `session.user.id` が存在しないため、モジュール拡張で追加している。これにより API Route 内で型エラーなしに `session.user.id` を参照できる。

---

## データフロー概要

### ファイルアップロード → ガントチャート表示

```text
ファイルドロップ（FileDropzone）
  │
  ▼
POST /api/projects/[id]/files
  │
  ├─ ファイルを uploads/[project-name]/[subfolder]/ に保存
  ├─ テキスト抽出（PDF → pdf-parse / テキスト系 → UTF-8デコード）
  ├─ getAIProviderForUser(userId)  ← lib/ai/server.ts
  │     ├─ DBにユーザー設定（"none"以外）あり → createAIProviderFromUserConfig()
  │     └─ "none" or 未設定 → null（AI解析スキップ）
  ├─ ai.extractPeriod(text, today) → 開始・終了日
  ├─ ai.summarize(text)            → タイトル・要約
  └─ ai.suggestFolder(text)        → 保存先サブフォルダ提案
        │
        ▼
  AI解析結果をフロントに返却（aiSuggestion / aiError）
        │
        ▼
  ユーザーが確認・修正（FileDropzone 内フォーム）
  ├─ フォルダ名（AI提案・理由表示・編集可）
  ├─ タイトル（編集可）
  └─ 開始日 / 終了日（編集可）
        │
        ▼
  POST /api/projects/[id]/tasks
  └─ Entry + GanttItem を DB に保存（Prisma）
        │
        ▼
  GanttChart コンポーネントで表示（ProjectLayout経由）
  水平線 + 円マーカー形式（表示範囲はイベント日付から動的計算）
  マーカーホバー → ツールチップ（タイトル・日付・要約）
  マーカークリック → 下部 FileViewer + 編集ボタン表示
```

### ファイル・イベントの表示

```text
ProjectLayout（クライアント統括）
  ├─ selectedFile 状態   ← サイドバーファイルクリック or ガントイベントクリック
  │     └─ FileViewer を下部パネルに表示
  │           /api/uploads/[...path] 経由でファイルを取得・表示
  │           （PDF / 画像 / Markdown / テキストを自動判別）
  └─ selectedEvent 状態  ← ガントイベントクリック
        └─ 下部パネルヘッダーにイベント情報 + 「編集」ボタン表示
              └─ 「編集」クリック → EventEditModal
                    PUT /api/projects/[id]/tasks/[taskId] → DB更新 → 再描画
```

### ファイル削除

```text
サイドバー FileList の「削除」ボタン → 確認ダイアログ
  │
  ▼
DELETE /api/projects/[id]/files/[fileId]
  ├─ Entry.projectFileId を null に更新（外部キー制約回避）
  ├─ ProjectFile を DB から削除
  └─ uploads/ 以下の実ファイルを削除
```

### イベント削除

```text
EventEditModal の「削除」ボタン → 確認ダイアログ
  │
  ▼
DELETE /api/projects/[id]/tasks/[taskId]
  ├─ プロジェクトがこのユーザーのものか確認
  ├─ GanttItem がこのユーザーのものか確認（projectId が null の古いデータも対応）
  ├─ GanttItem を DB から削除
  └─ 紐付く Entry も削除
```

### プロジェクト削除

```text
ProjectDeleteButton → 確認ダイアログ
  │
  ▼
DELETE /api/projects/[id]
  ├─ uploads/[project-name]/ フォルダを物理削除
  ├─ Entry（cascade）→ GanttItem（cascade）を削除
  └─ ProjectFile（cascade）を削除
```

### 手動タスク作成

```text
サイドバー「イベントを追加」→ NewTaskForm（タイトル・開始日・終了日を手入力）
  │
  ▼
POST /api/projects/[id]/tasks
  └─ Entry + GanttItem を DB に保存
```
