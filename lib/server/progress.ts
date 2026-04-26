import { supabaseServer } from "@/lib/supabase/server"
import type { UserProgress } from "@/lib/supabase/types"

// All operations rely on RLS to scope rows to the calling user.
// `userId` is passed explicitly so callers can audit, but the policy on user_progress
// won't let you write a row that isn't yours.

export async function startActivity(userId: string, activityId: string) {
  const sb = await supabaseServer()
  const { error } = await sb.from("user_progress").upsert(
    {
      user_id: userId,
      activity_id: activityId,
      status: "in_progress",
      last_updated: new Date().toISOString(),
    },
    { onConflict: "user_id,activity_id" },
  )
  if (error) throw error
}

export async function updateProgress(userId: string, activityId: string, progressPercent: number) {
  const pct = Math.max(0, Math.min(100, Math.round(progressPercent)))
  const sb = await supabaseServer()
  const { error } = await sb
    .from("user_progress")
    .update({
      progress_percent: pct,
      status: pct >= 100 ? "completed" : "in_progress",
      last_updated: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("activity_id", activityId)
  if (error) throw error
}

export async function completeActivity(
  userId: string,
  activityId: string,
  opts: { score?: number; xp?: number } = {},
) {
  const sb = await supabaseServer()
  const { error } = await sb.from("user_progress").upsert(
    {
      user_id: userId,
      activity_id: activityId,
      progress_percent: 100,
      status: "completed",
      score: opts.score ?? null,
      xp: opts.xp ?? 0,
      last_updated: new Date().toISOString(),
    },
    { onConflict: "user_id,activity_id" },
  )
  if (error) throw error
}

// Fetches a user's full progress, joined with activity metadata. RLS limits visibility
// to either the user themselves or their teachers.
export async function getUserProgress(userId: string) {
  const sb = await supabaseServer()
  const { data, error } = await sb
    .from("user_progress")
    .select(
      "*, activity:activity (id, title, type, song_number, mode)",
    )
    .eq("user_id", userId)
    .order("last_updated", { ascending: false })
  if (error) throw error
  return data as (UserProgress & { activity: { id: string; title: string; type: string; song_number: number | null; mode: string | null } })[]
}
