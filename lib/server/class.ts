import { supabaseServer } from "@/lib/supabase/server"
import type { ClassRow, ProgressStatus } from "@/lib/supabase/types"

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // omits I, O, 0, 1
function makeJoinCode(len = 6) {
  let s = ""
  for (let i = 0; i < len; i++) {
    s += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)]
  }
  return s
}

export async function createClass(userId: string, name: string): Promise<ClassRow> {
  const sb = await supabaseServer()

  // Retry once if we collide with an existing join code (extremely unlikely).
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await sb
      .from("class")
      .insert({ name, owner_id: userId, join_code: makeJoinCode() })
      .select("*")
      .single()
    if (!error && data) {
      // Add owner as teacher membership so RLS reads use the same path as other teachers.
      const { error: mErr } = await sb
        .from("membership")
        .insert({ user_id: userId, class_id: data.id, role: "teacher" })
      if (mErr) throw mErr
      return data as ClassRow
    }
    if (error && !/duplicate key value/.test(error.message)) throw error
  }
  throw new Error("Failed to allocate a unique join code")
}

export async function joinClass(userId: string, joinCode: string): Promise<ClassRow> {
  const sb = await supabaseServer()
  const { data: cls, error } = await sb
    .from("class")
    .select("*")
    .eq("join_code", joinCode.toUpperCase())
    .single()
  if (error || !cls) throw new Response("Invalid join code", { status: 404 })

  const { error: mErr } = await sb
    .from("membership")
    .upsert(
      { user_id: userId, class_id: cls.id, role: "student" },
      { onConflict: "user_id,class_id", ignoreDuplicates: true },
    )
  if (mErr) throw mErr
  return cls as ClassRow
}

export async function getClassStudents(classId: string) {
  const sb = await supabaseServer()
  const { data, error } = await sb
    .from("membership")
    .select("user_id, role, joined_at, app_user:app_user (id, display_name, email)")
    .eq("class_id", classId)
    .eq("role", "student")
  if (error) throw error
  return data
}

// Class progress matrix — used by the teacher dashboard.
// Returns one row per (student, activity) including students with no progress yet.
export async function getClassProgress(classId: string) {
  const sb = await supabaseServer()
  const { data, error } = await sb
    .from("membership")
    .select(
      `
      user_id,
      app_user:app_user (id, display_name),
      progress:user_progress!user_progress_user_id_fkey (
        activity_id,
        status,
        progress_percent,
        score,
        xp,
        last_updated
      )
      `,
    )
    .eq("class_id", classId)
    .eq("role", "student")
  if (error) throw error
  return data as Array<{
    user_id: string
    app_user: { id: string; display_name: string }
    progress: Array<{
      activity_id: string
      status: ProgressStatus
      progress_percent: number
      score: number | null
      xp: number
      last_updated: string
    }>
  }>
}
