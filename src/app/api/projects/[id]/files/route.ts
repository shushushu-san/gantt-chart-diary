import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/lib/db/prisma"
import { writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

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
  return NextResponse.json(projectFile, { status: 201 })
}
