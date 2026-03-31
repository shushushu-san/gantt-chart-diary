// API RouteでAIプロバイダーを使う際のヘルパー
// ユーザーのDB設定を読み込んでプロバイダーを生成する

import { prisma } from "@/lib/db/prisma"
import { createAIProviderFromUserConfig, createAIProviderFromEnv } from "@/lib/ai"
import type { AIProvider } from "@/lib/ai"

// ユーザーIDを元にそのユーザーのAI設定でプロバイダーを生成
// 設定が未登録の場合は環境変数のデフォルト設定にフォールバック
export async function getAIProviderForUser(userId: string): Promise<AIProvider> {
  const config = await prisma.userAIConfig.findUnique({
    where: { userId },
  })

  if (!config) {
    return createAIProviderFromEnv()
  }

  return createAIProviderFromUserConfig({
    provider: config.provider as "openai" | "ollama",
    openaiApiKey: config.openaiApiKey ?? undefined,
    openaiModel: config.openaiModel ?? undefined,
    ollamaBaseUrl: config.ollamaBaseUrl ?? undefined,
    ollamaModel: config.ollamaModel ?? undefined,
  })
}
