"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Play, Pause } from "lucide-react"
import { translateWord } from "@/lib/spanish-dictionary"
import Image from "next/image"

// Types
interface KaraokeWord {
  id: number
  text: string
  duration: number
  timestamp: number
}

interface KaraokeLine {
  id: number
  words: KaraokeWord[]
}

interface TimingData {
  songNumber: number
  title: string
  audioUrl: string
  lyrics: KaraokeLine[]
}

interface Note {
  text: string
  english: string
  timestamp: number
  duration: number
  lane: number
  hit: boolean
  id: string
}

interface DDRGameProps {
  songNumber: number
  songTitle: string
  onBack: () => void
}

// Constants
const NOTE_TRAVEL_TIME = 3.0
const HIT_LINE_POSITION = 0.85
const HIT_WINDOWS = { PERFECT: 0.08, GOOD: 0.15, MISS: 0.25 }
const LANE_COLORS = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500"]
const LANE_TEXT_COLORS = ["text-red-500", "text-blue-500", "text-green-500", "text-yellow-500"]

// Carrot SVG for each direction (the pointed tip faces the arrow direction)
const CARROT_SVGS: Record<string, string> = {
  left: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg">
    <polygon points="0,20 40,4 36,20 40,36" fill="#F97316" stroke="#EA580C" stroke-width="1.5"/>
    <line x1="14" y1="14" x2="20" y2="17" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="18" y1="12" x2="24" y2="16" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="22" y1="24" x2="28" y2="21" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="46" cy="14" rx="7" ry="5" fill="#22C55E" transform="rotate(-20,46,14)"/>
    <ellipse cx="50" cy="20" rx="7" ry="5" fill="#16A34A" transform="rotate(10,50,20)"/>
    <ellipse cx="44" cy="24" rx="6" ry="4" fill="#22C55E" transform="rotate(25,44,24)"/>
  </svg>`,
  down: `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,60 4,20 20,24 36,20" fill="#F97316" stroke="#EA580C" stroke-width="1.5"/>
    <line x1="14" y1="34" x2="17" y2="40" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="12" y1="38" x2="16" y2="44" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="24" y1="34" x2="21" y2="40" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="14" cy="12" rx="5" ry="7" fill="#22C55E" transform="rotate(-15,14,12)"/>
    <ellipse cx="20" cy="8" rx="5" ry="7" fill="#16A34A" transform="rotate(5,20,8)"/>
    <ellipse cx="26" cy="13" rx="4" ry="6" fill="#22C55E" transform="rotate(20,26,13)"/>
  </svg>`,
  up: `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,0 36,40 20,36 4,40" fill="#F97316" stroke="#EA580C" stroke-width="1.5"/>
    <line x1="14" y1="26" x2="17" y2="20" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="12" y1="22" x2="16" y2="16" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="24" y1="26" x2="21" y2="20" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="14" cy="48" rx="5" ry="7" fill="#22C55E" transform="rotate(15,14,48)"/>
    <ellipse cx="20" cy="52" rx="5" ry="7" fill="#16A34A" transform="rotate(-5,20,52)"/>
    <ellipse cx="26" cy="47" rx="4" ry="6" fill="#22C55E" transform="rotate(-20,26,47)"/>
  </svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg">
    <polygon points="60,20 20,4 24,20 20,36" fill="#F97316" stroke="#EA580C" stroke-width="1.5"/>
    <line x1="40" y1="14" x2="34" y2="17" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="36" y1="12" x2="30" y2="16" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="36" y1="24" x2="30" y2="21" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="14" cy="14" rx="7" ry="5" fill="#22C55E" transform="rotate(20,14,14)"/>
    <ellipse cx="10" cy="20" rx="7" ry="5" fill="#16A34A" transform="rotate(-10,10,20)"/>
    <ellipse cx="16" cy="24" rx="6" ry="4" fill="#22C55E" transform="rotate(-25,16,24)"/>
  </svg>`,
}

export default function DDRGame({ songNumber, songTitle, onBack }: DDRGameProps) {
  const [gameState, setGameState] = useState<"loading" | "setup" | "playing" | "ended">("loading")
  const [timingData, setTimingData] = useState<TimingData | null>(null)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [totalHits, setTotalHits] = useState(0)
  const [difficulty, setDifficulty] = useState(5)
  const [showTranslations, setShowTranslations] = useState(true)
  const [encouragement, setEncouragement] = useState<{ text: string; color: string } | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const notesRef = useRef<Note[]>([])
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const maxComboRef = useRef(0)
  const totalHitsRef = useRef(0)
  const hitColorIndexRef = useRef(0)
  const animationRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fallingRef = useRef<HTMLDivElement>(null)

  // Rainbow colors that cycle on each hit
  const RAINBOW_COLORS = [
    "#EF4444", // red
    "#F97316", // orange
    "#EAB308", // yellow
    "#22C55E", // green
    "#3B82F6", // blue
    "#A855F7", // purple
  ]

  // Load timing data
  useEffect(() => {
    fetch(`/timing/song-${songNumber}.json`)
      .then((res) => res.json())
      .then((data: TimingData) => {
        setTimingData(data)
        setGameState("setup")
      })
      .catch((err) => {
        console.error("Failed to load timing data:", err)
      })
  }, [songNumber])

  // Create notes from timing data
  const createNotes = useCallback((): Note[] => {
    if (!timingData) return []

    const allNotes: Note[] = []
    timingData.lyrics.forEach((line, lineIndex) => {
      line.words.forEach((word, wordIndex) => {
        allNotes.push({
          text: word.text,
          english: translateWord(word.text),
          timestamp: word.timestamp,
          duration: word.duration,
          lane: (lineIndex + wordIndex) % 4,
          hit: false,
          id: `${lineIndex}-${wordIndex}`,
        })
      })
    })

    // Filter by difficulty
    return allNotes.filter((_, index) => {
      if (difficulty === 5) return true
      if (difficulty === 4) return index % 4 !== 3
      if (difficulty === 3) return index % 2 === 0
      if (difficulty === 2) return index % 3 === 0
      return index % 5 === 0
    })
  }, [timingData, difficulty])

  // Start game — create audio directly in click handler (required for autoplay)
  const startGame = useCallback(() => {
    if (!timingData) return

    // Prevent double-invoke from creating duplicate audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }

    const notes = createNotes()
    notesRef.current = notes
    scoreRef.current = 0
    comboRef.current = 0
    maxComboRef.current = 0
    totalHitsRef.current = 0
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setTotalHits(0)

    // Create audio immediately in the click handler (user gesture required)
    const audio = new Audio(timingData.audioUrl)
    audio.crossOrigin = "anonymous"
    audioRef.current = audio

    audio.addEventListener("ended", () => {
      setGameState("ended")
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    })

    // Play audio immediately (user gesture context is required)
    audio.play().catch((err) => {
      console.error("Audio play failed:", err)
    })

    // Set game state after play() call to start render loop
    setGameState("playing")
  }, [timingData, createNotes])

  // Render loop
  useEffect(() => {
    if (gameState !== "playing" || !audioRef.current) return

    const render = () => {
      const audio = audioRef.current
      if (!audio || audio.paused) return

      const currentTime = audio.currentTime
      const container = fallingRef.current
      if (!container) return

      container.innerHTML = ""

      notesRef.current.forEach((note) => {
        if (!note.hit) {
          const timeUntilHit = note.timestamp - currentTime
          const isVisible = timeUntilHit <= NOTE_TRAVEL_TIME && timeUntilHit >= -HIT_WINDOWS.MISS

          if (isVisible) {
            const progress = 1 - timeUntilHit / NOTE_TRAVEL_TIME
            const yPosition = progress * (HIT_LINE_POSITION * 100)

            if (yPosition >= 0 && yPosition <= 100) {
              const noteEl = document.createElement("div")
              // Round blue bubble with coin inside
              noteEl.style.cssText = `
                position: absolute;
                left: ${note.lane * 25 + 2}%;
                width: 21%;
                top: ${yPosition}%;
                transform: translateY(-50%);
                z-index: 10;
                aspect-ratio: 1;
                max-height: 80px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                background: radial-gradient(circle at 30% 25%, rgba(173,216,255,0.6), rgba(100,180,255,0.35) 50%, rgba(59,130,246,0.25));
                border: 1.5px solid rgba(200,225,255,0.5);
                box-shadow: 0 0 18px rgba(59,130,246,0.3), inset 0 -6px 12px rgba(59,130,246,0.15), inset 4px 4px 12px rgba(255,255,255,0.35);
                overflow: visible;
              `

              // Coin inside the bubble - rounder, bubble-like with $ and larger text
              const englishText = (showTranslations && note.english && note.english.toLowerCase() !== note.text.toLowerCase()) ? note.english : ""
              const coinContent = englishText
                ? `<div style="font-size:7px;font-weight:700;color:#78350F;line-height:1;letter-spacing:0.3px">${englishText}</div><div style="font-size:12px;font-weight:900;color:#451A03;line-height:1.1">${note.text}</div><div style="font-size:9px;font-weight:900;color:#92400E;line-height:1;margin-top:1px">$</div>`
                : `<div style="font-size:15px;font-weight:900;color:#451A03;line-height:1.1">${note.text}</div><div style="font-size:10px;font-weight:900;color:#92400E;line-height:1;margin-top:2px">$</div>`

              noteEl.innerHTML = `<div style="width:88%;height:88%;border-radius:50%;background:radial-gradient(circle at 35% 28%,#FDE68A,#FBBF24 40%,#D97706);border:2.5px solid #B45309;box-shadow:0 2px 8px rgba(0,0,0,0.3),inset 0 -4px 8px rgba(146,64,14,0.25),inset 3px 3px 10px rgba(254,243,199,0.6),0 0 12px rgba(251,191,36,0.3);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:2px;position:relative"><div style="position:absolute;top:8%;left:18%;width:30%;height:20%;background:radial-gradient(ellipse,rgba(255,255,255,0.6),rgba(255,255,255,0) 70%);border-radius:50%;transform:rotate(-15deg)"></div>${coinContent}</div>`

              container.appendChild(noteEl)
            }
          }

          // Auto-miss
          if (currentTime > note.timestamp + HIT_WINDOWS.MISS) {
            note.hit = true
            comboRef.current = 0
            setCombo(0)
          }
        }
      })

      // Check if all notes are done — fade out and end early
      const allNotesDone = notesRef.current.every((n) => n.hit)
      const lastNote = notesRef.current[notesRef.current.length - 1]
      if (allNotesDone && lastNote && currentTime > lastNote.timestamp + 2) {
        // Fade out audio over 2 seconds then end
        const fadeAudio = audioRef.current
        if (fadeAudio && !fadeAudio.paused) {
          const fadeInterval = setInterval(() => {
            if (fadeAudio.volume > 0.05) {
              fadeAudio.volume = Math.max(0, fadeAudio.volume - 0.05)
            } else {
              clearInterval(fadeInterval)
              fadeAudio.pause()
              setGameState("ended")
              if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = null
              }
            }
          }, 100)
        }
        return
      }

      animationRef.current = requestAnimationFrame(render)
    }

    // Start on audio play
    const audio = audioRef.current
    const onPlay = () => {
      if (!animationRef.current) render()
    }
    const onPause = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    if (!audio.paused) render()

    return () => {
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [gameState, showTranslations])

  // Keyboard input
  useEffect(() => {
    if (gameState !== "playing") return

    const laneMap: Record<string, number> = {
      ArrowLeft: 0,
      ArrowDown: 1,
      ArrowUp: 2,
      ArrowRight: 3,
    }

    const handleKey = (e: KeyboardEvent) => {
      const lane = laneMap[e.key]
      if (lane === undefined) return
      e.preventDefault()

      // Visual feedback
      showLanePress(lane)

      const audio = audioRef.current
      if (!audio) return
      const currentTime = audio.currentTime

      // Find closest unhit note in this lane
      const candidates = notesRef.current.filter(
        (n) => n.lane === lane && !n.hit && Math.abs(n.timestamp - currentTime) <= HIT_WINDOWS.MISS
      )

      if (candidates.length === 0) return

      const closest = candidates.reduce((a, b) =>
        Math.abs(a.timestamp - currentTime) < Math.abs(b.timestamp - currentTime) ? a : b
      )

      const timeDelta = Math.abs(closest.timestamp - currentTime)
      let judgment: string
      let points: number
      let judgmentColor: string

      if (timeDelta <= HIT_WINDOWS.PERFECT) {
        judgment = showTranslations ? "PERFECT" : "PERFECTO"
        points = 25
        judgmentColor = "text-yellow-300"
      } else if (timeDelta <= HIT_WINDOWS.GOOD) {
        judgment = showTranslations ? "GOOD" : "BIEN"
        points = 25
        judgmentColor = "text-green-300"
      } else {
        judgment = "OK"
        points = 25
        judgmentColor = "text-blue-300"
      }

      closest.hit = true
      scoreRef.current += points
      comboRef.current += 1
      totalHitsRef.current += 1
      maxComboRef.current = Math.max(maxComboRef.current, comboRef.current)
      setScore(scoreRef.current)
      setCombo(comboRef.current)
      setMaxCombo(maxComboRef.current)
      setTotalHits(totalHitsRef.current)

      showHitEffect(lane, judgment, judgmentColor)
      checkEncouragement(comboRef.current)
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [gameState, showTranslations])

  // Touch input for mobile
  useEffect(() => {
    if (gameState !== "playing") return

    const handleTouch = (e: TouchEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        const x = touch.clientX - rect.left
        const lane = Math.floor((x / rect.width) * 4)
        if (lane < 0 || lane > 3) continue

        e.preventDefault()
        showLanePress(lane)

        const audio = audioRef.current
        if (!audio) return
        const currentTime = audio.currentTime

        const candidates = notesRef.current.filter(
          (n) => n.lane === lane && !n.hit && Math.abs(n.timestamp - currentTime) <= HIT_WINDOWS.MISS
        )

        if (candidates.length === 0) continue

        const closest = candidates.reduce((a, b) =>
          Math.abs(a.timestamp - currentTime) < Math.abs(b.timestamp - currentTime) ? a : b
        )

        const timeDelta = Math.abs(closest.timestamp - currentTime)
        let judgment: string
        let points: number
        let judgmentColor: string

        if (timeDelta <= HIT_WINDOWS.PERFECT) {
          judgment = showTranslations ? "PERFECT" : "PERFECTO"
          points = 25
          judgmentColor = "text-yellow-300"
        } else if (timeDelta <= HIT_WINDOWS.GOOD) {
          judgment = showTranslations ? "GOOD" : "BIEN"
          points = 25
          judgmentColor = "text-green-300"
        } else {
          judgment = "OK"
          points = 25
          judgmentColor = "text-blue-300"
        }

        closest.hit = true
        scoreRef.current += points
        comboRef.current += 1
        totalHitsRef.current += 1
        maxComboRef.current = Math.max(maxComboRef.current, comboRef.current)
        setScore(scoreRef.current)
        setCombo(comboRef.current)
        setMaxCombo(maxComboRef.current)
        setTotalHits(totalHitsRef.current)

        showHitEffect(lane, judgment, judgmentColor)
        checkEncouragement(comboRef.current)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("touchstart", handleTouch, { passive: false })
      return () => container.removeEventListener("touchstart", handleTouch)
    }
  }, [gameState, showTranslations])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const showLanePress = (lane: number) => {
    const hitZone = document.querySelector(`[data-ddr-lane="${lane}"] .ddr-hit-zone`) as HTMLElement
    const arrow = document.querySelector(`[data-ddr-lane="${lane}"] .ddr-arrow`) as HTMLElement
    const flash = document.querySelector(`[data-ddr-lane="${lane}"] .ddr-flash`) as HTMLElement

    if (hitZone) {
      hitZone.style.transform = "scale(0.9)"
      hitZone.style.boxShadow = "0 0 30px rgba(249,115,22,0.9), inset 0 0 20px rgba(249,115,22,0.4)"
      hitZone.style.borderColor = "#FDE68A"
      setTimeout(() => {
        hitZone.style.transform = "scale(1)"
        hitZone.style.boxShadow = "0 0 20px rgba(249,115,22,0.5), inset 0 0 10px rgba(249,115,22,0.2)"
        hitZone.style.borderColor = "rgb(251,146,60)"
      }, 150)
    }
    if (arrow) {
      arrow.style.transform = "scale(1.3)"
      setTimeout(() => {
        arrow.style.transform = "scale(1)"
      }, 150)
    }
    if (flash) {
      flash.style.opacity = "0.3"
      setTimeout(() => {
        flash.style.opacity = "0"
      }, 150)
    }
  }

  const showHitEffect = (lane: number, judgment: string, color: string) => {
    const container = fallingRef.current
    if (!container) return

    // Rainbow color cycle on each hit
    const rainbowColor = RAINBOW_COLORS[hitColorIndexRef.current % RAINBOW_COLORS.length]
    hitColorIndexRef.current += 1

    // Flash the hit zone with the rainbow color
    const hitZone = document.querySelector(`[data-ddr-lane="${lane}"] .ddr-hit-zone`) as HTMLElement
    if (hitZone) {
      hitZone.style.borderColor = rainbowColor
      hitZone.style.boxShadow = `0 0 30px ${rainbowColor}, inset 0 0 15px ${rainbowColor}80`
      hitZone.style.background = `${rainbowColor}30`
      setTimeout(() => {
        hitZone.style.borderColor = "rgb(251,146,60)"
        hitZone.style.boxShadow = "0 0 20px rgba(249,115,22,0.5), inset 0 0 10px rgba(249,115,22,0.2)"
        hitZone.style.background = "transparent"
      }, 200)
    }

    // Flash the lane background with the rainbow color
    const laneFlash = document.querySelector(`[data-ddr-lane="${lane}"] .ddr-flash`) as HTMLElement
    if (laneFlash) {
      laneFlash.style.backgroundColor = rainbowColor
      laneFlash.style.opacity = "0.25"
      setTimeout(() => {
        laneFlash.style.opacity = "0"
      }, 200)
    }

    // Find the note text for the coin
    const audio = audioRef.current
    const currentTime = audio ? audio.currentTime : 0
    const hitNote = notesRef.current.find(
      (n) => n.lane === lane && n.hit && Math.abs(n.timestamp - currentTime) <= HIT_WINDOWS.MISS + 0.1
    )
    const noteText = hitNote ? hitNote.text : ""
    const noteEnglish = hitNote ? hitNote.english : ""

    // Bubble pop effect — ring expanding outward
    const popRing = document.createElement("div")
    popRing.className = "absolute rounded-full pointer-events-none"
    popRing.style.cssText = `
      left: ${lane * 25 + 1}%; width: 23%; bottom: 12%; aspect-ratio: 1;
      border: 3px solid rgba(147,197,253,0.9);
      animation: bubblePop 0.4s ease-out forwards; z-index: 90;
    `
    container.appendChild(popRing)
    setTimeout(() => popRing.remove(), 400)

    // Bubble shards (small blue pieces flying out)
    for (let i = 0; i < 10; i++) {
      const shard = document.createElement("div")
      shard.className = "absolute rounded-full pointer-events-none"
      shard.style.cssText = `
        left: ${lane * 25 + 12}%; bottom: 15%;
        width: ${6 + Math.random() * 8}px; height: ${6 + Math.random() * 8}px;
        background: radial-gradient(circle, rgba(147,197,253,0.9), rgba(59,130,246,0.6));
        transition: all 0.5s ease-out; opacity: 1;
      `
      container.appendChild(shard)
      const angle = (i / 10) * Math.PI * 2
      const dist = 50 + Math.random() * 50
      setTimeout(() => {
        shard.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`
        shard.style.opacity = "0"
        shard.style.width = "2px"
        shard.style.height = "2px"
      }, 10)
      setTimeout(() => shard.remove(), 500)
    }

    // Coin dropping out of the popped bubble
    const coin = document.createElement("div")
    coin.className = "absolute pointer-events-none"
    coin.style.cssText = `
      left: ${lane * 25 + 1}%; width: 23%; bottom: 14%;
      display: flex; justify-content: center; z-index: 95;
      animation: coinDrop 0.8s ease-in forwards;
    `
    const coinText = showTranslations && noteEnglish && noteEnglish.toLowerCase() !== noteText.toLowerCase()
      ? `<div class="text-[8px] leading-tight text-yellow-900 font-semibold">${noteEnglish}</div><div class="text-[10px] leading-tight text-yellow-900 font-bold">${noteText}</div>`
      : `<div class="text-[10px] leading-tight text-yellow-900 font-bold">${noteText}</div>`
    coin.innerHTML = `
      <div style="width: 44px; height: 44px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #FDE68A, #F59E0B 50%, #D97706); border: 2.5px solid #B45309; box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(146,64,14,0.3), inset 2px 2px 6px rgba(254,243,199,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;">
        ${coinText}
      </div>
    `
    container.appendChild(coin)
    setTimeout(() => coin.remove(), 800)

    // Judgment text
    const el = document.createElement("div")
    el.className = `absolute ${color} font-bold text-3xl pointer-events-none`
    el.style.cssText = `
      left: ${lane * 25 + 1}%; width: 23%; bottom: 22%; text-align: center;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.9), 0 0 15px currentColor;
      animation: ddrJudgmentPop 0.8s ease-out forwards; z-index: 100;
    `
    el.textContent = judgment
    container.appendChild(el)
    setTimeout(() => el.remove(), 800)
  }

  const checkEncouragement = (currentCombo: number) => {
    const spanishMessages: Record<number, { text: string; color: string }> = {
      3: { text: "¡Vamos!", color: "text-green-300" },
      5: { text: "¡Bien Hecho!", color: "text-green-400" },
      8: { text: "¡Súper!", color: "text-cyan-400" },
      10: { text: "¡Excelente!", color: "text-blue-400" },
      13: { text: "¡Genial!", color: "text-indigo-400" },
      15: { text: "¡Increíble!", color: "text-purple-400" },
      18: { text: "¡Asombroso!", color: "text-violet-400" },
      20: { text: "¡Fantástico!", color: "text-pink-400" },
      25: { text: "¡Tremendo!", color: "text-rose-400" },
      30: { text: "¡IMPRESIONANTE!", color: "text-yellow-300" },
      35: { text: "¡MAGNÍFICO!", color: "text-amber-400" },
      40: { text: "¡FENOMENAL!", color: "text-red-400" },
      45: { text: "¡ESPECTACULAR!", color: "text-orange-300" },
      50: { text: "¡ERES INCREÍBLE!", color: "text-yellow-400" },
    }

    // Always show Spanish encouragement messages
    const messages = spanishMessages
    const overflowMsg = { text: "¡IMPARABLE!", color: "text-orange-400" }

    const msg = messages[currentCombo] || (currentCombo > 50 && currentCombo % 25 === 0 ? overflowMsg : null)

    if (msg) {
      setEncouragement(msg)
      setTimeout(() => setEncouragement(null), 2000)
    }
  }

  const resetGame = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    setGameState("setup")
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setTotalHits(0)
  }

  // Calculate grade based on percentage of bubbles popped
  const getGrade = () => {
    const total = notesRef.current.length
    if (total === 0) return { grade: "F", color: "text-red-400" }
    const pct = (totalHitsRef.current / total) * 100
    if (pct >= 97) return { grade: "A+", color: "text-yellow-300" }
    if (pct >= 93) return { grade: "A", color: "text-yellow-400" }
    if (pct >= 90) return { grade: "A-", color: "text-yellow-500" }
    if (pct >= 87) return { grade: "B+", color: "text-green-300" }
    if (pct >= 83) return { grade: "B", color: "text-green-400" }
    if (pct >= 80) return { grade: "B-", color: "text-green-500" }
    if (pct >= 77) return { grade: "C+", color: "text-blue-300" }
    if (pct >= 73) return { grade: "C", color: "text-blue-400" }
    if (pct >= 70) return { grade: "C-", color: "text-blue-500" }
    if (pct >= 67) return { grade: "D+", color: "text-orange-300" }
    if (pct >= 63) return { grade: "D", color: "text-orange-400" }
    if (pct >= 60) return { grade: "D-", color: "text-orange-500" }
    return { grade: "F", color: "text-red-400" }
  }

  const totalNotes = timingData
    ? timingData.lyrics.reduce((sum, line) => sum + line.words.length, 0)
    : 0

  const getNoteCountText = () => {
    const texts: Record<number, string> = {
      1: `~${Math.floor(totalNotes / 5)} notes`,
      2: `~${Math.floor(totalNotes / 3)} notes`,
      3: `~${Math.floor(totalNotes / 2)} notes`,
      4: `~${Math.floor(totalNotes * 0.75)} notes`,
      5: `All ${totalNotes} notes!`,
    }
    return texts[difficulty] || ""
  }

  // LOADING STATE
  if (gameState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🎵</div>
          <p className="text-gray-400">Loading timing data...</p>
        </div>
      </div>
    )
  }

  // SETUP SCREEN
  if (gameState === "setup") {
    const setupBgUrl = `/images/backgrounds/song-${songNumber}.jpg`
    return (
      <div className="min-h-screen text-white" style={{ background: `url(${setupBgUrl}) center/cover no-repeat fixed`, backgroundColor: "#1a0a2e" }}>
        <div className="max-w-md mx-auto p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pt-8">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onBack}>
              <ChevronDown className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold text-center flex-1">🎮 DDR Mode</h1>
            <div className="w-10" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-1">{songTitle}</h2>
            <p className="text-purple-200">Song #{songNumber}</p>
          </div>

          {/* Settings */}
          <div className="bg-black bg-opacity-40 rounded-xl p-6 space-y-6 mb-6">
            {/* Translations toggle */}
            <div>
              <label className="block mb-2 font-semibold">English Translations</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTranslations(!showTranslations)}
                  className={`w-14 h-7 rounded-full relative transition-colors ${showTranslations ? "bg-green-600" : "bg-gray-600"}`}
                >
                  <div
                    className={`absolute top-[2px] w-6 h-6 bg-white rounded-full transition-transform ${showTranslations ? "translate-x-7" : "translate-x-[2px]"}`}
                  />
                </button>
                <span className="text-purple-200">{showTranslations ? "ON" : "OFF"} - See word meanings</span>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block mb-2 font-semibold">Difficulty: Level {difficulty}</label>
              <input
                type="range"
                min="1"
                max="5"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className="w-full h-3 bg-purple-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-purple-300 mt-1">
                <span>Easy</span>
                <span className="font-bold text-white">{getNoteCountText()}</span>
                <span>Hard</span>
              </div>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startGame}
            className="w-full bg-green-600 hover:bg-green-700 py-4 rounded-xl font-bold text-2xl transition-colors"
          >
            {showTranslations ? "▶ Start!" : "▶ ¡Empezar!"}
          </button>

          {/* Instructions */}
          <div className="mt-6 bg-blue-900 bg-opacity-30 rounded-xl p-4 text-sm">
            <p className="font-bold mb-2">🎮 How to Play:</p>
            <p className="text-purple-200">An evil orange villain stole all of your coins! Quick — pop his bubbles with your carrot arrows to get your vocab bank back!</p>
          </div>
        </div>
      </div>
    )
  }

  // END SCREEN
  if (gameState === "ended") {
    const { grade, color: gradeColor } = getGrade()
    return (
      <div className="min-h-screen text-white flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/images/backgrounds/song-${songNumber}.jpg) center/cover no-repeat fixed`, backgroundColor: "#1a0a2e" }}>
        {/* Falling coin bubbles background animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 25 }).map((_, i) => {
            const size = 60
            const delay = Math.random() * 4
            const duration = 3.5 + Math.random() * 3
            const leftPos = Math.random() * 95
            const wobble = Math.random() > 0.4
            return (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${leftPos}%`,
                  top: `-8%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animation: `endCoinFall ${duration}s linear ${delay}s infinite${wobble ? `, coinWobble ${0.8 + Math.random() * 0.6}s ease-in-out ${delay}s infinite` : ""}`,
                  background: "radial-gradient(circle at 35% 30%, #FDE68A, #FBBF24 45%, #D97706)",
                  border: "2.5px solid #B45309",
                  boxShadow: "0 0 18px rgba(251,191,36,0.4), inset 0 -6px 12px rgba(146,64,14,0.25), inset 4px 4px 12px rgba(254,243,199,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {/* Bubble shine highlight */}
                <div
                  className="absolute rounded-full"
                  style={{
                    top: "8%",
                    left: "18%",
                    width: "35%",
                    height: "25%",
                    background: "radial-gradient(ellipse, rgba(255,255,255,0.7), rgba(255,255,255,0) 70%)",
                    transform: "rotate(-15deg)",
                  }}
                />
                {/* Dollar sign */}
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    color: "#78350F",
                    textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                    lineHeight: 1,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  $
                </span>
              </div>
            )
          })}
        </div>

        <div className="max-w-md mx-auto p-6 text-center relative z-10">
          {/* Trophy with Grade */}
          <div className="relative inline-block mb-6">
            <div className="w-56 h-56 mx-auto relative">
              <Image
                src="/images/trophy.jpg"
                alt="Trophy"
                width={224}
                height={224}
                className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(234,179,8,0.4)]"
              />
              {/* Grade overlaid inside the trophy cup */}
              <div className="absolute top-[18%] left-1/2 -translate-x-1/2 flex items-center justify-center">
                <span className={`text-5xl font-black ${gradeColor} drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`} style={{ textShadow: "0 0 20px currentColor" }}>
                  {grade}
                </span>
              </div>
            </div>
          </div>

          {/* Longest Flow */}
          <div className="bg-orange-900/40 rounded-xl p-4 border-2 border-orange-500 mb-3">
            <p className="text-orange-200 mb-1 text-lg font-semibold">🔥 Longest Flow</p>
            <span className="font-bold text-orange-300 text-4xl">{maxCombo}</span>
          </div>

          {/* Vocab Bank */}
          <div className="bg-yellow-900/40 rounded-xl p-4 border-2 border-yellow-500 mb-6">
            <p className="text-yellow-200 mb-1 text-lg font-semibold">💰 Vocab Bank</p>
            <span className="font-bold text-yellow-300 text-4xl">{score}</span>
          </div>

          {/* Super Hero Bunny with waving carrot and flowing cape */}
          <div className="mb-6 relative flex flex-col items-center">
            <div className="relative w-48 h-48" style={{ animation: "bunnyBounce 2s ease-in-out infinite" }}>
              <Image
                src="/images/super-bunny.png"
                alt="Super Bunny"
                width={192}
                height={192}
                className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                style={{ animation: "bunnySmile 3s ease-in-out infinite" }}
              />
              {/* Carrot wave glow effect */}
              <div
                className="absolute top-0 right-2 w-8 h-8 rounded-full bg-orange-400/30 blur-md"
                style={{ animation: "carrotGlow 1.5s ease-in-out infinite" }}
              />
              {/* Cape wind particles */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-white/30 rounded-full"
                  style={{
                    right: `-${8 + i * 6}px`,
                    top: `${50 + i * 12}%`,
                    animation: `capeParticle ${0.8 + i * 0.3}s ease-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <p className="text-purple-200 text-sm mt-2 italic">
              {showTranslations ? "Super Bunny celebrates your victory!" : "¡Súper Conejito celebra tu victoria!"}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-xl font-bold text-xl hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              {showTranslations ? "↻ Play Again!" : "↻ ¡Jugar Otra Vez!"}
            </button>
            <button onClick={onBack} className="w-full bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-xl font-bold transition-colors">
              Back to Songs
            </button>
          </div>
        </div>

        {/* End screen animations */}
        <style jsx>{`
          @keyframes endCoinFall {
            0% { transform: translateY(-20px) scale(0.8); opacity: 0; }
            5% { opacity: 0.95; transform: translateY(0) scale(1); }
            50% { opacity: 0.9; transform: translateY(50vh) scale(1.02); }
            90% { opacity: 0.7; }
            100% { transform: translateY(110vh) scale(0.95); opacity: 0; }
          }
          @keyframes coinWobble {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            25% { transform: translateX(-10px) rotate(-5deg); }
            75% { transform: translateX(10px) rotate(5deg); }
          }
          @keyframes bunnyBounce {
            0%, 100% { transform: translateY(0) scale(1); }
            25% { transform: translateY(-12px) scale(1.03); }
            50% { transform: translateY(0) scale(1); }
            75% { transform: translateY(-8px) scale(1.02); }
          }
          @keyframes bunnySmile {
            0%, 100% { transform: rotate(-3deg); }
            30% { transform: rotate(3deg); }
            60% { transform: rotate(-2deg); }
          }
          @keyframes carrotGlow {
            0%, 100% { opacity: 0.3; transform: scale(1) translateY(0); }
            50% { opacity: 0.7; transform: scale(1.3) translateY(-4px); }
          }
          @keyframes capeParticle {
            0% { opacity: 0.5; transform: translateX(0) translateY(0) scale(1); }
            100% { opacity: 0; transform: translateX(20px) translateY(-10px) scale(0); }
          }
        `}</style>
      </div>
    )
  }

  // PLAYING STATE
  const bgImageUrl = `/images/backgrounds/song-${songNumber}.jpg`
  return (
    <div className="min-h-screen text-white relative" style={{ background: `url(${bgImageUrl}) center/cover no-repeat fixed`, backgroundColor: "#1a0a2e" }}>
      {/* Encouragement overlay - at top of screen to avoid overlap with flow counter */}
      {encouragement && (
        <div className="fixed top-16 left-0 right-0 flex justify-center pointer-events-none z-50">
          <div
            className={`${encouragement.color} text-4xl md:text-6xl font-black px-6 py-2`}
            style={{
              textShadow: "3px 3px 6px rgba(0,0,0,0.9), 0 0 30px currentColor",
              animation: "ddrEncouragementBounce 0.6s ease-out",
            }}
          >
            {encouragement.text}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto p-2">
        {/* Top bar: Just back arrow */}
        <div className="flex items-center mb-2 p-2">
          <button onClick={onBack} className="text-white hover:text-purple-300 transition-colors bg-black/40 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Game Area */}
        <div
          ref={containerRef}
          className="relative bg-black/50 rounded-lg overflow-hidden border-4 border-purple-500/60"
          style={{ height: "75vh" }}
        >
          {/* Lanes */}
          <div className="absolute inset-0 flex">
            {[0, 1, 2, 3].map((lane) => (
              <div key={lane} className={`flex-1 ${lane < 3 ? "border-r-2 border-gray-600" : ""} relative`} data-ddr-lane={lane}>
                <div className="ddr-flash absolute inset-0 opacity-0 transition-opacity duration-300" style={{ backgroundColor: LANE_COLORS[lane].replace("bg-", "") === "red-500" ? "rgb(239,68,68)" : LANE_COLORS[lane].replace("bg-", "") === "blue-500" ? "rgb(59,130,246)" : LANE_COLORS[lane].replace("bg-", "") === "green-500" ? "rgb(34,197,94)" : "rgb(234,179,8)" }} />
                <div
                  className="ddr-hit-zone absolute left-1 right-1 border-3 border-orange-400 rounded-full transition-all duration-150"
                  style={{ bottom: "10%", aspectRatio: "1", boxShadow: "0 0 20px rgba(249,115,22,0.5), inset 0 0 10px rgba(249,115,22,0.2)" }}
                />
                <div className={`ddr-arrow absolute left-0 right-0 flex justify-center transition-all duration-150`} style={{ bottom: "3%" }} dangerouslySetInnerHTML={{ __html: [CARROT_SVGS.left, CARROT_SVGS.down, CARROT_SVGS.up, CARROT_SVGS.right][lane] }} />
              </div>
            ))}
          </div>

          {/* Flow counter centered behind bubbles */}
          {combo >= 2 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
              <div className="text-center">
                <div className="text-8xl md:text-9xl font-black text-white/40" style={{ textShadow: "0 0 60px rgba(255,255,255,0.25), 0 4px 8px rgba(0,0,0,0.5)", fontFamily: "'Impact', 'Arial Black', sans-serif", letterSpacing: "-2px" }}>
                  {combo}
                </div>
                <div className="text-2xl md:text-3xl font-black text-white/45 -mt-3 tracking-[0.3em] uppercase" style={{ textShadow: "0 0 30px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.5)", fontFamily: "'Impact', 'Arial Black', sans-serif" }}>
                  flow
                </div>
              </div>
            </div>
          )}

          {/* Falling notes rendered here */}
          <div ref={fallingRef} className="absolute inset-0 pointer-events-none" />
        </div>

        {/* Bank and Best - below the arrows */}
        <div className="flex justify-between items-center mt-2 bg-black/60 rounded-lg px-4 py-2">
          <div className="text-sm">
            💰 Bank: <span className="font-bold text-yellow-300 text-base">{score}</span>
          </div>
          <div className="text-sm">
            🔥 Best: <span className="font-bold text-orange-300 text-base">{maxCombo} flow</span>
          </div>
        </div>
      </div>

      {/* DDR-specific animations */}
      <style jsx global>{`
        @keyframes ddrJudgmentPop {
          0% { transform: scale(0.3); opacity: 0; }
          40% { transform: scale(1.4); opacity: 1; }
          100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
        }
        @keyframes ddrEncouragementBounce {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bubbleFloat {
          0%, 100% { transform: translateY(-50%) scale(1); }
          50% { transform: translateY(-50%) scale(1.04); }
        }
        @keyframes bubblePop {
          0% { transform: scale(1); opacity: 1; border-width: 3px; }
          100% { transform: scale(2.5); opacity: 0; border-width: 0.5px; }
        }
        @keyframes coinDrop {
          0% { transform: translateY(0) scale(1.2); opacity: 1; }
          30% { transform: translateY(20px) scale(1); opacity: 1; }
          100% { transform: translateY(80px) scale(0.6) rotate(15deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
