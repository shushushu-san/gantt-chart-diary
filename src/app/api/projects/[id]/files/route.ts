import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"
import { getAIProviderForUser } from "@/lib/ai/server"
import { writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

// ファイルからテキストを抽出する
async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  // PDF
  if (mimeType === "application/pdf") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>
      const data = await pdfParse(buffer)
      return data.text
    } catch {
      return ""
    }
  }
  // テキスト系（txt / md / csv 等）
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === ""
  ) {
    return buffer.toString("utf-8")
  }
  return ""
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // ファイルを保存
  const uploadDir = path.join(process.cwd(), "uploads", id)
  await mkdir(uploadDir, { recursive: true })
  const baseName = path.basename(file.name)
  const safeName = baseName.replace(/[^a-zA-Z0-9._\u3040-\u9FFF-]/g, "_")
  const filename = `${Date.now()}-${safeName}`
  await writeFile(path.join(uploadDir, filename), buffer)

  const projectFile = await prisma.projectFile.create({
    data: {
      projectId: id,
      name: file.name,
      url: `/uploads/${id}/${filename}`,
      mimeType: file.type,
      size: file.size,
    },
  })

  // テキスト抽出 → AI解析
  let aiSuggestion: {
    title: string
    summary: string
    startDate: string | null
    endDate: string | null
    isExplicit: boolean
  } | null = null

  const extractedText = await extractText(buffer, file.type)
  if (extractedText.trim().length > 0) {
    try {
      const ai = await getAIProviderForUser(session.user.id)
      const baseDate = new Date()
      const [periodResult, summaryResult] = await Promise.all([
        ai.extractPeriod(extractedText.slice(0, 4000), baseDate),
        ai.summarize(extractedText.slice(0, 4000)),
      ])
      aiSuggestion = {
        title: summaryResult.title,
        summary: summaryResult.summary,
        startDate: periodResult.startDate
          ? periodResult.startDate.toISOString().split("T")[0]
          : null,
        endDate: periodResult.endDate
          ? periodResult.endDate.toISOString().split("T")[0]
          : null,
        isExplicit: periodResult.isExplicit,
      }
    } catch {
      // AI解析に失敗してもファイル保存は成功扱い
    }
  }

  return NextResponse.json({ file: projectFile, aiSuggestion }, { status: 201 })
}
