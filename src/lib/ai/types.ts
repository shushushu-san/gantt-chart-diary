// AI プロバイダーの統一インターフェース
// 新しいプロバイダーを追加する場合はこのインターフェースを実装する

export type AIProviderType = "openai" | "ollama"

export interface ClassifyResult {
  category: string
  confidence: number // 0.0 ~ 1.0
  tags: string[]
}

export interface PeriodResult {
  startDate: Date | null
  endDate: Date | null
  isExplicit: boolean // テキストに明示的な日付があったか
}

export interface SummaryResult {
  title: string
  summary: string
}

export interface AIProvider {
  readonly providerType: AIProviderType
  classify(text: string, availableCategories: string[]): Promise<ClassifyResult>
  extractPeriod(text: string, baseDate: Date): Promise<PeriodResult>
  summarize(text: string): Promise<SummaryResult>
}

// プロバイダー設定の型
export interface OpenAIConfig {
  type: "openai"
  apiKey: string
  model: string // e.g. "gpt-4o"
  baseUrl?: string // カスタムエンドポイント（Azure等）
}

export interface OllamaConfig {
  type: "ollama"
  baseUrl: string // e.g. "http://localhost:11434"
  model: string   // e.g. "llama3", "gemma3", "mistral"
}

export type AIConfig = OpenAIConfig | OllamaConfig
