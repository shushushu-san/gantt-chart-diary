// 期間抽出・要約で使うプロンプトテンプレート
// プロバイダーに依存しない共通ロジック

export function buildPeriodPrompt(text: string, baseDate: Date): string {
  const baseDateStr = baseDate.toISOString().split("T")[0]
  return `以下のテキストから期間・日付情報を抽出してください。
基準日は ${baseDateStr} です。相対表現（今日、昨日、来週など）はこの日付を基準に解釈してください。

## テキスト
${text}

## 重要: 説明文は不要です。JSONオブジェクトのみを出力してください。
{"startDate":"<YYYY-MM-DD または null>","endDate":"<YYYY-MM-DD または null>","isExplicit":<true or false>}`
}

export function buildSummarizePrompt(text: string): string {
  return `以下のテキストを分析し、ガントチャート用の短いタイトルと要約を生成してください。

## テキスト
${text}

## 重要: 説明文は不要です。JSONオブジェクトのみを出力してください。
{"title":"<20文字以内のタイトル>","summary":"<100文字以内の要約>"}`
}

export function buildSuggestFolderPrompt(text: string, projectName: string): string {
  return `以下の資料はプロジェクト「${projectName}」にアップロードされました。
資料の内容を分析し、保存フォルダ名を提案してください。

## 資料の内容（抜粋）
${text}

## 制約
- フォルダ名は英数字・ハイフン・アンダーバーのみ（例: meeting-notes, financial-report）
- 20文字以内
- 日本語不可

## 重要: 説明文は不要です。JSONオブジェクトのみを出力してください。
{"folder":"<フォルダ名>","reason":"<50文字以内の理由>"}`
}

// LLMのJSON出力をパース
// - DeepSeek-R1等の推論モデルが出力する <think>...</think> タグを除去
// - マークダウンコードブロックを除去
// - テキスト中の最初の {...} ブロックを抽出してパース
export function parseJSONResponse<T>(raw: string): T {
  // <think>...</think> を除去（推論モデル対応）
  const withoutThinking = raw.replace(/<think>[\s\S]*?<\/think>/gi, "")

  // マークダウンコードブロックを除去
  const withoutCodeBlock = withoutThinking
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim()

  // { から始まり } で終わる最初のJSONオブジェクトを抽出
  const match = withoutCodeBlock.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error(`JSON object not found in response: ${raw.slice(0, 200)}`)
  }

  return JSON.parse(match[0]) as T
}
