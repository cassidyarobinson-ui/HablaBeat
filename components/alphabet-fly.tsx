"use client"
// ─────────────────────────────────────────────────────────────────────────────
// AlphabetFly — Bunny Fly game for Alphabet World
//
// Bunny slides left/right (hold buttons for continuous movement).
// Letters fall from the top in sequential Spanish-alphabet order.
// Decorative emojis float in the sky background.
// Gold CSS coins matching the app's splash/coins style.
// Blue bunny gif (transparent background).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"

// ─────────────────────────────────────────────────────────────────────────────
// SEQUENTIAL ALPHABET QUEUE — Spanish alphabet order
// Player must collect A → B → C → D … Z → Ñ → CH → RR → LL in order
// ─────────────────────────────────────────────────────────────────────────────

const ALPHABET_QUEUE: { label: string; english: string; category: "vowel" | "consonant" | "special"; hint: string }[] = [
  { label: "A",  english: "Tree",      category: "vowel",     hint: "A de Arbol 🌳" },
  { label: "B",  english: "Donkey",    category: "consonant", hint: "B de Burro 🫏" },
  { label: "C",  english: "House",     category: "consonant", hint: "C de Casa 🏠" },
  { label: "D",  english: "Dolphin",   category: "consonant", hint: "D de Delfín 🐬" },
  { label: "E",  english: "Elephant",  category: "vowel",     hint: "E de Elefante 🐘" },
  { label: "F",  english: "Flower",    category: "consonant", hint: "F de Flor 🌸" },
  { label: "G",  english: "Cat",       category: "consonant", hint: "G de Gato 🐱" },
  { label: "H",  english: "Ant",       category: "consonant", hint: "H de Hormiga 🐜" },
  { label: "I",  english: "Iguana",    category: "vowel",     hint: "I de Iguana 🦎" },
  { label: "J",  english: "Jaguar",    category: "consonant", hint: "J de Jaguar 🐆" },
  { label: "L",  english: "Lion",      category: "consonant", hint: "L de León 🦁" },
  { label: "M",  english: "Monkey",    category: "consonant", hint: "M de Mono 🐒" },
  { label: "N",  english: "Orange",    category: "consonant", hint: "N de Naranja 🍊" },
  { label: "Ñ",  english: "Child",     category: "special",   hint: "Ñ de Niño 👦" },
  { label: "O",  english: "Bear",      category: "vowel",     hint: "O de Oso 🐻" },
  { label: "P",  english: "Dove",      category: "consonant", hint: "P de Paloma 🕊️" },
  { label: "R",  english: "Frog",      category: "consonant", hint: "R de Rana 🐸" },
  { label: "RR", english: "Dog",       category: "special",   hint: "RR de Perro 🐶" },
  { label: "S",  english: "Sun",       category: "consonant", hint: "S de Sol ☀️" },
  { label: "T",  english: "Tiger",     category: "consonant", hint: "T de Tigre 🐯" },
  { label: "U",  english: "Grape",     category: "vowel",     hint: "U de Uva 🍇" },
  { label: "V",  english: "Cow",       category: "consonant", hint: "V de Vaca 🐄" },
  { label: "Y",  english: "Yoyo",      category: "consonant", hint: "Y de Yoyo 🪀" },
  { label: "Z",  english: "Shoe",      category: "consonant", hint: "Z de Zapato 👟" },
  { label: "CH", english: "Chocolate", category: "special",   hint: "CH de Chocolate 🍫" },
  { label: "LL", english: "Llama",     category: "special",   hint: "LL de Llama 🦙" },
]

// All items used as distractor pool
const ALL_ITEMS = ALPHABET_QUEUE.map(q => ({ label: q.label, english: q.english, category: q.category }))

// ─────────────────────────────────────────────────────────────────────────────
// SPANISH LETTER NAMES — phonetic text fed to TTS in Spanish
// Web Speech API with lang="es-MX" or "es-ES" will pronounce these correctly.
// Special chars: ñ → "eñe", ch → "che", rr → "erre doble", ll → "elle"
// ─────────────────────────────────────────────────────────────────────────────
const SPANISH_LETTER_NAME: Record<string, string> = {
  "A":  "a",
  "B":  "be",
  "C":  "ce",
  "CH": "che",
  "D":  "de",
  "E":  "e",
  "F":  "efe",
  "G":  "ge",
  "H":  "hache",
  "I":  "i",
  "J":  "jota",
  "L":  "ele",
  "LL": "elle",
  "M":  "eme",
  "N":  "ene",
  "Ñ":  "eñe",
  "O":  "o",
  "P":  "pe",
  "R":  "erre",
  "RR": "erre doble",
  "S":  "ese",
  "T":  "te",
  "U":  "u",
  "V":  "uve",
  "Y":  "ye",
  "Z":  "zeta",
}

// Speak a letter name in Spanish using Web Speech API
function speakSpanish(label: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const text = SPANISH_LETTER_NAME[label] ?? label.toLowerCase()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = "es-MX"
  utt.rate = 0.85
  utt.pitch = 1.1
  utt.volume = 1
  // Prefer a Spanish voice if available
  const voices = window.speechSynthesis.getVoices()
  const esVoice = voices.find(v => v.lang.startsWith("es")) ?? null
  if (esVoice) utt.voice = esVoice
  window.speechSynthesis.speak(utt)
}

// Decorative emojis floating in the sky
const SKY_EMOJIS = ["🌟", "⭐", "✨", "🎈", "🌈", "🦋", "🌸", "🎵", "🎶", "💫", "🌺", "🍀", "🎀", "🌙", "🌠"]

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FloatingLetter {
  id: number
  label: string
  english: string
  category: "vowel" | "consonant" | "special"
  x: number        // % from left
  y: number        // % from top
  speed: number    // % per frame
  isTarget: boolean
  collected: boolean
  flashState: "none" | "correct" | "wrong"
}

interface Coin {
  id: number
  x: number
  y: number
  speed: number
  collected: boolean
}

interface SkyEmoji {
  id: number
  emoji: string
  x: number   // % from left
  y: number   // % from top
  size: number
  driftDur: number
  driftDelay: number
}

interface Props {
  sectionTitle: string
  coins: number
  onCoinsChange: (delta: number) => void
  onClose: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BUNNY_W = 100  // px
const BUNNY_H = 100  // px
const LETTER_SIZE = 58   // px
const COIN_SIZE = 32
const STEER_IMPULSE = 0.55  // % per frame applied while held
const MAX_SPEED_X = 6
const MAX_SPEED_Y = 5
const FRICTION = 0.85
const HIT_RADIUS = 56   // px
const BUNNY_Y_INIT = 65  // starting Y (% from top)

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
  if (cat === "vowel")    return { bg: "#fef08a", text: "#92400e", glow: "#fde047" }
  if (cat === "special")  return { bg: "#fbcfe8", text: "#831843", glow: "#f9a8d4" }
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AlphabetFly({ sectionTitle, coins: initialCoins, onCoinsChange, onClose }: Props) {
  // Game state
  const [score, setScore] = useState(0)
  const [localCoins, setLocalCoins] = useState(initialCoins)
  const [gamePhase, setGamePhase] = useState<"countdown" | "playing" | "gameover">("countdown")
  const [countdown, setCountdown] = useState(3)
  const [alphabetIdx, setAlphabetIdx] = useState(0)   // which letter in ALPHABET_QUEUE we want next
  const [flashScreen, setFlashScreen] = useState<"correct" | "wrong" | null>(null)
  const [hintText, setHintText] = useState("")
  const [showHint, setShowHint] = useState(false)

  // Fixed sky emojis (generate once)
  const [skyEmojis] = useState<SkyEmoji[]>(makeSkyEmojis)

  // Bunny position — X and Y both move
  const bunnyX = useRef(50)
  const bunnyY = useRef(BUNNY_Y_INIT)
  const velX = useRef(0)
  const velY = useRef(0)

  // Hold-to-steer state
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdDirRef = useRef<"left" | "right" | "up" | "down" | null>(null)

  // DOM ref for game area
  const areaRef = useRef<HTMLDivElement>(null)
  const bunnyElRef = useRef<HTMLDivElement>(null)

  // Floating items
  const [letters, setLetters] = useState<FloatingLetter[]>([])
  const [coinItems, setCoinItems] = useState<Coin[]>([])
  const letterIdRef = useRef(0)
  const coinIdRef = useRef(0)

  // Pop particles — letters that just got collected, shown briefly then fade
  const [popItems, setPopItems] = useState<{ id: number; label: string; english: string; x: number; y: number; correct: boolean }[]>([])
  const popIdRef = useRef(0)

  // Animation
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef(0)
  const coinTimerRef = useRef(0)
  const waveTimerRef = useRef(0)           // timer for continuous letter waves
  const missedTargetRef = useRef(false)    // flag: target exited screen without being hit

  // Keep alphabetIdx accessible in RAF without stale closure
  const alphabetIdxRef = useRef(0)
  useEffect(() => { alphabetIdxRef.current = alphabetIdx }, [alphabetIdx])

  // Prevent double-collection in same frame
  const collectedThisFrameRef = useRef(false)

  // Current target
  const currentEntry = ALPHABET_QUEUE[alphabetIdx % ALPHABET_QUEUE.length]

  // ── Hold steering ─────────────────────────────────────────────────────────
  const startHold = useCallback((dir: "left" | "right" | "up" | "down") => {
    if (holdDirRef.current === dir) return
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
    holdDirRef.current = dir
    const applyImpulse = () => {
      if (dir === "left")  velX.current = Math.max(-MAX_SPEED_X, velX.current - STEER_IMPULSE)
      if (dir === "right") velX.current = Math.min(MAX_SPEED_X,  velX.current + STEER_IMPULSE)
      if (dir === "up")    velY.current = Math.max(-MAX_SPEED_Y, velY.current - STEER_IMPULSE)
      if (dir === "down")  velY.current = Math.min(MAX_SPEED_Y,  velY.current + STEER_IMPULSE)
    }
    applyImpulse()
    holdIntervalRef.current = setInterval(applyImpulse, 16)
  }, [])

  const stopHold = useCallback(() => {
    holdDirRef.current = null
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
  }, [])

  // Cleanup hold on unmount
  useEffect(() => {
    return () => { if (holdIntervalRef.current) clearInterval(holdIntervalRef.current) }
  }, [])

  // ── Keyboard arrow key support (all 4 directions) ────────────────────────
  useEffect(() => {
    if (gamePhase !== "playing") return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); startHold("left") }
      if (e.key === "ArrowRight") { e.preventDefault(); startHold("right") }
      if (e.key === "ArrowUp")    { e.preventDefault(); startHold("up") }
      if (e.key === "ArrowDown")  { e.preventDefault(); startHold("down") }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) stopHold()
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup",   onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup",   onKeyUp)
    }
  }, [gamePhase, startHold, stopHold])

  // ── Spawn a wave of letters (APPENDS — multiple waves on screen at once) ──
  // Each wave has 1 target + 2 distractors placed at random X positions
  const spawnWave = useCallback((targetLabel: string) => {
    const pool = ALL_ITEMS.filter(a => a.label !== targetLabel)
    const distractors = shuffle(pool).slice(0, 2)
    const targetItem = ALL_ITEMS.find(a => a.label === targetLabel)!
    const all = shuffle([targetItem, ...distractors])

    // Spread across screen with randomised X so waves don't stack
    const positions = shuffle([15, 35, 55, 72, 88]).slice(0, 3)

    const newLetters: FloatingLetter[] = all.map((item, i) => ({
      id: letterIdRef.current++,
      label: item.label,
      english: item.english,
      category: item.category,
      x: positions[i],
      y: -8 - Math.random() * 6,    // stagger entry slightly
      speed: 0.20 + Math.random() * 0.10,
      isTarget: item.label === targetLabel,
      collected: false,
      flashState: "none",
    }))
    // APPEND to existing letters (not replace)
    setLetters(prev => [...prev.filter(l => !l.collected), ...newLetters])
  }, [])

  // ── Spawn coins (2 at a time, spread apart) ───────────────────────────────
  const spawnCoin = useCallback(() => {
    const count = Math.random() < 0.4 ? 3 : 2  // 40% chance of 3 coins
    const newCoins: Coin[] = Array.from({ length: count }, () => ({
      id: coinIdRef.current++,
      x: 8 + Math.random() * 84,
      y: -8 - Math.random() * 6,
      speed: 0.12 + Math.random() * 0.08,
      collected: false,
    }))
    setCoinItems(prev => [...prev, ...newCoins])
  }, [])

  // ── Advance to next letter (correct hit OR missed / fell off screen) ──────
  const advanceAlphabet = useCallback((wasCorrect: boolean) => {
    const idx = alphabetIdxRef.current
    const entry = ALPHABET_QUEUE[idx % ALPHABET_QUEUE.length]
    if (wasCorrect) {
      setFlashScreen("correct")
      setScore(s => s + 10)
      setHintText(entry.hint)
      setShowHint(true)
      setTimeout(() => { setFlashScreen(null); setShowHint(false) }, 900)
    } else {
      // Missed — brief red flash, no score penalty, just move on
      setFlashScreen("wrong")
      setTimeout(() => setFlashScreen(null), 400)
    }
    const nextIdx = idx + 1
    setAlphabetIdx(nextIdx)
    alphabetIdxRef.current = nextIdx
    // Reset wave timer so a new wave spawns very soon
    waveTimerRef.current = 99999
  }, [])

  const handleCorrect = useCallback(() => advanceAlphabet(true),  [advanceAlphabet])
  const handleWrong   = useCallback(() => {
    // Wrong letter hit — flash red but DON'T advance
    setFlashScreen("wrong")
    setScore(s => Math.max(0, s - 5))
    setTimeout(() => setFlashScreen(null), 400)
  }, [])

  // ── Main game loop ────────────────────────────────────────────────────────
  const gameLoop = useCallback((ts: number) => {
    if (!areaRef.current) return
    const dt = Math.min(ts - lastTimeRef.current, 50)
    lastTimeRef.current = ts

    const area = areaRef.current.getBoundingClientRect()
    const areaW = area.width
    const areaH = area.height

    // ── Bunny physics — X and Y both move ──
    velX.current = velX.current * FRICTION
    velY.current = velY.current * FRICTION
    bunnyX.current = Math.max(3,  Math.min(94, bunnyX.current + velX.current * 0.35))
    bunnyY.current = Math.max(5,  Math.min(88, bunnyY.current + velY.current * 0.35))

    // ── Move letters downward ──
    collectedThisFrameRef.current = false
    let targetMissed = false
    setLetters(prev => {
      const updated = prev.map(l => {
        if (l.collected) return l
        const newY = l.y + l.speed * (dt / 16)
        const lxPx = (l.x / 100) * areaW
        const lyPx = (newY / 100) * areaH
        const bxPx = (bunnyX.current / 100) * areaW
        const byPx = (bunnyY.current / 100) * areaH
        const dist = Math.hypot(lxPx - bxPx, lyPx - byPx)
        if (dist < HIT_RADIUS && !collectedThisFrameRef.current) {
          collectedThisFrameRef.current = true
          if (l.isTarget) {
            handleCorrect()
          } else {
            handleWrong()
          }
          // Say the letter name in Spanish
          speakSpanish(l.label)
          // Spawn a pop particle at the letter's current position
          setPopItems(prev => [...prev, {
            id: popIdRef.current++,
            label: l.label,
            english: l.english,
            x: l.x,
            y: newY,
            correct: l.isTarget,
          }])
          return { ...l, collected: true, flashState: (l.isTarget ? "correct" : "wrong") as FloatingLetter["flashState"] }
        }
        // Target fell off screen without being hit → auto-advance
        if (newY > 108 && l.isTarget && !l.collected) {
          targetMissed = true
          return { ...l, collected: true }
        }
        if (newY > 115) return { ...l, collected: true }
        return { ...l, y: newY }
      })
      return updated
    })
    if (targetMissed && !collectedThisFrameRef.current) {
      collectedThisFrameRef.current = true
      advanceAlphabet(false)
    }

    // ── Continuous wave spawner ──
    waveTimerRef.current += dt
    if (waveTimerRef.current > 2200 + Math.random() * 600) {
      waveTimerRef.current = 0
      const cur = ALPHABET_QUEUE[alphabetIdxRef.current % ALPHABET_QUEUE.length]
      spawnWave(cur.label)
    }

    // ── Move coins ──
    setCoinItems(prev => prev.map(c => {
      if (c.collected) return c
      const newY = c.y + c.speed * (dt / 16)
      const cxPx = (c.x / 100) * areaW
      const cyPx = (newY / 100) * areaH
      const bxPx = (bunnyX.current / 100) * areaW
      const byPx = (bunnyY.current / 100) * areaH
      const dist = Math.hypot(cxPx - bxPx, cyPx - byPx)
      if (dist < HIT_RADIUS * 0.75) {
        setLocalCoins(lc => { onCoinsChange(1); return lc + 1 })
        return { ...c, collected: true }
      }
      if (newY > 110) return { ...c, collected: true }
      return { ...c, y: newY }
    }))

    // ── Coin spawn timer — much more frequent ──
    coinTimerRef.current += dt
    if (coinTimerRef.current > 1400 + Math.random() * 800) {
      coinTimerRef.current = 0
      spawnCoin()
    }

    rafRef.current = requestAnimationFrame(gameLoop)
  }, [handleCorrect, handleWrong, advanceAlphabet, spawnWave, spawnCoin])

  // ── Countdown → start ────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== "countdown") return
    if (countdown <= 0) {
      setGamePhase("playing")
      // Kick off with the first wave immediately; wave timer will add more continuously
      spawnWave(ALPHABET_QUEUE[0].label)
      waveTimerRef.current = 0
      // Announce first letter
      setTimeout(() => speakSpanish(ALPHABET_QUEUE[0].label), 400)
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [gamePhase, countdown, spawnWave])

  // ── Start/stop RAF ───────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== "playing") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    lastTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(gameLoop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [gamePhase, gameLoop])

  // ── Announce current target letter in Spanish when it changes ─────────────
  useEffect(() => {
    if (gamePhase !== "playing") return
    const entry = ALPHABET_QUEUE[alphabetIdx % ALPHABET_QUEUE.length]
    // Small delay so the hit-sound (if any) finishes first
    const t = setTimeout(() => speakSpanish(entry.label), 350)
    return () => clearTimeout(t)
  }, [alphabetIdx, gamePhase])

  // ── Auto-remove pop particles after animation ─────────────────────────────
  useEffect(() => {
    if (popItems.length === 0) return
    const t = setTimeout(() => {
      setPopItems(prev => prev.slice(Math.max(0, prev.length - 20)))
    }, 1200)
    return () => clearTimeout(t)
  }, [popItems])

  // ── Bunny DOM position (X + Y both dynamic) ─────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const worldName = sectionTitle.replace(" World", "")
  const progressPct = Math.round((alphabetIdx / ALPHABET_QUEUE.length) * 100)

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "linear-gradient(180deg, #0f0c29 0%, #1e1b4b 25%, #312e81 55%, #4338ca 80%, #6366f1 100%)" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-safe-top pt-3 pb-2 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/80 text-sm font-bold active:scale-95 transition-all"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
        >
          ← Back
        </button>

        <div className="text-center">
          <div className="text-white font-black text-lg leading-none">{worldName} Fly ✈️</div>
          <div className="text-white/60 text-xs mt-0.5">
            {alphabetIdx}/{ALPHABET_QUEUE.length} letters
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Gold coin display */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)" }}>
            {/* Inline gold coin */}
            <div style={{
              width: "18px", height: "18px", borderRadius: "50%",
              background: "conic-gradient(from 160deg,#D97706,#FBBF24 30%,#FDE68A 50%,#FBBF24 70%,#D97706)",
              border: "1.5px solid #92400E",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(120,53,0,0.4)",
              flexShrink: 0,
              position: "relative",
            }}>
              <div style={{ position: "absolute", top: "15%", left: "18%", width: "32%", height: "20%", background: "radial-gradient(ellipse,rgba(255,255,255,0.6),rgba(255,255,255,0) 70%)", borderRadius: "50%", transform: "rotate(-15deg)" }} />
            </div>
            <span className="text-yellow-300 font-black text-sm">{localCoins}</span>
          </div>
          {/* Score */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
            <span className="text-white font-black text-sm">{score}pts</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-1 flex-shrink-0">
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: "linear-gradient(90deg,#fbbf24,#f59e0b)" }} />
        </div>
      </div>

      {/* ── Game Area ── */}
      <div
        ref={areaRef}
        className="flex-1 relative overflow-hidden select-none"
      >
        {/* Twinkling stars */}
        {[...Array(22)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white/25"
            style={{
              width: `${1.5 + (i % 3)}px`, height: `${1.5 + (i % 3)}px`,
              left: `${(i * 41 + 9) % 97}%`,
              top:  `${(i * 59 + 5) % 88}%`,
              animation: `twinkle ${1.5 + (i % 5) * 0.4}s ease-in-out ${(i * 0.35) % 2.5}s infinite alternate`,
            }}
          />
        ))}

        {/* Decorative sky emojis */}
        {skyEmojis.map(se => (
          <div
            key={se.id}
            className="absolute select-none pointer-events-none"
            style={{
              left: `${se.x}%`,
              top: `${se.y}%`,
              fontSize: `${se.size}px`,
              opacity: 0.45,
              animation: `skyDrift ${se.driftDur}s ease-in-out ${se.driftDelay}s infinite alternate`,
              filter: "drop-shadow(0 0 4px rgba(255,255,255,0.3))",
            }}
          >
            {se.emoji}
          </div>
        ))}

        {/* Soft clouds */}
        {[12, 52, 80].map((x, i) => (
          <div key={i} className="absolute text-white/15 select-none pointer-events-none"
            style={{ left: `${x}%`, top: `${14 + i * 18}%`, fontSize: "60px",
              animation: `cloudDrift ${9 + i * 2}s ease-in-out ${i * 4}s infinite alternate` }}
          >☁️</div>
        ))}

        {/* ── Floating Letters ── */}
        {letters.filter(l => !l.collected).map(l => {
          const colors = categoryColor(l.category)
          return (
            <div
              key={l.id}
              className="absolute flex flex-col items-center select-none pointer-events-none"
              style={{
                left: `${l.x}%`,
                top:  `${l.y}%`,
                transform: "translateX(-50%)",
                animation: l.isTarget ? "targetPulse 1.4s ease-in-out infinite" : undefined,
              }}
            >
              {/* Letter bubble */}
              <div
                className="flex items-center justify-center font-black rounded-2xl"
                style={{
                  width: `${LETTER_SIZE}px`,
                  height: `${LETTER_SIZE}px`,
                  fontSize: l.label.length > 1 ? "20px" : "30px",
                  background: colors.bg,
                  color: colors.text,
                  boxShadow: `0 0 16px ${colors.glow}, 0 4px 12px rgba(0,0,0,0.3)`,
                  border: l.isTarget ? "3px solid white" : "2px solid rgba(255,255,255,0.35)",
                  position: "relative",
                }}
              >
                {l.label}
                {l.isTarget && (
                  <div
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center"
                    style={{ fontSize: "9px", fontWeight: 900, color: "#92400e" }}
                  >★</div>
                )}
              </div>
              {/* English word below bubble */}
              <div
                className="mt-1 px-2 py-0.5 rounded-lg font-bold text-white text-center"
                style={{
                  fontSize: "10px",
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.02em",
                }}
              >
                {l.english}
              </div>
            </div>
          )
        })}

        {/* ── Pop Particles (collected letter + english word, floats up and fades) ── */}
        {popItems.map(p => (
          <div
            key={p.id}
            className="absolute flex flex-col items-center pointer-events-none select-none"
            style={{
              left: `${p.x}%`,
              top:  `${p.y}%`,
              transform: "translateX(-50%)",
              animation: "popFloat 1.1s ease-out forwards",
              zIndex: 15,
            }}
          >
            <div
              className="font-black rounded-2xl flex items-center justify-center"
              style={{
                width: `${LETTER_SIZE}px`,
                height: `${LETTER_SIZE}px`,
                fontSize: p.label.length > 1 ? "20px" : "30px",
                background: p.correct ? "#4ade80" : "#f87171",
                color: p.correct ? "#14532d" : "#7f1d1d",
                boxShadow: p.correct
                  ? "0 0 20px rgba(74,222,128,0.8), 0 4px 12px rgba(0,0,0,0.3)"
                  : "0 0 20px rgba(248,113,113,0.8), 0 4px 12px rgba(0,0,0,0.3)",
                border: "3px solid white",
              }}
            >
              {p.label}
            </div>
            <div
              className="mt-1 px-2 py-0.5 rounded-lg font-bold text-white text-center"
              style={{
                fontSize: "11px",
                background: p.correct ? "rgba(74,222,128,0.35)" : "rgba(248,113,113,0.35)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.3)",
                whiteSpace: "nowrap",
              }}
            >
              {p.english}
            </div>
          </div>
        ))}

        {/* ── Gold Coins ── */}
        {coinItems.filter(c => !c.collected).map(c => (
          <div
            key={c.id}
            className="absolute select-none pointer-events-none"
            style={{
              left: `${c.x}%`,
              top:  `${c.y}%`,
              width: `${COIN_SIZE}px`,
              height: `${COIN_SIZE}px`,
              borderRadius: "50%",
              background: "conic-gradient(from 160deg,#D97706,#FBBF24 30%,#FDE68A 50%,#FBBF24 70%,#D97706)",
              border: "2px solid #92400E",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(120,53,0,0.4), inset 1px 1px 4px rgba(254,243,199,0.5), 0 0 12px rgba(251,191,36,0.6)",
              transform: "translateX(-50%)",
              animation: "coinSpin 1.3s linear infinite",
              position: "absolute",
            }}
          >
            {/* Highlight glint */}
            <div style={{ position: "absolute", top: "14%", left: "18%", width: "32%", height: "20%", background: "radial-gradient(ellipse,rgba(255,255,255,0.6),rgba(255,255,255,0) 70%)", borderRadius: "50%", transform: "rotate(-15deg)" }} />
          </div>
        ))}

        {/* ── Bunny — bigger, blue-tinted via CSS filter, transparent background ── */}
        {gamePhase === "playing" && (
          <div
            ref={bunnyElRef}
            className="absolute pointer-events-none"
            style={{
              width: `${BUNNY_W}px`,
              height: `${BUNNY_H}px`,
              zIndex: 10,
              // Blue tint: sepia converts to warm tones, hue-rotate pushes to blue, brightness lightens
              filter: "sepia(1) hue-rotate(180deg) saturate(3) brightness(1.6) drop-shadow(0 0 10px rgba(99,179,237,0.9)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
            }}
          >
            <Image
              src="/images/super-bunny-nobg.gif"
              alt="Bunny"
              width={BUNNY_W}
              height={BUNNY_H}
              className="w-full h-full object-contain"
              unoptimized
              priority
            />
          </div>
        )}

        {/* ── Screen Flash ── */}
        {flashScreen && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: flashScreen === "correct"
                ? "rgba(74,222,128,0.22)"
                : "rgba(239,68,68,0.28)",
              zIndex: 20,
            }}
          />
        )}

        {/* ── Hint pop ── */}
        {showHint && (
          <div
            className="absolute left-1/2 pointer-events-none"
            style={{ top: "38%", zIndex: 25, animation: "hintPop 0.9s ease-out forwards", transform: "translateX(-50%)" }}
          >
            <div className="text-5xl mb-2 text-center">✅</div>
            <div className="text-white font-black text-xl px-5 py-2.5 rounded-2xl text-center"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", whiteSpace: "nowrap" }}>
              +10 pts<br />
              <span className="text-base font-bold text-yellow-300">{hintText}</span>
            </div>
          </div>
        )}

        {/* ── Countdown overlay ── */}
        {gamePhase === "countdown" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 30, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
            <div className="text-white font-black text-center mb-8">
              <div className="text-2xl mb-2 opacity-80">Get ready!</div>
              <div className="text-8xl" style={{ animation: "countdownPop 1s ease-out forwards" }}>
                {countdown > 0 ? countdown : "🐰"}
              </div>
            </div>
            <div className="px-6 py-3 rounded-2xl text-white/70 text-sm text-center max-w-xs"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <strong className="text-white">Hold any arrow</strong> to steer 🐰<br />
              Fly into the <span className="text-yellow-300 font-bold">★ starred letter</span>!<br />
              <span className="text-xs opacity-60 mt-1 block">Letters are in order: A → B → C…</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom: Prompt + Steering Controls ── */}
      <div className="flex-shrink-0 pb-safe-bottom" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)" }}>

        {/* Prompt bar */}
        <div className="px-4 pt-3 pb-2 text-center">
          <div className="inline-block px-5 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-0.5">Find it!</div>
            <div className="text-white font-black text-2xl leading-tight tracking-wide">
              {currentEntry.label}
              <span className="text-white/50 font-bold text-sm ml-2">— {currentEntry.hint}</span>
            </div>
          </div>
        </div>

        {/* D-pad — 4 directional hold buttons */}
        <div className="flex items-center justify-center gap-2 px-4 pb-4">
          {/* Left */}
          <button
            className="flex flex-col items-center justify-center rounded-2xl font-black text-white text-2xl transition-transform active:scale-90"
            style={{
              width: "80px", height: "64px",
              background: "rgba(99,102,241,0.55)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
              WebkitUserSelect: "none", userSelect: "none", touchAction: "none",
            }}
            onPointerDown={(e) => { e.preventDefault(); if (gamePhase === "playing") startHold("left") }}
            onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}
          >◀</button>

          {/* Up + Down stacked in center */}
          <div className="flex flex-col gap-1.5">
            <button
              className="flex items-center justify-center rounded-2xl font-black text-white text-2xl transition-transform active:scale-90"
              style={{
                width: "64px", height: "44px",
                background: "rgba(139,92,246,0.55)",
                border: "1.5px solid rgba(255,255,255,0.3)",
                boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
                WebkitUserSelect: "none", userSelect: "none", touchAction: "none",
              }}
              onPointerDown={(e) => { e.preventDefault(); if (gamePhase === "playing") startHold("up") }}
              onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}
            >▲</button>
            <button
              className="flex items-center justify-center rounded-2xl font-black text-white text-2xl transition-transform active:scale-90"
              style={{
                width: "64px", height: "44px",
                background: "rgba(139,92,246,0.55)",
                border: "1.5px solid rgba(255,255,255,0.3)",
                boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
                WebkitUserSelect: "none", userSelect: "none", touchAction: "none",
              }}
              onPointerDown={(e) => { e.preventDefault(); if (gamePhase === "playing") startHold("down") }}
              onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}
            >▼</button>
          </div>

          {/* Right */}
          <button
            className="flex flex-col items-center justify-center rounded-2xl font-black text-white text-2xl transition-transform active:scale-90"
            style={{
              width: "80px", height: "64px",
              background: "rgba(99,102,241,0.55)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
              WebkitUserSelect: "none", userSelect: "none", touchAction: "none",
            }}
            onPointerDown={(e) => { e.preventDefault(); if (gamePhase === "playing") startHold("right") }}
            onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}
          >▶</button>
        </div>
      </div>

      {/* ── CSS Keyframes ── */}
      <style>{`
        @keyframes twinkle {
          from { opacity: 0.15; transform: scale(0.7); }
          to   { opacity: 0.9;  transform: scale(1.3); }
        }
        @keyframes cloudDrift {
          from { transform: translateX(-12px); }
          to   { transform: translateX(12px); }
        }
        @keyframes skyDrift {
          0%   { transform: translateY(0px) rotate(-4deg); }
          50%  { transform: translateY(-8px) rotate(2deg); }
          100% { transform: translateY(4px) rotate(-2deg); }
        }
        @keyframes coinSpin {
          0%   { transform: translateX(-50%) scaleX(1); }
          25%  { transform: translateX(-50%) scaleX(0.3); }
          50%  { transform: translateX(-50%) scaleX(1); }
          75%  { transform: translateX(-50%) scaleX(0.3); }
          100% { transform: translateX(-50%) scaleX(1); }
        }
        @keyframes targetPulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50%       { transform: translateX(-50%) scale(1.1); }
        }
        @keyframes hintPop {
          0%   { opacity: 0; transform: translateX(-50%) scale(0.7); }
          25%  { opacity: 1; transform: translateX(-50%) scale(1.08); }
          75%  { opacity: 1; transform: translateX(-50%) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) scale(0.9); }
        }
        @keyframes countdownPop {
          0%   { transform: scale(0.5); opacity: 0; }
          50%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes popFloat {
          0%   { opacity: 1;   transform: translateX(-50%) translateY(0px) scale(1.15); }
          40%  { opacity: 1;   transform: translateX(-50%) translateY(-28px) scale(1); }
          100% { opacity: 0;   transform: translateX(-50%) translateY(-60px) scale(0.8); }
        }
      `}</style>
    </div>
  )
}
