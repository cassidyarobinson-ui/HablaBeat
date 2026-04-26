import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/auth"
import { startActivity } from "@/lib/server/progress"

// POST /api/activities/:id/start — mark an activity in_progress for the current user
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    await startActivity(user.id, id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
