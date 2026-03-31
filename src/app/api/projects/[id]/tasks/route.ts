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

  const { title, categoryLabel, startDate, endDate } = await req.json()
  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: "title, startDate, endDate は必須です" }, { status: 400 })
  }

  // Entry + GanttItem をトランザクションで作成
  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.entry.create({
      data: {
        userId: session.user.id,
        projectId: id,
        content: title,
        sourceType: "text",
      },
    })
    const ganttItem = await tx.ganttItem.create({
      data: {
        entryId: entry.id,
        title,
        categoryLabel: categoryLabel ?? "未分類",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        tags: [],
      },
    })
    return ganttItem
  })

  return NextResponse.json(result, { status: 201 })
}
