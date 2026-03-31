import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"
import { rmSync, existsSync } from "fs"
import path from "path"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      files: { orderBy: { createdAt: "desc" } },
      entries: {
        include: { ganttItems: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // uploads/[project-name]/ フォルダを削除
  const uploadDir = path.join(process.cwd(), "uploads", project.name)
  if (existsSync(uploadDir)) {
    rmSync(uploadDir, { recursive: true, force: true })
  }

  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
