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
  onNextSong?: () => void
  onGameEnd?: (songNumber: number, flow: number, bank: number, grade: string) => void
}

// Constants
const NOTE_TRAVEL_TIME = 3.0
const HIT_LINE_POSITION = 0.85
const HIT_WINDOWS = { PERFECT: 0.08, GOOD: 0.15, MISS: 0.25 }
const LANE_COLORS = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500"]
const LANE_TEXT_COLORS = ["text-red-500", "text-blue-500", "text-green-500", "text-yellow-500"]

// Carrot SVG for each direction (the pointed tip faces the arrow direction) - black outline
const CARROT_SVGS: Record<string, string> = {
  left: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg">
    <polygon points="0,20 40,4 36,20 40,36" fill="#F97316" stroke="#000" stroke-width="2"/>
    <line x1="14" y1="14" x2="20" y2="17" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="18" y1="12" x2="24" y2="16" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="22" y1="24" x2="28" y2="21" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="46" cy="14" rx="7" ry="5" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(-20,46,14)"/>
    <ellipse cx="50" cy="20" rx="7" ry="5" fill="#16A34A" stroke="#000" stroke-width="1" transform="rotate(10,50,20)"/>
    <ellipse cx="44" cy="24" rx="6" ry="4" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(25,44,24)"/>
  </svg>`,
  down: `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,60 4,20 20,24 36,20" fill="#F97316" stroke="#000" stroke-width="2"/>
    <line x1="14" y1="34" x2="17" y2="40" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="12" y1="38" x2="16" y2="44" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="24" y1="34" x2="21" y2="40" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="14" cy="12" rx="5" ry="7" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(-15,14,12)"/>
    <ellipse cx="20" cy="8" rx="5" ry="7" fill="#16A34A" stroke="#000" stroke-width="1" transform="rotate(5,20,8)"/>
    <ellipse cx="26" cy="13" rx="4" ry="6" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(20,26,13)"/>
  </svg>`,
  up: `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,0 36,40 20,36 4,40" fill="#F97316" stroke="#000" stroke-width="2"/>
    <line x1="14" y1="26" x2="17" y2="20" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="12" y1="22" x2="16" y2="16" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="24" y1="26" x2="21" y2="20" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="14" cy="48" rx="5" ry="7" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(15,14,48)"/>
    <ellipse cx="20" cy="52" rx="5" ry="7" fill="#16A34A" stroke="#000" stroke-width="1" transform="rotate(-5,20,52)"/>
    <ellipse cx="26" cy="47" rx="4" ry="6" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(-20,26,47)"/>
  </svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg">
    <polygon points="60,20 20,4 24,20 20,36" fill="#F97316" stroke="#000" stroke-width="2"/>
    <line x1="40" y1="14" x2="34" y2="17" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="36" y1="12" x2="30" y2="16" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="36" y1="24" x2="30" y2="21" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="14" cy="14" rx="7" ry="5" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(20,14,14)"/>
    <ellipse cx="10" cy="20" rx="7" ry="5" fill="#16A34A" stroke="#000" stroke-width="1" transform="rotate(-10,10,20)"/>
    <ellipse cx="16" cy="24" rx="6" ry="4" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(-25,16,24)"/>
  </svg>`,
}

export default function DDRGame({ songNumber, songTitle, onBack, onNextSong, onGameEnd }: DDRGameProps) {
  const [gameState, setGameState] = useState<"loading" | "setup" | "playing" | "ended">("loading")
  const [timingData, setTimingData] = useState<TimingData | null>(null)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [totalHits, setTotalHits] = useState(0)
  const [speed, setSpeed] = useState<"slow" | "medium" | "fast">("medium")
  const [showTranslations, setShowTranslations] = useState(true)
  const [encouragement, setEncouragement] = useState<{ text: string; color: string } | null>(null)
  const [elapsedTime, setElapsedTime] = useState("0:00")
  const [totalTime, setTotalTime] = useState("0:00")
  const [isPaused, setIsPaused] = useState(false)

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

  // Speed multiplier: affects playback rate (pitch preserved via Web Audio or playbackRate)
  const getSpeedRate = useCallback(() => {
    if (speed === "slow") return 0.65
    if (speed === "medium") return 0.85
    return 1.0
  }, [speed])

  // Create notes from timing data — all bubbles always shown (no difficulty filter)
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

    return allNotes
  }, [timingData])

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
    // Set speed (playbackRate) with pitch preservation
    const rate = getSpeedRate()
    audio.playbackRate = rate
    // preservesPitch keeps the pitch unchanged when speed changes
    ;(audio as any).preservesPitch = true
    ;(audio as any).mozPreservesPitch = true
    ;(audio as any).webkitPreservesPitch = true
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
    setIsPaused(false)
    setGameState("playing")
  }, [timingData, createNotes, getSpeedRate])

  // Pause/resume toggle
  const togglePause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play()
      setIsPaused(false)
    } else {
      audio.pause()
      setIsPaused(true)
    }
  }, [])

  // Render loop
  useEffect(() => {
    if (gameState !== "playing" || !audioRef.current) return

    const render = () => {
      const audio = audioRef.current
      if (!audio || audio.paused) return

      const currentTime = audio.currentTime
      const container = fallingRef.current
      if (!container) return

      // Calculate effective total time: last bubble + 4s fade (reflected in display)
      const lastNote = notesRef.current[notesRef.current.length - 1]
      const effectiveEnd = lastNote ? lastNote.timestamp + 4 : (audio.duration || 0)
      const displayTotal = Math.min(effectiveEnd, audio.duration || effectiveEnd)

      // Update time display
      const mins = Math.floor(currentTime / 60)
      const secs = Math.floor(currentTime % 60)
      setElapsedTime(`${mins}:${secs.toString().padStart(2, "0")}`)
      const tMins = Math.floor(displayTotal / 60)
      const tSecs = Math.floor(displayTotal % 60)
      setTotalTime(`${tMins}:${tSecs.toString().padStart(2, "0")}`)

      container.innerHTML = ""

      notesRef.current.forEach((note) => {
        if (!note.hit) {
          const timeUntilHit = note.timestamp - currentTime
          const isVisible = timeUntilHit <= NOTE_TRAVEL_TIME && timeUntilHit >= -HIT_WINDOWS.MISS

          if (isVisible) {
            const progress = 1 - timeUntilHit / NOTE_TRAVEL_TIME
            const yPosition = progress * (HIT_LINE_POSITION * 100)

            if (yPosition >= 0 && yPosition <= 100) {
              // 3D perspective: bubbles start small/angled at top, grow as they approach
              const scale = 0.45 + progress * 0.55 // 0.45 at top → 1.0 at hit line
              const rotateX = (1 - progress) * 35 // 35deg tilt at top → 0 at hit line
              const opacity = Math.min(1, 0.4 + progress * 0.6) // fade in slightly

              const noteEl = document.createElement("div")
              // Round blue bubble with coin inside
              noteEl.style.cssText = `
                position: absolute;
                left: ${note.lane * 25 + 1}%;
                width: 23%;
                top: ${yPosition}%;
                transform: translateY(-50%) scale(${scale}) rotateX(${rotateX}deg);
                transform-origin: center center;
                z-index: ${Math.floor(progress * 20) + 10};
                aspect-ratio: 1;
                max-height: 110px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25) 0%, rgba(173,216,255,0.15) 30%, rgba(100,180,255,0.08) 60%, rgba(59,130,246,0.12) 100%);
                border: 1.5px solid rgba(180,210,255,0.45);
                box-shadow: 0 0 20px rgba(59,130,246,0.2), inset 0 -8px 16px rgba(59,130,246,0.12), inset 3px 3px 8px rgba(255,255,255,0.3), inset -2px -2px 6px rgba(100,150,255,0.1);
                overflow: visible;
                opacity: ${opacity};
              `

              // Coin inside the bubble — A colors, C double ring, 82% size, more bubble-like
              const englishText = (showTranslations && note.english && note.english.toLowerCase() !== note.text.toLowerCase()) ? note.english : ""
              const coinContent = englishText
                ? `<div style="font-size:10px;font-weight:700;color:#78350F;line-height:1.1;letter-spacing:0.3px;max-width:90%;text-align:center">${englishText}</div><div style="font-size:14px;font-weight:900;color:#451A03;line-height:1.1;max-width:90%;text-align:center">${note.text}</div>`
                : `<div style="font-size:18px;font-weight:900;color:#451A03;line-height:1.1;max-width:90%;text-align:center">${note.text}</div>`

              noteEl.innerHTML = `
                <div style="position:absolute;top:5%;left:12%;width:30%;height:18%;background:radial-gradient(ellipse,rgba(255,255,255,0.5),rgba(255,255,255,0) 70%);border-radius:50%;transform:rotate(-20deg);pointer-events:none;z-index:2"></div>
                <div style="position:absolute;bottom:12%;right:10%;width:20%;height:8%;background:radial-gradient(ellipse,rgba(255,255,255,0.25),rgba(255,255,255,0) 70%);border-radius:50%;transform:rotate(15deg);pointer-events:none;z-index:2"></div>
                <div style="width:82%;height:82%;border-radius:50%;background:conic-gradient(from 160deg,#D97706,#FBBF24 30%,#FDE68A 50%,#FBBF24 70%,#D97706);border:3px solid #92400E;box-shadow:0 2px 8px rgba(0,0,0,0.35),inset 0 -4px 8px rgba(120,53,0,0.3),inset 3px 3px 10px rgba(254,243,199,0.5),0 0 10px rgba(251,191,36,0.25);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:2px;position:relative">
                  <div style="position:absolute;inset:3px;border-radius:50%;border:2px solid rgba(254,243,199,0.4);pointer-events:none"></div>
                  <div style="position:absolute;inset:8px;border-radius:50%;border:1px solid rgba(254,243,199,0.2);pointer-events:none"></div>
                  <div style="position:absolute;top:8%;left:15%;width:32%;height:20%;background:radial-gradient(ellipse,rgba(255,255,255,0.5),rgba(255,255,255,0) 70%);border-radius:50%;transform:rotate(-15deg);pointer-events:none"></div>
                  ${coinContent}
                </div>`

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

      // Check if all notes are done — fade out 3-5 seconds after last bubble
      const allNotesDone = notesRef.current.every((n) => n.hit)
      const lastNoteCheck = notesRef.current[notesRef.current.length - 1]
      if (allNotesDone && lastNoteCheck && currentTime > lastNoteCheck.timestamp + 1) {
        // Fade out audio over ~3 seconds then end
        const fadeAudio = audioRef.current
        if (fadeAudio && !fadeAudio.paused) {
          const fadeInterval = setInterval(() => {
            if (fadeAudio.volume > 0.03) {
              fadeAudio.volume = Math.max(0, fadeAudio.volume - 0.025) // ~3s fade (0.025 * 40 steps @ 75ms)
            } else {
              clearInterval(fadeInterval)
              fadeAudio.pause()
              setGameState("ended")
              if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = null
              }
            }
          }, 75)
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
      // Space bar to pause/resume
      if (e.key === " " || e.key === "Escape") {
        e.preventDefault()
        togglePause()
        return
      }

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
    const arrow = document.querySelector(`[data-ddr-lane="${lane}"] .ddr-arrow`) as HTMLElement
    const flash = document.querySelector(`[data-ddr-lane="${lane}"] .ddr-flash`) as HTMLElement

    // Carrot pushes up a smidge then snaps back
    if (arrow) {
      arrow.style.transform = "translateY(-12px) scale(1.15)"
      setTimeout(() => {
        arrow.style.transform = "translateY(0) scale(1)"
      }, 120)
    }
    if (flash) {
      flash.style.opacity = "0.25"
      setTimeout(() => {
        flash.style.opacity = "0"
      }, 150)
    }
  }

  const showHitEffect = (lane: number, judgment: string, color: string) => {
    const container = containerRef.current
    if (!container) return

    // Rainbow color cycle on each hit
    const rainbowColor = RAINBOW_COLORS[hitColorIndexRef.current % RAINBOW_COLORS.length]
    hitColorIndexRef.current += 1

    // Flash carrot arrow with rainbow color on hit
    const hitArrow = document.querySelector(`[data-ddr-lane="${lane}"] .ddr-arrow`) as HTMLElement
    if (hitArrow) {
      hitArrow.style.filter = `drop-shadow(0 0 12px ${rainbowColor}) drop-shadow(0 0 24px ${rainbowColor})`
      hitArrow.style.transform = "translateY(-14px) scale(1.2)"
      setTimeout(() => {
        hitArrow.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
        hitArrow.style.transform = "translateY(0) scale(1)"
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

    // === BUBBLE POP ANIMATION ===
    const laneLeft = lane * 25 + 1
    const laneWidth = 23

    // Primary pop ring — fast expanding burst
    const popRing1 = document.createElement("div")
    popRing1.className = "absolute rounded-full pointer-events-none"
    popRing1.style.cssText = `
      left: ${laneLeft}%; width: ${laneWidth}%; bottom: 12%; aspect-ratio: 1;
      border: 3px solid rgba(147,197,253,0.95);
      animation: bubblePop 0.35s ease-out forwards; z-index: 90;
    `
    container.appendChild(popRing1)
    setTimeout(() => popRing1.remove(), 350)

    // Secondary pop ring — slightly delayed, thinner
    const popRing2 = document.createElement("div")
    popRing2.className = "absolute rounded-full pointer-events-none"
    popRing2.style.cssText = `
      left: ${laneLeft}%; width: ${laneWidth}%; bottom: 12%; aspect-ratio: 1;
      border: 2px solid rgba(200,230,255,0.7);
      animation: bubblePopSlow 0.5s ease-out 0.05s forwards; z-index: 89;
    `
    container.appendChild(popRing2)
    setTimeout(() => popRing2.remove(), 550)

    // Bubble "skin" flash — brief full circle that pops
    const skinFlash = document.createElement("div")
    skinFlash.className = "absolute rounded-full pointer-events-none"
    skinFlash.style.cssText = `
      left: ${laneLeft + 2}%; width: ${laneWidth - 4}%; bottom: 13%; aspect-ratio: 1;
      background: radial-gradient(circle, rgba(173,216,255,0.5), rgba(59,130,246,0.2));
      animation: bubbleSkinPop 0.25s ease-out forwards; z-index: 88;
    `
    container.appendChild(skinFlash)
    setTimeout(() => skinFlash.remove(), 250)

    // Water droplet splashes — small arcs flying outward like a real bubble pop
    for (let i = 0; i < 14; i++) {
      const droplet = document.createElement("div")
      const size = 3 + Math.random() * 6
      const isLarge = size > 6
      droplet.className = "absolute rounded-full pointer-events-none"
      droplet.style.cssText = `
        left: ${laneLeft + laneWidth / 2}%; bottom: 15%;
        width: ${size}px; height: ${size}px;
        background: ${isLarge
          ? "radial-gradient(circle at 30% 30%, rgba(200,230,255,0.95), rgba(100,180,255,0.7))"
          : "radial-gradient(circle, rgba(147,197,253,0.9), rgba(59,130,246,0.5))"};
        ${isLarge ? "box-shadow: inset 1px 1px 2px rgba(255,255,255,0.6);" : ""}
        transition: all ${0.35 + Math.random() * 0.25}s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        opacity: 1; z-index: 91;
      `
      container.appendChild(droplet)
      const angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
      const dist = 35 + Math.random() * 55
      const gravity = 15 + Math.random() * 25
      setTimeout(() => {
        droplet.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + gravity}px)`
        droplet.style.opacity = "0"
        droplet.style.width = "1px"
        droplet.style.height = "1px"
      }, 10)
      setTimeout(() => droplet.remove(), 600)
    }

    // Coin dropping out of the popped bubble
    const coin = document.createElement("div")
    coin.className = "absolute pointer-events-none"
    coin.style.cssText = `
      left: ${laneLeft}%; width: ${laneWidth}%; bottom: 14%;
      display: flex; justify-content: center; z-index: 95;
      animation: coinDrop 0.8s ease-in forwards;
    `
    const coinText = showTranslations && noteEnglish && noteEnglish.toLowerCase() !== noteText.toLowerCase()
      ? `<div style="font-size:10px;font-weight:700;color:#5C3000;line-height:1.1;max-width:90%;text-align:center;text-shadow:0 0.5px 0 rgba(255,255,255,0.3)">${noteEnglish}</div><div style="font-size:13px;font-weight:900;color:#3D1D00;line-height:1.1;max-width:90%;text-align:center;text-shadow:0 0.5px 0 rgba(255,255,255,0.3)">${noteText}</div>`
      : `<div style="font-size:14px;font-weight:900;color:#3D1D00;line-height:1.1;max-width:90%;text-align:center;text-shadow:0 0.5px 0 rgba(255,255,255,0.3)">${noteText}</div>`
    coin.innerHTML = `
      <div style="width:56px;height:56px;border-radius:50%;background:conic-gradient(from 160deg,#D97706,#FBBF24 30%,#FDE68A 50%,#FBBF24 70%,#D97706);border:3px solid #92400E;box-shadow:0 3px 10px rgba(0,0,0,0.5),inset 0 -3px 6px rgba(120,53,0,0.4),inset 2px 2px 6px rgba(254,243,199,0.5),0 0 12px rgba(251,191,36,0.3);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:2px;position:relative">
        <div style="position:absolute;inset:3px;border-radius:50%;border:2px solid rgba(254,243,199,0.4);pointer-events:none"></div>
        <div style="position:absolute;inset:7px;border-radius:50%;border:1px solid rgba(254,243,199,0.2);pointer-events:none"></div>
        <div style="position:absolute;top:8%;left:15%;width:32%;height:20%;background:radial-gradient(ellipse,rgba(255,255,255,0.5),rgba(255,255,255,0) 70%);border-radius:50%;transform:rotate(-15deg);pointer-events:none"></div>
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

  // Fire onGameEnd when game ends
  useEffect(() => {
    if (gameState === "ended" && onGameEnd) {
      const { grade } = getGrade()
      onGameEnd(songNumber, maxComboRef.current, scoreRef.current, grade)
    }
  }, [gameState])

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
    setIsPaused(false)
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
          {/* Header with gradient */}
          <div className="relative rounded-2xl overflow-hidden mb-4 mt-4" style={{ background: "linear-gradient(135deg, rgba(88,28,135,0.85), rgba(15,23,42,0.85) 50%, rgba(30,58,138,0.85))" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="relative px-4 py-5">
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onBack}>
                  <ChevronDown className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-black text-center flex-1 tracking-wider uppercase" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>🎮 PLAY</h1>
                <div className="w-10" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1" style={{ textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>{songTitle}</h2>
                <p className="text-purple-200 text-sm">Song #{songNumber}</p>
              </div>
            </div>
          </div>

          {/* Your Mission - moved under header */}
          <div className="bg-blue-900/40 rounded-xl p-3 text-sm mb-4 border border-blue-400/30">
            <p className="font-bold mb-1 text-blue-200">🎯 Your Mission:</p>
            <p className="text-purple-200">Pop the bubbles with your carrot arrows to get your vocab bank back!</p>
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

            {/* Speed Selection */}
            <div>
              <label className="block mb-3 font-semibold">Speed</label>
              <div className="flex gap-3">
                {(["slow", "medium", "fast"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      speed === s
                        ? s === "slow" ? "bg-green-600 text-white shadow-lg shadow-green-600/30"
                        : s === "medium" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "bg-red-600 text-white shadow-lg shadow-red-600/30"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {s === "slow" ? "🐢 Slow" : s === "medium" ? "🎵 Medium" : "⚡ Fast (Normal)"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-purple-300 mt-2 text-center">
                {speed === "slow" ? "0.65× speed — more time to react" : speed === "medium" ? "0.85× speed — a bit slower" : "Normal speed"}
              </p>
            </div>

            {/* Total bubbles info */}
            <div className="text-center text-sm text-purple-300">
              {totalNotes} vocab words
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startGame}
            className="w-full bg-green-600 hover:bg-green-700 py-4 rounded-xl font-bold text-2xl transition-colors"
          >
            {showTranslations ? "▶ Start!" : "▶ ¡Empezar!"}
          </button>
        </div>
      </div>
    )
  }

  // END SCREEN
  if (gameState === "ended") {
    const { grade, color: gradeColor } = getGrade()
    return (
      <div className="h-[100dvh] text-white flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/images/backgrounds/song-${songNumber}.jpg) center/cover no-repeat fixed`, backgroundColor: "#1a0a2e" }}>
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

        <div className="max-w-md mx-auto px-4 py-2 text-center relative z-10 flex flex-col items-center justify-center h-full">
          {/* Trophy centered, larger, bouncing */}
          <div className="relative w-44 h-44 md:w-56 md:h-56 flex-shrink-0 mx-auto mb-2" style={{ animation: "bunnyBounce 2s ease-in-out infinite" }}>
            <Image
              src="/images/trophy.png"
              alt="Trophy"
              width={224}
              height={224}
              className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(234,179,8,0.4)]"
            />
            {/* Grade overlaid inside the trophy cup */}
            <div className="absolute top-[18%] left-1/2 -translate-x-1/2 flex items-center justify-center">
              <span className={`text-4xl md:text-5xl font-black ${gradeColor} drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`} style={{ textShadow: "0 0 20px currentColor" }}>
                {grade}
              </span>
            </div>
            {/* WINNER text on the plaque */}
            <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2">
              <span className="text-sm md:text-base font-black text-yellow-900 tracking-wider uppercase" style={{ textShadow: "0 1px 1px rgba(255,255,255,0.3)" }}>
                WINNER
              </span>
            </div>
          </div>

          {/* Stats row - horizontal with large emojis */}
          <div className="flex gap-3 w-full mb-3">
            {/* Longest Flow */}
            <div className="flex-1 bg-orange-900/40 rounded-xl px-3 py-2 border-2 border-orange-500">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl md:text-3xl">🔥</span>
                <span className="text-orange-200 text-base md:text-lg font-semibold">Flow</span>
                <span className="font-bold text-orange-300 text-2xl md:text-3xl">{maxCombo}</span>
              </div>
            </div>
            {/* Vocab Bank */}
            <div className="flex-1 bg-yellow-900/40 rounded-xl px-3 py-2 border-2 border-yellow-500">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl md:text-3xl">💰</span>
                <span className="text-yellow-200 text-base md:text-lg font-semibold">Bank</span>
                <span className="font-bold text-yellow-300 text-2xl md:text-3xl">{score}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 w-full mb-2">
            <button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              {showTranslations ? "↻ Play Again!" : "↻ ¡Jugar Otra Vez!"}
            </button>
            <div className="flex gap-2 w-full">
              <button onClick={onBack} className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm">
                ← Back to Songs
              </button>
              {onNextSong && (
                <button onClick={onNextSong} className="flex-1 bg-green-700 hover:bg-green-600 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm">
                  Next Song →
                </button>
              )}
            </div>
          </div>

          {/* Super Bunny below buttons */}
          <div className="relative flex flex-col items-center">
            <div className="relative w-24 h-24 md:w-32 md:h-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/super-bunny-animated.webp"
                alt="Super Bunny"
                className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              />
            </div>
            <p className="text-purple-200 text-xs italic">
              {showTranslations ? "Super Bunny celebrates your victory!" : "¡Súper Conejito celebra tu victoria!"}
            </p>
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
        `}</style>
      </div>
    )
  }

  // PLAYING STATE
  const bgImageUrl = `/images/backgrounds/song-${songNumber}.jpg`
  return (
    <div className="h-[100dvh] text-white relative overflow-hidden" style={{ background: `url(${bgImageUrl}) center/cover no-repeat fixed`, backgroundColor: "#1a0a2e" }}>
      {/* Pause overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={togglePause}>
          <div className="text-center">
            <div className="text-6xl mb-4">⏸️</div>
            <p className="text-white text-2xl font-bold">PAUSED</p>
            <p className="text-white/60 mt-2">Tap to resume</p>
          </div>
        </div>
      )}

      {/* Encouragement overlay - at top of screen to avoid overlap with flow counter */}
      {encouragement && (
        <div className="fixed top-16 left-0 right-0 flex justify-center pointer-events-none z-40">
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

      <div className="max-w-lg mx-auto h-full flex flex-col">
        {/* Top bar: Just back arrow */}
        <div className="flex items-center p-1 px-2 flex-shrink-0">
          <button onClick={onBack} className="text-white hover:text-purple-300 transition-colors bg-black/40 rounded-full p-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Game Area - lanes extend to edges (no rounded border, no top/bottom lines) */}
        <div
          ref={containerRef}
          className="relative overflow-hidden flex-1"
          style={{ perspective: "800px" }}
        >
          {/* Lanes - extend full height, no top/bottom borders */}
          <div className="absolute inset-0 flex">
            {[0, 1, 2, 3].map((lane) => (
              <div key={lane} className={`flex-1 ${lane < 3 ? "border-r border-white/20" : ""} relative`} data-ddr-lane={lane}>
                <div className="ddr-flash absolute inset-0 opacity-0 transition-opacity duration-300" style={{ backgroundColor: LANE_COLORS[lane].replace("bg-", "") === "red-500" ? "rgb(239,68,68)" : LANE_COLORS[lane].replace("bg-", "") === "blue-500" ? "rgb(59,130,246)" : LANE_COLORS[lane].replace("bg-", "") === "green-500" ? "rgb(34,197,94)" : "rgb(234,179,8)" }} />
                <div className="ddr-hit-zone absolute left-1 right-1 transition-all duration-150" style={{ bottom: "10%", aspectRatio: "1" }} />
                <div className={`ddr-arrow absolute left-0 right-0 flex justify-center transition-all duration-100`} style={{ bottom: "4%", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} dangerouslySetInnerHTML={{ __html: [CARROT_SVGS.left, CARROT_SVGS.down, CARROT_SVGS.up, CARROT_SVGS.right][lane] }} />
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
          <div ref={fallingRef} className="absolute inset-0 pointer-events-none" style={{ transformStyle: "preserve-3d" }} />
        </div>

        {/* Bottom bar: Bank, Pause, Time, Best - fatter with larger icons */}
        <div className="flex justify-between items-center bg-black/70 px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-yellow-300 text-xl md:text-2xl">{score}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={togglePause} className="bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors">
              {isPaused ? <Play className="h-5 w-5 text-white" /> : <Pause className="h-5 w-5 text-white" />}
            </button>
            <div className="text-base text-white/70 font-mono">
              <span className="text-white font-bold text-lg">{elapsedTime}</span> / {totalTime}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-orange-300 text-xl md:text-2xl">{maxCombo}</span>
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
          60% { opacity: 0.6; }
          100% { transform: scale(2.8); opacity: 0; border-width: 0.5px; }
        }
        @keyframes bubblePopSlow {
          0% { transform: scale(0.8); opacity: 0.7; border-width: 2px; }
          100% { transform: scale(3.2); opacity: 0; border-width: 0.3px; }
        }
        @keyframes bubbleSkinPop {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 0.3; }
          100% { transform: scale(1.8); opacity: 0; }
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
