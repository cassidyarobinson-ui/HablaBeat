import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/auth"
import { getClassStudents, getClassProgress } from "@/lib/server/class"

// GET /api/classes/:id/students?withProgress=1
// RLS guarantees only members can read; the per-student progress join is teacher-only.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser()
    const { id } = await params
    const url = new URL(req.url)
    if (url.searchParams.get("withProgress")) {
      const data = await getClassProgress(id)
      return NextResponse.json({ students: data })
    }
    const data = await getClassStudents(id)
    return NextResponse.json({ students: data })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
