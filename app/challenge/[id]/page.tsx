"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"

const DDRGame = dynamic(() => import("@/components/ddr-game"), { ssr: false })
const SongFly = dynamic(() => import("@/components/song-fly"), { ssr: false })

interface ChallengeData {
  mode?: "fly" | "pop"  // fly or pop (default pop for backwards compat)
  s: number    // song number
  t: string    // song title
  sc: number   // challenger score
  g?: string   // challenger grade (pop only)
  fc?: number  // challenger flow combo (pop only)
  n?: string   // challenger name
  p?: string   // challenger photo base64
  vb?: number  // total vocab bank
  bf?: number  // best flow
  cs?: number  // total challenges sent
  cw?: number  // challenges won
  str?: number // daily streak
}

type Stage = "intro" | "playing" | "result"

export default function ChallengePage() {
  const params = useParams()
  const [challenge, setChallenge] = useState<ChallengeData | null>(null)
  const [error, setError] = useState(false)
  const [stage, setStage] = useState<Stage>("intro")
  const [myScore, setMyScore] = useState(0)
  const [myGrade, setMyGrade] = useState("")
  const [myFlow, setMyFlow] = useState(0)
  const [lbName, setLbName] = useState("")
  const [lbPosted, setLbPosted] = useState(false)

  // Decode the URL-safe base64 challenge payload
  useEffect(() => {
    try {
      const id = Array.isArray(params.id) ? params.id[0] : params.id
      const standard = id.replace(/-/g, "+").replace(/_/g, "/")
      const padded = standard + "==".slice(0, (4 - standard.length % 4) % 4)
      const decoded = JSON.parse(atob(padded))
      setChallenge(decoded)
    } catch {
      setError(true)
    }
  }, [params.id])

  // Load saved user name for leaderboard
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hablabeat-user-name")
      if (saved) setLbName(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const postToLeaderboard = () => {
    if (!challenge) return
    const name = lbName.trim() || "Anonymous"
    const entry = {
      name,
      flow: isFly ? 0 : myFlow,
      bank: myScore,
      grade: isFly ? "—" : myGrade,
      song: challenge.t,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      mode: isFly ? "fly" as const : "pop" as const,
    }
    try {
      const existing = JSON.parse(localStorage.getItem("hablabeat-leaderboard") || "[]")
      const updated = [...existing, entry]
      updated.sort((a: { bank: number; flow: number }, b: { bank: number; flow: number }) => b.bank - a.bank || b.flow - a.flow)
      localStorage.setItem("hablabeat-leaderboard", JSON.stringify(updated.slice(0, 100)))
    } catch { /* ignore */ }
    // Also save the name for future use
    localStorage.setItem("hablabeat-user-name", JSON.stringify(name))
    setLbPosted(true)
  }

  const isFly = challenge?.mode === "fly"

  const GRADE_ORDER = ["F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"]
  const gradeRank = (g: string) => GRADE_ORDER.indexOf(g)

  const handlePopGameEnd = (_songNum: number, flow: number, bank: number, grade: string) => {
    setMyScore(bank)
    setMyGrade(grade)
    setMyFlow(flow)
    setStage("result")
  }

  const handleFlyGameEnd = (score: number) => {
    setMyScore(score)
    setStage("result")
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #6d28d9 100%)" }}>
        <div className="text-center">
          <p className="text-6xl mb-4">😕</p>
          <h1 className="text-2xl font-black text-white mb-2">Invalid Challenge Link</h1>
          <p className="text-white/50 mb-6">This link looks broken or expired.</p>
          <a href="/" className="px-6 py-3 rounded-full font-black text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 4px 16px rgba(168,85,247,0.5)", border: "1.5px solid rgba(255,255,255,0.3)" }}>
            Go to HablaBeat
          </a>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #6d28d9 100%)" }}>
        <p className="text-white/50 text-lg animate-pulse">Loading challenge…</p>
      </div>
    )
  }

  const challengerName = challenge.n || "Someone"
  const challengerPhoto = challenge.p || ""

  // ── Intro / accept screen ──
  if (stage === "intro") {
    const hasStats = challenge.vb || challenge.bf || challenge.cw || challenge.str
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 20%, #4c1d95 40%, #6d28d9 60%, #7c3aed 80%, #a855f7 100%)" }}>
        {/* Floating decorative coins */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute pointer-events-none" style={{
            left: `${10 + (i * 23) % 80}%`,
            top: `${5 + (i * 17) % 70}%`,
            fontSize: `${18 + (i * 5) % 20}px`,
            opacity: 0.15,
            animation: `floatCoin ${3 + (i * 0.7) % 3}s ease-in-out infinite ${i * 0.4}s`,
          }}>✦</div>
        ))}

        <div className="max-w-sm w-full text-center relative z-10">
          {/* Challenger avatar + name */}
          <div className="mb-5">
            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 shadow-2xl mb-3" style={{ borderColor: "rgba(255,255,255,0.4)", boxShadow: "0 0 30px rgba(168,85,247,0.5)" }}>
              {challengerPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={challengerPhoto} alt={challengerName} className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-5xl" style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>🐰</span>
              )}
            </div>
            <p className="text-2xl font-black text-white leading-tight">{challengerName}</p>
            <p className="text-white/60 text-sm mt-0.5">has challenged you! ⚔️</p>
            {(challenge.str ?? 0) >= 2 && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(249,115,22,0.25)", color: "#fdba74", border: "1px solid rgba(249,115,22,0.3)" }}>
                🔥 {challenge.str}-day streak
              </span>
            )}
          </div>

          {/* Score to beat card */}
          <div className="rounded-3xl p-5 mb-5" style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">
              {isFly ? "🦋 Fly" : "🥕 Pop"} Score to Beat
            </p>
            <p className="text-white font-black text-base mb-4">{challenge.t}</p>

            {isFly ? (
              <div className="py-3 rounded-2xl" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}>
                <p className="text-4xl font-black" style={{ color: "#fbbf24" }}>{challenge.sc}</p>
                <p className="text-white/40 text-xs mt-1">💰 Score</p>
              </div>
            ) : (
              <div className="flex justify-center gap-4">
                <div className="flex-1 py-3 rounded-2xl" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}>
                  <p className="text-2xl font-black text-yellow-300">{challenge.g}</p>
                  <p className="text-white/40 text-xs mt-1">Grade</p>
                </div>
                <div className="flex-1 py-3 rounded-2xl" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}>
                  <p className="text-2xl font-black text-yellow-400">{challenge.sc}</p>
                  <p className="text-white/40 text-xs mt-1">💰 Bank</p>
                </div>
                <div className="flex-1 py-3 rounded-2xl" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)" }}>
                  <p className="text-2xl font-black text-orange-300">{challenge.fc}</p>
                  <p className="text-white/40 text-xs mt-1">🔥 Flow</p>
                </div>
              </div>
            )}

            {/* Stats row */}
            {hasStats && (
              <div className="flex justify-center gap-3 mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                {(challenge.vb ?? 0) > 0 && (
                  <div className="text-center">
                    <p className="text-sm font-black text-yellow-300">{challenge.vb}</p>
                    <p className="text-white/30 text-[10px]">💰 Bank</p>
                  </div>
                )}
                {(challenge.bf ?? 0) > 0 && (
                  <div className="text-center">
                    <p className="text-sm font-black text-orange-300">{challenge.bf}</p>
                    <p className="text-white/30 text-[10px]">🔥 Flow</p>
                  </div>
                )}
                {(challenge.cw ?? 0) > 0 && (
                  <div className="text-center">
                    <p className="text-sm font-black text-purple-300">{challenge.cw}</p>
                    <p className="text-white/30 text-[10px]">⚔️ Won</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Accept button */}
          <div className="rounded-full p-[2px] mb-3" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))", boxShadow: isFly ? "0 6px 24px rgba(6,182,212,0.5)" : "0 6px 24px rgba(249,115,22,0.5)" }}>
            <button
              onClick={() => setStage("playing")}
              className="w-full py-4 rounded-full font-black text-xl text-white transition-all active:scale-95"
              style={{ background: isFly ? "linear-gradient(135deg, #06b6d4, #8b5cf6)" : "linear-gradient(135deg, #f97316, #ef4444)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }}
            >
              <span style={{ display: "inline-block", animation: "btnBounce 0.9s ease-in-out infinite" }}>{isFly ? "🦋" : "🥕"}</span>
              {" "}Accept Challenge!
            </button>
          </div>

          <a href="/" className="text-white/30 text-sm hover:text-white/50 transition-colors">
            Go to HablaBeat instead
          </a>
        </div>

        <style jsx>{`
          @keyframes floatCoin {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-12px) rotate(8deg); }
          }
          @keyframes btnBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
        `}</style>
      </div>
    )
  }

  // ── Playing ──
  if (stage === "playing") {
    if (isFly) {
      return (
        <SongFly
          songNumber={challenge.s}
          coins={0}
          onCoinsChange={() => {}}
          onClose={() => setStage("intro")}
          onGameEnd={handleFlyGameEnd}
        />
      )
    }
    return (
      <DDRGame
        songNumber={challenge.s}
        songTitle={challenge.t}
        onBack={() => setStage("intro")}
        onGameEnd={handlePopGameEnd}
      />
    )
  }

  // ── Result screen ──
  let outcome: "win" | "lose" | "tie"

  if (isFly) {
    if (myScore > challenge.sc) outcome = "win"
    else if (myScore < challenge.sc) outcome = "lose"
    else outcome = "tie"
  } else {
    const myRank = gradeRank(myGrade)
    const theirRank = gradeRank(challenge.g || "F")
    if (myRank > theirRank) outcome = "win"
    else if (myRank < theirRank) outcome = "lose"
    else if (myScore > challenge.sc) outcome = "win"
    else if (myScore < challenge.sc) outcome = "lose"
    else outcome = "tie"
  }

  const resultConfig = {
    win:  { emoji: "🎉", headline: "You Win!", sub: `You crushed ${challengerName}!`, grad: "linear-gradient(160deg, #1a1200 0%, #4a3800 30%, #854d0e 60%, #ca8a04 100%)", glow: "rgba(202,138,4,0.5)", accent: "#fbbf24", border: "rgba(251,191,36,0.3)" },
    lose: { emoji: "😤", headline: "You Lose!", sub: `${challengerName} got you… rematch??`, grad: "linear-gradient(160deg, #1a0000 0%, #4a0000 30%, #7f1d1d 60%, #dc2626 100%)", glow: "rgba(220,38,38,0.5)", accent: "#f87171", border: "rgba(248,113,113,0.3)" },
    tie:  { emoji: "🤝", headline: "It's a Tie!", sub: "Dead even — incredibly close!", grad: "linear-gradient(160deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #7c3aed 100%)", glow: "rgba(124,58,237,0.5)", accent: "#a78bfa", border: "rgba(167,139,250,0.3)" },
  }[outcome]

  const myPopRank = gradeRank(myGrade)
  const theirPopRank = gradeRank(challenge.g || "F")

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: resultConfig.grad }}>
      {/* Floating particles */}
      {[...Array(10)].map((_, i) => (
        <div key={i} className="absolute pointer-events-none" style={{
          left: `${5 + (i * 19) % 85}%`,
          top: `${3 + (i * 13) % 75}%`,
          fontSize: `${14 + (i * 4) % 18}px`,
          opacity: 0.15,
          animation: `floatCoin ${3 + (i * 0.5) % 3}s ease-in-out infinite ${i * 0.3}s`,
        }}>{outcome === "win" ? "✦" : outcome === "lose" ? "💀" : "✦"}</div>
      ))}

      <div className="max-w-sm w-full text-center relative z-10">
        {/* Result emoji */}
        <p className="text-7xl mb-2" style={{ animation: "resultBounce 1s ease-in-out infinite" }}>{resultConfig.emoji}</p>
        <h1 className="text-4xl font-black mb-1" style={{ color: resultConfig.accent, textShadow: `0 0 30px ${resultConfig.glow}` }}>{resultConfig.headline}</h1>
        <p className="text-white/50 text-sm mb-6">{resultConfig.sub}</p>

        {/* Score comparison card */}
        <div className="rounded-3xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.08)", border: `1.5px solid ${resultConfig.border}`, backdropFilter: "blur(12px)", boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)` }}>
          {/* Column headers */}
          <div className="grid grid-cols-3 gap-2 text-center mb-3 items-center">
            <div></div>
            <div className="text-xs font-black text-white/60 uppercase tracking-wider">You</div>
            <div className="flex flex-col items-center gap-0.5">
              {challengerPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={challengerPhoto} alt={challengerName} className="w-7 h-7 rounded-full object-cover" style={{ border: "2px solid rgba(255,255,255,0.3)" }} />
              ) : (
                <span className="text-lg">🐰</span>
              )}
              <span className="text-[10px] text-white/40 font-bold truncate w-16">{challengerName.slice(0, 8)}</span>
            </div>
          </div>

          {isFly ? (
            <div className="grid grid-cols-3 gap-2 text-center items-center py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="text-left pl-3 text-sm text-white/40 font-bold">💰 Score</div>
              <div className={`text-2xl font-black ${myScore >= challenge.sc ? "text-yellow-300" : "text-white/30"}`}>{myScore}</div>
              <div className={`text-2xl font-black ${challenge.sc >= myScore ? "text-yellow-300" : "text-white/30"}`}>{challenge.sc}</div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-2 text-center items-center py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="text-left pl-3 text-sm text-white/40 font-bold">Grade</div>
                <div className={`text-2xl font-black ${myPopRank >= theirPopRank ? "text-yellow-300" : "text-white/30"}`}>{myGrade}</div>
                <div className={`text-2xl font-black ${theirPopRank >= myPopRank ? "text-yellow-300" : "text-white/30"}`}>{challenge.g}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center items-center py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="text-left pl-3 text-sm text-white/40 font-bold">💰 Bank</div>
                <div className={`text-2xl font-black ${myScore >= challenge.sc ? "text-yellow-400" : "text-white/30"}`}>{myScore}</div>
                <div className={`text-2xl font-black ${challenge.sc >= myScore ? "text-yellow-400" : "text-white/30"}`}>{challenge.sc}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center items-center py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="text-left pl-3 text-sm text-white/40 font-bold">🔥 Flow</div>
                <div className={`text-2xl font-black ${myFlow >= (challenge.fc ?? 0) ? "text-orange-300" : "text-white/30"}`}>{myFlow}</div>
                <div className={`text-2xl font-black ${(challenge.fc ?? 0) >= myFlow ? "text-orange-300" : "text-white/30"}`}>{challenge.fc}</div>
              </div>
            </div>
          )}
        </div>

        {/* Post to leaderboard */}
        {!lbPosted ? (
          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(168,85,247,0.4)", backdropFilter: "blur(8px)" }}>
            <p className="text-white font-black text-sm text-center mb-2">🏆 Post to Leaderboard</p>
            <input
              type="text"
              value={lbName}
              onChange={e => setLbName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") postToLeaderboard() }}
              placeholder="Your name..."
              maxLength={20}
              className="w-full rounded-xl px-4 py-2.5 text-center font-black text-gray-900 text-sm outline-none mb-2"
              style={{ background: "rgba(255,255,255,0.95)", border: "2px solid rgba(168,85,247,0.4)" }}
            />
            <button
              onClick={postToLeaderboard}
              className="w-full py-2.5 rounded-xl font-black text-white text-sm active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 4px 12px rgba(168,85,247,0.4)" }}
            >
              📋 Post Score
            </button>
          </div>
        ) : (
          <div className="rounded-2xl px-4 py-3 mb-4 text-center" style={{ background: "rgba(52,211,153,0.15)", border: "1.5px solid rgba(52,211,153,0.4)" }}>
            <p className="text-emerald-300 font-black text-sm">✓ Score posted to leaderboard!</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          <div className="rounded-full p-[2px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))", boxShadow: `0 6px 20px ${resultConfig.glow}` }}>
            <button
              onClick={() => { setStage("playing"); setLbPosted(false) }}
              className="w-full py-3.5 rounded-full font-black text-white text-lg transition-all active:scale-95"
              style={{ background: isFly ? "linear-gradient(135deg, #06b6d4, #8b5cf6)" : "linear-gradient(135deg, #f97316, #ef4444)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }}
            >
              🔁 Rematch!
            </button>
          </div>
          <a
            href="/"
            className="block w-full py-3 rounded-full font-bold text-white/60 text-sm transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            🏠 Go to HablaBeat
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes resultBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.05); }
        }
        @keyframes floatCoin {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(8deg); }
        }
      `}</style>
    </div>
  )
}
