import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/auth"
import { createAssignment } from "@/lib/server/assignment"

// POST /api/assignments
//   body: { classId: string; title: string; dueAt?: string|null; activityIds: string[] }
export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const body = (await req.json()) as {
      classId?: string
      title?: string
      dueAt?: string | null
      activityIds?: string[]
    }
    if (!body.classId || !body.title?.trim() || !Array.isArray(body.activityIds)) {
      return NextResponse.json(
        { error: "classId, title, and activityIds are required" },
        { status: 400 },
      )
    }
    const a = await createAssignment(user.id, {
      classId: body.classId,
      title: body.title.trim(),
      dueAt: body.dueAt ?? null,
      activityIds: body.activityIds,
    })
    return NextResponse.json({ assignment: a })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
