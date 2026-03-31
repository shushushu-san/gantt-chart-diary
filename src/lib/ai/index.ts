// lib/ai のエントリーポイント
// 外部からはここだけをimportする

export type {
  AIProvider,
  AIProviderType,
  AIConfig,
  ClassifyResult,
  PeriodResult,
  SummaryResult,
  OpenAIConfig,
  OllamaConfig,
} from "./types"

export {
  createAIProvider,
  createAIProviderFromEnv,
  createAIProviderFromUserConfig,
  type UserAIConfig,
} from "./factory"
