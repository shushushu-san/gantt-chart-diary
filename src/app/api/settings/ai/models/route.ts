import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"

// OllamaのAPIからインストール済みモデル一覧を取得する
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const baseUrl = req.nextUrl.searchParams.get("baseUrl") ?? "http://localhost:11434"

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      return NextResponse.json({ error: `Ollama接続エラー: ${res.status}` }, { status: 502 })
    }
    const data = await res.json() as { models: { name: string; size: number }[] }
    const models = (data.models ?? []).map((m) => ({
      name: m.name,
      sizeMB: Math.round(m.size / 1024 / 1024),
    }))
    return NextResponse.json({ models })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "不明なエラー"
    return NextResponse.json(
      { error: `Ollamaに接続できません。起動しているか確認してください。（${msg}）` },
      { status: 502 }
    )
  }
}
