// Hand-written subset. Replace with `supabase gen types typescript` output once
// the schema has stabilized.

export type MembershipRole = "student" | "teacher"
export type ActivityType = "lesson" | "quiz" | "exercise"
export type ProgressStatus = "not_started" | "in_progress" | "completed"

export interface AppUser {
  id: string
  auth_id: string
  display_name: string
  email: string
  created_at: string
}

export interface ClassRow {
  id: string
  name: string
  owner_id: string
  join_code: string
  created_at: string
}

export interface Membership {
  user_id: string
  class_id: string
  role: MembershipRole
  joined_at: string
}

export interface Activity {
  id: string
  title: string
  type: ActivityType
  song_number: number | null
  mode: string | null
}

export interface UserProgress {
  user_id: string
  activity_id: string
  progress_percent: number
  status: ProgressStatus
  score: number | null
  xp: number
  last_updated: string
}

export interface Assignment {
  id: string
  class_id: string
  title: string
  due_at: string | null
  created_by: string
  created_at: string
}

export interface AssignmentActivity {
  assignment_id: string
  activity_id: string
  order_index: number
}
