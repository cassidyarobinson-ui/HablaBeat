import { supabaseServer } from "@/lib/supabase/server"
import type { AppUser } from "@/lib/supabase/types"

// Returns the app_user row for the signed-in caller, or null if unauthenticated.
// Throws if the auth session exists but no app_user row was created (which would mean
// the on_auth_user_created trigger didn't fire — usually a config issue).
export async function getCurrentUser(): Promise<AppUser | null> {
  const sb = await supabaseServer()
  const { data: auth } = await sb.auth.getUser()
  if (!auth.user) return null

  const { data, error } = await sb
    .from("app_user")
    .select("*")
    .eq("auth_id", auth.user.id)
    .single()

  if (error) throw error
  return data as AppUser
}

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) throw new Response("Unauthorized", { status: 401 })
  return user
}
