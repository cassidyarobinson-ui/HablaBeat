import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/auth"
import { getAssignmentProgress } from "@/lib/server/assignment"

// GET /api/assignments/:id/progress — completion matrix for one assignment.
// Visible to anyone in the class (RLS); only carries student-level detail when caller is a teacher.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser()
    const { id } = await params
    const data = await getAssignmentProgress(id)
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
