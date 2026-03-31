import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "メールアドレスとパスワードは必須です" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上にしてください" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, hashedPassword },
    select: { id: true, email: true, name: true },
  })

  return NextResponse.json(user, { status: 201 })
}
