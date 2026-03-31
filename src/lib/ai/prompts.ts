// カテゴリ分類・期間抽出で使うプロンプトテンプレート
// プロバイダーに依存しない共通ロジック

export function buildClassifyPrompt(
  text: string,
  categories: string[]
): string {
  return `以下の日記・テキストを分析し、最も適切なカテゴリと関連タグを返してください。

## 利用可能なカテゴリ
${categories.map((c, i) => `${i + 1}. ${c}`).join("\n")}

## 分析対象テキスト
${text}

## 出力形式（JSONのみ返すこと）
{
  "category": "<最も適切なカテゴリ名>",
  "confidence": <0.0〜1.0の確信度>,
  "tags": ["<タグ1>", "<タグ2>", ...]
}`
}

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

// LLMのJSON出力をパース（マークダウンコードブロックを除去）
export function parseJSONResponse<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
  return JSON.parse(cleaned) as T
}
