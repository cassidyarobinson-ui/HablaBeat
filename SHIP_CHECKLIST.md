# HablaBeat — App Store Ship Checklist (v2, code-reviewed 2026-05-20)

Approach decision: **Stay hybrid (Capacitor).** A native rewrite is not worth it — see "Why hybrid" at the bottom. The Capacitor iOS project already exists at `ios/App/App.xcworkspace`.

---

## 🔴 Must-fix blockers (found by reading the code)

### A. Add the microphone permission string (CRITICAL — guaranteed rejection without it)
Sing mode calls `navigator.mediaDevices.getUserMedia({ audio: ... })` (`app/page.tsx`, `startMic`). On iOS, a WKWebView mic request **crashes / silently fails** unless `Info.plist` contains `NSMicrophoneUsageDescription`. The current `ios/App/App/Info.plist` has NO usage strings at all.
- Add to `ios/App/App/Info.plist`:
  - `NSMicrophoneUsageDescription` = "HablaBeat uses your microphone for sing-along mode, to detect when you're singing along to the song."
- Without this: Apple rejects under Guideline 2.1 (crash) or 5.1.1 (privacy).

### B. Songs — VERIFIED FINE (no longer a blocker)
Checked the code: lyrics load via `fetch('/timing/song-N.json')` and audio via `audioUrl: '/audio/song-N.m4a'` — both are **relative paths to files bundled in the app**, not server calls. `out/audio/` has all 50 songs (94 MB) and they're synced into `ios/App/App/public/audio/`. Songs play locally/offline. The fetch also has a `.catch`, so a failure can't crash the app. No action needed; just eyeball one song in the simulator for peace of mind.

---

## ✅ Good news the code review confirmed
- **No login/accounts in the iOS app.** The static export excludes all auth/server routes; there's no sign-in UI in `out/`. → No demo account needed for review, and **no account-deletion requirement** (Guideline 5.1.1(v) doesn't apply).
- **Leaderboard is device-local only** (`localStorage`, key `hablabeat-leaderboard`). Names never leave the phone → not "data collection."
- **Strong 4.2 case**: real interactive games (DDR bubble pop, ~12 "fly" mini-games, sing mode with pitch detection, visualizer, maps). This is clearly more than a website.

## 🟡 Verify before answering App Privacy
- `@vercel/analytics` is a dependency. If it runs in the iOS build, it collects usage data → App Privacy must say "Data Collected → Usage Data" (not "Not Collected"). Check whether the analytics component is rendered in the iOS layout; if so, either disclose it or disable it for the native build. Easiest: disable analytics in the Capacitor build and answer "Data Not Collected."

---

## Steps to ship

### 1. Apply blocker fix A + open in Xcode
```
cd "/Users/cassidyrobinson/Desktop/DDR Files/HablaBeat"
# (add NSMicrophoneUsageDescription to ios/App/App/Info.plist — see A)
npm run build:ios          # rebuild static export + cap sync
npx cap open ios           # opens ios/App/App.xcworkspace in Xcode
```

### 2. Run in the simulator (verify blocker B)
- Pick **iPhone 17 Pro Max**, Cmd+R.
- Confirm: songs play, lyrics show, sing mode prompts for mic permission (and the prompt text is your usage string), games work.
- If a song won't load → the audio/lyrics fetch URL is relative; make it absolute, then `npm run build:ios` again.

### 3. Host privacy policy + a REAL support page
Lesson from PauseText: Apple rejects a Support URL that just points at the privacy policy (Guideline 1.5.0). Make BOTH:
- Privacy policy page (use `PRIVACY_POLICY.md`)
- A separate **support page** with a contact email + short FAQ (a `support.html` like PauseText's)
- Host both on GitHub Pages (e.g. repo `hablabeat-privacy`, with `index.md` + `support.html`).

### 4. Screenshots (6.9" iPhone, 1320×2868)
Lead with the games: DDR bubble pop mid-play, a fly mini-game, sing mode with word highlighting, the map/Americas screen, a win/celebration with the bunny. Cmd+S in the simulator.

### 5. Verify signing
Xcode → blue **App** project → **App** target → Signing & Capabilities → Team = your paid account (VWZGXYFHXF), Bundle ID `com.hablabeat.app`, "Automatically manage signing" checked.

### 6. Archive → Upload (same as PauseText)
- Device dropdown → **Any iOS Device (arm64)**
- Product → Archive → Distribute App → App Store Connect → Upload
- Answer the export-compliance question: **None of the algorithms** (no custom encryption) → "Ready to Submit"

### 7. Create the App Store Connect listing (NEW — HablaBeat isn't there yet)
- appstoreconnect.apple.com → Apps → **+** → New App
  - Platform iOS · Name **HablaBeat** · Language English (US) · Bundle ID `com.hablabeat.app` · SKU `hablabeat-1`
- App Information: Category **Education** (secondary **Music**), age rating 4+
- Pricing: **Free** (if you ever charge for content later, you must use Apple In-App Purchase — Guideline 3.1.1)
- Version 1.0 metadata from `APP_STORE_METADATA.md`, screenshots, Privacy Policy URL, Support URL (the real support page), Marketing URL `https://hablabeat.com`, select the build
- App Privacy: see the analytics note above before answering

### 8. Submit for review
Submit at top right. ~24–48 hr.

---

## Substantive risk to be honest about: music licensing
HablaBeat plays Spanish songs. If those are **copyrighted commercial tracks you don't have a license for**, that's both an App Store rejection risk (Apple asks music apps to prove rights) and a real legal exposure. Approval is far safer if the songs are original, royalty-free, or properly licensed. Worth confirming before submitting.

---

## Why hybrid (not a native rewrite)
The codebase is large and mature: a ~3,800-line `app/page.tsx`, ~20 interactive game components (`ddr-game`, `sing-mode-view`, `visualizer-view`, and ~12 `*-fly` games), audio-context pitch detection, MapLibre/Mapbox maps, Radix UI, Supabase (web side). Rebuilding all of that in SwiftUI would take months for zero user-visible benefit, and the app already clears Apple's "more than a website" bar through its games. Capacitor is the correct call and is already wired up.
