"use client"
// ─────────────────────────────────────────────────────────────────────────────
// VocabFly — Generic 2-phase Bunny Fly vocabulary game engine
// Used by: PetFly, TravelFly, NumbersFly, TimeFly, FeelingsFly, FoodFly
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED TYPES (used by wrapper components)
// ─────────────────────────────────────────────────────────────────────────────

export interface FlyWord { spanish: string; english: string }

export interface FlyPhaseConfig {
  words:          FlyWord[]
  speedBase:      number    // base fall speed
  speedVariance:  number    // random variance added to speed
  waveInterval:   number    // ms between waves
  label:          string    // e.g. "Pets", "Habitats"
  bgGradient:     string    // full CSS background gradient
  bubbleBg:       string    // word-bubble background color
  bubbleText:     string    // word-bubble text color
  progressGrad:   string    // progress-bar CSS gradient
  badgeColor:     string    // rgba for phase badge bg
  colorMap?:      Record<string, string>  // spanish word → CSS background (dynamic sky color)
}

export interface VocabFlyProps {
  title:           string   // game title text
  icon:            string   // emoji next to title
  phase1:          FlyPhaseConfig
  phase2:          FlyPhaseConfig
  transitionMsg:   string   // e.g. "Now: Habitats! 🌳"
  transitionIcon:  string   // large emoji at transition screen
  accentColor:     string   // CSS gradient for Let's Go + Play Again buttons
  coins:           number
  onCoinsChange:   (delta: number) => void
  onClose:         () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FloatingWord {
  id: number; spanish: string; english: string
  x: number; y: number; speed: number
  isTarget: boolean; collected: boolean
}
interface Coin { id: number; x: number; y: number; speed: number; collected: boolean }
interface PopParticle { id: number; spanish: string; english: string; x: number; y: number; correct: boolean }
interface SkyEmoji { id: number; emoji: string; x: number; y: number; size: number; driftDur: number; driftDelay: number }

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BUNNY_W       = 100
const BUNNY_H       = 100
const WORD_H        = 46
const COIN_SIZE     = 32
const STEER_IMPULSE = 0.55
const MAX_SPEED_X   = 6
const MAX_SPEED_Y   = 5
const FRICTION      = 0.85
const HIT_RADIUS    = 60
const BUNNY_Y_INIT  = 65

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

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function VocabFly({
  title, icon,
  phase1, phase2,
  transitionMsg, transitionIcon,
  accentColor,
  coins: initialCoins, onCoinsChange, onClose,
}: VocabFlyProps) {

  // ── Stable computed values (init once at mount) ───────────────────────────
  const FULL_QUEUE = useRef([...phase1.words, ...phase2.words]).current
  const PHASE1_LEN = useRef(phase1.words.length).current

  // ── Render state ──────────────────────────────────────────────────────────
  const [gamePhase,    setGamePhase]    = useState<"instructions" | "countdown" | "playing" | "phase_transition" | "complete">("instructions")
  const [countdown,    setCountdown]    = useState(3)
  const [score,        setScore]        = useState(0)
  const [localCoins,   setLocalCoins]   = useState(initialCoins)
  const [wordIdx,      setWordIdx]      = useState(0)
  const [flashScreen,  setFlashScreen]  = useState<"correct" | "wrong" | null>(null)
  const [showHint,     setShowHint]     = useState(false)
  const [hintEntry,    setHintEntry]    = useState<FlyWord | null>(null)

  const [words,     setWords]     = useState<FloatingWord[]>([])
  const [coinItems, setCoinItems] = useState<Coin[]>([])
  const [popItems,  setPopItems]  = useState<PopParticle[]>([])
  const [skyEmojis] = useState<SkyEmoji[]>(makeSkyEmojis)

  // ── Mutable refs ──────────────────────────────────────────────────────────
  const bunnyX  = useRef(50)
  const bunnyY  = useRef(BUNNY_Y_INIT)
  const velX    = useRef(0)
  const velY    = useRef(0)

  const wordIdxRef         = useRef(0)
  const gamePhaseRef       = useRef<"instructions" | "countdown" | "playing" | "phase_transition" | "complete">("instructions")
  const collectedThisFrame = useRef(false)
  const wordItemIdRef      = useRef(0)
  const coinIdRef          = useRef(0)
  const popIdRef           = useRef(0)
  const waveTimerRef       = useRef(0)
  const coinTimerRef       = useRef(0)
  const lastTimeRef        = useRef(0)
  const rafRef             = useRef<number | null>(null)
  const onCoinsChangeRef   = useRef(onCoinsChange)
  const scoreRef           = useRef(0)

  // Keep phase configs accessible in callbacks
  const phase1Ref = useRef(phase1)
  const phase2Ref = useRef(phase2)

  useEffect(() => { phase1Ref.current = phase1 }, [phase1])
  useEffect(() => { phase2Ref.current = phase2 }, [phase2])
  useEffect(() => { onCoinsChangeRef.current = onCoinsChange }, [onCoinsChange])
  useEffect(() => { wordIdxRef.current = wordIdx }, [wordIdx])
  useEffect(() => { gamePhaseRef.current = gamePhase }, [gamePhase])

  const areaRef    = useRef<HTMLDivElement>(null)
  const bunnyElRef = useRef<HTMLDivElement>(null)

  // ── Hold-to-steer ─────────────────────────────────────────────────────────
  const holdIntervalRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeDirectionsRef = useRef(new Set<"left" | "right" | "up" | "down">())

  const startHold = useCallback((dir: "left" | "right" | "up" | "down") => {
    activeDirectionsRef.current.add(dir)
    const apply = () => {
      const dirs = activeDirectionsRef.current
      if (dirs.has("left"))  velX.current = Math.max(-MAX_SPEED_X, velX.current - STEER_IMPULSE)
      if (dirs.has("right")) velX.current = Math.min(MAX_SPEED_X,  velX.current + STEER_IMPULSE)
      if (dirs.has("up"))    velY.current = Math.max(-MAX_SPEED_Y, velY.current - STEER_IMPULSE)
      if (dirs.has("down"))  velY.current = Math.min(MAX_SPEED_Y,  velY.current + STEER_IMPULSE)
    }
    apply()
    if (!holdIntervalRef.current) holdIntervalRef.current = setInterval(apply, 16)
  }, [])

  const stopHold = useCallback((dir?: "left" | "right" | "up" | "down") => {
    if (dir) activeDirectionsRef.current.delete(dir)
    else     activeDirectionsRef.current.clear()
    if (activeDirectionsRef.current.size === 0) {
      if (holdIntervalRef.current) { clearInterval(holdIntervalRef.current); holdIntervalRef.current = null }
    }
  }, [])

  useEffect(() => () => { if (holdIntervalRef.current) clearInterval(holdIntervalRef.current) }, [])

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== "playing") return
    const dn = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); startHold("left")  }
      if (e.key === "ArrowRight") { e.preventDefault(); startHold("right") }
      if (e.key === "ArrowUp")    { e.preventDefault(); startHold("up")    }
      if (e.key === "ArrowDown")  { e.preventDefault(); startHold("down")  }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  stopHold("left")
      if (e.key === "ArrowRight") stopHold("right")
      if (e.key === "ArrowUp")    stopHold("up")
      if (e.key === "ArrowDown")  stopHold("down")
    }
    window.addEventListener("keydown", dn)
    window.addEventListener("keyup",   up)
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up) }
  }, [gamePhase, startHold, stopHold])

  // ── Spawn helpers ─────────────────────────────────────────────────────────
  const spawnWave = useCallback((targetSpanish: string, pool: FlyWord[], speedBase: number, speedVariance: number) => {
    const distractors = shuffle(pool.filter(w => w.spanish !== targetSpanish)).slice(0, 2)
    const target = pool.find(w => w.spanish === targetSpanish)!
    const all = shuffle([target, ...distractors])
    const positions = shuffle([12, 30, 50, 68, 85]).slice(0, 3)
    setWords(all.map((item, i) => ({
      id: wordItemIdRef.current++,
      spanish: item.spanish, english: item.english,
      x: positions[i], y: -8 - Math.random() * 6,
      speed: speedBase + Math.random() * speedVariance,
      isTarget: item.spanish === targetSpanish, collected: false,
    })))
  }, [])

  const spawnCoins = useCallback(() => {
    const count = Math.random() < 0.4 ? 3 : 2
    setCoinItems(prev => [...prev, ...Array.from({ length: count }, () => ({
      id: coinIdRef.current++,
      x: 8 + Math.random() * 84, y: -8 - Math.random() * 6,
      speed: 0.12 + Math.random() * 0.08, collected: false,
    }))])
  }, [])

  // ── Main game loop ────────────────────────────────────────────────────────
  const gameLoop = useCallback((ts: number) => {
    if (gamePhaseRef.current !== "playing") return
    const dt = Math.min(ts - lastTimeRef.current, 50)
    lastTimeRef.current = ts

    const area = areaRef.current?.getBoundingClientRect()
    if (!area) { rafRef.current = requestAnimationFrame(gameLoop); return }
    const areaW = area.width
    const areaH = area.height

    velX.current *= FRICTION
    velY.current *= FRICTION
    bunnyX.current = Math.max(3,  Math.min(94, bunnyX.current + velX.current * 0.35))
    bunnyY.current = Math.max(5,  Math.min(88, bunnyY.current + velY.current * 0.35))

    collectedThisFrame.current = false
    let targetMissed = false
    const idx = wordIdxRef.current
    const isPhase2 = idx >= PHASE1_LEN
    const currentPool = isPhase2 ? phase2Ref.current.words : phase1Ref.current.words
    const speedBase   = isPhase2 ? phase2Ref.current.speedBase : phase1Ref.current.speedBase
    const speedVar    = isPhase2 ? phase2Ref.current.speedVariance : phase1Ref.current.speedVariance

    setWords(prev => prev.map(w => {
      if (w.collected) return w
      const newY = w.y + w.speed * (dt / 16)
      const dist = Math.hypot(
        (w.x / 100) * areaW - (bunnyX.current / 100) * areaW,
        (newY / 100) * areaH - (bunnyY.current / 100) * areaH
      )

      if (dist < HIT_RADIUS && !collectedThisFrame.current) {
        collectedThisFrame.current = true
        speakSpanish(w.spanish)
        setPopItems(pp => [...pp, {
          id: popIdRef.current++,
          spanish: w.spanish, english: w.english,
          x: w.x, y: newY, correct: w.isTarget,
        }])
        if (w.isTarget) {
          const coin = Math.random() < 0.6 ? 1 : 0
          if (coin > 0) { onCoinsChangeRef.current(coin); setLocalCoins(c => c + coin) }
        }
        advanceRef.current(w.isTarget)
        return { ...w, collected: true }
      }

      if (newY > 108 && w.isTarget && !targetMissed) {
        targetMissed = true
        advanceRef.current(false)
        return { ...w, y: newY, collected: true }
      }
      return { ...w, y: newY }
    }))

    // Wave timer
    waveTimerRef.current += dt
    const waveInterval = isPhase2 ? phase2Ref.current.waveInterval : phase1Ref.current.waveInterval
    if (waveTimerRef.current >= waveInterval) {
      waveTimerRef.current = 0
      const curIdx = wordIdxRef.current
      if (curIdx < FULL_QUEUE.length) {
        const pool = curIdx >= PHASE1_LEN ? phase2Ref.current.words : phase1Ref.current.words
        const wb   = curIdx >= PHASE1_LEN ? phase2Ref.current.speedBase : phase1Ref.current.speedBase
        const wv   = curIdx >= PHASE1_LEN ? phase2Ref.current.speedVariance : phase1Ref.current.speedVariance
        spawnWave(FULL_QUEUE[curIdx].spanish, pool, wb, wv)
      }
    }

    // Coin timer
    coinTimerRef.current += dt
    if (coinTimerRef.current >= 5000) {
      coinTimerRef.current = 0
      spawnCoins()
    }

    setCoinItems(prev => prev.map(c => {
      if (c.collected) return c
      const newY = c.y + c.speed * (dt / 16)
      const dist = Math.hypot(
        (c.x / 100) * areaW - (bunnyX.current / 100) * areaW,
        (newY / 100) * areaH - (bunnyY.current / 100) * areaH
      )
      if (dist < HIT_RADIUS * 0.85) {
        onCoinsChangeRef.current(1); setLocalCoins(lc => lc + 1)
        return { ...c, collected: true }
      }
      return { ...c, y: newY }
    }))

    rafRef.current = requestAnimationFrame(gameLoop)
  }, [spawnWave, spawnCoins, FULL_QUEUE, PHASE1_LEN])

  // ── Advance word (called from game loop) ──────────────────────────────────
  const advanceRef = useRef<(wasCorrect: boolean) => void>(() => {})
  advanceRef.current = (wasCorrect: boolean) => {
    const idx = wordIdxRef.current
    const entry = FULL_QUEUE[idx]
    if (wasCorrect) {
      setFlashScreen("correct")
      setScore(s => { scoreRef.current = s + 10; return s + 10 })
      setHintEntry(entry)
      setShowHint(true)
      setTimeout(() => { setFlashScreen(null); setShowHint(false) }, 900)
    } else {
      setFlashScreen("wrong")
      setTimeout(() => setFlashScreen(null), 400)
    }
    const nextIdx = idx + 1

    if (nextIdx === PHASE1_LEN) {
      wordIdxRef.current = nextIdx
      setWordIdx(nextIdx)
      setGamePhase("phase_transition")
      gamePhaseRef.current = "phase_transition"
      setTimeout(() => {
        setFlashScreen(null); setShowHint(false)
        setGamePhase("playing"); gamePhaseRef.current = "playing"
        waveTimerRef.current = 99999
        lastTimeRef.current = performance.now()
        rafRef.current = requestAnimationFrame(gameLoop)
      }, 2200)
      return
    }

    if (nextIdx >= FULL_QUEUE.length) {
      wordIdxRef.current = nextIdx
      setWordIdx(nextIdx)
      setTimeout(() => {
        setFlashScreen(null); setShowHint(false)
        setGamePhase("complete"); gamePhaseRef.current = "complete"
      }, 1000)
      return
    }

    wordIdxRef.current = nextIdx
    setWordIdx(nextIdx)
    setTimeout(() => speakSpanish(FULL_QUEUE[nextIdx].spanish), 400)
    waveTimerRef.current = 99999
  }

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
      lastTimeRef.current = performance.now()
      waveTimerRef.current = 99999
      speakSpanish(FULL_QUEUE[0].spanish)
      rafRef.current = requestAnimationFrame(gameLoop)
    }, 600)
    return () => clearTimeout(t)
  }, [gamePhase, countdown, gameLoop, FULL_QUEUE])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  // ── Bunny DOM position ────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== "playing") return
    let raf: number
    const update = () => {
      if (bunnyElRef.current) {
        bunnyElRef.current.style.left = `calc(${bunnyX.current}% - ${BUNNY_W / 2}px)`
        bunnyElRef.current.style.top  = `calc(${bunnyY.current}% - ${BUNNY_H / 2}px)`
      }
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [gamePhase])

  useEffect(() => {
    if (popItems.length === 0) return
    const t = setTimeout(() => setPopItems(pp => pp.slice(Math.max(0, pp.length - 20))), 1200)
    return () => clearTimeout(t)
  }, [popItems])

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const progressPct  = Math.round((wordIdx / FULL_QUEUE.length) * 100)
  const currentEntry = FULL_QUEUE[Math.min(wordIdx, FULL_QUEUE.length - 1)]
  const isPhase2     = wordIdx >= PHASE1_LEN
  const currentPhase = isPhase2 ? phase2 : phase1
  const bubbleBg     = currentPhase.bubbleBg
  const bubbleText   = currentPhase.bubbleText

  // Dynamic color background — if the current phase has a colorMap and the target word
  // is in it, swap the sky to that color while playing (e.g. "amarillo" → yellow sky)
  const dynamicBg = (gamePhase === "playing" || gamePhase === "phase_transition")
    ? (currentPhase.colorMap?.[currentEntry.spanish] ?? currentPhase.bgGradient)
    : currentPhase.bgGradient

  return (
    <div className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: dynamicBg, transition: "background 0.9s ease" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-safe-top pt-3 pb-2 flex-shrink-0">
        <button onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/80 text-sm font-bold active:scale-95 transition-all"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
          ← Back
        </button>

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

      {/* Progress bar */}
      <div className="px-4 pb-1 flex-shrink-0">
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.15)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width:`${progressPct}%`, background: currentPhase.progressGrad }}/>
        </div>
        <div className="flex justify-between text-white/40 text-xs mt-0.5 px-0.5">
          <span>{phase1.label}</span>
          <span>{phase2.label}</span>
        </div>
      </div>

      {/* ── Game Area ── */}
      <div ref={areaRef} className="flex-1 relative overflow-hidden select-none">

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

        {/* ── Floating Spanish Words ── */}
        {words.filter(w => !w.collected).map(w => (
          <div key={w.id}
            className="absolute flex flex-col items-center select-none pointer-events-none"
            style={{ left:`${w.x}%`, top:`${w.y}%`, transform:"translateX(-50%)" }}>
            <div className="flex items-center justify-center font-black rounded-2xl px-3" style={{
              height:`${WORD_H}px`, minWidth:"70px",
              fontSize: w.spanish.length > 8 ? "12px" : w.spanish.length > 6 ? "14px" : "16px",
              background: bubbleBg, color: bubbleText,
              boxShadow:"0 4px 12px rgba(0,0,0,0.25)",
              border:"2px solid rgba(255,255,255,0.35)",
            }}>
              {w.spanish}
            </div>
          </div>
        ))}

        {/* ── Pop Particles ── */}
        {popItems.map(p => (
          <div key={p.id}
            className="absolute flex flex-col items-center pointer-events-none select-none"
            style={{left:`${p.x}%`,top:`${p.y}%`,transform:"translateX(-50%)",
              animation:"popFloat 1.1s ease-out forwards",zIndex:15}}>
            <div className="font-black rounded-2xl flex items-center justify-center px-3" style={{
              height:`${WORD_H}px`, minWidth:"70px",
              fontSize: p.spanish.length > 8 ? "12px" : p.spanish.length > 6 ? "14px" : "16px",
              background: p.correct ? "#4ade80" : "#f87171",
              color:      p.correct ? "#14532d" : "#7f1d1d",
              boxShadow:  p.correct
                ? "0 0 20px rgba(74,222,128,0.8),0 4px 12px rgba(0,0,0,0.3)"
                : "0 0 20px rgba(248,113,113,0.8),0 4px 12px rgba(0,0,0,0.3)",
              border:"3px solid white",
            }}>{p.spanish}</div>
            <div className="mt-1 px-2 py-0.5 rounded-lg font-bold text-white text-center"
              style={{fontSize:"11px",
                background: p.correct ? "rgba(74,222,128,0.35)" : "rgba(248,113,113,0.35)",
                backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,0.3)",whiteSpace:"nowrap"}}>
              {p.english}
            </div>
          </div>
        ))}

        {/* ── Coins ── */}
        {coinItems.filter(c => !c.collected).map(c => (
          <div key={c.id} className="absolute select-none pointer-events-none" style={{
            left:`${c.x}%`,top:`${c.y}%`,
            width:`${COIN_SIZE}px`,height:`${COIN_SIZE}px`,borderRadius:"50%",
            background:"conic-gradient(from 160deg,#D97706,#FBBF24 30%,#FDE68A 50%,#FBBF24 70%,#D97706)",
            border:"2px solid #92400E",
            boxShadow:"0 2px 8px rgba(0,0,0,0.2),inset 0 -2px 4px rgba(120,53,0,0.4),0 0 12px rgba(251,191,36,0.6)",
            transform:"translateX(-50%)",animation:"coinSpin 1.3s linear infinite",position:"absolute",
          }}>
            <div style={{position:"absolute",top:"14%",left:"18%",width:"32%",height:"20%",
              background:"radial-gradient(ellipse,rgba(255,255,255,0.6),rgba(255,255,255,0) 70%)",
              borderRadius:"50%",transform:"rotate(-15deg)"}}/>
          </div>
        ))}

        {/* ── Bunny ── */}
        {(gamePhase === "playing" || gamePhase === "phase_transition") && (
          <div ref={bunnyElRef} className="absolute pointer-events-none" style={{
            width:`${BUNNY_W}px`,height:`${BUNNY_H}px`,zIndex:10,
            filter:"sepia(1) hue-rotate(290deg) saturate(3) brightness(1.5) drop-shadow(0 0 10px rgba(236,72,153,0.9)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
          }}>
            <Image src="/images/super-bunny-nobg.gif" alt="Bunny"
              width={BUNNY_W} height={BUNNY_H}
              className="w-full h-full object-contain" unoptimized priority/>
          </div>
        )}

        {/* ── Screen flash ── */}
        {flashScreen && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: flashScreen === "correct" ? "rgba(74,222,128,0.22)" : "rgba(239,68,68,0.28)",
            zIndex:20,
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
              style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",maxWidth:"300px"}}>
              <div className="text-white font-bold text-base leading-relaxed">
                Use your <span className="text-yellow-300 font-black">arrow keys</span> to fly the bunny to the correct Spanish words!
              </div>
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
        {gamePhase === "phase_transition" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{zIndex:35,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)"}}>
            <div className="text-7xl mb-4" style={{animation:"countdownPop 0.5s ease-out forwards"}}>{transitionIcon}</div>
            <div className="text-white font-black text-3xl text-center mb-2">{phase1.label}: ✅</div>
            <div className="text-white/80 font-bold text-xl text-center mb-1">{transitionMsg}</div>
            <div className="text-white/50 text-sm text-center mt-2">Get ready — it&apos;s a little faster!</div>
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
              <strong className="text-white">Hold any arrow</strong> to steer 🐰<br/>
              Fly to the <span className="text-yellow-300 font-bold">correct Spanish word</span>!<br/>
              <span className="text-xs opacity-60 mt-1 block">English prompt shown at bottom</span>
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
            <div className="flex gap-3">
              <button onClick={() => {
                setScore(0); scoreRef.current = 0
                setWordIdx(0); wordIdxRef.current = 0
                setWords([]); setCoinItems([]); setPopItems([])
                setCountdown(3); setFlashScreen(null); setShowHint(false)
                waveTimerRef.current = 0; coinTimerRef.current = 0
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
        @keyframes coinSpin {
          0%   { transform:translateX(-50%) scaleX(1); }
          25%  { transform:translateX(-50%) scaleX(0.3); }
          50%  { transform:translateX(-50%) scaleX(1); }
          75%  { transform:translateX(-50%) scaleX(0.3); }
          100% { transform:translateX(-50%) scaleX(1); }
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
          100% { opacity:0; transform:translateX(-50%) translateY(-60px) scale(0.8); }
        }
      `}</style>
    </div>
  )
}
