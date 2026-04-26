import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/auth"
import { updateProgress } from "@/lib/server/progress"

// PATCH /api/activities/:id/progress  body: { progressPercent: number }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = (await req.json()) as { progressPercent?: number }
    if (typeof body.progressPercent !== "number") {
      return NextResponse.json({ error: "progressPercent is required" }, { status: 400 })
    }
    await updateProgress(user.id, id, body.progressPercent)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
