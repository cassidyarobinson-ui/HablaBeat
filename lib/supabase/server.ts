import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Server-side Supabase client tied to the request cookies. RLS still applies — this
// runs queries as the signed-in user, not as the service role.
export async function supabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // setAll inside a Server Component will throw; safe to ignore — middleware refreshes the session.
          }
        },
      },
    },
  )
}
