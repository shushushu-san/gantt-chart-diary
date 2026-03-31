// 期間抽出・要約で使うプロンプトテンプレート
// プロバイダーに依存しない共通ロジック

export function buildPeriodPrompt(text: string, baseDate: Date): string {
  const baseDateStr = baseDate.toISOString().split("T")[0]
  return `以下のテキストから期間・日付情報を抽出してください。
基準日は ${baseDateStr} です。相対表現（今日、昨日、来週など）はこの日付を基準に解釈してください。

## テキスト
${text}

## 出力形式（JSONのみ返すこと）
{
  "startDate": "<YYYY-MM-DD形式 または null>",
  "endDate": "<YYYY-MM-DD形式 または null>",
  "isExplicit": <テキストに明示的な日付があればtrue>
}`
}

export function buildSummarizePrompt(text: string): string {
  return `以下のテキストを分析し、ガントチャートのバーに表示するための短いタイトルと要約を生成してください。

## テキスト
${text}

## 出力形式（JSONのみ返すこと）
{
  "title": "<20文字以内のタイトル>",
  "summary": "<100文字以内の要約>"
}`
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

## 出力形式（JSONのみ返すこと）
{
  "folder": "<フォルダ名>",
  "reason": "<50文字以内で判断理由を日本語で>"
}`
}

// LLMのJSON出力をパース（マークダウンコードブロックを除去）
export function parseJSONResponse<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
  return JSON.parse(cleaned) as T
}
