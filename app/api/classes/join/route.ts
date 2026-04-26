import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/auth"
import { joinClass } from "@/lib/server/class"

// POST /api/classes/join  body: { joinCode: string }
export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const body = (await req.json()) as { joinCode?: string }
    if (!body.joinCode?.trim()) {
      return NextResponse.json({ error: "joinCode is required" }, { status: 400 })
    }
    const cls = await joinClass(user.id, body.joinCode.trim())
    return NextResponse.json({ class: cls })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
