"use client"
// ─────────────────────────────────────────────────────────────────────────────
// AlphabetFly — Arrow-based quiz for Alphabet World
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"
import { useGamepad, type PadButton } from "@/hooks/use-gamepad"

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const ALPHABET_QUEUE: { label: string; spanish: string; english: string; category: "vowel" | "consonant" | "special" }[] = [
  { label: "A",  spanish: "Árbol",     english: "Tree",      category: "vowel"     },
  { label: "B",  spanish: "Burro",     english: "Donkey",    category: "consonant" },
  { label: "C",  spanish: "Casa",      english: "House",     category: "consonant" },
  { label: "CH", spanish: "Chocolate", english: "Chocolate", category: "special"   },
  { label: "D",  spanish: "Delfín",    english: "Dolphin",   category: "consonant" },
  { label: "E",  spanish: "Elefante",  english: "Elephant",  category: "vowel"     },
  { label: "F",  spanish: "Flor",      english: "Flower",    category: "consonant" },
  { label: "G",  spanish: "Gato",      english: "Cat",       category: "consonant" },
  { label: "H",  spanish: "Hormiga",   english: "Ant",       category: "consonant" },
  { label: "I",  spanish: "Iguana",    english: "Iguana",    category: "vowel"     },
  { label: "J",  spanish: "Jaguar",    english: "Jaguar",    category: "consonant" },
  { label: "L",  spanish: "León",      english: "Lion",      category: "consonant" },
  { label: "LL", spanish: "Llama",     english: "Llama",     category: "special"   },
  { label: "M",  spanish: "Mono",      english: "Monkey",    category: "consonant" },
  { label: "N",  spanish: "Naranja",   english: "Orange",    category: "consonant" },
  { label: "Ñ",  spanish: "Niño",      english: "Child",     category: "special"   },
  { label: "O",  spanish: "Oso",       english: "Bear",      category: "vowel"     },
  { label: "P",  spanish: "Paloma",    english: "Dove",      category: "consonant" },
  { label: "R",  spanish: "Rana",      english: "Frog",      category: "consonant" },
  { label: "RR", spanish: "Perro",     english: "Dog",       category: "special"   },
  { label: "S",  spanish: "Sol",       english: "Sun",       category: "consonant" },
  { label: "T",  spanish: "Tigre",     english: "Tiger",     category: "consonant" },
  { label: "U",  spanish: "Uva",       english: "Grape",     category: "vowel"     },
  { label: "V",  spanish: "Vaca",      english: "Cow",       category: "consonant" },
  { label: "Y",  spanish: "Yoyo",      english: "Yoyo",      category: "consonant" },
  { label: "Z",  spanish: "Zapato",    english: "Shoe",      category: "consonant" },
]

const SPANISH_LETTER_NAME: Record<string, string> = {
  "A": "a", "B": "be", "C": "ce", "CH": "che", "D": "de", "E": "e",
  "F": "efe", "G": "ge", "H": "hache", "I": "i", "J": "jota",
  "L": "ele", "LL": "elle", "M": "eme", "N": "ene", "Ñ": "eñe",
  "O": "o", "P": "pe", "R": "erre", "RR": "erre doble",
  "S": "ese", "T": "te", "U": "u", "V": "uve", "Y": "ye", "Z": "zeta",
}

function speakSpanish(label: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const text = SPANISH_LETTER_NAME[label] ?? label.toLowerCase()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = "es-MX"; utt.rate = 0.85; utt.pitch = 1.1; utt.volume = 1
  const voices = window.speechSynthesis.getVoices()
  const esVoice = voices.find(v => v.lang.startsWith("es")) ?? null
  if (esVoice) utt.voice = esVoice
  window.speechSynthesis.speak(utt)
}

const SKY_EMOJIS = ["🌟","⭐","✨","🎈","🌈","🦋","🌸","🎵","🎶","💫","🌺","🍀","🎀","🌙","🌠"]

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AnswerOption {
  id: number
  label: string
  spanish: string
  english: string
  category: "vowel" | "consonant" | "special"
  isTarget: boolean
  position: "left" | "up" | "right"
  x: number
  y: number
}

interface SkyEmoji { id: number; emoji: string; x: number; y: number; size: number; driftDur: number; driftDelay: number }

interface Props {
  sectionTitle: string
  coins: number
  onCoinsChange: (delta: number) => void
  onClose: () => void
  songFilter?: (entry: { label: string; category: string }) => boolean
  onGameEnd?: (score: number) => void
  onChallenge?: (score: number) => void
  activePointer?: string
  storeOwned?: string[]
  onEquipPointer?: (id: string) => void
}

const FLY_GEAR_CATALOG = [
  { id: "pointer-carrot",    name: "Carrot",           emoji: "🥕" },
  { id: "pointer-red-laser", name: "Red Laser",        emoji: "🔴" },
  { id: "pointer-banana",    name: "Banana Blaster",   emoji: "🍌" },
  { id: "pointer-water",     name: "Water Cannon",     emoji: "💧" },
  { id: "pointer-lightning", name: "Lightning Bolt",   emoji: "⚡" },
  { id: "pointer-ice",       name: "Ice Blaster",      emoji: "❄️" },
  { id: "pointer-rainbow",   name: "Rainbow Laser",    emoji: "🌈" },
  { id: "pointer-rocket",    name: "Rocket Launcher",  emoji: "🚀" },
  { id: "pointer-star",      name: "Star Shooter",     emoji: "⭐" },
  { id: "pointer-dragon",    name: "Dragon Breath",    emoji: "🐉" },
]

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BUNNY_W = 100
const BUNNY_H = 100
const BUNNY_HOME_X = 50
const BUNNY_HOME_Y = 72

const ANSWER_POSITIONS: { position: "left" | "up" | "right"; x: number; y: number }[] = [
  { position: "left",  x: 18, y: 32 },
  { position: "up",    x: 50, y: 16 },
  { position: "right", x: 82, y: 32 },
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

function categoryColor(cat: "vowel" | "consonant" | "special"): { bg: string; text: string; glow: string } {
  if (cat === "vowel")   return { bg: "#fef08a", text: "#92400e", glow: "#fde047" }
  if (cat === "special") return { bg: "#fbcfe8", text: "#831843", glow: "#f9a8d4" }
  return { bg: "#bfdbfe", text: "#1e3a8a", glow: "#93c5fd" }
}

function makeSkyEmojis(): SkyEmoji[] {
  return Array.from({ length: 14 }, (_, i) => ({
    id: i,
    emoji: SKY_EMOJIS[i % SKY_EMOJIS.length],
    x: 5 + (i * 13 + 7) % 88,
    y: 3 + (i * 17 + 5) % 65,
    size: 18 + (i * 7) % 22,
    driftDur: 4 + (i * 1.3) % 5,
    driftDelay: (i * 0.7) % 4,
  }))
}

// Sound effects
let _audioCtx: AudioContext | null = null
function getAudioCtx() { if (!_audioCtx) _audioCtx = new AudioContext(); return _audioCtx }
function playCorrectSound() {
  try { const ctx = getAudioCtx(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = "sine"; o.frequency.setValueAtTime(587, ctx.currentTime); o.frequency.setValueAtTime(784, ctx.currentTime + 0.08); o.frequency.setValueAtTime(988, ctx.currentTime + 0.16); g.gain.setValueAtTime(0.18, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.35) } catch {}
}
function playWrongSound() {
  try { const ctx = getAudioCtx(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = "triangle"; o.frequency.setValueAtTime(310, ctx.currentTime); o.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.25); g.gain.setValueAtTime(0.2, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3) } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AlphabetFly({ sectionTitle, coins: initialCoins, onCoinsChange, onClose, songFilter, onGameEnd, onChallenge, activePointer = "pointer-carrot", storeOwned = ["pointer-carrot"], onEquipPointer }: Props) {

  const FILTERED_QUEUE = useRef(songFilter ? ALPHABET_QUEUE.filter(e => songFilter(e)) : ALPHABET_QUEUE).current

  const [localSpeechEnabled, setLocalSpeechEnabled] = useState(false)
  const speechEnabledRef = useRef(false)
  useEffect(() => { speechEnabledRef.current = localSpeechEnabled }, [localSpeechEnabled])

  const [gamePhase,    setGamePhase]    = useState<"instructions" | "countdown" | "playing" | "complete" | "practice_more">("instructions")
  const [countdown,    setCountdown]    = useState(3)
  const [score,        setScore]        = useState(0)
  const [localCoins,   setLocalCoins]   = useState(initialCoins)
  const [alphabetIdx,  setAlphabetIdx]  = useState(0)
  const [flashScreen,  setFlashScreen]  = useState<"correct" | "wrong" | null>(null)
  const [showHint,     setShowHint]     = useState(false)
  const [hintEntry,    setHintEntry]    = useState<typeof ALPHABET_QUEUE[0] | null>(null)
  const [skyEmojis]                    = useState<SkyEmoji[]>(makeSkyEmojis)
  const [wrongCount,   setWrongCount]   = useState(0)
  const [halfSkull,    setHalfSkull]    = useState(false)
  const [missedWords,  setMissedWords]  = useState<{ label: string; spanish: string; english: string }[]>([])
  const [showLoadout,  setShowLoadout]  = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Answer options
  const [answers, setAnswers] = useState<AnswerOption[]>([])
  const [answerFlash, setAnswerFlash] = useState<{ id: number; correct: boolean } | null>(null)
  const [waitingForNext, setWaitingForNext] = useState(false)

  // Bunny animation
  const [bunnyPos, setBunnyPos] = useState({ x: BUNNY_HOME_X, y: BUNNY_HOME_Y })
  const [bunnyAnimating, setBunnyAnimating] = useState(false)
  const [bunnyFacing, setBunnyFacing] = useState<"left" | "right">("left")

  // Refs
  const alphabetIdxRef   = useRef(0)
  const gamePhaseRef     = useRef<typeof gamePhase>("instructions")
  const wrongCountRef    = useRef(0)
  const halfSkullRef     = useRef(false)
  const answerIdRef      = useRef(0)
  const onCoinsChangeRef = useRef(onCoinsChange)
  const scoreRef         = useRef(0)
  const lockedRef        = useRef(false)

  useEffect(() => { onCoinsChangeRef.current = onCoinsChange }, [onCoinsChange])
  useEffect(() => { alphabetIdxRef.current = alphabetIdx }, [alphabetIdx])
  useEffect(() => { gamePhaseRef.current = gamePhase }, [gamePhase])
  useEffect(() => { setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0) }, [])

  // ── Spawn answers ─────────────────────────────────────────────────────────
  const spawnQuestion = useCallback((targetIdx: number) => {
    if (targetIdx >= FILTERED_QUEUE.length) return
    const targetItem = FILTERED_QUEUE[targetIdx]
    const pool = ALPHABET_QUEUE.filter(a => a.label !== targetItem.label)
    const distractors = shuffle(pool).slice(0, 2)
    const all = shuffle([targetItem, ...distractors])
    const positions = shuffle([...ANSWER_POSITIONS])

    const newAnswers: AnswerOption[] = all.map((item, i) => ({
      id: answerIdRef.current++,
      label: item.label,
      spanish: item.spanish,
      english: item.english,
      category: item.category,
      isTarget: item.label === targetItem.label,
      position: positions[i].position,
      x: positions[i].x,
      y: positions[i].y,
    }))

    setAnswers(newAnswers)
    setAnswerFlash(null)
    setWaitingForNext(false)
    lockedRef.current = false
    setBunnyPos({ x: BUNNY_HOME_X, y: BUNNY_HOME_Y })
    setBunnyAnimating(false)
  }, [FILTERED_QUEUE])

  // ── Advance ───────────────────────────────────────────────────────────────
  const advanceRef = useRef<(wasCorrect: boolean) => void>(() => {})
  advanceRef.current = (wasCorrect: boolean) => {
    const idx = alphabetIdxRef.current
    const entry = FILTERED_QUEUE[idx]
    if (wasCorrect) {
      setFlashScreen("correct")
      setScore(s => { scoreRef.current = s + 10; return s + 10 })
      setHintEntry(entry)
      setShowHint(true)
      playCorrectSound()
      const coin = Math.random() < 0.6 ? 1 : 0
      if (coin > 0) { onCoinsChangeRef.current(coin); setLocalCoins(c => c + coin) }
      setTimeout(() => { setFlashScreen(null); setShowHint(false) }, 900)
    } else {
      setFlashScreen("wrong")
      playWrongSound()
      setTimeout(() => setFlashScreen(null), 400)
      halfSkullRef.current = false; setHalfSkull(false)
      wrongCountRef.current += 1; setWrongCount(wrongCountRef.current)
      setMissedWords(prev => [...prev, entry])
      if (wrongCountRef.current >= 5) {
        setTimeout(() => { setFlashScreen(null); setShowHint(false); setGamePhase("practice_more"); gamePhaseRef.current = "practice_more" }, 500)
        return
      }
    }

    const nextIdx = idx + 1
    if (nextIdx >= FILTERED_QUEUE.length) {
      alphabetIdxRef.current = nextIdx; setAlphabetIdx(nextIdx)
      setTimeout(() => { setFlashScreen(null); setShowHint(false); setGamePhase("complete"); gamePhaseRef.current = "complete"; onGameEnd?.(scoreRef.current) }, 1000)
      return
    }

    alphabetIdxRef.current = nextIdx; setAlphabetIdx(nextIdx)
    setWaitingForNext(true)
    setTimeout(() => {
      spawnQuestion(nextIdx)
      if (speechEnabledRef.current) setTimeout(() => speakSpanish(FILTERED_QUEUE[nextIdx].label), 300)
    }, 800)
  }

  // ── Handle answer selection ───────────────────────────────────────────────
  const handleSelectAnswer = useCallback((answer: AnswerOption) => {
    if (lockedRef.current || waitingForNext || bunnyAnimating) return
    if (gamePhaseRef.current !== "playing") return
    lockedRef.current = true

    if (speechEnabledRef.current) speakSpanish(answer.label)
    if (answer.position === "left") setBunnyFacing("left")
    else if (answer.position === "right") setBunnyFacing("right")

    setBunnyAnimating(true)
    setBunnyPos({ x: answer.x, y: answer.y })

    setTimeout(() => {
      setAnswerFlash({ id: answer.id, correct: answer.isTarget })
      setTimeout(() => {
        setBunnyPos({ x: BUNNY_HOME_X, y: BUNNY_HOME_Y })
        setBunnyFacing("left")
        setTimeout(() => { setBunnyAnimating(false); advanceRef.current(answer.isTarget) }, 400)
      }, 350)
    }, 450)
  }, [waitingForNext, bunnyAnimating])

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== "playing") return
    const handler = (e: KeyboardEvent) => {
      if (lockedRef.current) return
      let dir: "left" | "up" | "right" | null = null
      if (e.key === "ArrowLeft")  dir = "left"
      if (e.key === "ArrowUp")    dir = "up"
      if (e.key === "ArrowRight") dir = "right"
      if (!dir) return
      e.preventDefault()
      const answer = answers.find(a => a.position === dir)
      if (answer) handleSelectAnswer(answer)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [gamePhase, answers, handleSelectAnswer])

  // ── Gamepad ───────────────────────────────────────────────────────────────
  useGamepad({
    enabled: gamePhase === "playing",
    onPress: (btn: PadButton) => {
      if (lockedRef.current) return
      let dir: "left" | "up" | "right" | null = null
      if (btn === "left") dir = "left"
      if (btn === "up") dir = "up"
      if (btn === "right") dir = "right"
      if (!dir) return
      const answer = answers.find(a => a.position === dir)
      if (answer) handleSelectAnswer(answer)
    },
  })

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== "countdown") return
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t) }
    setCountdown(0)
    const t = setTimeout(() => {
      setGamePhase("playing"); gamePhaseRef.current = "playing"
      spawnQuestion(0)
      if (speechEnabledRef.current) speakSpanish(FILTERED_QUEUE[0].label)
    }, 600)
    return () => clearTimeout(t)
  }, [gamePhase, countdown, spawnQuestion, FILTERED_QUEUE])

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const progressPct  = Math.round((alphabetIdx / FILTERED_QUEUE.length) * 100)
  const currentEntry = FILTERED_QUEUE[Math.min(alphabetIdx, FILTERED_QUEUE.length - 1)]
  const ARROW_LABELS: Record<string, string> = { left: "←", up: "↑", right: "→" }

  const resetGame = () => {
    setScore(0); scoreRef.current = 0
    setAlphabetIdx(0); alphabetIdxRef.current = 0
    setAnswers([]); setCountdown(3); setFlashScreen(null); setShowHint(false)
    wrongCountRef.current = 0; setWrongCount(0); setMissedWords([])
    halfSkullRef.current = false; setHalfSkull(false)
    setAnswerFlash(null); setWaitingForNext(false); lockedRef.current = false
    setBunnyPos({ x: BUNNY_HOME_X, y: BUNNY_HOME_Y }); setBunnyAnimating(false)
    setGamePhase("countdown"); gamePhaseRef.current = "countdown"
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 30%, #4338ca 65%, #6366f1 100%)", transition: "background 0.9s ease" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-safe-top pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/80 text-sm font-bold active:scale-95 transition-all"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
            ← Back
          </button>
          {storeOwned.length > 1 && (
            <button onClick={() => setShowLoadout(true)}
              className="px-2.5 py-1.5 rounded-full text-sm active:scale-90 transition-all"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
              {FLY_GEAR_CATALOG.find(g => g.id === activePointer)?.emoji || "🥕"}
            </button>
          )}
        </div>

        <div className="text-center">
          <div className="text-white font-black text-lg leading-none">
            📚 {sectionTitle}
          </div>
          <div className="text-white/60 text-xs mt-0.5">{alphabetIdx}/{FILTERED_QUEUE.length} letters</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)" }}>
            <div style={{
              width:"18px",height:"18px",borderRadius:"50%",flexShrink:0,position:"relative",
              background:"conic-gradient(from 160deg,#D97706,#FBBF24 30%,#FDE68A 50%,#FBBF24 70%,#D97706)",
              border:"1.5px solid #92400E",boxShadow:"0 1px 4px rgba(0,0,0,0.2),inset 0 -1px 2px rgba(120,53,0,0.4)"}}>
              <div style={{position:"absolute",top:"15%",left:"18%",width:"32%",height:"20%",
                background:"radial-gradient(ellipse,rgba(255,255,255,0.6),rgba(255,255,255,0) 70%)",
                borderRadius:"50%",transform:"rotate(-15deg)"}}/>
            </div>
            <span className="text-yellow-300 font-black text-sm">{localCoins}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
            <span className="text-white font-black text-sm">{score}pts</span>
          </div>
        </div>
      </div>

      {/* Progress + skulls */}
      <div className="px-4 pb-1 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.15)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width:`${progressPct}%`, background:"linear-gradient(90deg,#a78bfa,#c084fc)" }}/>
            </div>
          </div>
          <div className="flex gap-0.5 flex-shrink-0">
            {[0,1,2,3,4].map(i => {
              const isFull = i < wrongCount
              const isHalf = !isFull && i === wrongCount && halfSkull
              return (
                <span key={i} style={{
                  fontSize: "14px", opacity: isFull ? 1 : isHalf ? 0.6 : 0.25,
                  filter: isFull ? "none" : isHalf ? "none" : "grayscale(1)",
                  transition: "all 0.3s ease",
                  transform: isFull ? "scale(1.1)" : isHalf ? "scale(1.05)" : "scale(1)",
                }}>{isHalf ? "🩻" : "💀"}</span>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Game Area ── */}
      <div className="flex-1 relative overflow-hidden select-none" style={{ touchAction: "none" }}>

        {/* Stars */}
        {[...Array(22)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white/25" style={{
            width:`${1.5+(i%3)}px`,height:`${1.5+(i%3)}px`,
            left:`${(i*41+9)%97}%`,top:`${(i*59+5)%88}%`,
            animation:`twinkle ${1.5+(i%5)*0.4}s ease-in-out ${(i*0.35)%2.5}s infinite alternate`}}/>
        ))}

        {/* Sky emojis */}
        {skyEmojis.map(se => (
          <div key={se.id} className="absolute select-none pointer-events-none" style={{
            left:`${se.x}%`,top:`${se.y}%`,fontSize:`${se.size}px`,opacity:0.4,
            animation:`skyDrift ${se.driftDur}s ease-in-out ${se.driftDelay}s infinite alternate`,
            filter:"drop-shadow(0 0 4px rgba(255,255,255,0.3))"}}>
            {se.emoji}
          </div>
        ))}

        {/* Clouds */}
        {[12,52,80].map((x,i) => (
          <div key={i} className="absolute text-white/15 select-none pointer-events-none"
            style={{left:`${x}%`,top:`${14+i*18}%`,fontSize:"60px",
              animation:`cloudDrift ${9+i*2}s ease-in-out ${i*4}s infinite alternate`}}>☁️</div>
        ))}

        {/* ── Answer options (letter bubbles at Left / Up / Right) ── */}
        {gamePhase === "playing" && answers.map(a => {
          const isFlashed = answerFlash?.id === a.id
          const flashCorrect = answerFlash?.correct
          const colors = categoryColor(a.category)
          return (
            <button key={a.id}
              onClick={() => handleSelectAnswer(a)}
              disabled={lockedRef.current || waitingForNext}
              className="absolute flex flex-col items-center select-none"
              style={{ left: `${a.x}%`, top: `${a.y}%`, transform: "translate(-50%, -50%)", zIndex: 5 }}>
              {/* Arrow indicator */}
              <div className="text-white/70 font-black text-2xl mb-1"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)", filter: "drop-shadow(0 0 6px rgba(255,255,255,0.3))" }}>
                {ARROW_LABELS[a.position]}
              </div>
              {/* Letter bubble */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{
                  position: "absolute", inset: "-8px", borderRadius: "50%",
                  background: isFlashed
                    ? (flashCorrect ? "radial-gradient(circle, rgba(74,222,128,0.6) 0%, transparent 70%)" : "radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)")
                    : `radial-gradient(circle, ${colors.glow}88 0%, transparent 70%)`,
                  animation: isFlashed ? undefined : "starGlow 2s ease-in-out infinite alternate",
                }}/>
                <div className="flex items-center justify-center font-black" style={{
                  position: "relative", zIndex: 1,
                  width: "64px", height: "64px",
                  fontSize: a.label.length > 1 ? "20px" : "28px",
                  background: isFlashed
                    ? (flashCorrect ? "radial-gradient(ellipse at 35% 30%, #4ade80, #22c55e)" : "radial-gradient(ellipse at 35% 30%, #f87171, #ef4444)")
                    : `radial-gradient(ellipse at 35% 30%, ${colors.bg}, ${colors.bg}dd)`,
                  color: isFlashed ? (flashCorrect ? "#14532d" : "#7f1d1d") : colors.text,
                  borderRadius: "50%",
                  boxShadow: isFlashed
                    ? (flashCorrect ? "0 0 24px rgba(74,222,128,0.9),0 4px 12px rgba(0,0,0,0.3)" : "0 0 24px rgba(248,113,113,0.9),0 4px 12px rgba(0,0,0,0.3)")
                    : `0 0 18px ${colors.glow}88, 0 0 6px ${colors.glow}44, 0 4px 12px rgba(0,0,0,0.3)`,
                  border: isFlashed ? "3px solid white" : "2.5px solid rgba(255,255,255,0.5)",
                  animation: isFlashed ? undefined : "starFloat 3s ease-in-out infinite",
                  transition: "background 0.2s ease",
                }}>
                  <div style={{ position: "absolute", top: "4px", left: "20%", width: "35%", height: "30%", borderRadius: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)" }}/>
                  <span style={{ position: "relative", zIndex: 1 }}>{a.label}</span>
                </div>
              </div>
              {/* Spanish word below */}
              <div className="mt-1 text-white/60 text-xs font-bold">{a.spanish}</div>
            </button>
          )
        })}

        {/* ── Bunny ── */}
        {(gamePhase === "playing") && (
          <div className="absolute pointer-events-none" style={{
            left: `calc(${bunnyPos.x}% - ${BUNNY_W / 2}px)`,
            top: `calc(${bunnyPos.y}% - ${BUNNY_H / 2}px)`,
            width: `${BUNNY_W}px`, height: `${BUNNY_H}px`, zIndex: 10,
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
            transition: bunnyAnimating ? "left 0.4s cubic-bezier(0.34,1.56,0.64,1), top 0.4s cubic-bezier(0.34,1.56,0.64,1)" : "left 0.35s ease, top 0.35s ease",
            transform: bunnyFacing === "right" ? "scaleX(-1)" : "scaleX(1)",
          }}>
            <Image src="/images/super-bunny-winner.png" alt="Bunny"
              width={BUNNY_W} height={BUNNY_H}
              className="w-full h-full object-contain" unoptimized priority/>
          </div>
        )}

        {/* Screen flash */}
        {flashScreen && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: flashScreen === "correct" ? "rgba(74,222,128,0.22)" : "rgba(239,68,68,0.28)", zIndex: 20,
          }}/>
        )}

        {/* Hint pop */}
        {showHint && hintEntry && (
          <div className="absolute left-1/2 pointer-events-none"
            style={{top:"38%",zIndex:25,animation:"hintPop 0.9s ease-out forwards",transform:"translateX(-50%)"}}>
            <div className="text-5xl mb-2 text-center">✅</div>
            <div className="text-white font-black text-xl px-5 py-2.5 rounded-2xl text-center"
              style={{background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",whiteSpace:"nowrap"}}>
              +10 pts<br/>
              <span className="text-yellow-300 font-bold text-base">{hintEntry.label}</span>
              <span className="text-white/60 font-bold text-sm ml-2">= {hintEntry.spanish} ({hintEntry.english})</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        {gamePhase === "instructions" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8"
            style={{zIndex:50,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(12px)"}}>
            <div className="text-8xl mb-5" style={{animation:"countdownPop 0.6s ease-out forwards"}}>🐰</div>
            <div className="text-white font-black text-2xl text-center mb-5">📚 {sectionTitle}</div>
            <div className="text-center mb-8 px-6 py-4 rounded-2xl"
              style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",maxWidth:"320px"}}>
              <div className="text-white font-bold text-base leading-relaxed">
                {isTouchDevice
                  ? <><span className="text-yellow-300 font-black">Tap</span> the correct letter to fly the bunny there!</>
                  : <>Press <span className="text-yellow-300 font-black">← ↑ →</span> arrow keys to fly the bunny to the correct letter!</>
                }
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {["←","↑","→"].map((a, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-3xl">{a}</span>
                    <span className="text-white/50 text-xs">{["Left","Up","Right"][i]}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-3 mt-4">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{background:"#fef08a",color:"#92400e"}}>Vowel</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{background:"#bfdbfe",color:"#1e3a8a"}}>Consonant</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{background:"#fbcfe8",color:"#831843"}}>Special</span>
              </div>
            </div>
            {/* Speech toggle */}
            <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-2xl"
              style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",maxWidth:"300px",width:"100%"}}>
              <span className="text-2xl">{localSpeechEnabled ? "🔊" : "🔇"}</span>
              <div className="flex-1">
                <div className="text-white font-bold text-sm">Say letters aloud</div>
                <div className="text-white/50 text-xs">Hear pronunciation during play</div>
              </div>
              <button onClick={() => setLocalSpeechEnabled(prev => !prev)}
                className="w-12 h-7 rounded-full transition-all relative flex-shrink-0"
                style={{ background: localSpeechEnabled ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.15)", border: "1.5px solid " + (localSpeechEnabled ? "rgba(34,197,94,0.6)" : "rgba(255,255,255,0.2)") }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ left: localSpeechEnabled ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </div>
            <button onClick={() => { setGamePhase("countdown"); gamePhaseRef.current = "countdown" }}
              className="px-8 py-4 rounded-2xl font-black text-white text-lg transition-transform active:scale-95"
              style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",boxShadow:"0 4px 24px rgba(99,102,241,0.5)"}}>
              Let&apos;s Go! 🚀
            </button>
          </div>
        )}

        {/* Countdown */}
        {gamePhase === "countdown" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{zIndex:30,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(6px)"}}>
            <div className="text-white font-black text-center mb-8">
              <div className="text-2xl mb-2 opacity-80">Get ready!</div>
              <div className="text-8xl" style={{animation:"countdownPop 1s ease-out forwards"}}>
                {countdown > 0 ? countdown : "🐰"}
              </div>
            </div>
            <div className="px-6 py-3 rounded-2xl text-white/70 text-sm text-center max-w-xs"
              style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)"}}>
              {isTouchDevice
                ? <><strong className="text-white">Tap</strong> the correct letter<br/></>
                : <><strong className="text-white">Press ← ↑ →</strong> to pick a letter<br/></>
              }
              Fly 🐰 to the <span className="text-yellow-300 font-bold">correct letter</span>!
            </div>
          </div>
        )}

        {/* Practice More / Game Over */}
        {gamePhase === "practice_more" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
            style={{zIndex:45,background:"linear-gradient(160deg,rgba(20,0,0,0.97),rgba(80,10,10,0.98))",backdropFilter:"blur(10px)"}}>
            <div className="text-5xl mb-3" style={{animation:"countdownPop 0.6s ease-out forwards"}}>💀💀💀💀💀</div>
            <div className="text-white font-black text-2xl text-center mb-2">5 Strikes — Game Over!</div>
            <div className="text-white/60 font-bold text-sm text-center mb-4">Review the letters you missed:</div>
            <div className="w-full max-w-xs mb-6 space-y-2">
              {missedWords.slice(0, 5).map((w, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)"}}>
                  <span className="text-red-400 text-lg">💀</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-black text-base">{w.label} — {w.spanish}</div>
                    <div className="text-white/50 text-xs">{w.english}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={resetGame}
                className="px-6 py-3 rounded-2xl font-black text-white text-base transition-transform active:scale-95"
                style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)"}}>
                Try Again 🔄
              </button>
              <button onClick={onClose}
                className="px-6 py-3 rounded-2xl font-black text-white text-base transition-transform active:scale-95"
                style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",boxShadow:"0 4px 20px rgba(99,102,241,0.5)"}}>
                Study More 📖
              </button>
            </div>
          </div>
        )}

        {/* Win screen */}
        {gamePhase === "complete" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
            style={{zIndex:40,background:"linear-gradient(160deg,rgba(15,5,40,0.96),rgba(30,27,75,0.98))",backdropFilter:"blur(10px)"}}>
            {[...Array(18)].map((_,i) => (
              <div key={i} className="absolute pointer-events-none" style={{
                left:`${(i*37+11)%94}%`,top:`${(i*53+7)%88}%`,
                fontSize:`${16+(i%4)*8}px`,
                animation:`twinkle ${1.2+(i%4)*0.4}s ease-in-out ${(i*0.3)%2}s infinite alternate`,
              }}>{["🌟","⭐","✨","🎉","🎊","💫"][i%6]}</div>
            ))}
            <div className="text-8xl mb-3" style={{animation:"countdownPop 0.6s ease-out forwards"}}>🏆</div>
            <div className="text-white font-black text-3xl text-center mb-1">¡Lo lograste!</div>
            <div className="text-white/70 font-bold text-base text-center mb-6">You finished the whole alphabet!</div>
            <div className="flex gap-4 mb-8">
              {[{label:"Score",val:score},{label:"Coins",val:localCoins},{label:"Letters",val:FILTERED_QUEUE.length}].map(s => (
                <div key={s.label} className="flex flex-col items-center px-5 py-3 rounded-2xl"
                  style={{background:"rgba(251,191,36,0.18)",border:"1px solid rgba(251,191,36,0.4)"}}>
                  <span className="text-yellow-300 font-black text-2xl">{s.val}</span>
                  <span className="text-white/60 text-xs font-bold mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-xs">
              {FILTERED_QUEUE.map(entry => (
                <div key={entry.label} className="flex items-center justify-center rounded-xl font-black"
                  style={{
                    width:"38px",height:"38px",
                    fontSize: entry.label.length > 1 ? "11px" : "18px",
                    background: entry.category==="vowel" ? "#fef08a" : entry.category==="special" ? "#fbcfe8" : "#bfdbfe",
                    color:      entry.category==="vowel" ? "#92400e" : entry.category==="special" ? "#831843" : "#1e3a8a",
                    boxShadow:"0 2px 8px rgba(0,0,0,0.25)",
                  }}>{entry.label}</div>
              ))}
            </div>
            {onChallenge && (
              <div className="w-full max-w-xs mb-3">
                <button onClick={() => onChallenge(scoreRef.current)}
                  className="px-6 py-3 rounded-2xl font-black text-white text-base transition-transform active:scale-95 w-full"
                  style={{background:"linear-gradient(135deg,#06b6d4,#0891b2)",boxShadow:"0 4px 20px rgba(6,182,212,0.5)",border:"1.5px solid rgba(255,255,255,0.3)"}}>
                  ⚔️ Challenge a Friend
                </button>
                <p className="text-center text-xs font-bold mt-1" style={{ color: "#fbbf24" }}>Win and earn 2x points! 💰</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={resetGame}
                className="px-6 py-3 rounded-2xl font-black text-white text-base transition-transform active:scale-95"
                style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",boxShadow:"0 4px 20px rgba(99,102,241,0.5)"}}>
                Play Again 🔄
              </button>
              <button onClick={onClose}
                className="px-6 py-3 rounded-2xl font-black text-white/80 text-base transition-transform active:scale-95"
                style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)"}}>
                Back 🏠
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar — letter prompt ── */}
      <div className="flex-shrink-0 pb-safe-bottom" style={{background:"rgba(0,0,0,0.45)",backdropFilter:"blur(12px)"}}>
        <div className="px-4 py-4 text-center">
          <div className="inline-block px-5 py-2.5 rounded-2xl"
            style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)"}}>
            <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-0.5">Find it!</div>
            <div className="text-white font-black text-3xl leading-tight tracking-wide">
              {currentEntry.label}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes twinkle { from { opacity:0.15; transform:scale(0.7); } to { opacity:0.9; transform:scale(1.3); } }
        @keyframes cloudDrift { from { transform:translateX(-12px); } to { transform:translateX(12px); } }
        @keyframes skyDrift { 0% { transform:translateY(0px) rotate(-4deg); } 50% { transform:translateY(-8px) rotate(2deg); } 100% { transform:translateY(4px) rotate(-2deg); } }
        @keyframes hintPop { 0% { opacity:0; transform:translateX(-50%) scale(0.7); } 25% { opacity:1; transform:translateX(-50%) scale(1.08); } 75% { opacity:1; transform:translateX(-50%) scale(1); } 100% { opacity:0; transform:translateX(-50%) scale(0.9); } }
        @keyframes countdownPop { 0% { transform:scale(0.5); opacity:0; } 50% { transform:scale(1.2); opacity:1; } 100% { transform:scale(1); opacity:1; } }
        @keyframes starGlow { 0% { opacity:0.4; transform:scale(0.9); } 100% { opacity:0.8; transform:scale(1.15); } }
        @keyframes starFloat { 0%,100% { transform:scale(1) rotate(-2deg); } 50% { transform:scale(1.06) rotate(2deg); } }
      `}</style>

      {/* Loadout overlay */}
      {showLoadout && (
        <div className="absolute inset-0 z-[999] flex flex-col items-center justify-end" style={{ background: "rgba(0,0,0,0.75)" }} onClick={() => setShowLoadout(false)}>
          <div className="w-full max-w-md rounded-t-3xl overflow-hidden"
            style={{ background: "linear-gradient(180deg, #1a0d2e 0%, #0f0520 100%)", border: "1.5px solid rgba(168,85,247,0.35)", borderBottom: "none", boxShadow: "0 -8px 40px rgba(0,0,0,0.7)", maxHeight: "60dvh" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.25)" }} /></div>
            <div className="flex items-center justify-between px-5 pt-1 pb-3">
              <div>
                <p className="text-white text-xl font-black">⚙️ Loadout</p>
                <p className="text-white/50 text-xs mt-0.5">Tap to equip — owned gear only</p>
              </div>
              <button onClick={() => setShowLoadout(false)}
                className="px-4 py-2 rounded-full font-black text-white text-sm active:scale-90 transition-all"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 14px rgba(34,197,94,0.4)" }}>
                ▶ Close
              </button>
            </div>
            <div className="overflow-y-auto px-4 pb-6" style={{ WebkitOverflowScrolling: "touch" }}>
              <div className="grid grid-cols-4 gap-2">
                {FLY_GEAR_CATALOG.filter(item => storeOwned.includes(item.id)).map(item => {
                  const isActive = activePointer === item.id
                  return (
                    <button key={item.id}
                      onClick={() => { onEquipPointer?.(item.id); setShowLoadout(false) }}
                      className="flex flex-col items-center gap-1 py-2.5 px-1.5 rounded-xl transition-all active:scale-90"
                      style={{
                        background: isActive ? "linear-gradient(135deg, rgba(168,85,247,0.45), rgba(99,102,241,0.45))" : "rgba(255,255,255,0.08)",
                        border: isActive ? "2px solid rgba(168,85,247,0.9)" : "1.5px solid rgba(255,255,255,0.08)",
                      }}>
                      <span style={{ fontSize: "24px" }}>{item.emoji}</span>
                      <span className="text-white text-[10px] font-bold text-center leading-tight">{item.name}</span>
                      {isActive && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "rgba(134,239,172,0.25)", color: "#86efac" }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
