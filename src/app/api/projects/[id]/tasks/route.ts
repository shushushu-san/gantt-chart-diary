import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const entries = await prisma.entry.findMany({
    where: { projectId: id, userId: session.user.id },
    include: { ganttItems: true },
    orderBy: { createdAt: "desc" },
  })
  const tasks = entries.flatMap((e) => e.ganttItems)
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { title, summary, startDate, endDate, fileId, subfolder } = await req.json()
  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: "title, startDate, endDate は必須です" }, { status: 400 })
  }

  // fileId が指定された場合、そのファイルがこのプロジェクトに属するか確認
  if (fileId) {
    const pf = await prisma.projectFile.findFirst({ where: { id: fileId, projectId: id } })
    if (!pf) return NextResponse.json({ error: "file not found" }, { status: 404 })
  }

  // Entry + GanttItem をトランザクションで作成
  const result = await prisma.$transaction(async (tx) => {
    // subfolderが指定された場合、ProjectFileを更新
    if (fileId && subfolder) {
      await tx.projectFile.update({
        where: { id: fileId },
        data: { subfolder },
      })
    }
    const entry = await tx.entry.create({
      data: {
        userId: session.user.id,
        projectId: id,
        projectFileId: fileId ?? null,
        content: title,
        sourceType: fileId ? "file" : "text",
      },
    })
    const ganttItem = await tx.ganttItem.create({
      data: {
        entryId: entry.id,
        title,
        summary: summary ?? null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        tags: [],
      },
    })
    return ganttItem
  })

  return NextResponse.json(result, { status: 201 })
}
