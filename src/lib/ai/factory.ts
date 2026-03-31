// AIプロバイダーのファクトリー
// 環境変数またはユーザー設定に基づいてプロバイダーを生成する

import type { AIProvider, AIConfig } from "./types"
import { OpenAIProvider } from "./providers/openai"
import { OllamaProvider } from "./providers/ollama"

export function createAIProvider(config: AIConfig): AIProvider {
  switch (config.type) {
    case "openai":
      return new OpenAIProvider(config)
    case "ollama":
      return new OllamaProvider(config)
    default:
      throw new Error(`Unknown AI provider type: ${(config as AIConfig).type}`)
  }
}

// 環境変数からデフォルト設定を生成（サーバーサイドAPI Route用）
export function createAIProviderFromEnv(): AIProvider {
  const type = process.env.AI_PROVIDER ?? "openai"

  if (type === "ollama") {
    const baseUrl = process.env.OLLAMA_BASE_URL
    const model = process.env.OLLAMA_MODEL
    if (!baseUrl || !model) {
      throw new Error(
        "OLLAMA_BASE_URL and OLLAMA_MODEL must be set when AI_PROVIDER=ollama"
      )
    }
    return createAIProvider({ type: "ollama", baseUrl, model })
  }

  // デフォルト: openai
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL ?? "gpt-4o"
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY must be set when AI_PROVIDER=openai")
  }
  return createAIProvider({ type: "openai", apiKey, model })
}

// ユーザー設定からプロバイダーを生成（DBのユーザー設定を直接受ける）
export function createAIProviderFromUserConfig(
  userConfig: UserAIConfig
): AIProvider {
  if (userConfig.provider === "none") {
    throw new Error("AI provider is set to none")
  }

  if (userConfig.provider === "ollama") {
    return createAIProvider({
      type: "ollama",
      baseUrl: userConfig.ollamaBaseUrl ?? "http://localhost:11434",
      model: userConfig.ollamaModel ?? "llama3",
    })
  }

  return createAIProvider({
    type: "openai",
    apiKey: userConfig.openaiApiKey ?? process.env.OPENAI_API_KEY ?? "",
    model: userConfig.openaiModel ?? "gpt-4o",
  })
}

// DBに保存するユーザーのAI設定型
export interface UserAIConfig {
  provider: "none" | "openai" | "ollama"
  // OpenAI
  openaiApiKey?: string // ユーザー独自キーを使う場合（任意）
  openaiModel?: string
  // Ollama
  ollamaBaseUrl?: string
  ollamaModel?: string
}
