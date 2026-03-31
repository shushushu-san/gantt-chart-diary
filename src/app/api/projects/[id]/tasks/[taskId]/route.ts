import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"

type Params = { params: Promise<{ id: string; taskId: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, taskId } = await params

  // プロジェクトがこのユーザーに属するか確認
  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // GanttItem がこのユーザーに属するか確認（projectId が null の古いエントリも対応）
  const ganttItem = await prisma.ganttItem.findFirst({
    where: { id: taskId },
    include: { entry: true },
  })
  if (!ganttItem || ganttItem.entry.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { title, summary, startDate, endDate } = await req.json()
  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: "title, startDate, endDate は必須です" }, { status: 400 })
  }

  const updated = await prisma.ganttItem.update({
    where: { id: taskId },
    data: {
      title,
      summary: summary ?? null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, taskId } = await params

  // プロジェクトがこのユーザーに属するか確認
  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // GanttItem がこのユーザーに属するか確認（projectId が null の古いエントリも対応）
  const ganttItem = await prisma.ganttItem.findFirst({
    where: { id: taskId },
    include: { entry: true },
  })
  if (!ganttItem || ganttItem.entry.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.ganttItem.delete({ where: { id: taskId } }),
    prisma.entry.delete({ where: { id: ganttItem.entryId } }),
  ])

  return NextResponse.json({ ok: true })
}
