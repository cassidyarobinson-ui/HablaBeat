"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"

const DDRGame = dynamic(() => import("@/components/ddr-game"), { ssr: false })

interface ChallengeData {
  s: number   // song number
  t: string   // song title
  sc: number  // challenger score
  g: string   // challenger grade
  fc: number  // challenger flow combo
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

  // Grade order for comparison
  const GRADE_ORDER = ["F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"]
  const gradeRank = (g: string) => GRADE_ORDER.indexOf(g)

  const handleGameEnd = (_songNum: number, flow: number, bank: number, grade: string) => {
    setMyScore(bank)
    setMyGrade(grade)
    setMyFlow(flow)
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

  // ── Intro / accept screen ──
  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <p className="text-7xl mb-4">⚔️</p>
          <h1 className="text-3xl font-black text-gray-900 mb-1">You've Been Challenged!</h1>
          <p className="text-gray-500 mb-6">Can you beat their score on <span className="font-bold text-gray-800">{challenge.t}</span>?</p>

          {/* Challenger's score card */}
          <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg p-5 mb-6">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-3">Their Score to Beat</p>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-black text-yellow-500">{challenge.g}</p>
                <p className="text-xs text-gray-400 mt-1">Grade</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-yellow-600">{challenge.sc}</p>
                <p className="text-xs text-gray-400 mt-1">💰 Bank</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-orange-500">{challenge.fc}</p>
                <p className="text-xs text-gray-400 mt-1">🔥 Flow</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStage("playing")}
            className="w-full py-4 rounded-xl font-bold text-xl text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#6A9FC0" }}
          >
            🥕 Accept Challenge!
          </button>
          <a href="/" className="block mt-3 text-sm text-gray-400 hover:text-gray-600">
            Go to HablaBeat instead
          </a>
        </div>
      </div>
    )
  }

  // ── Playing — full DDR game ──
  if (stage === "playing") {
    return (
      <DDRGame
        songNumber={challenge.s}
        songTitle={challenge.t}
        onBack={() => setStage("intro")}
        onGameEnd={handleGameEnd}
      />
    )
  }

  // ── Result screen ──
  const myRank = gradeRank(myGrade)
  const theirRank = gradeRank(challenge.g)
  const scoreDiff = myScore - challenge.sc

  let outcome: "win" | "lose" | "tie"
  if (myRank > theirRank) outcome = "win"
  else if (myRank < theirRank) outcome = "lose"
  else if (myScore > challenge.sc) outcome = "win"
  else if (myScore < challenge.sc) outcome = "lose"
  else outcome = "tie"

  const resultConfig = {
    win:  { emoji: "🎉", headline: "You Win!", sub: "Amazing — you crushed the challenge!", bg: "from-yellow-50 to-white", border: "border-yellow-300", color: "#f59e0b" },
    lose: { emoji: "😅", headline: "You Lose!", sub: "So close! Challenge them back to a rematch!", bg: "from-red-50 to-white", border: "border-red-200", color: "#ef4444" },
    tie:  { emoji: "🤝", headline: "It's a Tie!", sub: "Dead even — incredibly close!", bg: "from-blue-50 to-white", border: "border-blue-200", color: "#6A9FC0" },
  }[outcome]

  return (
    <div className={`min-h-screen bg-gradient-to-b ${resultConfig.bg} flex items-center justify-center px-4`}>
      <div className="max-w-sm w-full text-center">
        <p className="text-7xl mb-3" style={{ animation: "bounce 1s ease-in-out infinite" }}>{resultConfig.emoji}</p>
        <h1 className="text-4xl font-black mb-1" style={{ color: resultConfig.color }}>{resultConfig.headline}</h1>
        <p className="text-gray-500 mb-6">{resultConfig.sub}</p>

        {/* Score comparison */}
        <div className={`bg-white rounded-2xl border-2 ${resultConfig.border} shadow-lg p-5 mb-6`}>
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-bold"></div>
            <div className="text-xs font-bold" style={{ color: "#6A9FC0" }}>YOU</div>
            <div className="text-xs text-gray-400 font-bold">THEM</div>
          </div>
          {/* Grade row */}
          <div className="grid grid-cols-3 gap-2 text-center items-center py-2 border-b border-gray-100">
            <div className="text-left text-sm text-gray-500">Grade</div>
            <div className={`text-2xl font-black ${myRank >= theirRank ? "text-yellow-500" : "text-gray-400"}`}>{myGrade}</div>
            <div className={`text-2xl font-black ${theirRank >= myRank ? "text-yellow-500" : "text-gray-400"}`}>{challenge.g}</div>
          </div>
          {/* Score row */}
          <div className="grid grid-cols-3 gap-2 text-center items-center py-2 border-b border-gray-100">
            <div className="text-left text-sm text-gray-500">💰 Bank</div>
            <div className={`text-2xl font-black ${myScore >= challenge.sc ? "text-yellow-600" : "text-gray-400"}`}>{myScore}</div>
            <div className={`text-2xl font-black ${challenge.sc >= myScore ? "text-yellow-600" : "text-gray-400"}`}>{challenge.sc}</div>
          </div>
          {/* Flow row */}
          <div className="grid grid-cols-3 gap-2 text-center items-center py-2">
            <div className="text-left text-sm text-gray-500">🔥 Flow</div>
            <div className={`text-2xl font-black ${myFlow >= challenge.fc ? "text-orange-500" : "text-gray-400"}`}>{myFlow}</div>
            <div className={`text-2xl font-black ${challenge.fc >= myFlow ? "text-orange-500" : "text-gray-400"}`}>{challenge.fc}</div>
          </div>
        </div>

        <div className="space-y-2">
          {/* Rematch — same challenge link so friend can re-challenge */}
          <button
            onClick={() => setStage("playing")}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#6A9FC0" }}
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
