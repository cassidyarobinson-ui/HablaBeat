"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Play, Pause } from "lucide-react"
import { translateWord } from "@/lib/spanish-dictionary"

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

export default function DDRGame({ songNumber, songTitle, onBack }: DDRGameProps) {
  const [gameState, setGameState] = useState<"loading" | "setup" | "playing" | "ended">("loading")
  const [timingData, setTimingData] = useState<TimingData | null>(null)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [difficulty, setDifficulty] = useState(5)
  const [showTranslations, setShowTranslations] = useState(true)
  const [encouragement, setEncouragement] = useState<{ text: string; color: string } | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const notesRef = useRef<Note[]>([])
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const maxComboRef = useRef(0)
  const animationRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fallingRef = useRef<HTMLDivElement>(null)

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

  // Start game
  const startGame = useCallback(() => {
    if (!timingData) return

    const notes = createNotes()
    notesRef.current = notes
    scoreRef.current = 0
    comboRef.current = 0
    maxComboRef.current = 0
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setGameState("playing")

    // Create and play audio from the MyKaraoke URL
    if (audioRef.current) {
      audioRef.current.pause()
    }
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

    audio.play().catch((err) => {
      console.error("Audio play failed:", err)
    })
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
              noteEl.className = `absolute ${LANE_COLORS[note.lane]} rounded-lg p-2 text-center shadow-xl border-2 border-white`
              noteEl.style.left = note.lane * 25 + 1 + "%"
              noteEl.style.width = "23%"
              noteEl.style.top = yPosition + "%"
              noteEl.style.transform = "translateY(-50%)"
              noteEl.style.zIndex = "10"

              if (showTranslations && note.english && note.english.toLowerCase() !== note.text.toLowerCase()) {
                // English small on top, Spanish big on bottom
                noteEl.innerHTML = `<div class="text-xs font-semibold opacity-80">${note.english}</div><div class="font-bold text-lg">${note.text}</div>`
              } else {
                noteEl.innerHTML = `<div class="font-bold text-lg">${note.text}</div>`
              }

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
        points = 100 + comboRef.current * 10
        judgmentColor = "text-yellow-300"
      } else if (timeDelta <= HIT_WINDOWS.GOOD) {
        judgment = showTranslations ? "GOOD" : "BIEN"
        points = 50 + comboRef.current * 5
        judgmentColor = "text-green-300"
      } else {
        judgment = "OK"
        points = 20
        judgmentColor = "text-blue-300"
      }

      closest.hit = true
      scoreRef.current += points
      comboRef.current += 1
      maxComboRef.current = Math.max(maxComboRef.current, comboRef.current)
      setScore(scoreRef.current)
      setCombo(comboRef.current)
      setMaxCombo(maxComboRef.current)

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
          points = 100 + comboRef.current * 10
          judgmentColor = "text-yellow-300"
        } else if (timeDelta <= HIT_WINDOWS.GOOD) {
          judgment = showTranslations ? "GOOD" : "BIEN"
          points = 50 + comboRef.current * 5
          judgmentColor = "text-green-300"
        } else {
          judgment = "OK"
          points = 20
          judgmentColor = "text-blue-300"
        }

        closest.hit = true
        scoreRef.current += points
        comboRef.current += 1
        maxComboRef.current = Math.max(maxComboRef.current, comboRef.current)
        setScore(scoreRef.current)
        setCombo(comboRef.current)
        setMaxCombo(maxComboRef.current)

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
      hitZone.style.boxShadow = "0 0 30px rgba(255,255,255,0.8), inset 0 0 20px rgba(255,255,255,0.4)"
      setTimeout(() => {
        hitZone.style.transform = "scale(1)"
        hitZone.style.boxShadow = "0 0 20px rgba(255,255,255,0.5)"
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

    // Judgment text
    const el = document.createElement("div")
    el.className = `absolute ${color} font-bold text-3xl pointer-events-none`
    el.style.cssText = `
      left: ${lane * 25 + 1}%; width: 23%; bottom: 18%; text-align: center;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.9), 0 0 15px currentColor;
      animation: ddrJudgmentPop 0.8s ease-out forwards; z-index: 100;
    `
    el.textContent = judgment
    container.appendChild(el)
    setTimeout(() => el.remove(), 800)

    // Particles
    for (let i = 0; i < 8; i++) {
      const p = document.createElement("div")
      p.className = `absolute ${LANE_COLORS[lane]} rounded-full pointer-events-none`
      p.style.cssText = `
        left: ${lane * 25 + 12}%; bottom: 15%; width: 12px; height: 12px;
        transition: all 0.5s ease-out; opacity: 1;
      `
      container.appendChild(p)
      const angle = (i / 8) * Math.PI * 2
      const dist = 60 + Math.random() * 40
      setTimeout(() => {
        p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`
        p.style.opacity = "0"
        p.style.width = "3px"
        p.style.height = "3px"
      }, 10)
      setTimeout(() => p.remove(), 500)
    }
  }

  const checkEncouragement = (currentCombo: number) => {
    const spanishMessages: Record<number, { text: string; color: string }> = {
      5: { text: "¡Bien Hecho!", color: "text-green-400" },
      10: { text: "¡Excelente!", color: "text-blue-400" },
      15: { text: "¡Increíble!", color: "text-purple-400" },
      20: { text: "¡Fantástico!", color: "text-pink-400" },
      30: { text: "¡IMPRESIONANTE!", color: "text-yellow-300" },
      40: { text: "¡FENOMENAL!", color: "text-red-400" },
      50: { text: "¡ERES INCREÍBLE!", color: "text-yellow-400" },
    }

    const englishMessages: Record<number, { text: string; color: string }> = {
      5: { text: "Nice Job!", color: "text-green-400" },
      10: { text: "Excellent!", color: "text-blue-400" },
      15: { text: "Incredible!", color: "text-purple-400" },
      20: { text: "Fantastic!", color: "text-pink-400" },
      30: { text: "AMAZING!", color: "text-yellow-300" },
      40: { text: "PHENOMENAL!", color: "text-red-400" },
      50: { text: "YOU'RE INCREDIBLE!", color: "text-yellow-400" },
    }

    const messages = showTranslations ? englishMessages : spanishMessages
    const overflowMsg = showTranslations
      ? { text: "UNSTOPPABLE!", color: "text-orange-400" }
      : { text: "¡IMPARABLE!", color: "text-orange-400" }

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 text-white">
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
            <ul className="space-y-1 text-purple-200">
              <li>• Words fall as the song plays!</li>
              <li>
                • <span className="font-bold text-white">Desktop:</span> Press ← ↓ ↑ → arrow keys
              </li>
              <li>
                • <span className="font-bold text-white">Mobile:</span> Tap the lane as words reach the bottom
              </li>
              <li>• Perfect timing = more points!</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // END SCREEN
  if (gameState === "ended") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 text-center">
          <h2 className="text-5xl font-bold mb-4 text-yellow-300 animate-pulse">
            {showTranslations ? "Congrats!" : "¡Felicidades!"}
          </h2>
          <p className="text-2xl font-bold mb-6 text-pink-300">
            {showTranslations ? "You Did Amazing!" : "¡Lo Hiciste Increíble!"}
          </p>

          <div className="space-y-3 mb-8">
            <div className="bg-yellow-900/40 rounded-xl p-4 border-2 border-yellow-500">
              <p className="text-yellow-200 mb-1">{showTranslations ? "Final Score" : "Puntuación Final"}</p>
              <span className="font-bold text-yellow-300 text-4xl">{score}</span>
            </div>
            <div className="bg-green-900/40 rounded-xl p-4 border-2 border-green-500">
              <p className="text-green-200 mb-1">{showTranslations ? "Max Combo" : "Combo Máximo"}</p>
              <span className="font-bold text-green-300 text-4xl">×{maxCombo}</span>
            </div>
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
      </div>
    )
  }

  // PLAYING STATE
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 text-white">
      {/* Encouragement overlay */}
      {encouragement && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div
            className={`${encouragement.color} text-5xl md:text-7xl font-black`}
            style={{
              textShadow: "4px 4px 8px rgba(0,0,0,0.9)",
              animation: "ddrEncouragementBounce 0.6s ease-out",
            }}
          >
            {encouragement.text}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto p-2">
        {/* Score bar */}
        <div className="flex justify-between mb-2 text-sm bg-black/50 rounded-lg p-3">
          <div>
            Score: <span className="font-bold text-yellow-300">{score}</span>
          </div>
          <div>
            Combo: <span className="font-bold text-green-300">×{combo}</span>
          </div>
          <div>
            Best: <span className="font-bold text-blue-300">×{maxCombo}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 justify-center mb-2">
          <button onClick={resetGame} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold text-sm">
            ↻ Reset
          </button>
        </div>

        {/* Game Area */}
        <div
          ref={containerRef}
          className="relative bg-black/70 rounded-lg overflow-hidden border-4 border-purple-500"
          style={{ height: "70vh" }}
        >
          {/* Lanes */}
          <div className="absolute inset-0 flex">
            {[0, 1, 2, 3].map((lane) => (
              <div key={lane} className={`flex-1 ${lane < 3 ? "border-r-2 border-gray-600" : ""} relative`} data-ddr-lane={lane}>
                <div className="ddr-flash absolute inset-0 opacity-0 transition-opacity duration-300" style={{ backgroundColor: LANE_COLORS[lane].replace("bg-", "") === "red-500" ? "rgb(239,68,68)" : LANE_COLORS[lane].replace("bg-", "") === "blue-500" ? "rgb(59,130,246)" : LANE_COLORS[lane].replace("bg-", "") === "green-500" ? "rgb(34,197,94)" : "rgb(234,179,8)" }} />
                <div
                  className="ddr-hit-zone absolute left-1 right-1 h-20 border-4 border-white rounded-lg transition-all duration-150"
                  style={{ bottom: "12%", boxShadow: "0 0 20px rgba(255,255,255,0.5)" }}
                />
                <div className={`ddr-arrow absolute left-0 right-0 text-center text-4xl font-bold ${LANE_TEXT_COLORS[lane]} transition-all duration-150`} style={{ bottom: "3%" }}>
                  {["←", "↓", "↑", "→"][lane]}
                </div>
              </div>
            ))}
          </div>

          {/* Falling notes rendered here */}
          <div ref={fallingRef} className="absolute inset-0 pointer-events-none" />
        </div>

        <div className="text-center mt-2 text-sm text-purple-200">🎹 Press ← ↓ ↑ → or tap lanes! 🎹</div>
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
      `}</style>
    </div>
  )
}
