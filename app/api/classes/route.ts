import { NextResponse } from "next/server"
import { requireUser } from "@/lib/server/auth"
import { createClass } from "@/lib/server/class"
import { supabaseServer } from "@/lib/supabase/server"

// GET /api/classes — list classes the user is a member of (any role)
export async function GET() {
  try {
    const user = await requireUser()
    const sb = await supabaseServer()
    const { data, error } = await sb
      .from("membership")
      .select("role, class:class (id, name, owner_id, join_code, created_at)")
      .eq("user_id", user.id)
    if (error) throw error
    return NextResponse.json({ classes: data })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST /api/classes  body: { name: string }
export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const body = (await req.json()) as { name?: string }
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }
    const cls = await createClass(user.id, body.name.trim())
    return NextResponse.json({ class: cls })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
