"use client"

import { createBrowserClient } from "@supabase/ssr"

// Singleton browser client. Reads the public env vars Next.js exposes to the bundle.
let _client: ReturnType<typeof createBrowserClient> | null = null

export function supabaseBrowser() {
  if (_client) return _client
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return _client
}
