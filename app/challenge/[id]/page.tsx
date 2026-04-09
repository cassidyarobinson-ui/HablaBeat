"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"

const DDRGame = dynamic(() => import("@/components/ddr-game"), { ssr: false })
const SongFly = dynamic(() => import("@/components/song-fly"), { ssr: false })

interface ChallengeData {
  mode?: "fly" | "pop"
  s: number
  t: string
  sc: number
  g?: string
  fc?: number
  n?: string
  p?: string
  vb?: number
  bf?: number
  cs?: number
  cw?: number
  str?: number
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hablabeat-user-name")
      if (saved) setLbName(JSON.parse(saved))
    } catch {}
  }, [])

  const postToLeaderboard = () => {
    if (!challenge) return
    const name = lbName.trim() || "Anonymous"
    const entry = { name, flow: isFly ? 0 : myFlow, bank: myScore, grade: isFly ? "—" : myGrade, song: challenge.t, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), mode: isFly ? "fly" as const : "pop" as const }
    try {
      const existing = JSON.parse(localStorage.getItem("hablabeat-leaderboard") || "[]")
      const updated = [...existing, entry].sort((a: { bank: number; flow: number }, b: { bank: number; flow: number }) => b.bank - a.bank || b.flow - a.flow)
      localStorage.setItem("hablabeat-leaderboard", JSON.stringify(updated.slice(0, 100)))
    } catch {}
    localStorage.setItem("hablabeat-user-name", JSON.stringify(name))
    setLbPosted(true)
  }

  const isFly = challenge?.mode === "fly"
  const GRADE_ORDER = ["F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"]
  const gradeRank = (g: string) => GRADE_ORDER.indexOf(g)
  const handlePopGameEnd = (_songNum: number, flow: number, bank: number, grade: string) => { setMyScore(bank); setMyGrade(grade); setMyFlow(flow); setStage("result") }
  const handleFlyGameEnd = (score: number) => { setMyScore(score); setStage("result") }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg, #2d5a9e 0%, #3d6bc4 30%, #4a7cdb 60%, #5b9be6 100%)" }}>
      <div className="text-center">
        <p className="text-6xl mb-4">😕</p>
        <h1 className="text-2xl font-black text-white mb-2">Invalid Challenge Link</h1>
        <p className="text-white/50 mb-6">This link looks broken or expired.</p>
        <a href="/" className="px-6 py-3 rounded-full font-black text-white" style={{ background: "#4a7cdb" }}>Go to HablaBeat</a>
      </div>
    </div>
  )

  if (!challenge) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #2d5a9e 0%, #3d6bc4 30%, #4a7cdb 60%, #5b9be6 100%)" }}>
      <p className="text-white/50 text-lg animate-pulse">Loading challenge…</p>
    </div>
  )

  const challengerName = challenge.n || "Someone"
  const challengerPhoto = challenge.p || ""

  if (stage === "intro") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: "linear-gradient(160deg, #2d5a9e 0%, #3d6bc4 30%, #4a7cdb 60%, #5b9be6 100%)" }}>
      <div className="max-w-sm w-full text-center">
        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 mb-3" style={{ borderColor: "rgba(255,255,255,0.4)" }}>
          {challengerPhoto ? <img src={challengerPhoto} alt={challengerName} className="w-full h-full object-cover" /> : <img src="/images/super-bunny-heart.gif" alt="Challenger" className="w-full h-full object-contain" style={{ background: "#4a7cdb" }} />}
        </div>
        <p className="text-2xl font-black text-white">{challengerName}</p>
        <p className="text-white/60 text-sm">has challenged you!</p>
        <div className="rounded-3xl p-5 my-5" style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)" }}>
          <p className="text-white font-black text-base mb-4">{challenge.t}</p>
          <p className="text-4xl font-black" style={{ color: "#fbbf24" }}>{challenge.sc}</p>
          <p className="text-white/40 text-xs mt-1">Score to Beat</p>
        </div>
        <button onClick={() => setStage("playing")} className="w-full py-4 rounded-full font-black text-xl text-white active:scale-95" style={{ background: "#4a7cdb" }}>
          Accept Challenge!
        </button>
      </div>
    </div>
  )

  if (stage === "playing") {
    if (isFly) return <SongFly songNumber={challenge.s} coins={0} onCoinsChange={() => {}} onClose={() => setStage("intro")} onGameEnd={handleFlyGameEnd} />
    return <DDRGame songNumber={challenge.s} songTitle={challenge.t} onBack={() => setStage("intro")} onGameEnd={handlePopGameEnd} />
  }

  let outcome: "win" | "lose" | "tie"
  if (isFly) { outcome = myScore > challenge.sc ? "win" : myScore < challenge.sc ? "lose" : "tie" }
  else {
    const myRank = gradeRank(myGrade), theirRank = gradeRank(challenge.g || "F")
    outcome = myRank > theirRank ? "win" : myRank < theirRank ? "lose" : myScore > challenge.sc ? "win" : myScore < challenge.sc ? "lose" : "tie"
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: outcome === "win" ? "linear-gradient(160deg, #1a1200 0%, #854d0e 60%, #ca8a04 100%)" : outcome === "lose" ? "linear-gradient(160deg, #1a0000 0%, #7f1d1d 60%, #dc2626 100%)" : "linear-gradient(160deg, #2d5a9e 0%, #4a7cdb 60%, #5b9be6 100%)" }}>
      <div className="max-w-sm w-full text-center">
        <p className="text-7xl mb-2">{outcome === "win" ? "🎉" : outcome === "lose" ? "😤" : "🤝"}</p>
        <h1 className="text-4xl font-black mb-6" style={{ color: outcome === "win" ? "#fbbf24" : outcome === "lose" ? "#f87171" : "#7ba3e8" }}>
          {outcome === "win" ? "You Win!" : outcome === "lose" ? "You Lose!" : "It's a Tie!"}
        </h1>
        <div className="space-y-2">
          <button onClick={() => { setStage("playing"); setLbPosted(false) }} className="w-full py-3.5 rounded-full font-black text-white text-lg active:scale-95" style={{ background: "linear-gradient(135deg, #5b9be6, #4a7cdb)" }}>
            🔁 Rematch!
          </button>
          <a href="/" className="block w-full py-3 rounded-full font-bold text-white/60 text-sm" style={{ background: "rgba(255,255,255,0.08)" }}>
            🏠 Go to HablaBeat
          </a>
        </div>
      </div>
    </div>
  )
}
