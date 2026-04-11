import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"
import { getAIProviderForUser } from "@/lib/ai/server"
import { writeFile, mkdir, unlink } from "node:fs/promises"
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
  const useAI = formData.get("useAI") !== "false"

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // テキスト抽出 → AI解析（ファイル保存前にフォルダ名を決める）
  const extractedText = useAI ? await extractText(buffer, file.type) : ""

  let suggestedFolder: { folder: string; reason: string } | null = null
  let aiSuggestion: {
    title: string
    summary: string
    startDate: string | null
    endDate: string | null
    isExplicit: boolean
  } | null = null

  let aiError: string | null = null

  if (extractedText.trim().length > 0) {
    try {
      const ai = await getAIProviderForUser(session.user.id)
      if (ai !== null) {
        const baseDate = new Date()
        const [periodResult, summaryResult, folderResult] = await Promise.all([
          ai.extractPeriod(extractedText.slice(0, 4000), baseDate),
          ai.summarize(extractedText.slice(0, 4000)),
          ai.suggestFolder(extractedText.slice(0, 2000), project.name),
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
        suggestedFolder = folderResult
      }
    } catch (e) {
      aiError = e instanceof Error ? e.message : "AI解析に失敗しました"
    }
  }

  // ファイルを保存（AI提案フォルダは仮置き、ユーザー確認後に確定）
  // アップロード先: uploads/[project-name]/[subfolder]/
  const safeProjectName = project.name.replace(/[^a-zA-Z0-9\u3040-\u9FFF]/g, "_").slice(0, 40)
  const uploadDir = path.join(process.cwd(), "uploads", safeProjectName)
  await mkdir(uploadDir, { recursive: true })
  const baseName = path.basename(file.name)
  const safeName = baseName.replace(/[^a-zA-Z0-9._\u3040-\u9FFF-]/g, "_")
  const filename = `${Date.now()}-${safeName}`
  await writeFile(path.join(uploadDir, filename), buffer)

  const projectFile = await prisma.projectFile.create({
    data: {
      projectId: id,
      name: file.name,
      url: `/uploads/${safeProjectName}/${filename}`,
      mimeType: file.type,
      size: file.size,
      // subfolder はユーザー確認後に PATCH で更新する
    },
  })

  return NextResponse.json({ file: projectFile, aiSuggestion, suggestedFolder, aiError }, { status: 201 })
}

// PATCH /api/projects/[id]/files  → フォルダ名を一括変更
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { subfolder, newSubfolder } = await req.json()
  if (typeof subfolder !== "string" || typeof newSubfolder !== "string" || !newSubfolder.trim()) {
    return NextResponse.json({ error: "subfolder と newSubfolder は必須です" }, { status: 400 })
  }

  const safeNew = newSubfolder.trim().replace(/[\x00-\x1f\\<>:"|?*]/g, "-").replace(/\/+/g, "/").replace(/^\/|\/$/g, "")

  await prisma.projectFile.updateMany({
    where: { projectId: id, subfolder },
    data: { subfolder: safeNew },
  })

  return NextResponse.json({ success: true, newSubfolder: safeNew })
}

// DELETE /api/projects/[id]/files?subfolder=xxx  → フォルダ内全ファイルを削除
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const subfolder = req.nextUrl.searchParams.get("subfolder")
  if (!subfolder) return NextResponse.json({ error: "subfolder パラメータが必要です" }, { status: 400 })

  const files = await prisma.projectFile.findMany({ where: { projectId: id, subfolder } })

  for (const file of files) {
    // Entry の外部キーを null に
    await prisma.entry.updateMany({ where: { projectFileId: file.id }, data: { projectFileId: null } })
    await prisma.projectFile.delete({ where: { id: file.id } })
    if (file.url) {
      try { await unlink(path.join(process.cwd(), file.url)) } catch { /* ignore */ }
    }
  }

  return NextResponse.json({ success: true, deleted: files.length })
}
