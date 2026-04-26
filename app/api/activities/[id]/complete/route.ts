import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/auth"
import { completeActivity } from "@/lib/server/progress"

// POST /api/activities/:id/complete  body: { score?: number; xp?: number }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = (await req.json().catch(() => ({}))) as { score?: number; xp?: number }
    await completeActivity(user.id, id, { score: body.score, xp: body.xp })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
