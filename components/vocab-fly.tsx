"use client"
// ─────────────────────────────────────────────────────────────────────────────
// VocabFly — Arrow-based quiz: pick Left / Up / Right to fly bunny to answer
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"
import { useGamepad, type PadButton } from "@/hooks/use-gamepad"

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED TYPES (used by wrapper components)
// ─────────────────────────────────────────────────────────────────────────────

export interface FlyWord { spanish: string; english: string }

export interface FlyPhaseConfig {
  words:          FlyWord[]
  speedBase:      number
  speedVariance:  number
  waveInterval:   number
  label:          string
  bgGradient:     string
  bubbleBg:       string
  bubbleText:     string
  progressGrad:   string
  badgeColor:     string
  colorMap?:      Record<string, string>
}

export interface VocabFlyProps {
  title:           string
  icon:            string
  phase1:          FlyPhaseConfig
  phase2?:         FlyPhaseConfig
  transitionMsg?:  string
  transitionIcon?: string
  accentColor:     string
  coins:           number
  onCoinsChange:   (delta: number) => void
  onClose:         () => void
  speechEnabled?:  boolean
  onGameEnd?:      (score: number) => void
  onChallenge?:    (score: number) => void
  activePointer?:  string
  storeOwned?:     string[]
  onEquipPointer?: (id: string) => void
}

// Mini catalog for fly loadout UI
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
// PRIVATE TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AnswerOption {
  id: number
  spanish: string
  english: string
  isTarget: boolean
  position: "left" | "up" | "right"
  x: number // percent
  y: number // percent
}

interface SkyEmoji { id: number; emoji: string; x: number; y: number; size: number; driftDur: number; driftDelay: number }

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BUNNY_W = 72
const BUNNY_H = 72
const BUNNY_HOME_X = 50
const BUNNY_HOME_Y = 72

// Answer positions: Left, Up, Right
const ANSWER_POSITIONS: { position: "left" | "up" | "right"; x: number; y: number }[] = [
  { position: "left",  x: 18, y: 32 },
  { position: "up",    x: 50, y: 16 },
  { position: "right", x: 82, y: 32 },
]

const SKY_EMOJIS = ["🌟","⭐","✨","🎈","🌈","🦋","🌸","🎵","💫","🌺","🍀","🎀","🌙","🌠","🫀"]

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

function speakSpanish(word: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(word)
  utt.lang = "es-MX"; utt.rate = 0.85; utt.pitch = 1.1; utt.volume = 1
  const voices = window.speechSynthesis.getVoices()
  const esVoice = voices.find(v => v.lang.startsWith("es")) ?? null
  if (esVoice) utt.voice = esVoice
  window.speechSynthesis.speak(utt)
}

// ── Sound effects via Web Audio API ──
let _audioCtx: AudioContext | null = null
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new AudioContext()
  return _audioCtx
}
function playCorrectSound() {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(587, ctx.currentTime)
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.08)
    osc.frequency.setValueAtTime(988, ctx.currentTime + 0.16)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35)
  } catch {}
}
function playWrongSound() {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = "triangle"
    osc.frequency.setValueAtTime(310, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.25)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function VocabFly({
  title, icon,
  phase1, phase2,
  transitionMsg, transitionIcon,
  accentColor,
  coins: initialCoins, onCoinsChange, onClose,
  speechEnabled, onGameEnd, onChallenge,
  activePointer = "pointer-carrot", storeOwned = ["pointer-carrot"], onEquipPointer,
}: VocabFlyProps) {

  // ── Stable computed values ────────────────────────────────────────────────
  const FULL_QUEUE = useRef(phase2 ? [...phase1.words, ...phase2.words] : [...phase1.words]).current
  const PHASE1_LEN = useRef(phase1.words.length).current
  const isSinglePhase = !phase2

  // ── Render state ──────────────────────────────────────────────────────────
  const [gamePhase,    setGamePhase]    = useState<"instructions" | "countdown" | "playing" | "phase_transition" | "complete" | "practice_more">("instructions")
  const [countdown,    setCountdown]    = useState(3)
  const [score,        setScore]        = useState(0)
  const [localCoins,   setLocalCoins]   = useState(initialCoins)
  const [wordIdx,      setWordIdx]      = useState(0)
  const [flashScreen,  setFlashScreen]  = useState<"correct" | "wrong" | null>(null)
  const [showHint,     setShowHint]     = useState(false)
  const [hintEntry,    setHintEntry]    = useState<FlyWord | null>(null)
  const [skyEmojis]                    = useState<SkyEmoji[]>(makeSkyEmojis)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [wrongCount,   setWrongCount]   = useState(0)
  const [halfSkull,    setHalfSkull]    = useState(false)
  const [missedWords,  setMissedWords]  = useState<FlyWord[]>([])
  const [showLoadout,  setShowLoadout]  = useState(false)

  // Answer options for current question
  const [answers, setAnswers] = useState<AnswerOption[]>([])
  const [answerFlash, setAnswerFlash] = useState<{ id: number; correct: boolean } | null>(null)
  const [waitingForNext, setWaitingForNext] = useState(false)

  // Bunny animation position
  const [bunnyPos, setBunnyPos] = useState({ x: BUNNY_HOME_X, y: BUNNY_HOME_Y })
  const [bunnyAnimating, setBunnyAnimating] = useState(false)
  const [bunnyFacing, setBunnyFacing] = useState<"left" | "right">("left")

  // ── Mutable refs ──────────────────────────────────────────────────────────
  const wordIdxRef       = useRef(0)
  const gamePhaseRef     = useRef<typeof gamePhase>("instructions")
  const wrongCountRef    = useRef(0)
  const halfSkullRef     = useRef(false)
  const answerIdRef      = useRef(0)
  const onCoinsChangeRef = useRef(onCoinsChange)
  const scoreRef         = useRef(0)
  const lockedRef        = useRef(false) // prevents double-selection

  // Speech toggle
  const [localSpeechEnabled, setLocalSpeechEnabled] = useState(speechEnabled ?? false)
  const speechEnabledRef = useRef(localSpeechEnabled)
  useEffect(() => { speechEnabledRef.current = localSpeechEnabled }, [localSpeechEnabled])

  useEffect(() => { onCoinsChangeRef.current = onCoinsChange }, [onCoinsChange])
  useEffect(() => { wordIdxRef.current = wordIdx }, [wordIdx])
  useEffect(() => { gamePhaseRef.current = gamePhase }, [gamePhase])

  // ── Detect touch device ───────────────────────────────────────────────────
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
  }, [])

  // ── Spawn answers for a given word index ──────────────────────────────────
  const spawnQuestion = useCallback((targetIdx: number) => {
    if (targetIdx >= FULL_QUEUE.length) return
    const targetWord = FULL_QUEUE[targetIdx]
    const isPhase2 = targetIdx >= PHASE1_LEN
    const pool = isPhase2 ? (phase2?.words ?? phase1.words) : phase1.words
    const distractors = shuffle(pool.filter(w => w.spanish !== targetWord.spanish)).slice(0, 2)
    const all = shuffle([targetWord, ...distractors])
    const positions = shuffle([...ANSWER_POSITIONS])

    const newAnswers: AnswerOption[] = all.map((item, i) => ({
      id: answerIdRef.current++,
      spanish: item.spanish,
      english: item.english,
      isTarget: item.spanish === targetWord.spanish,
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
  }, [FULL_QUEUE, PHASE1_LEN, phase1, phase2])

  // ── Advance word ──────────────────────────────────────────────────────────
  const advanceRef = useRef<(wasCorrect: boolean) => void>(() => {})
  advanceRef.current = (wasCorrect: boolean) => {
    const idx = wordIdxRef.current
    const entry = FULL_QUEUE[idx]
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
      // Wrong answer gives a full skull
      halfSkullRef.current = false
      setHalfSkull(false)
      wrongCountRef.current += 1
      setWrongCount(wrongCountRef.current)
      setMissedWords(prev => [...prev, entry])
      if (wrongCountRef.current >= 5) {
        setTimeout(() => {
          setFlashScreen(null); setShowHint(false)
          setGamePhase("practice_more"); gamePhaseRef.current = "practice_more"
        }, 500)
        return
      }
    }

    const nextIdx = idx + 1

    // Phase transition
    if (nextIdx === PHASE1_LEN && !isSinglePhase) {
      wordIdxRef.current = nextIdx
      setWordIdx(nextIdx)
      setGamePhase("phase_transition")
      gamePhaseRef.current = "phase_transition"
      setAnswers([])
      setTimeout(() => {
        setFlashScreen(null); setShowHint(false)
        setGamePhase("playing"); gamePhaseRef.current = "playing"
        spawnQuestion(nextIdx)
        if (speechEnabledRef.current) setTimeout(() => speakSpanish(FULL_QUEUE[nextIdx].spanish), 300)
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
      }, 1000)
      return
    }

    wordIdxRef.current = nextIdx
    setWordIdx(nextIdx)

    // Spawn next question after bunny flies back
    setWaitingForNext(true)
    setTimeout(() => {
      spawnQuestion(nextIdx)
      if (speechEnabledRef.current) setTimeout(() => speakSpanish(FULL_QUEUE[nextIdx].spanish), 300)
    }, 800)
  }

  // ── Handle answer selection ───────────────────────────────────────────────
  const handleSelectAnswer = useCallback((answer: AnswerOption) => {
    if (lockedRef.current || waitingForNext || bunnyAnimating) return
    if (gamePhaseRef.current !== "playing") return
    lockedRef.current = true

    // Speak the word
    if (speechEnabledRef.current) speakSpanish(answer.spanish)

    // Set bunny facing direction
    if (answer.position === "left") setBunnyFacing("left")
    else if (answer.position === "right") setBunnyFacing("right")

    // Fly bunny to answer
    setBunnyAnimating(true)
    setBunnyPos({ x: answer.x, y: answer.y })

    // After bunny arrives (~450ms), show result
    setTimeout(() => {
      setAnswerFlash({ id: answer.id, correct: answer.isTarget })

      // After showing flash, fly bunny back and advance
      setTimeout(() => {
        setBunnyPos({ x: BUNNY_HOME_X, y: BUNNY_HOME_Y })
        setBunnyFacing("left")

        setTimeout(() => {
          setBunnyAnimating(false)
          advanceRef.current(answer.isTarget)
        }, 400)
      }, 350)
    }, 450)
  }, [waitingForNext, bunnyAnimating])

  // ── Keyboard — single press selects Left/Up/Right ──────────────────────────
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

  // ── Gamepad / dance mat ───────────────────────────────────────────────────
  useGamepad({
    enabled: gamePhase === "playing",
    onPress: (btn: PadButton) => {
      if (lockedRef.current) return
      let dir: "left" | "up" | "right" | null = null
      if (btn === "left")  dir = "left"
      if (btn === "up")    dir = "up"
      if (btn === "right") dir = "right"
      if (!dir) return
      const answer = answers.find(a => a.position === dir)
      if (answer) handleSelectAnswer(answer)
    },
  })

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== "countdown") return
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
    setCountdown(0)
    const t = setTimeout(() => {
      setGamePhase("playing")
      gamePhaseRef.current = "playing"
      spawnQuestion(0)
      if (speechEnabledRef.current) speakSpanish(FULL_QUEUE[0].spanish)
    }, 600)
    return () => clearTimeout(t)
  }, [gamePhase, countdown, spawnQuestion, FULL_QUEUE])

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const progressPct  = Math.round((wordIdx / FULL_QUEUE.length) * 100)
  const currentEntry = FULL_QUEUE[Math.min(wordIdx, FULL_QUEUE.length - 1)]
  const isPhase2     = !isSinglePhase && wordIdx >= PHASE1_LEN
  const currentPhase = isPhase2 ? phase2! : phase1
  const bubbleBg     = currentPhase.bubbleBg
  const bubbleText   = currentPhase.bubbleText

  const dynamicBg = (gamePhase === "playing" || gamePhase === "phase_transition")
    ? (currentPhase.colorMap?.[currentEntry.spanish] ?? currentPhase.bgGradient)
    : currentPhase.bgGradient

  const ARROW_LABELS: Record<string, string> = { left: "←", up: "↑", right: "→" }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: dynamicBg, transition: "background 0.9s ease" }}>

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
            {icon} {title}
            <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: currentPhase.badgeColor, color: "white" }}>
              {currentPhase.label}
            </span>
          </div>
          <div className="text-white/60 text-xs mt-0.5">{wordIdx}/{FULL_QUEUE.length} words</div>
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

      {/* Progress bar + skull strikes */}
      <div className="px-4 pb-1 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.15)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width:`${progressPct}%`, background: currentPhase.progressGrad }}/>
            </div>
          </div>
          <div className="flex gap-0.5 flex-shrink-0">
            {[0,1,2,3,4].map(i => {
              const isFull = i < wrongCount
              const isHalf = !isFull && i === wrongCount && halfSkull
              return (
                <span key={i} style={{
                  fontSize: "14px",
                  opacity: isFull ? 1 : isHalf ? 0.6 : 0.25,
                  filter: isFull ? "none" : isHalf ? "none" : "grayscale(1)",
                  transition: "all 0.3s ease",
                  transform: isFull ? "scale(1.1)" : isHalf ? "scale(1.05)" : "scale(1)",
                }}>{isHalf ? "🩻" : "💀"}</span>
              )
            })}
          </div>
        </div>
        <div className="flex justify-between text-white/40 text-xs mt-0.5 px-0.5">
          <span>{phase1.label}</span>
          {phase2 && <span>{phase2.label}</span>}
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

        {/* ── Answer options (3 bubbles at Left / Up / Right) ── */}
        {gamePhase === "playing" && answers.map(a => {
          const isFlashed = answerFlash?.id === a.id
          const flashColor = answerFlash?.correct
          return (
            <button key={a.id}
              onClick={() => handleSelectAnswer(a)}
              disabled={lockedRef.current || waitingForNext}
              className="absolute flex flex-col items-center select-none"
              style={{
                left: `${a.x}%`, top: `${a.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 5,
                transition: "transform 0.15s ease",
              }}>
              {/* Arrow indicator */}
              <div className="text-white/70 font-black text-2xl mb-1"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)", filter: "drop-shadow(0 0 6px rgba(255,255,255,0.3))" }}>
                {ARROW_LABELS[a.position]}
              </div>
              {/* Word bubble */}
              <div style={{
                position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
                minWidth: "80px", height: "54px", padding: "0 16px",
              }}>
                {/* Glow halo */}
                <div style={{
                  position: "absolute", inset: "-8px",
                  borderRadius: "50%",
                  background: isFlashed
                    ? (flashColor ? "radial-gradient(circle, rgba(74,222,128,0.6) 0%, transparent 70%)" : "radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)")
                    : `radial-gradient(circle, ${bubbleBg}55 0%, transparent 70%)`,
                  animation: isFlashed ? undefined : "starGlow 2s ease-in-out infinite alternate",
                  transition: "background 0.2s ease",
                }}/>
                {/* Star body */}
                <div className="flex items-center justify-center font-black" style={{
                  position: "relative", zIndex: 1,
                  minWidth: "76px", height: "50px", padding: "0 14px",
                  fontSize: a.spanish.length > 8 ? "13px" : a.spanish.length > 6 ? "15px" : "18px",
                  background: isFlashed
                    ? (flashColor ? "radial-gradient(ellipse at 35% 30%, #4ade80, #22c55e)" : "radial-gradient(ellipse at 35% 30%, #f87171, #ef4444)")
                    : `radial-gradient(ellipse at 35% 30%, ${bubbleBg}, ${bubbleBg}dd)`,
                  color: isFlashed ? (flashColor ? "#14532d" : "#7f1d1d") : bubbleText,
                  borderRadius: "50%",
                  boxShadow: isFlashed
                    ? (flashColor ? "0 0 24px rgba(74,222,128,0.9),0 4px 12px rgba(0,0,0,0.3)" : "0 0 24px rgba(248,113,113,0.9),0 4px 12px rgba(0,0,0,0.3)")
                    : `0 0 18px ${bubbleBg}88, 0 0 6px ${bubbleBg}44, 0 4px 12px rgba(0,0,0,0.3)`,
                  border: isFlashed
                    ? "3px solid white"
                    : "2.5px solid rgba(255,255,255,0.5)",
                  animation: isFlashed ? undefined : "starFloat 3s ease-in-out infinite",
                  transition: "background 0.2s ease, box-shadow 0.2s ease",
                }}>
                  {/* Inner shine */}
                  <div style={{
                    position: "absolute", top: "4px", left: "20%", width: "35%", height: "30%",
                    borderRadius: "50%",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
                  }}/>
                  <span style={{ position: "relative", zIndex: 1 }}>{a.spanish}</span>
                </div>
              </div>
            </button>
          )
        })}

        {/* ── Bunny ── */}
        {(gamePhase === "playing" || gamePhase === "phase_transition") && (
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

        {/* ── Screen flash ── */}
        {flashScreen && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: flashScreen === "correct" ? "rgba(74,222,128,0.22)" : "rgba(239,68,68,0.28)",
            zIndex: 20,
          }}/>
        )}

        {/* ── Hint pop ── */}
        {showHint && hintEntry && (
          <div className="absolute left-1/2 pointer-events-none"
            style={{top:"38%",zIndex:25,animation:"hintPop 0.9s ease-out forwards",transform:"translateX(-50%)"}}>
            <div className="text-5xl mb-2 text-center">✅</div>
            <div className="text-white font-black text-xl px-5 py-2.5 rounded-2xl text-center"
              style={{background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",whiteSpace:"nowrap"}}>
              +10 pts<br/>
              <span className="text-yellow-300 font-bold text-base">{hintEntry.spanish}</span>
              <span className="text-white/60 font-bold text-sm ml-2">= {hintEntry.english}</span>
            </div>
          </div>
        )}

        {/* ── Instructions Screen ── */}
        {gamePhase === "instructions" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8"
            style={{zIndex:50,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(12px)"}}>
            <div className="text-8xl mb-5" style={{animation:"countdownPop 0.6s ease-out forwards"}}>🐰</div>
            <div className="text-white font-black text-2xl text-center mb-5">{icon} {title}</div>
            <div className="text-center mb-8 px-6 py-4 rounded-2xl"
              style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",maxWidth:"320px"}}>
              <div className="text-white font-bold text-base leading-relaxed">
                {isTouchDevice
                  ? <><span className="text-yellow-300 font-black">Tap</span> the correct Spanish word to fly the bunny there!</>
                  : <>Press <span className="text-yellow-300 font-black">← ↑ →</span> arrow keys to fly the bunny to the correct Spanish word!</>
                }
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex flex-col items-center">
                  <span className="text-3xl">←</span>
                  <span className="text-white/50 text-xs">Left</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl">↑</span>
                  <span className="text-white/50 text-xs">Up</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl">→</span>
                  <span className="text-white/50 text-xs">Right</span>
                </div>
              </div>
            </div>
            {/* Speech toggle */}
            <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-2xl"
              style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",maxWidth:"300px",width:"100%"}}>
              <span className="text-2xl">{localSpeechEnabled ? "🔊" : "🔇"}</span>
              <div className="flex-1">
                <div className="text-white font-bold text-sm">Say words aloud</div>
                <div className="text-white/50 text-xs">Hear pronunciation during play</div>
              </div>
              <button
                onClick={() => setLocalSpeechEnabled(prev => !prev)}
                className="w-12 h-7 rounded-full transition-all relative flex-shrink-0"
                style={{
                  background: localSpeechEnabled
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "rgba(255,255,255,0.15)",
                  border: "1.5px solid " + (localSpeechEnabled ? "rgba(34,197,94,0.6)" : "rgba(255,255,255,0.2)"),
                }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ left: localSpeechEnabled ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </div>
            <button
              onClick={() => { setGamePhase("countdown"); gamePhaseRef.current = "countdown" }}
              className="px-8 py-4 rounded-2xl font-black text-white text-lg transition-transform active:scale-95"
              style={{background: accentColor, boxShadow:"0 4px 24px rgba(0,0,0,0.4)"}}>
              Let&apos;s Go! 🚀
            </button>
          </div>
        )}

        {/* ── Phase Transition ── */}
        {gamePhase === "phase_transition" && transitionIcon && transitionMsg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{zIndex:35,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)"}}>
            <div className="text-7xl mb-4" style={{animation:"countdownPop 0.5s ease-out forwards"}}>{transitionIcon}</div>
            <div className="text-white font-black text-3xl text-center mb-2">{phase1.label}: ✅</div>
            <div className="text-white/80 font-bold text-xl text-center mb-1">{transitionMsg}</div>
            <div className="text-white/50 text-sm text-center mt-2">Get ready for the next round!</div>
          </div>
        )}

        {/* ── Countdown ── */}
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
                ? <><strong className="text-white">Tap</strong> the correct answer<br/></>
                : <><strong className="text-white">Press ← ↑ →</strong> to pick an answer<br/></>
              }
              Fly 🐰 to the <span className="text-yellow-300 font-bold">correct Spanish word</span>!<br/>
              <span className="text-xs opacity-60 mt-1 block">English prompt shown at bottom</span>
            </div>
          </div>
        )}

        {/* ── Practice More screen — 5 wrong answers ── */}
        {gamePhase === "practice_more" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
            style={{zIndex:45,background:"linear-gradient(160deg,rgba(20,0,0,0.97),rgba(80,10,10,0.98))",backdropFilter:"blur(10px)"}}>
            <div className="text-5xl mb-3" style={{animation:"countdownPop 0.6s ease-out forwards"}}>💀💀💀💀💀</div>
            <div className="text-white font-black text-2xl text-center mb-2">5 Strikes — Game Over!</div>
            <div className="text-white/60 font-bold text-sm text-center mb-4">Review the words you missed:</div>
            <div className="w-full max-w-xs mb-6 space-y-2">
              {missedWords.slice(0, 5).map((w, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)"}}>
                  <span className="text-red-400 text-lg">💀</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-black text-base">{w.spanish}</div>
                    <div className="text-white/50 text-xs">{w.english}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => {
                setScore(0); scoreRef.current = 0
                setWordIdx(0); wordIdxRef.current = 0
                setAnswers([]); setCountdown(3); setFlashScreen(null); setShowHint(false)
                wrongCountRef.current = 0; setWrongCount(0); setMissedWords([])
                halfSkullRef.current = false; setHalfSkull(false)
                setAnswerFlash(null); setWaitingForNext(false); lockedRef.current = false
                setBunnyPos({ x: BUNNY_HOME_X, y: BUNNY_HOME_Y }); setBunnyAnimating(false)
                setGamePhase("countdown"); gamePhaseRef.current = "countdown"
              }}
                className="px-6 py-3 rounded-2xl font-black text-white text-base transition-transform active:scale-95"
                style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)"}}>
                Try Again 🔄
              </button>
              <button onClick={onClose}
                className="px-6 py-3 rounded-2xl font-black text-white text-base transition-transform active:scale-95"
                style={{background: accentColor, boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
                Study More 📖
              </button>
            </div>
          </div>
        )}

        {/* ── Win screen ── */}
        {gamePhase === "complete" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
            style={{zIndex:40,background:"linear-gradient(160deg,rgba(5,3,20,0.97),rgba(20,10,50,0.98))",backdropFilter:"blur(10px)"}}>
            {[...Array(18)].map((_,i) => (
              <div key={i} className="absolute pointer-events-none" style={{
                left:`${(i*37+11)%94}%`,top:`${(i*53+7)%88}%`,
                fontSize:`${16+(i%4)*8}px`,
                animation:`twinkle ${1.2+(i%4)*0.4}s ease-in-out ${(i*0.3)%2}s infinite alternate`,
              }}>{["🌟","⭐","✨","🎉","🎊","💫"][i%6]}</div>
            ))}
            <div className="text-8xl mb-3" style={{animation:"countdownPop 0.6s ease-out forwards"}}>🏆</div>
            <div className="text-white font-black text-3xl text-center mb-1">¡Lo lograste!</div>
            <div className="text-white/70 font-bold text-base text-center mb-6">All {FULL_QUEUE.length} words collected!</div>
            <div className="flex gap-4 mb-8">
              {[{label:"Score",val:score},{label:"Coins",val:localCoins},{label:"Words",val:FULL_QUEUE.length}].map(s => (
                <div key={s.label} className="flex flex-col items-center px-5 py-3 rounded-2xl"
                  style={{background:"rgba(251,191,36,0.18)",border:"1px solid rgba(251,191,36,0.4)"}}>
                  <span className="text-yellow-300 font-black text-2xl">{s.val}</span>
                  <span className="text-white/60 text-xs font-bold mt-0.5">{s.label}</span>
                </div>
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
              <button onClick={() => {
                setScore(0); scoreRef.current = 0
                setWordIdx(0); wordIdxRef.current = 0
                setAnswers([]); setCountdown(3); setFlashScreen(null); setShowHint(false)
                wrongCountRef.current = 0; setWrongCount(0); setMissedWords([])
                halfSkullRef.current = false; setHalfSkull(false)
                setAnswerFlash(null); setWaitingForNext(false); lockedRef.current = false
                setBunnyPos({ x: BUNNY_HOME_X, y: BUNNY_HOME_Y }); setBunnyAnimating(false)
                setGamePhase("countdown"); gamePhaseRef.current = "countdown"
              }}
                className="px-6 py-3 rounded-2xl font-black text-white text-base transition-transform active:scale-95"
                style={{background: accentColor, boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
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

      {/* ── Bottom bar — English prompt ── */}
      <div className="flex-shrink-0 pb-safe-bottom" style={{background:"rgba(0,0,0,0.50)",backdropFilter:"blur(12px)"}}>
        <div className="px-4 py-4 text-center">
          <div className="inline-block px-5 py-2.5 rounded-2xl"
            style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.35)"}}>
            <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-0.5">Find in Spanish →</div>
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
        @keyframes cloudDrift {
          from { transform:translateX(-12px); }
          to   { transform:translateX(12px); }
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
        @keyframes starGlow {
          0%   { opacity:0.4; transform:scale(0.9); }
          100% { opacity:0.8; transform:scale(1.15); }
        }
        @keyframes starFloat {
          0%,100% { transform:scale(1) rotate(-2deg); }
          50%     { transform:scale(1.06) rotate(2deg); }
        }
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
