"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, Pause, Play, SkipBack, SkipForward } from "lucide-react"
import { LYRIC_TRANSLATIONS } from "@/lib/lyric-translations"

// ─────────────────────────────────────────────
// Country data — palette + flag colors per song
// ─────────────────────────────────────────────
type CountryData = { country: string; flag: string; flagColors: string[]; palette: string[] }

const SONG_COUNTRY: Record<number, CountryData> = {
  // ── Mexico — Alphabet World 🇲🇽 green/white/red ──────────────────────────────
  1: { country: "Mexico", flag: "🇲🇽", flagColors: ["#006847","#FFFFFF","#CE1126"], palette: ["#00CED1","#FF1493","#FF8C00"] },
  2: { country: "Mexico", flag: "🇲🇽", flagColors: ["#006847","#FFFFFF","#CE1126"], palette: ["#00CED1","#FF1493","#FF8C00"] },
  3: { country: "Mexico", flag: "🇲🇽", flagColors: ["#006847","#FFFFFF","#CE1126"], palette: ["#00CED1","#FF1493","#FF8C00"] },
  // ── Guatemala — Body World 🇬🇹 blue/white/blue ───────────────────────────────
  4: { country: "Guatemala", flag: "🇬🇹", flagColors: ["#4997D0","#FFFFFF","#4997D0"], palette: ["#FF00FF","#00FFFF","#FFD700"] },
  5: { country: "Guatemala", flag: "🇬🇹", flagColors: ["#4997D0","#FFFFFF","#4997D0"], palette: ["#FF00FF","#00FFFF","#FFD700"] },
  6: { country: "El Salvador", flag: "🇸🇻", flagColors: ["#0F47AF","#FFFFFF","#0F47AF"], palette: ["#228B22","#FF6347","#1E90FF"] },
  7: { country: "El Salvador", flag: "🇸🇻", flagColors: ["#0F47AF","#FFFFFF","#0F47AF"], palette: ["#228B22","#FF6347","#1E90FF"] },
  // ── Honduras — Pet World 🇭🇳 ─────────────────────────────────────────────────
  8: { country: "Honduras", flag: "🇭🇳", flagColors: ["#0073CF","#FFFFFF","#0073CF"], palette: ["#228B22","#FF6347","#1E90FF"] },
  9: { country: "Honduras", flag: "🇭🇳", flagColors: ["#0073CF","#FFFFFF","#0073CF"], palette: ["#228B22","#FF6347","#1E90FF"] },
  10: { country: "Honduras", flag: "🇭🇳", flagColors: ["#0073CF","#FFFFFF","#0073CF"], palette: ["#228B22","#FF6347","#1E90FF"] },
  // ── Nicaragua — Travel World 🇳🇮 blue/white/blue ─────────────────────────────
  11: { country: "Nicaragua", flag: "🇳🇮", flagColors: ["#3D6CC0","#FFFFFF","#3D6CC0"], palette: ["#FF4500","#00CED1","#FF8C00"] },
  12: { country: "Nicaragua", flag: "🇳🇮", flagColors: ["#3D6CC0","#FFFFFF","#3D6CC0"], palette: ["#FF4500","#00CED1","#FF8C00"] },
  13: { country: "Nicaragua", flag: "🇳🇮", flagColors: ["#3D6CC0","#FFFFFF","#3D6CC0"], palette: ["#FF4500","#00CED1","#FF8C00"] },
  // ── Costa Rica — Numbers World 🇨🇷 blue/white/red/white/blue ──────────────────
  14: { country: "Costa Rica", flag: "🇨🇷", flagColors: ["#002B7F","#FFFFFF","#CE1126"], palette: ["#00FF7F","#32CD32","#008080"] },
  15: { country: "Costa Rica", flag: "🇨🇷", flagColors: ["#002B7F","#FFFFFF","#CE1126"], palette: ["#00FF7F","#32CD32","#008080"] },
  // ── Panama — Time World 🇵🇦 red/white/blue ────────────────────────────────────
  16: { country: "Panama", flag: "🇵🇦", flagColors: ["#CC0001","#FFFFFF","#003580"], palette: ["#FFD700","#DC143C","#1E90FF"] },
  17: { country: "Panama", flag: "🇵🇦", flagColors: ["#CC0001","#FFFFFF","#003580"], palette: ["#FFD700","#DC143C","#1E90FF"] },
  // ── Puerto Rico / DR — Feelings Color World 🇵🇷🇩🇴 ──────────────────────────────
  18: { country: "Puerto Rico", flag: "🇵🇷", flagColors: ["#EF3340","#FFFFFF","#0A3161"], palette: ["#CC0000","#1E90FF","#FFD700"] },
  19: { country: "Puerto Rico", flag: "🇵🇷", flagColors: ["#EF3340","#FFFFFF","#0A3161"], palette: ["#CC0000","#1E90FF","#FFD700"] },
  20: { country: "Dominican Republic", flag: "🇩🇴", flagColors: ["#002D62","#FFFFFF","#CF142B"], palette: ["#1E90FF","#CC0000","#FFD700"] },
  // ── Cuba — Food World 🇨🇺 ─────────────────────────────────────────────────────
  21: { country: "Cuba", flag: "🇨🇺", flagColors: ["#002A8F","#FFFFFF","#CF142B"], palette: ["#FFD700","#CC0000","#1E90FF"] },
  22: { country: "Cuba", flag: "🇨🇺", flagColors: ["#002A8F","#FFFFFF","#CF142B"], palette: ["#FFD700","#CC0000","#1E90FF"] },
  23: { country: "Cuba", flag: "🇨🇺", flagColors: ["#002A8F","#FFFFFF","#CF142B"], palette: ["#FFD700","#CC0000","#1E90FF"] },
  // ── Colombia — AR World 🇨🇴 yellow/blue/red ──────────────────────────────────
  24: { country: "Colombia", flag: "🇨🇴", flagColors: ["#FCD116","#003087","#CE1126"], palette: ["#1E90FF","#FFD700","#CC0000"] },
  25: { country: "Colombia", flag: "🇨🇴", flagColors: ["#FCD116","#003087","#CE1126"], palette: ["#1E90FF","#FFD700","#CC0000"] },
  26: { country: "Colombia", flag: "🇨🇴", flagColors: ["#FCD116","#003087","#CE1126"], palette: ["#1E90FF","#FFD700","#CC0000"] },
  27: { country: "Colombia", flag: "🇨🇴", flagColors: ["#FCD116","#003087","#CE1126"], palette: ["#1E90FF","#FFD700","#CC0000"] },
  // ── Venezuela — ER World 🇻🇪 yellow/blue/red ─────────────────────────────────
  28: { country: "Venezuela", flag: "🇻🇪", flagColors: ["#CF142B","#00247D","#FCD116"], palette: ["#DAA520","#228B22","#CC0000"] },
  29: { country: "Venezuela", flag: "🇻🇪", flagColors: ["#CF142B","#00247D","#FCD116"], palette: ["#DAA520","#228B22","#CC0000"] },
  30: { country: "Venezuela", flag: "🇻🇪", flagColors: ["#CF142B","#00247D","#FCD116"], palette: ["#DAA520","#228B22","#CC0000"] },
  // ── Ecuador — IR World 🇪🇨 yellow/blue/red ───────────────────────────────────
  31: { country: "Ecuador", flag: "🇪🇨", flagColors: ["#FFD100","#003DA5","#FF0000"], palette: ["#000080","#DC143C","#FFD700"] },
  32: { country: "Ecuador", flag: "🇪🇨", flagColors: ["#FFD100","#003DA5","#FF0000"], palette: ["#000080","#DC143C","#FFD700"] },
  33: { country: "Ecuador", flag: "🇪🇨", flagColors: ["#FFD100","#003DA5","#FF0000"], palette: ["#000080","#DC143C","#FFD700"] },
  // ── Peru — Quick Past World 🇵🇪 red/white/red ────────────────────────────────
  34: { country: "Peru", flag: "🇵🇪", flagColors: ["#D91023","#FFFFFF","#D91023"], palette: ["#FF1493","#CC0000","#FFD700"] },
  35: { country: "Peru", flag: "🇵🇪", flagColors: ["#D91023","#FFFFFF","#D91023"], palette: ["#FF1493","#CC0000","#FFD700"] },
  36: { country: "Peru", flag: "🇵🇪", flagColors: ["#D91023","#FFFFFF","#D91023"], palette: ["#FF1493","#CC0000","#FFD700"] },
  37: { country: "Peru", flag: "🇵🇪", flagColors: ["#D91023","#FFFFFF","#D91023"], palette: ["#FF1493","#CC0000","#FFD700"] },
  // ── Bolivia — Long Past World 🇧🇴 red/yellow/green ───────────────────────────
  38: { country: "Bolivia", flag: "🇧🇴", flagColors: ["#D52B1E","#F9E300","#007A33"], palette: ["#FF4500","#00CC00","#8B4513"] },
  39: { country: "Bolivia", flag: "🇧🇴", flagColors: ["#D52B1E","#F9E300","#007A33"], palette: ["#FF4500","#00CC00","#8B4513"] },
  40: { country: "Bolivia", flag: "🇧🇴", flagColors: ["#D52B1E","#F9E300","#007A33"], palette: ["#FF4500","#00CC00","#8B4513"] },
  // ── Paraguay — Future World 🇵🇾 red/white/blue ───────────────────────────────
  41: { country: "Paraguay", flag: "🇵🇾", flagColors: ["#D52B1E","#FFFFFF","#0038A8"], palette: ["#FFFFFF","#CC0000","#1E90FF"] },
  42: { country: "Paraguay", flag: "🇵🇾", flagColors: ["#D52B1E","#FFFFFF","#0038A8"], palette: ["#FFFFFF","#CC0000","#1E90FF"] },
  // ── Uruguay — Conditional World 🇺🇾 white/blue stripes ───────────────────────
  43: { country: "Uruguay", flag: "🇺🇾", flagColors: ["#FFFFFF","#0038A8","#FFFFFF"], palette: ["#20B2AA","#FF8C00","#FFD700"] },
  44: { country: "Uruguay", flag: "🇺🇾", flagColors: ["#FFFFFF","#0038A8","#FFFFFF"], palette: ["#20B2AA","#FF8C00","#FFD700"] },
  // ── Chile — Pronoun World 🇨🇱 red/white/blue ─────────────────────────────────
  45: { country: "Chile", flag: "🇨🇱", flagColors: ["#D52B1E","#FFFFFF","#0039A6"], palette: ["#1E90FF","#DC143C","#FFFFFF"] },
  46: { country: "Chile", flag: "🇨🇱", flagColors: ["#D52B1E","#FFFFFF","#0039A6"], palette: ["#1E90FF","#DC143C","#FFFFFF"] },
  // ── Argentina — Advanced World 🇦🇷 light blue/white ──────────────────────────
  47: { country: "Argentina", flag: "🇦🇷", flagColors: ["#74ACDF","#FFFFFF","#74ACDF"], palette: ["#74ACDF","#FFFFFF","#FFD700"] },
  48: { country: "Argentina", flag: "🇦🇷", flagColors: ["#74ACDF","#FFFFFF","#74ACDF"], palette: ["#74ACDF","#FFFFFF","#FFD700"] },
  49: { country: "Argentina", flag: "🇦🇷", flagColors: ["#74ACDF","#FFFFFF","#74ACDF"], palette: ["#74ACDF","#FFFFFF","#FFD700"] },
  50: { country: "Argentina", flag: "🇦🇷", flagColors: ["#74ACDF","#FFFFFF","#74ACDF"], palette: ["#74ACDF","#FFFFFF","#FFD700"] },
}

const FALLBACK: CountryData = { country: "Latin America", flag: "🌎", flagColors: ["#FF0000","#FFFFFF","#228B22"], palette: ["#FF00FF","#00FFFF","#FFD700"] }

function getCountry(n: number): CountryData { return SONG_COUNTRY[n] ?? FALLBACK }


// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface SingModeViewProps {
  song: { id: string; title: string; number: number; youtubeId?: string; sectionTitle?: string }
  lyricLines: { id: number; words: { id: number; text: string; timestamp: number; duration: number }[] }[]
  audioUrl?: string
  onBack: () => void
  onNext?: () => void
  onPrev?: () => void
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
// ── Format seconds as m:ss ──
function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export default function SingModeView({
  song, lyricLines, audioUrl,
  onBack, onNext, onPrev,
}: SingModeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const [bgImageLoaded, setBgImageLoaded] = useState(false)
  const [activeLyricId, setActiveLyricId] = useState<number>(-1)
  const [activeWordId, setActiveWordId] = useState<number>(-1)
  const [elapsedSecs, setElapsedSecs] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)  // direct audio playback — same as DDR game
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Total song duration derived from the last lyric word's end time
  const totalDuration = useMemo(() => {
    let max = 0
    for (const line of lyricLines) {
      for (const w of line.words) {
        max = Math.max(max, w.timestamp + w.duration)
      }
    }
    return max
  }, [lyricLines])

  const country = getCountry(song.number)
  const { palette, flag, flagColors, country: countryName } = country

  // ── Load song background image on song change ──
  useEffect(() => {
    setBgImageLoaded(false)
    bgImageRef.current = null
    const img = new Image()
    img.onload = () => { bgImageRef.current = img; setBgImageLoaded(true) }
    img.src = `/images/backgrounds/song-${song.number}.jpg`
    return () => { bgImageRef.current = null }
  }, [song.number])

  // ── Load and play audio directly from audioUrl — identical to DDR game ──
  // Timestamps in the JSON were generated from this exact WAV file, so currentTime
  // matches the lyrics perfectly with zero offset calculation needed.
  useEffect(() => {
    setElapsedSecs(0)
    setActiveWordId(-1)
    setActiveLyricId(-1)
    if (!audioUrl) { audioRef.current = null; return }
    const audio = new Audio(audioUrl)
    audio.preload = "auto"
    audioRef.current = audio
    // Auto-advance to next song when audio ends
    audio.addEventListener("ended", () => { if (onNext) setTimeout(onNext, 800) })
    // Try to play immediately, then retry on canplay in case buffering is needed
    audio.play().catch(() => {
      // Browser may have blocked autoplay — retry when buffered
      audio.addEventListener("canplay", () => { audio.play().catch(() => {}) }, { once: true })
    })
    return () => {
      audio.pause()
      audio.src = ""
      audioRef.current = null
    }
  }, [audioUrl, song.number, onNext])

  // ── Word-level + Line-level karaoke sync — reads audio.currentTime directly (same as DDR game) ──
  useEffect(() => {
    if (lyricLines.length === 0) { setActiveWordId(-1); setActiveLyricId(-1); return }
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    wordTimerRef.current = setInterval(() => {
      const elapsed = audioRef.current?.currentTime ?? 0
      setElapsedSecs(elapsed)
      let foundWord = -1
      let foundLine = -1
      for (const line of lyricLines) {
        const firstWord = line.words[0]
        const lastWord = line.words[line.words.length - 1]
        // Line is active if we're between its first word start and last word end (+ small buffer)
        if (firstWord && lastWord &&
            elapsed >= firstWord.timestamp &&
            elapsed < lastWord.timestamp + lastWord.duration + 0.3) {
          foundLine = line.id
        }
        for (const word of line.words) {
          if (elapsed >= word.timestamp && elapsed < word.timestamp + word.duration) {
            foundWord = word.id
          }
        }
      }
      setActiveWordId(foundWord)
      setActiveLyricId(foundLine)
    }, 40) // 40ms — same as DDR game
    return () => { if (wordTimerRef.current) clearInterval(wordTimerRef.current) }
  }, [lyricLines, song.number])

  // ── Canvas draw loop ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener("resize", resize)

    let lastBeat = 0
    let beatFlash = 0

    const draw = () => {
      animRef.current = requestAnimationFrame(draw)
      const W = canvas.width, H = canvas.height
      // Simple time-based beat flash for visual interest (no mic needed)
      const now = Date.now()
      const beat = Math.sin(now / 500) // ~120bpm pulse
      if (beat > 0.95 && now - lastBeat > 400) {
        lastBeat = now; beatFlash = 0.5
      }
      beatFlash = Math.max(0, beatFlash - 0.04)

      // ── 1. Draw song background image (cover-fit) ──
      const img = bgImageRef.current
      const hasImage = bgImageLoaded && img

      if (hasImage) {
        const zoom = 1 + beatFlash * 0.03
        const iw = img!.naturalWidth, ih = img!.naturalHeight
        const scale = Math.max(W / iw, H / ih)
        const dw = iw * scale * zoom, dh = ih * scale * zoom
        ctx.drawImage(img!, (W - dw) / 2, (H - dh) / 2, dw, dh)

        // Light overlay for text legibility
        ctx.fillStyle = "rgba(0,0,0,0.18)"
        ctx.fillRect(0, 0, W, H)

        // Beat flash in flag primary color
        if (beatFlash > 0) {
          ctx.fillStyle = `${flagColors[0]}${Math.floor(beatFlash * 30).toString(16).padStart(2,'0')}`
          ctx.fillRect(0, 0, W, H)
        }

        ctx.shadowBlur = 0; ctx.globalAlpha = 1
      } else {
        // No image yet — solid dark background in palette color
        ctx.fillStyle = `${palette[2]}33`
        ctx.fillRect(0, 0, W, H)
      }

      // ── Bottom gradient for lyric readability ──
      const grad = ctx.createLinearGradient(0, H * 0.55, 0, H)
      grad.addColorStop(0, "rgba(0,0,0,0)")
      grad.addColorStop(1, "rgba(0,0,0,0.65)")
      ctx.fillStyle = grad
      ctx.fillRect(0, H * 0.55, W, H * 0.45)
    }
    draw()
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [palette, bgImageLoaded, song.number])

  // ── Seek: click anywhere on progress bar to jump to that position ──
  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || totalDuration <= 0 || !progressBarRef.current) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = fraction * totalDuration
    setElapsedSecs(fraction * totalDuration)
  }

  // ── Toggle play/pause ──
  function togglePause() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => {})
      setIsPlaying(true)
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  // ── Spacebar to pause/play ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault()
        togglePause()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  // Active lyric line only
  const activeLine = lyricLines.find(l => l.id === activeLyricId)

  // Helper: render a line word-by-word with karaoke highlighting
  function renderLine(
    line: { id: number; words: { id: number; text: string; timestamp: number; duration: number }[] },
    isActive: boolean
  ) {
    return (
      <span className="inline-flex flex-wrap justify-center gap-x-1.5 gap-y-0.5">
        {line.words.map((w, i) => {
          const isLit = isActive && w.id === activeWordId
          const isPast = isActive && activeWordId > w.id
          return (
            <span
              key={w.id}
              style={{
                color: isLit ? "#60a5fa" : isPast ? "rgba(255,255,255,0.55)" : "#fff",
                textShadow: isLit
                  ? "0 0 12px #3b82f6, 0 0 28px #60a5fa, 0 0 50px #3b82f6"
                  : "none",
                fontWeight: isLit ? 900 : isActive ? 700 : 500,
                transform: isLit ? "scale(1.15)" : "scale(1)",
                display: "inline-block",
                transition: "color 0.08s, transform 0.08s",
              }}
            >
              {w.text}
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ touchAction: "none" }} onClick={togglePause}>
      {/* Full-screen canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />

      {/* Audio is played directly from the WAV audioUrl — same as DDR game, perfect timestamp sync */}

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-safe pt-4 pb-2"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }}
        onClick={e => e.stopPropagation()}>
        <button
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-black/40 text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{song.title}</p>
          <p className="text-white/60 text-xs truncate">{song.sectionTitle}</p>
        </div>
        {/* Country badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-bold"
          style={{ background: `${palette[0]}55`, border: `1px solid ${palette[0]}` }}>
          <span className="text-base">{flag}</span>
          <span>{countryName}</span>
        </div>
      </div>

      {/* ── Spacer pushes lyrics + controls to bottom ── */}
      <div className="flex-1" />

      {/* ── Lyrics near bottom ── */}
      <div className="relative z-10 px-3 pb-2 flex flex-col items-center gap-1">
        {/* Active line: Spanish (karaoke) + matching English translation directly below */}
        {activeLine && (
          <div className="flex flex-col items-center gap-0.5 w-full max-w-sm px-3 py-2 rounded-2xl"
            style={{ background: "rgba(0,0,0,0.38)", backdropFilter: "blur(6px)" }}>
            <p className="text-center text-lg sm:text-xl leading-snug font-bold w-full" style={{ letterSpacing: "0.01em" }}>
              {renderLine(activeLine, true)}
            </p>
            {LYRIC_TRANSLATIONS[song.number]?.[activeLine.id] && (
              <p className="text-center text-sm sm:text-base leading-snug font-semibold w-full" style={{ color: "rgba(255,240,140,0.95)", letterSpacing: "0.01em" }}>
                {LYRIC_TRANSLATIONS[song.number][activeLine.id]}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div className="relative z-10 px-4 pb-safe pb-6 pt-2"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)" }}
        onClick={e => e.stopPropagation()}>

        {/* Progress bar — click to seek */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-white/60 text-xs tabular-nums w-8 text-right">{formatTime(elapsedSecs)}</span>
          {/* Outer wrapper: larger invisible hit area for easier tapping */}
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="flex-1 cursor-pointer flex items-center"
            style={{ padding: "8px 0", margin: "-8px 0" }}
          >
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: totalDuration > 0 ? `${Math.min(100, (elapsedSecs / totalDuration) * 100)}%` : "0%",
                  background: flagColors[1] === "#FFFFFF"
                    // Flag has white middle — use hard stops so white stripe is visible
                    ? `linear-gradient(90deg, ${flagColors[0]} 0%, ${flagColors[0]} 33%, ${flagColors[1]} 33%, ${flagColors[1]} 66%, ${flagColors[2]} 66%, ${flagColors[2]} 100%)`
                    : `linear-gradient(90deg, ${flagColors[0]} 0%, ${flagColors[1]} 50%, ${flagColors[2]} 100%)`,
                  transition: "width 0.1s linear",
                }}
              />
            </div>
          </div>
          <span className="text-white/60 text-xs tabular-nums w-8">{formatTime(totalDuration)}</span>
        </div>

        {/* Skip prev / play-pause / skip next row */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!onPrev}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white disabled:opacity-30"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          {/* Play / Pause button */}
          <button
            onClick={togglePause}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 text-white"
          >
            {isPlaying
              ? <Pause className="h-6 w-6" />
              : <Play className="h-6 w-6 translate-x-0.5" />
            }
          </button>

          <button
            onClick={onNext}
            disabled={!onNext}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white disabled:opacity-30"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
