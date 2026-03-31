# プロジェクト構成解説

## ファイルツリー

```text
gantt-chart-diary/
│
├── .env.example                        # 必要な環境変数の一覧テンプレート
├── next.config.ts                      # Next.js 設定
├── tailwind.config.ts                  # Tailwind CSS 設定
├── postcss.config.js                   # PostCSS 設定（Tailwind のビルドに必要）
├── tsconfig.json                       # TypeScript 設定（@ パスエイリアス定義）
├── package.json                        # 依存パッケージ一覧・スクリプト定義
├── node_modules/                       # ※ gitignore済み。npm install で自動生成される依存パッケージ本体
│
├── prisma/
│   └── schema.prisma                   # データベーススキーマ定義
│
└── src/
    ├── app/                            # Next.js App Router のルーティング層
    │   ├── globals.css                 # グローバルスタイル
    │   ├── layout.tsx                  # 全ページ共通レイアウト
    │   ├── page.tsx                    # トップページ（/）
    │   └── api/
    │       └── settings/
    │           └── ai/
    │               └── route.ts        # AI設定 API（GET / PUT）
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

アプリが扱う全テーブルを定義するファイル。変更後は `npx prisma migrate dev` でDBに適用する。

| モデル | 役割 |
| ------ | ---- |
| `User` | ユーザー情報。メール・パスワードハッシュ・表示名を保持 |
| `Account` / `Session` / `VerificationToken` | NextAuth.js が使用する認証管理テーブル |
| `UserAIConfig` | ユーザーごとのAI設定（プロバイダー種別・APIキー・モデル名）。`User` と 1対1 |
| `Category` | ガントチャートのレーン（カテゴリ）。ユーザーがカスタム定義できる |
| `Entry` | 日記エントリ本体。テキスト内容・アップロードファイルのURLを保持 |
| `GanttItem` | ガントチャートのバー1本分。`Entry` と `Category` に紐づき、開始日・終了日・タグを持つ |

---

### `src/app/` — ルーティング層

#### `layout.tsx`

全ページ共通のHTMLラッパー。フォント・メタ情報・共通UIをここに置く。

#### `page.tsx`

トップページ（`/`）のエントリーポイント。現在は仮実装。今後ガントチャート表示画面になる。

#### `src/app/api/settings/ai/route.ts`

ユーザーのAI設定を操作するREST APIエンドポイント。

| メソッド | 動作 |
| ------- | ---- |
| `GET /api/settings/ai` | ログイン中ユーザーの現在のAI設定を返す（APIキーはマスク済み） |
| `PUT /api/settings/ai` | プロバイダー種別・APIキー・モデル名をDBに保存・更新する |

---

### `src/lib/ai/` — AI処理層

AIプロバイダーを差し替え可能にするための抽象化レイヤー。**外から見えるインターフェースを固定し、実装だけを交換できる**設計になっている。

#### `types.ts` — 型・インターフェース定義

```text
AIProvider（インターフェース）
├── classify()     テキストをカテゴリに分類
├── extractPeriod() テキストから開始・終了日を抽出
└── summarize()    タイトルと要約を生成
```

全プロバイダーがこのインターフェースを実装するため、呼び出し側はプロバイダーの種類を意識しなくてよい。

#### `prompts.ts` — プロンプトテンプレート

LLMに渡すプロンプト文字列を生成する関数。OpenAI でも Ollama でも同じプロンプトを使う。LLMが JSON 以外の余計なテキストを返した場合にも対応できる `parseJSONResponse()` も含む。

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

```text
ユーザー入力（テキスト/ファイル）
  │
  ▼
API Route（今後 /api/entries/classify 等で実装）
  │
  ├─ getAIProviderForUser(userId)  ←  lib/ai/server.ts
  │     └─ ユーザーのDB設定を参照
  │
  ├─ ai.classify(text, categories) → カテゴリ分類
  ├─ ai.extractPeriod(text, date)  → 開始・終了日抽出
  └─ ai.summarize(text)            → タイトル・要約生成
        │
        ▼
  GanttItem を DB に保存（prisma）
        │
        ▼
  フロントエンド: ガントチャートとして表示
  バーをクリック → Entry.sourceUrl から元資料を参照
```
