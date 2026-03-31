import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { files: true, entries: true } } },
  })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, description } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: "プロジェクト名は必須です" }, { status: 400 })
  }

  const project = await prisma.project.create({
    data: { name: name.trim(), description, userId: session.user.id },
  })
  return NextResponse.json(project, { status: 201 })
}
