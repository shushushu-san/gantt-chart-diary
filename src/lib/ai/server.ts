// API RouteでAIプロバイダーを使う際のヘルパー
// ユーザーのDB設定を読み込んでプロバイダーを生成する

import { prisma } from "@/lib/db/prisma"
import { createAIProviderFromUserConfig } from "@/lib/ai"
import type { AIProvider } from "@/lib/ai"

// ユーザーIDを元にそのユーザーのAI設定でプロバイダーを生成
// 未設定または "none" の場合は null を返す
export async function getAIProviderForUser(userId: string): Promise<AIProvider | null> {
  const config = await prisma.userAIConfig.findUnique({
    where: { userId },
  })

  // 設定なし or "none" の場合はAI解析を行わない
  if (!config || config.provider === "none") {
    return null
  }

  return createAIProviderFromUserConfig({
    provider: config.provider as "openai" | "ollama",
    openaiApiKey: config.openaiApiKey ?? undefined,
    openaiModel: config.openaiModel ?? undefined,
    ollamaBaseUrl: config.ollamaBaseUrl ?? undefined,
    ollamaModel: config.ollamaModel ?? undefined,
  })
}
