import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"
import { unlink } from "node:fs/promises"
import path from "node:path"

// PATCH /api/projects/[id]/files/[fileId] → ファイル名を変更
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, fileId } = await params
  const file = await prisma.projectFile.findFirst({
    where: { id: fileId, project: { id, userId: session.user.id } },
  })
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { name } = await req.json()
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name は必須です" }, { status: 400 })
  }

  const updated = await prisma.projectFile.update({
    where: { id: fileId },
    data: { name: name.trim() },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, fileId } = await params

  // 所有権確認
  const file = await prisma.projectFile.findFirst({
    where: {
      id: fileId,
      project: { id, userId: session.user.id },
    },
  })
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Entry.projectFileId を null に設定（外部キー制約回避）
  await prisma.entry.updateMany({
    where: { projectFileId: fileId },
    data: { projectFileId: null },
  })

  // DB から削除
  await prisma.projectFile.delete({ where: { id: fileId } })

  // ファイルシステムから削除（エラーは無視）
  if (file.url) {
    try {
      const filePath = path.join(process.cwd(), file.url)
      await unlink(filePath)
    } catch {
      // ファイルが存在しない場合も正常終了
    }
  }

  return NextResponse.json({ success: true })
}
