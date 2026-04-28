"use client"
// ─────────────────────────────────────────────────────────────────────────────
// BattleIguana — Boss Battle: Bunny vs Iguana (El Salvador)
// Tap bugs (vocab words) from Alphabet, Body, Clothing & Roles (songs 1-7)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"

// ─────────────────────────────────────────────────────────────────────────────
// WORD DATA — curated keywords from songs 1-7
// ─────────────────────────────────────────────────────────────────────────────

interface Word { spanish: string; english: string }

const PHASE_ALPHABET: Word[] = [
  { spanish: "abecedario", english: "alphabet" },
  { spanish: "ñ",          english: "eñe" },
  { spanish: "ch",         english: "che" },
  { spanish: "rr",         english: "double r" },
  { spanish: "ll",         english: "elle" },
  { spanish: "niño",       english: "child" },
  { spanish: "churro",     english: "churro" },
  { spanish: "perro",      english: "dog" },
  { spanish: "lluvia",     english: "rain" },
  { spanish: "vocales",    english: "vowels" },
]

const PHASE_BODY: Word[] = [
  { spanish: "cabeza",   english: "head" },
  { spanish: "brazos",   english: "arms" },
  { spanish: "manos",    english: "hands" },
  { spanish: "pierna",   english: "leg" },
  { spanish: "ojos",     english: "eyes" },
  { spanish: "boca",     english: "mouth" },
  { spanish: "nariz",    english: "nose" },
  { spanish: "dientes",  english: "teeth" },
  { spanish: "espalda",  english: "back" },
  { spanish: "rodilla",  english: "knee" },
]

const PHASE_CLOTHING: Word[] = [
  { spanish: "camisa",    english: "shirt" },
  { spanish: "zapatos",   english: "shoes" },
  { spanish: "gorra",     english: "cap" },
  { spanish: "falda",     english: "skirt" },
  { spanish: "chaqueta",  english: "jacket" },
  { spanish: "botas",     english: "boots" },
  { spanish: "pantalón",  english: "pants" },
  { spanish: "bufanda",   english: "scarf" },
  { spanish: "vestido",   english: "dress" },
  { spanish: "pijama",    english: "pajamas" },
]

const PHASE_ROLES: Word[] = [
  { spanish: "familia",   english: "family" },
  { spanish: "mamá",      english: "mom" },
  { spanish: "papá",      english: "dad" },
  { spanish: "hermano",   english: "brother" },
  { spanish: "abuela",    english: "grandma" },
  { spanish: "doctor",    english: "doctor" },
  { spanish: "bombero",   english: "firefighter" },
  { spanish: "maestra",   english: "teacher" },
  { spanish: "cantante",  english: "singer" },
  { spanish: "policía",   english: "police" },
]

const ALL_PHASES = [PHASE_ALPHABET, PHASE_BODY, PHASE_CLOTHING, PHASE_ROLES]
const PHASE_LABELS = ["Alphabet Bugs", "Body Bugs", "Clothing Bugs", "Roles Bugs"]
const PHASE_ICONS  = ["🔤", "🦴", "👗", "👨‍👩‍👧"]
const FULL_QUEUE = [...PHASE_ALPHABET, ...PHASE_BODY, ...PHASE_CLOTHING, ...PHASE_ROLES]
const PHASE_BOUNDARIES = [0, 10, 20, 30] // starting index of each phase

const BUG_EMOJIS = ["🐛", "🪲", "🦗", "🐜", "🐞"]

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface DisplayBug {
  id: number
  spanish: string
  english: string
  isTarget: boolean
  bugEmoji: string
  x: number   // percent position (for scattered layout)
  y: number   // percent position
  bobDelay: number // animation delay offset
}

interface CarrotAnim {
  fromX: number; fromY: number
  toX: number; toY: number
  active: boolean
}

interface BugFlash {
  bugId: number
  correct: boolean
}

interface JungleEmoji { id: number; emoji: string; x: number; y: number; size: number; driftDur: number; driftDelay: number }

interface Props {
  coins: number
  onCoinsChange: (delta: number) => void
  onClose: () => void
  onGameEnd?: (score: number) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BUNNY_W       = 100
const BUNNY_H       = 100
const WORD_H        = 46

const JUNGLE_EMOJIS = ["🌿","🍃","🌴","🌺","🦋","🍄","🌱","🐛","🦎","🪴"]

// Bunny fixed position (bottom center) in percentages
const BUNNY_X_PCT = 50
const BUNNY_Y_PCT = 82

// Bug positions: scattered around the middle area
const BUG_POSITIONS: { x: number; y: number }[] = [
  { x: 18, y: 28 },
  { x: 50, y: 22 },
  { x: 82, y: 30 },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeJungleEmojis(): JungleEmoji[] {
  return Array.from({ length: 14 }, (_, i) => ({
    id: i,
    emoji: JUNGLE_EMOJIS[i % JUNGLE_EMOJIS.length],
    x: 5 + (i * 13 + 7) % 88,
    y: 3 + (i * 17 + 5) % 65,
    size: 18 + (i * 7) % 22,
    driftDur: 4 + (i * 1.3) % 5,
    driftDelay: (i * 0.7) % 4,
  }))
}

function speakSpanish(word: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(word)
  utt.lang = "es-MX"
  utt.rate = 0.85
  utt.pitch = 1.1
  utt.volume = 1
  const voices = window.speechSynthesis.getVoices()
  const esVoice = voices.find(v => v.lang.startsWith("es")) ?? null
  if (esVoice) utt.voice = esVoice
  window.speechSynthesis.speak(utt)
}

function getCurrentPhaseIdx(wordIdx: number): number {
  if (wordIdx >= 30) return 3
  if (wordIdx >= 20) return 2
  if (wordIdx >= 10) return 1
  return 0
}

function getPhasePool(phaseIdx: number): Word[] {
  return ALL_PHASES[phaseIdx] ?? PHASE_ALPHABET
}

// ─────────────────────────────────────────────────────────────────────────────
// SOUND EFFECTS (Web Audio API)
// ─────────────────────────────────────────────────────────────────────────────

const playCorrectSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1)
    osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

const playWrongSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = "square"
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

type GamePhase = "intro" | "dialogue" | "countdown" | "playing" | "phase_transition" | "complete" | "defeated"

export default function BattleIguana({ coins: initialCoins, onCoinsChange, onClose, onGameEnd }: Props) {

  const [gamePhase, setGamePhase]       = useState<GamePhase>("intro")
  const [countdown, setCountdown]       = useState(3)
  const [score, setScore]               = useState(0)
  const [localCoins, setLocalCoins]     = useState(initialCoins)
  const [wordIdx, setWordIdx]           = useState(0)
  const [flashScreen, setFlashScreen]   = useState<"correct" | "wrong" | null>(null)
  const [showHint, setShowHint]         = useState(false)
  const [hintEntry, setHintEntry]       = useState<Word | null>(null)
  const [transitionMsg, setTransitionMsg] = useState("")
  const [wrongCount, setWrongCount]     = useState(0)
  const [halfSkull, setHalfSkull]       = useState(false)
  const [iguanaHp, setIguanaHp]         = useState(FULL_QUEUE.length)

  const [currentBugs, setCurrentBugs]   = useState<DisplayBug[]>([])
  const [carrotAnim, setCarrotAnim]     = useState<CarrotAnim>({ fromX: 0, fromY: 0, toX: 0, toY: 0, active: false })
  const [bugFlash, setBugFlash]         = useState<BugFlash | null>(null)
  const [waitingForNext, setWaitingForNext] = useState(false)
  const [jungleEmojis]                  = useState<JungleEmoji[]>(makeJungleEmojis)

  const wordIdxRef         = useRef(0)
  const gamePhaseRef       = useRef<GamePhase>("intro")
  const bugItemIdRef       = useRef(0)
  const popIdRef           = useRef(0)
  const onCoinsChangeRef   = useRef(onCoinsChange)
  const scoreRef           = useRef(0)
  const wrongCountRef      = useRef(0)
  const halfSkullRef       = useRef(false)
  const iguanaHpRef        = useRef(FULL_QUEUE.length)

  useEffect(() => { onCoinsChangeRef.current = onCoinsChange }, [onCoinsChange])
  useEffect(() => { wordIdxRef.current = wordIdx }, [wordIdx])
  useEffect(() => { gamePhaseRef.current = gamePhase }, [gamePhase])

  const areaRef = useRef<HTMLDivElement>(null)

  // ── Spawn bugs for a given word ──────────────────────────────────────────
  const spawnBugsForWord = useCallback((targetIdx: number) => {
    if (targetIdx >= FULL_QUEUE.length) return
    const targetWord = FULL_QUEUE[targetIdx]
    const phaseIdx = getCurrentPhaseIdx(targetIdx)
    const pool = getPhasePool(phaseIdx)
    const distractors = shuffle(pool.filter(w => w.spanish !== targetWord.spanish)).slice(0, 2)
    const all = shuffle([targetWord, ...distractors])
    const positions = shuffle([...BUG_POSITIONS])

    const newBugs: DisplayBug[] = all.map((item, i) => ({
      id: bugItemIdRef.current++,
      spanish: item.spanish,
      english: item.english,
      isTarget: item.spanish === targetWord.spanish,
      bugEmoji: BUG_EMOJIS[Math.floor(Math.random() * BUG_EMOJIS.length)],
      x: positions[i].x,
      y: positions[i].y,
      bobDelay: i * 0.4,
    }))

    setCurrentBugs(newBugs)
    setBugFlash(null)
    setCarrotAnim({ fromX: 0, fromY: 0, toX: 0, toY: 0, active: false })
    setWaitingForNext(false)
  }, [])

  // ── Advance word ──────────────────────────────────────────────────────────
  const advanceRef = useRef<(wasCorrect: boolean) => void>(() => {})
  advanceRef.current = (wasCorrect: boolean) => {
    const idx   = wordIdxRef.current
    const entry = FULL_QUEUE[idx]
    if (wasCorrect) {
      setFlashScreen("correct")
      setScore(s => { scoreRef.current = s + 10; return s + 10 })
      setIguanaHp(hp => { iguanaHpRef.current = hp - 1; return hp - 1 })
      setHintEntry(entry)
      setShowHint(true)
      // Award a coin on correct answer
      const coin = Math.random() < 0.6 ? 1 : 0
      if (coin > 0) { onCoinsChangeRef.current(coin); setLocalCoins(c => c + coin) }
      setTimeout(() => { setFlashScreen(null); setShowHint(false) }, 900)
    } else {
      setFlashScreen("wrong")
      // Skull logic
      if (halfSkullRef.current) {
        halfSkullRef.current = false; setHalfSkull(false)
        wrongCountRef.current += 1; setWrongCount(wc => wc + 1)
      } else {
        halfSkullRef.current = true; setHalfSkull(true)
      }
      setTimeout(() => setFlashScreen(null), 400)
      // Check defeat
      if (wrongCountRef.current >= 5) {
        setTimeout(() => {
          setGamePhase("defeated"); gamePhaseRef.current = "defeated"
        }, 500)
        return
      }
    }

    const nextIdx = idx + 1
    const currentPhase = getCurrentPhaseIdx(idx)
    const nextPhase = getCurrentPhaseIdx(nextIdx)

    // Phase transition
    if (nextIdx < FULL_QUEUE.length && nextPhase !== currentPhase) {
      wordIdxRef.current = nextIdx
      setWordIdx(nextIdx)
      setTransitionMsg(`${PHASE_LABELS[currentPhase]}: done! Now: ${PHASE_LABELS[nextPhase]}!`)
      setGamePhase("phase_transition")
      gamePhaseRef.current = "phase_transition"
      setCurrentBugs([])
      setTimeout(() => {
        setFlashScreen(null); setShowHint(false)
        setGamePhase("playing"); gamePhaseRef.current = "playing"
        spawnBugsForWord(nextIdx)
        setTimeout(() => speakSpanish(FULL_QUEUE[nextIdx].spanish), 300)
      }, 2200)
      return
    }

    // Completed all words
    if (nextIdx >= FULL_QUEUE.length) {
      wordIdxRef.current = nextIdx
      setWordIdx(nextIdx)
      setTimeout(() => {
        setFlashScreen(null); setShowHint(false)
        setGamePhase("complete"); gamePhaseRef.current = "complete"
        onGameEnd?.(scoreRef.current)
        // Bonus coins for winning boss battle
        onCoinsChangeRef.current(25)
        setLocalCoins(c => c + 25)
      }, 1000)
      return
    }

    wordIdxRef.current = nextIdx
    setWordIdx(nextIdx)

    // Spawn next wave after a delay
    setWaitingForNext(true)
    setTimeout(() => {
      spawnBugsForWord(nextIdx)
      setTimeout(() => speakSpanish(FULL_QUEUE[nextIdx].spanish), 300)
    }, 800)
  }

  // ── Handle bug click ────────────────────────────────────────────────────
  const handleBugClick = useCallback((bug: DisplayBug, bugElement: HTMLDivElement | null) => {
    if (waitingForNext || carrotAnim.active || bugFlash) return
    if (gamePhaseRef.current !== "playing") return

    const area = areaRef.current
    if (!area) return

    // Calculate pixel positions for carrot animation
    const areaRect = area.getBoundingClientRect()

    // Bunny position (bottom center)
    const fromX = (BUNNY_X_PCT / 100) * areaRect.width
    const fromY = (BUNNY_Y_PCT / 100) * areaRect.height

    // Bug position
    const toX = (bug.x / 100) * areaRect.width
    const toY = (bug.y / 100) * areaRect.height

    // Speak the word
    speakSpanish(bug.spanish)

    // Start carrot animation
    setCarrotAnim({ fromX, fromY, toX, toY, active: true })

    // After carrot arrives (~300ms), show result
    setTimeout(() => {
      setCarrotAnim(prev => ({ ...prev, active: false }))
      setBugFlash({ bugId: bug.id, correct: bug.isTarget })

      if (bug.isTarget) {
        playCorrectSound()
      } else {
        playWrongSound()
      }

      // After showing flash, advance
      setTimeout(() => {
        advanceRef.current(bug.isTarget)
      }, 300)
    }, 300)
  }, [waitingForNext, carrotAnim.active, bugFlash])

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== "countdown") return
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
    setCountdown(0)
    const t = setTimeout(() => {
      setGamePhase("playing"); gamePhaseRef.current = "playing"
      spawnBugsForWord(0)
      speakSpanish(FULL_QUEUE[0].spanish)
    }, 600)
    return () => clearTimeout(t)
  }, [gamePhase, countdown, spawnBugsForWord])

  // Auto-advance from intro
  useEffect(() => {
    if (gamePhase !== "intro") return
    const t = setTimeout(() => { setGamePhase("dialogue"); gamePhaseRef.current = "dialogue" }, 3000)
    return () => clearTimeout(t)
  }, [gamePhase])

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const progressPct  = Math.round((wordIdx / FULL_QUEUE.length) * 100)
  const hpPct        = Math.round((iguanaHp / FULL_QUEUE.length) * 100)
  const currentEntry = FULL_QUEUE[Math.min(wordIdx, FULL_QUEUE.length - 1)]
  const phaseIdx     = getCurrentPhaseIdx(wordIdx)
  const skulls       = Array.from({ length: wrongCount }, (_, i) => i)

  return (
    <div className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "linear-gradient(180deg, #0a1500 0%, #1a3a05 30%, #2d5016 65%, #1a3a05 100%)" }}>

      {/* ── INTRO SCREEN ── */}
      {gamePhase === "intro" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
          style={{ zIndex: 60, background: "radial-gradient(ellipse at center, #1a2e05 0%, #0a1500 100%)" }}
          onClick={() => { setGamePhase("dialogue"); gamePhaseRef.current = "dialogue" }}>

          {/* Jungle bg emojis */}
          {["🌿","🍃","🌴","🌺","🦎","🐛","🪲","🌱"].map((e, i) => (
            <div key={i} className="absolute pointer-events-none" style={{
              left: `${(i * 31 + 10) % 90}%`, top: `${(i * 43 + 8) % 80}%`,
              fontSize: `${20 + (i % 3) * 12}px`, opacity: 0.25,
              animation: `skyDrift ${3 + i}s ease-in-out infinite alternate`,
            }}>{e}</div>
          ))}

          <div className="flex items-center gap-6 mb-6">
            <div style={{ animation: "countdownPop 0.6s ease-out forwards" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/me-bunny.svg" alt="Blue Bunny" className="w-24 h-24 object-contain" />
            </div>
            <div className="text-white font-black text-5xl" style={{
              animation: "countdownPop 0.8s ease-out forwards",
              textShadow: "0 0 20px rgba(255,200,0,0.8)"
            }}>VS</div>
            <div className="text-8xl" style={{ animation: "countdownPop 1s ease-out forwards" }}>🦎</div>
          </div>

          <div className="text-white font-black text-2xl text-center" style={{ animation: "countdownPop 1.2s ease-out forwards" }}>
            Blue Bunny battles Iguana!
          </div>
          <div className="text-white/40 text-sm mt-6">Tap to continue</div>
        </div>
      )}

      {/* ── DIALOGUE SCREEN ── */}
      {gamePhase === "dialogue" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
          style={{ zIndex: 55, background: "linear-gradient(180deg, #0a1500 0%, #1a3a05 50%, #2d5016 100%)" }}>

          <div className="text-[100px] mb-4" style={{ animation: "countdownPop 0.6s ease-out forwards" }}>🦎</div>

          <div className="relative max-w-sm px-6 py-5 rounded-3xl mb-8"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "2px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(8px)",
            }}>
            <div style={{
              position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "12px solid transparent", borderRight: "12px solid transparent",
              borderBottom: "12px solid rgba(255,255,255,0.12)",
            }} />
            <p className="text-white font-bold text-base leading-relaxed text-center">
              &ldquo;You have to be able to collect enough bugs to fly to the next country.
              I want to make sure you are ready.&rdquo;
            </p>
            <p className="text-yellow-300 font-black text-sm text-center mt-2">&mdash; Iguana 🦎</p>
          </div>

          <button
            onClick={() => { setGamePhase("countdown"); gamePhaseRef.current = "countdown" }}
            className="px-8 py-4 rounded-2xl font-black text-white text-lg transition-transform active:scale-95"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: "0 4px 24px rgba(34,197,94,0.5)",
            }}>
            I&apos;m Ready! 🐛
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0" style={{ zIndex: 5 }}>
        <button onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/80 text-sm font-bold active:scale-95 transition-all"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
          ← Back
        </button>

        <div className="text-center">
          <div className="text-white font-black text-lg leading-none">
            ⚔️ Battle Iguana
            <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.4)", color: "white" }}>
              {PHASE_LABELS[phaseIdx]}
            </span>
          </div>
          <div className="text-white/60 text-xs mt-0.5">{wordIdx}/{FULL_QUEUE.length} bugs</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)" }}>
            <span style={{ fontSize: "15px" }}>💰</span>
            <span className="text-yellow-300 font-black text-sm">{localCoins}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
            <span className="text-white font-black text-sm">{score}pts</span>
          </div>
        </div>
      </div>

      {/* Iguana HP Bar */}
      <div className="px-4 pb-0.5 flex-shrink-0" style={{ zIndex: 5 }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🦎</span>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${hpPct}%`, background: hpPct > 50 ? "linear-gradient(90deg, #ef4444, #f97316)" : hpPct > 25 ? "linear-gradient(90deg, #f97316, #fbbf24)" : "linear-gradient(90deg, #fbbf24, #22c55e)" }} />
          </div>
          <span className="text-white/60 text-xs font-bold">{iguanaHp}/{FULL_QUEUE.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-1 flex-shrink-0" style={{ zIndex: 5 }}>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #22c55e, #16a34a)" }} />
        </div>
        <div className="flex justify-between text-white/40 text-xs mt-0.5 px-0.5">
          {PHASE_LABELS.map((l, i) => (
            <span key={i} style={{ opacity: i === phaseIdx ? 1 : 0.5, color: i === phaseIdx ? "#4ade80" : undefined }}>{l.replace(" Bugs", "")}</span>
          ))}
        </div>
        {/* Skulls */}
        {wrongCount > 0 && (
          <div className="flex gap-1 mt-1">
            {skulls.map(i => <span key={i} className="text-sm">💀</span>)}
            {halfSkull && <span className="text-sm opacity-50">💀</span>}
            <span className="text-white/40 text-xs ml-1">{wrongCount}/5</span>
          </div>
        )}
      </div>

      {/* ── Game Area ── */}
      <div ref={areaRef} className="flex-1 relative overflow-hidden select-none">

        {/* Jungle particles */}
        {[...Array(18)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-green-300/20" style={{
            width: `${1.5 + (i % 3)}px`, height: `${1.5 + (i % 3)}px`,
            left: `${(i * 41 + 9) % 97}%`, top: `${(i * 59 + 5) % 88}%`,
            animation: `twinkle ${1.5 + (i % 5) * 0.4}s ease-in-out ${(i * 0.35) % 2.5}s infinite alternate`,
          }} />
        ))}

        {/* Jungle emojis */}
        {jungleEmojis.map(se => (
          <div key={se.id} className="absolute select-none pointer-events-none" style={{
            left: `${se.x}%`, top: `${se.y}%`, fontSize: `${se.size}px`, opacity: 0.3,
            animation: `skyDrift ${se.driftDur}s ease-in-out ${se.driftDelay}s infinite alternate`,
            filter: "drop-shadow(0 0 4px rgba(74,222,128,0.3))",
          }}>{se.emoji}</div>
        ))}

        {/* ── English Prompt (prominent at top) ── */}
        {gamePhase === "playing" && (
          <div className="absolute left-1/2 top-2 -translate-x-1/2 z-[12] pointer-events-none">
            <div className="px-5 py-2 rounded-2xl text-center"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-0.5">Find the Spanish word for:</div>
              <div className="text-white font-black text-2xl leading-tight">{currentEntry.english}</div>
            </div>
          </div>
        )}

        {/* ── Floating Bugs (Spanish Words) — gently bobbing in place ── */}
        {gamePhase === "playing" && currentBugs.map(bug => {
          const isFlashed = bugFlash && bugFlash.bugId === bug.id
          const flashColor = isFlashed ? (bugFlash!.correct ? "#4ade80" : "#f87171") : null
          return (
            <div key={bug.id}
              className="absolute flex flex-col items-center select-none"
              style={{
                left: `${bug.x}%`, top: `${bug.y}%`,
                transform: "translateX(-50%) translateY(-50%)",
                cursor: (waitingForNext || carrotAnim.active || bugFlash) ? "default" : "pointer",
                zIndex: 8,
                animation: `bugBob 2.2s ease-in-out ${bug.bobDelay}s infinite alternate`,
                transition: flashColor ? "transform 0.2s" : undefined,
              }}
              onClick={(e) => {
                e.stopPropagation()
                handleBugClick(bug, e.currentTarget as HTMLDivElement)
              }}
            >
              <span style={{
                fontSize: "28px",
                marginBottom: "-2px",
                filter: "drop-shadow(0 0 4px rgba(255,255,255,0.5))",
              }}>{bug.bugEmoji}</span>
              <div className="flex items-center justify-center font-black rounded-2xl px-4 py-1" style={{
                height: `${WORD_H}px`,
                minWidth: "80px",
                fontSize: bug.spanish.length > 8 ? "13px" : bug.spanish.length > 5 ? "15px" : "17px",
                background: flashColor ?? "#d1fae5",
                color: isFlashed && !bugFlash!.correct ? "#7f1d1d" : "#14532d",
                boxShadow: flashColor
                  ? `0 0 24px ${flashColor}, 0 4px 12px rgba(0,0,0,0.3)`
                  : "0 4px 12px rgba(0,0,0,0.25)",
                border: flashColor
                  ? `3px solid white`
                  : "2px solid rgba(255,255,255,0.35)",
                transition: "background 0.15s, box-shadow 0.15s",
              }}>
                {bug.spanish}
              </div>
            </div>
          )
        })}

        {/* ── Carrot Projectile ── */}
        {carrotAnim.active && (
          <div className="absolute pointer-events-none" style={{
            zIndex: 15,
            left: `${carrotAnim.fromX}px`,
            top: `${carrotAnim.fromY}px`,
            fontSize: "32px",
            animation: "carrotFly 0.3s ease-in forwards",
            ["--carrot-from-x" as any]: `${carrotAnim.fromX}px`,
            ["--carrot-from-y" as any]: `${carrotAnim.fromY}px`,
            ["--carrot-to-x" as any]: `${carrotAnim.toX}px`,
            ["--carrot-to-y" as any]: `${carrotAnim.toY}px`,
          }}>
            🥕
          </div>
        )}

        {/* ── Bunny (fixed at bottom center) ── */}
        {(gamePhase === "playing" || gamePhase === "phase_transition") && (
          <div className="absolute pointer-events-none" style={{
            left: `calc(${BUNNY_X_PCT}% - ${BUNNY_W / 2}px)`,
            top: `calc(${BUNNY_Y_PCT}% - ${BUNNY_H / 2}px)`,
            width: `${BUNNY_W}px`, height: `${BUNNY_H}px`, zIndex: 10,
            filter: "sepia(1) hue-rotate(180deg) saturate(2.5) brightness(1.2) drop-shadow(0 0 10px rgba(34,197,94,0.9)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
          }}>
            <Image src="/images/me-bunny.svg" alt="Bunny"
              width={BUNNY_W} height={BUNNY_H}
              className="w-full h-full object-contain" unoptimized priority />
          </div>
        )}

        {/* ── Screen flash ── */}
        {flashScreen && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: flashScreen === "correct" ? "rgba(74,222,128,0.22)" : "rgba(239,68,68,0.28)",
            zIndex: 20,
          }} />
        )}

        {/* ── Hint pop ── */}
        {showHint && hintEntry && (
          <div className="absolute left-1/2 pointer-events-none"
            style={{ top: "38%", zIndex: 25, animation: "hintPop 0.9s ease-out forwards", transform: "translateX(-50%)" }}>
            <div className="text-5xl mb-2 text-center">✅</div>
            <div className="text-white font-black text-xl px-5 py-2.5 rounded-2xl text-center"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", whiteSpace: "nowrap" }}>
              +10 pts<br />
              <span className="text-green-300 font-bold text-base">{hintEntry.spanish}</span>
              <span className="text-white/60 font-bold text-sm ml-2">= {hintEntry.english}</span>
            </div>
          </div>
        )}

        {/* ── Countdown ── */}
        {gamePhase === "countdown" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 30, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
            <div className="text-white font-black text-center mb-8">
              <div className="text-2xl mb-2 opacity-80">Get ready!</div>
              <div className="text-8xl" style={{ animation: "countdownPop 1s ease-out forwards" }}>
                {countdown > 0 ? countdown : "🐛"}
              </div>
            </div>
            <div className="px-6 py-3 rounded-2xl text-white/70 text-sm text-center max-w-xs"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <strong className="text-white">Tap the correct Spanish bug!</strong><br />
              🐛 A carrot will fly to squash it!<br />
              <span className="text-xs opacity-60 mt-1 block">English prompt shown at top</span>
            </div>
          </div>
        )}

        {/* ── Phase Transition ── */}
        {gamePhase === "phase_transition" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 35, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
            <div className="text-7xl mb-4" style={{ animation: "countdownPop 0.5s ease-out forwards" }}>
              {PHASE_ICONS[getCurrentPhaseIdx(wordIdx)]}
            </div>
            <div className="text-white font-black text-2xl text-center mb-2">{transitionMsg}</div>
            <div className="text-white/50 text-sm text-center mt-2">Get ready &mdash; it gets faster! 🐛</div>
          </div>
        )}

        {/* ── WIN SCREEN ── */}
        {gamePhase === "complete" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
            style={{ zIndex: 40, background: "linear-gradient(160deg, rgba(10,21,0,0.96), rgba(26,58,5,0.98))", backdropFilter: "blur(10px)" }}>
            {[...Array(18)].map((_, i) => (
              <div key={i} className="absolute pointer-events-none" style={{
                left: `${(i * 37 + 11) % 94}%`, top: `${(i * 53 + 7) % 88}%`,
                fontSize: `${16 + (i % 4) * 8}px`,
                animation: `twinkle ${1.2 + (i % 4) * 0.4}s ease-in-out ${(i * 0.3) % 2}s infinite alternate`,
              }}>{["🌟","⭐","✨","🎉","🐛","💫"][i % 6]}</div>
            ))}
            <div className="text-8xl mb-3" style={{ animation: "countdownPop 0.6s ease-out forwards" }}>🏆</div>
            <div className="text-white font-black text-3xl text-center mb-1">You defeated the Iguana!</div>
            <div className="text-white/70 font-bold text-base text-center mb-2">You&apos;re ready to fly to the next country!</div>
            <div className="text-yellow-300 font-black text-sm mb-6">+25 bonus coins! 💰</div>
            <div className="flex gap-4 mb-8">
              {[{ label: "Score", val: score }, { label: "Coins", val: localCoins }, { label: "Bugs", val: FULL_QUEUE.length }].map(s => (
                <div key={s.label} className="flex flex-col items-center px-5 py-3 rounded-2xl"
                  style={{ background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.4)" }}>
                  <span className="text-green-300 font-black text-2xl">{s.val}</span>
                  <span className="text-white/60 text-xs font-bold mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => {
                setScore(0); scoreRef.current = 0
                setWordIdx(0); wordIdxRef.current = 0
                setCurrentBugs([]); setBugFlash(null); setWaitingForNext(false)
                setCarrotAnim({ fromX: 0, fromY: 0, toX: 0, toY: 0, active: false })
                setCountdown(3); setFlashScreen(null); setShowHint(false)
                setWrongCount(0); wrongCountRef.current = 0
                setHalfSkull(false); halfSkullRef.current = false
                setIguanaHp(FULL_QUEUE.length); iguanaHpRef.current = FULL_QUEUE.length
                setGamePhase("countdown"); gamePhaseRef.current = "countdown"
              }}
                className="px-6 py-3 rounded-2xl font-black text-white text-base transition-transform active:scale-95"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 20px rgba(34,197,94,0.5)" }}>
                Play Again 🔄
              </button>
              <button onClick={onClose}
                className="px-6 py-3 rounded-2xl font-black text-white/80 text-base transition-transform active:scale-95"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>
                Back 🏠
              </button>
            </div>
          </div>
        )}

        {/* ── DEFEATED SCREEN ── */}
        {gamePhase === "defeated" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
            style={{ zIndex: 40, background: "linear-gradient(160deg, rgba(30,5,5,0.96), rgba(80,10,10,0.98))", backdropFilter: "blur(10px)" }}>
            <div className="text-8xl mb-3" style={{ animation: "countdownPop 0.6s ease-out forwards" }}>🦎</div>
            <div className="text-white font-black text-2xl text-center mb-2">Not enough bugs!</div>
            <div className="text-white/70 font-bold text-base text-center mb-6">Practice your words and come back stronger!</div>
            <div className="flex gap-4 mb-8">
              {[{ label: "Score", val: score }, { label: "Bugs", val: wordIdx }, { label: "Skulls", val: `${wrongCount}/5` }].map(s => (
                <div key={s.label} className="flex flex-col items-center px-5 py-3 rounded-2xl"
                  style={{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.4)" }}>
                  <span className="text-red-300 font-black text-2xl">{s.val}</span>
                  <span className="text-white/60 text-xs font-bold mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => {
                setScore(0); scoreRef.current = 0
                setWordIdx(0); wordIdxRef.current = 0
                setCurrentBugs([]); setBugFlash(null); setWaitingForNext(false)
                setCarrotAnim({ fromX: 0, fromY: 0, toX: 0, toY: 0, active: false })
                setCountdown(3); setFlashScreen(null); setShowHint(false)
                setWrongCount(0); wrongCountRef.current = 0
                setHalfSkull(false); halfSkullRef.current = false
                setIguanaHp(FULL_QUEUE.length); iguanaHpRef.current = FULL_QUEUE.length
                setGamePhase("countdown"); gamePhaseRef.current = "countdown"
              }}
                className="px-6 py-3 rounded-2xl font-black text-white text-base transition-transform active:scale-95"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 20px rgba(239,68,68,0.5)" }}>
                Try Again 🔄
              </button>
              <button onClick={onClose}
                className="px-6 py-3 rounded-2xl font-black text-white/80 text-base transition-transform active:scale-95"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>
                Back 🏠
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar — English prompt ── */}
      <div className="flex-shrink-0 pb-safe-bottom" style={{ background: "rgba(0,0,0,0.50)", backdropFilter: "blur(12px)", zIndex: 5 }}>
        <div className="px-4 py-4 text-center">
          <div className="inline-block px-5 py-2.5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.35)" }}>
            <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-0.5">Tap the bug for →</div>
            <div className="text-white font-black text-3xl leading-tight tracking-wide">
              {currentEntry.english}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          from { opacity:0.15; transform:scale(0.7); }
          to   { opacity:0.9;  transform:scale(1.3); }
        }
        @keyframes skyDrift {
          0%   { transform:translateY(0px) rotate(-4deg); }
          50%  { transform:translateY(-8px) rotate(2deg); }
          100% { transform:translateY(4px) rotate(-2deg); }
        }
        @keyframes hintPop {
          0%   { opacity:0; transform:translateX(-50%) scale(0.7); }
          25%  { opacity:1; transform:translateX(-50%) scale(1.08); }
          75%  { opacity:1; transform:translateX(-50%) scale(1); }
          100% { opacity:0; transform:translateX(-50%) scale(0.9); }
        }
        @keyframes countdownPop {
          0%   { transform:scale(0.5); opacity:0; }
          60%  { transform:scale(1.15); opacity:1; }
          100% { transform:scale(1); opacity:1; }
        }
        @keyframes popFloat {
          0%   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
          100% { opacity:0; transform:translateX(-50%) translateY(-50px) scale(0.7); }
        }
        @keyframes bugBob {
          0%   { transform:translateX(-50%) translateY(-50%) translateY(0px); }
          50%  { transform:translateX(-50%) translateY(-50%) translateY(-10px); }
          100% { transform:translateX(-50%) translateY(-50%) translateY(4px); }
        }
        @keyframes carrotFly {
          0% {
            left: var(--carrot-from-x);
            top: var(--carrot-from-y);
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          100% {
            left: var(--carrot-to-x);
            top: var(--carrot-to-y);
            opacity: 1;
            transform: scale(1.2) rotate(-45deg);
          }
        }
      `}</style>
    </div>
  )
}
