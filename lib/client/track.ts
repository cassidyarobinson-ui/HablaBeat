// Fire-and-forget tracking calls to the Supabase-backed API routes.
// Silently swallow failures so unauthenticated users aren't disrupted —
// localStorage remains the source of truth for gameplay UI state.

function activityIdFor(songNumber: number, mode: "play" | "practice") {
  return `song-${songNumber}-${mode}`
}

function safeFetch(url: string, init?: RequestInit) {
  if (typeof window === "undefined") return Promise.resolve()
  return fetch(url, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  }).catch(() => undefined)
}

export function trackStart(songNumber: number, mode: "play" | "practice") {
  void safeFetch(`/api/activities/${activityIdFor(songNumber, mode)}/start`, {
    method: "POST",
  })
}

export function trackComplete(
  songNumber: number,
  mode: "play" | "practice",
  opts: { score?: number; xp?: number } = {},
) {
  void safeFetch(`/api/activities/${activityIdFor(songNumber, mode)}/complete`, {
    method: "POST",
    body: JSON.stringify(opts),
  })
}
