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

  // Decode the URL-safe base64 challenge payload
  useEffect(() => {
    try {
      const id = Array.isArray(params.id) ? params.id[0] : params.id
      // Restore standard base64 from URL-safe variant
      const standard = id.replace(/-/g, "+").replace(/_/g, "/")
      const padded = standard + "==".slice(0, (4 - standard.length % 4) % 4)
      const decoded = JSON.parse(atob(padded))
      setChallenge(decoded)
    } catch {
      setError(true)
    }
  }, [params.id])

  const isFly = challenge?.mode === "fly"

  // Grade order for comparison (pop mode)
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
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-6xl mb-4">😕</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Challenge Link</h1>
          <p className="text-gray-500 mb-6">This link looks broken or expired.</p>
          <a href="/" className="px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: "#6A9FC0" }}>
            Go to HablaBeat
          </a>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-lg animate-pulse">Loading challenge…</p>
      </div>
    )
  }

  const challengerName = challenge.n || "Someone"
  const challengerPhoto = challenge.p || ""

  // ── Intro / accept screen ──
  if (stage === "intro") {
    const hasStats = challenge.vb || challenge.bf || challenge.cw || challenge.str
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-8">
        <div className="max-w-sm w-full text-center">

          {/* Challenger profile card */}
          <div className="bg-white rounded-3xl border-2 border-blue-200 shadow-xl p-5 mb-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-20 h-20 rounded-full overflow-hidden border-4 shadow-md flex-shrink-0"
                style={{ borderColor: "#6A9FC0", backgroundColor: "#e0f2fe" }}
              >
                {challengerPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={challengerPhoto} alt={challengerName} className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-4xl">🐰</span>
                )}
              </div>
              <div className="text-left flex-1">
                <p className="text-xl font-black text-gray-900 leading-tight">{challengerName}</p>
                <p className="text-sm text-gray-500 leading-tight">has challenged you! ⚔️</p>
                {(challenge.str ?? 0) >= 2 && (
                  <span className="inline-block mt-1 bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    🔥 {challenge.str}-day streak!
                  </span>
                )}
              </div>
            </div>

            {/* Stats row — only shown if challenger has stats */}
            {hasStats && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(challenge.vb ?? 0) > 0 && (
                  <div className="bg-yellow-50 rounded-xl p-2 text-center border border-yellow-200">
                    <p className="text-lg font-black text-yellow-600">{challenge.vb}</p>
                    <p className="text-xs text-yellow-700">💰 Bank</p>
                  </div>
                )}
                {(challenge.bf ?? 0) > 0 && (
                  <div className="bg-orange-50 rounded-xl p-2 text-center border border-orange-200">
                    <p className="text-lg font-black text-orange-500">{challenge.bf}</p>
                    <p className="text-xs text-orange-600">🔥 Flow</p>
                  </div>
                )}
                {(challenge.cw ?? 0) > 0 && (
                  <div className="bg-blue-50 rounded-xl p-2 text-center border border-blue-200">
                    <p className="text-lg font-black" style={{ color: "#6A9FC0" }}>{challenge.cw}</p>
                    <p className="text-xs" style={{ color: "#6A9FC0" }}>⚔️ Won</p>
                  </div>
                )}
              </div>
            )}

            {/* Score to beat */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
                {isFly ? "Fly" : "Pop"} Score to Beat on {challenge.t}
              </p>
              {isFly ? (
                <div className="text-center">
                  <p className="text-4xl font-black text-yellow-600">{challenge.sc}</p>
                  <p className="text-xs text-gray-400 mt-0.5">💰 Score</p>
                </div>
              ) : (
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-black text-yellow-500">{challenge.g}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Grade</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-yellow-600">{challenge.sc}</p>
                    <p className="text-xs text-gray-400 mt-0.5">💰 Bank</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-orange-500">{challenge.fc}</p>
                    <p className="text-xs text-gray-400 mt-0.5">🔥 Flow</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setStage("playing")}
            className="w-full py-4 rounded-xl font-bold text-xl text-white transition-all hover:opacity-90"
            style={{ backgroundColor: isFly ? "#06b6d4" : "#6A9FC0" }}
          >
            {isFly ? "🦋 Accept Fly Challenge!" : "🥕 Accept Challenge!"}
          </button>
          <a href="/" className="block mt-3 text-sm text-gray-400 hover:text-gray-600">
            Go to HablaBeat instead
          </a>
        </div>
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
    // Fly: compare scores only
    if (myScore > challenge.sc) outcome = "win"
    else if (myScore < challenge.sc) outcome = "lose"
    else outcome = "tie"
  } else {
    // Pop: compare grade first, then score, then flow
    const myRank = gradeRank(myGrade)
    const theirRank = gradeRank(challenge.g || "F")
    if (myRank > theirRank) outcome = "win"
    else if (myRank < theirRank) outcome = "lose"
    else if (myScore > challenge.sc) outcome = "win"
    else if (myScore < challenge.sc) outcome = "lose"
    else outcome = "tie"
  }

  const resultConfig = {
    win:  { emoji: "🎉", headline: "You Win!", sub: `You crushed ${challengerName}'s score!`, bg: "from-yellow-50 to-white", border: "border-yellow-300", color: "#f59e0b" },
    lose: { emoji: "😅", headline: "You Lose!", sub: `${challengerName} got you this time… rematch?? 🥕`, bg: "from-red-50 to-white", border: "border-red-200", color: "#ef4444" },
    tie:  { emoji: "🤝", headline: "It's a Tie!", sub: "Dead even — incredibly close!", bg: "from-blue-50 to-white", border: "border-blue-200", color: "#6A9FC0" },
  }[outcome]

  const myPopRank = gradeRank(myGrade)
  const theirPopRank = gradeRank(challenge.g || "F")

  return (
    <div className={`min-h-screen bg-gradient-to-b ${resultConfig.bg} flex items-center justify-center px-4`}>
      <div className="max-w-sm w-full text-center">
        <p className="text-7xl mb-3" style={{ animation: "bounce 1s ease-in-out infinite" }}>{resultConfig.emoji}</p>
        <h1 className="text-4xl font-black mb-1" style={{ color: resultConfig.color }}>{resultConfig.headline}</h1>
        <p className="text-gray-500 mb-6">{resultConfig.sub}</p>

        {/* Score comparison */}
        <div className={`bg-white rounded-2xl border-2 ${resultConfig.border} shadow-lg p-5 mb-6`}>
          {/* Column headers with challenger avatar */}
          <div className="grid grid-cols-3 gap-2 text-center mb-3 items-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-bold"></div>
            <div className="text-xs font-bold" style={{ color: "#6A9FC0" }}>YOU</div>
            <div className="flex flex-col items-center gap-0.5">
              {challengerPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={challengerPhoto}
                  alt={challengerName}
                  className="w-7 h-7 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <span className="text-lg">🐰</span>
              )}
              <span className="text-xs text-gray-400 font-bold truncate w-16">{challengerName.slice(0, 8)}</span>
            </div>
          </div>

          {isFly ? (
            /* Fly result: score only */
            <div className="grid grid-cols-3 gap-2 text-center items-center py-2">
              <div className="text-left text-sm text-gray-500">💰 Score</div>
              <div className={`text-2xl font-black ${myScore >= challenge.sc ? "text-yellow-600" : "text-gray-400"}`}>{myScore}</div>
              <div className={`text-2xl font-black ${challenge.sc >= myScore ? "text-yellow-600" : "text-gray-400"}`}>{challenge.sc}</div>
            </div>
          ) : (
            /* Pop result: grade + bank + flow */
            <>
              <div className="grid grid-cols-3 gap-2 text-center items-center py-2 border-b border-gray-100">
                <div className="text-left text-sm text-gray-500">Grade</div>
                <div className={`text-2xl font-black ${myPopRank >= theirPopRank ? "text-yellow-500" : "text-gray-400"}`}>{myGrade}</div>
                <div className={`text-2xl font-black ${theirPopRank >= myPopRank ? "text-yellow-500" : "text-gray-400"}`}>{challenge.g}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center items-center py-2 border-b border-gray-100">
                <div className="text-left text-sm text-gray-500">💰 Bank</div>
                <div className={`text-2xl font-black ${myScore >= challenge.sc ? "text-yellow-600" : "text-gray-400"}`}>{myScore}</div>
                <div className={`text-2xl font-black ${challenge.sc >= myScore ? "text-yellow-600" : "text-gray-400"}`}>{challenge.sc}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center items-center py-2">
                <div className="text-left text-sm text-gray-500">🔥 Flow</div>
                <div className={`text-2xl font-black ${myFlow >= (challenge.fc ?? 0) ? "text-orange-500" : "text-gray-400"}`}>{myFlow}</div>
                <div className={`text-2xl font-black ${(challenge.fc ?? 0) >= myFlow ? "text-orange-500" : "text-gray-400"}`}>{challenge.fc}</div>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setStage("playing")}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: isFly ? "#06b6d4" : "#6A9FC0" }}
          >
            🔁 Rematch!
          </button>
          <a
            href="/"
            className="block w-full py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            🏠 Go to HablaBeat
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  )
}
