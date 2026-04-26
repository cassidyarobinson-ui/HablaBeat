import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/auth"
import { getUserProgress } from "@/lib/server/progress"

// GET /api/me/progress — current user's progress across all activities
export async function GET() {
  try {
    const user = await requireUser()
    const rows = await getUserProgress(user.id)
    return NextResponse.json({ progress: rows })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
