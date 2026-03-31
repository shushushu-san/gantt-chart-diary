// ユーザーのAI設定を取得・更新するAPIルート
// GET /api/settings/ai  → 現在の設定を返す
// PUT /api/settings/ai  → 設定を保存する

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"
import type { UserAIConfig } from "@/lib/ai"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const config = await prisma.userAIConfig.findUnique({
    where: { userId: session.user.id },
  })

  // APIキーはレスポンスに含めない（マスク処理）
  return NextResponse.json({
    provider: config?.provider ?? "openai",
    openaiApiKeySet: !!config?.openaiApiKey,
    openaiModel: config?.openaiModel ?? "gpt-4o",
    ollamaBaseUrl: config?.ollamaBaseUrl ?? "http://localhost:11434",
    ollamaModel: config?.ollamaModel ?? "llama3",
  })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() as Partial<UserAIConfig> & {
    openaiApiKey?: string
  }

  // バリデーション
  if (body.provider && !["openai", "ollama"].includes(body.provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
  }

  const updated = await prisma.userAIConfig.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      provider: body.provider ?? "openai",
      openaiApiKey: body.openaiApiKey ?? null,
      openaiModel: body.openaiModel ?? "gpt-4o",
      ollamaBaseUrl: body.ollamaBaseUrl ?? "http://localhost:11434",
      ollamaModel: body.ollamaModel ?? "llama3",
    },
    update: {
      ...(body.provider && { provider: body.provider }),
      ...(body.openaiApiKey !== undefined && { openaiApiKey: body.openaiApiKey }),
      ...(body.openaiModel && { openaiModel: body.openaiModel }),
      ...(body.ollamaBaseUrl && { ollamaBaseUrl: body.ollamaBaseUrl }),
      ...(body.ollamaModel && { ollamaModel: body.ollamaModel }),
    },
  })

  return NextResponse.json({
    provider: updated.provider,
    openaiApiKeySet: !!updated.openaiApiKey,
    openaiModel: updated.openaiModel,
    ollamaBaseUrl: updated.ollamaBaseUrl,
    ollamaModel: updated.ollamaModel,
  })
}
