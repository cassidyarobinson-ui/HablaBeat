import { supabaseServer } from "@/lib/supabase/server"
import type { Assignment } from "@/lib/supabase/types"

export interface CreateAssignmentInput {
  classId: string
  title: string
  dueAt?: string | null
  activityIds: string[]
}

// Creates an assignment + its ordered activity list. RLS guarantees only a teacher
// in the target class can write here.
export async function createAssignment(
  teacherId: string,
  input: CreateAssignmentInput,
): Promise<Assignment> {
  const sb = await supabaseServer()

  const { data: assignment, error } = await sb
    .from("assignment")
    .insert({
      class_id: input.classId,
      title: input.title,
      due_at: input.dueAt ?? null,
      created_by: teacherId,
    })
    .select("*")
    .single()
  if (error || !assignment) throw error ?? new Error("Failed to create assignment")

  if (input.activityIds.length > 0) {
    const rows = input.activityIds.map((activityId, i) => ({
      assignment_id: assignment.id,
      activity_id: activityId,
      order_index: i,
    }))
    const { error: aaErr } = await sb.from("assignment_activity").insert(rows)
    if (aaErr) throw aaErr
  }
  return assignment as Assignment
}

// Per-student status for one assignment — drives the "2/4 lessons" badge.
// Derived: counts user_progress rows where status='completed' across the assignment's activities.
export async function getAssignmentProgress(assignmentId: string) {
  const sb = await supabaseServer()

  // Fetch the assignment + its activities + the class's students in parallel.
  const [{ data: assignment, error: aErr }, { data: aaRows, error: aaErr }] = await Promise.all([
    sb.from("assignment").select("id, class_id, title, due_at").eq("id", assignmentId).single(),
    sb.from("assignment_activity").select("activity_id").eq("assignment_id", assignmentId),
  ])
  if (aErr || !assignment) throw aErr ?? new Error("Assignment not found")
  if (aaErr) throw aaErr

  const activityIds = (aaRows ?? []).map((r) => r.activity_id)
  const total = activityIds.length

  const { data: students, error: sErr } = await sb
    .from("membership")
    .select("user_id, app_user:app_user (id, display_name)")
    .eq("class_id", assignment.class_id)
    .eq("role", "student")
  if (sErr) throw sErr

  if (total === 0 || (students ?? []).length === 0) {
    return { assignment, total, students: [] as Array<{ user_id: string; display_name: string; completed: number; total: number }> }
  }

  // Single-pass query: completed counts per user.
  const { data: completed, error: cErr } = await sb
    .from("user_progress")
    .select("user_id, activity_id")
    .in("activity_id", activityIds)
    .eq("status", "completed")
    .in("user_id", (students ?? []).map((s) => s.user_id))
  if (cErr) throw cErr

  const completedByUser = new Map<string, number>()
  for (const row of completed ?? []) {
    completedByUser.set(row.user_id, (completedByUser.get(row.user_id) ?? 0) + 1)
  }

  return {
    assignment,
    total,
    students: (students ?? []).map((s) => ({
      user_id: s.user_id,
      display_name: (s.app_user as any)?.display_name ?? "—",
      completed: completedByUser.get(s.user_id) ?? 0,
      total,
    })),
  }
}
