"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Mic, MicOff } from "lucide-react"

// ── Latin-themed Pexels search queries (fetched via our proxy or direct) ──
// These are fetched from Pexels at runtime using the API key below.
// Free Pexels API key — replace if needed.
const PEXELS_API_KEY = "QRejvnDTjk8yS9g9TWg3PNP3xQVpHJMuWimILfdpOUVYqnFygj58czF1"

const LATIN_QUERIES = [
  "latin dance salsa",
  "carnival colorful festival",
  "flamenco dance performance",
  "tropical beach colorful",
  "latin music celebration",
]

// ── Neon 80s + Hockney + Latin vibrancy palette ──
const PALETTE = [
  "#FF00FF", "#00FFFF", "#FF006E", "#FFFF00",
  "#FF4500", "#00FF41", "#FF69B4", "#FCD34D",
  "#E879F9", "#0EA5E9", "#FFFFFF", "#FB923C",
]

function pickColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)]
}

// ── Helpers ──
function neonRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, lw: number, glow: number
) {
  ctx.shadowColor = color; ctx.shadowBlur = glow
  ctx.strokeStyle = color; ctx.lineWidth = lw
  ctx.strokeRect(x, y, w, h)
  ctx.shadowBlur = 0
}

function fillPoly(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, sides: number, size: number, rot: number, color: string
) {
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i <= sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2
    i === 0
      ? ctx.moveTo(cx + Math.cos(a) * size, cy + Math.sin(a) * size)
      : ctx.lineTo(cx + Math.cos(a) * size, cy + Math.sin(a) * size)
  }
  ctx.fill()
}

function neonLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, lw: number, glow: number
) {
  ctx.shadowColor = color; ctx.shadowBlur = glow
  ctx.strokeStyle = color; ctx.lineWidth = lw
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  ctx.shadowBlur = 0
}

interface Shape {
  type: "circle" | "triangle" | "diamond" | "star" | "ring"
  x: number; y: number; size: number; color: string
  life: number; decay: number; vx: number; vy: number
  rot: number; rotSpeed: number
}

const SCENES = ["tunnel", "grid80s", "kaleidoscope", "strobe", "trianglefield"] as const
type SceneName = typeof SCENES[number]

interface VisualizerViewProps {
  onBack: () => void
}

export default function VisualizerView({ onBack }: VisualizerViewProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const videoARef    = useRef<HTMLVideoElement>(null)
  const videoBRef    = useRef<HTMLVideoElement>(null)
  const animRef      = useRef<number>(0)
  const timerRef     = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef  = useRef<AudioContext | null>(null)
  const analyserRef  = useRef<AnalyserNode | null>(null)
  const streamRef    = useRef<MediaStream | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [statusMsg, setStatusMsg]     = useState("Loading Latin vibes...")
  const [clipUrls, setClipUrls]       = useState<string[]>([])
  const [clipLoaded, setClipLoaded]   = useState(false)
  const [elapsed, setElapsed]         = useState(0)

  // Mutable refs for draw loop (avoids stale closures)
  const sceneRef       = useRef<number>(0)
  const currentClipRef = useRef<number>(0)
  const activeVideoRef = useRef<"a" | "b">("a")
  const prevEnergyRef  = useRef<number>(0)
  const beatCoolRef    = useRef<number>(0)
  const shapesRef      = useRef<Shape[]>([])
  const frameRef       = useRef<number>(0)

  // ── Fetch Pexels clips ──
  const loadClips = useCallback(async () => {
    setStatusMsg("Loading Latin vibes...")
    try {
      const query = LATIN_QUERIES[Math.floor(Math.random() * LATIN_QUERIES.length)]
      const resp = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=6&min_duration=8&max_duration=60`,
        { headers: { Authorization: PEXELS_API_KEY } }
      )
      const data = await resp.json()
      const urls: string[] = []
      for (const v of data.videos || []) {
        const mp4 = v.video_files?.find(
          (f: { file_type: string; height: number }) => f.file_type === "video/mp4" && f.height <= 720
        )
        if (mp4?.link) urls.push(mp4.link)
      }
      if (urls.length === 0) throw new Error("No clips found")
      setClipUrls(urls)

      // Pre-load first two
      if (videoARef.current) videoARef.current.src = urls[0]
      if (videoBRef.current) videoARef.current && (videoBRef.current.src = urls[1] || urls[0])

      await Promise.all([
        new Promise<void>(r => {
          if (!videoARef.current) return r()
          videoARef.current.oncanplay = () => r()
          videoARef.current.load()
          setTimeout(r, 6000)
        }),
        new Promise<void>(r => {
          if (!videoBRef.current) return r()
          videoBRef.current.oncanplay = () => r()
          videoBRef.current.load()
          setTimeout(r, 6000)
        }),
      ])

      setClipLoaded(true)
      setStatusMsg("Tap the mic and play!")
    } catch {
      setStatusMsg("Tap mic to start (no clips loaded)")
      setClipLoaded(true)
    }
  }, [])

  useEffect(() => { loadClips() }, [loadClips])

  // ── Switch video clip ──
  const switchClip = useCallback((urls: string[]) => {
    if (urls.length === 0) return
    currentClipRef.current = (currentClipRef.current + 1) % urls.length

    if (activeVideoRef.current === "a") {
      if (videoBRef.current) {
        videoBRef.current.src = urls[currentClipRef.current]
        videoBRef.current.style.opacity = "1"
        videoBRef.current.play().catch(() => {})
      }
      if (videoARef.current) videoARef.current.style.opacity = "0"
      activeVideoRef.current = "b"
    } else {
      if (videoARef.current) {
        videoARef.current.src = urls[currentClipRef.current]
        videoARef.current.style.opacity = "1"
        videoARef.current.play().catch(() => {})
      }
      if (videoBRef.current) videoBRef.current.style.opacity = "0"
      activeVideoRef.current = "a"
    }
  }, [])

  // ── Drawing helpers ──
  function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, rot: number) {
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 15
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = rot + (i / 10) * Math.PI * 2
      const r = i % 2 === 0 ? size : size * 0.4
      i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
               : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0
  }

  function spawnShape(W: number, H: number, energy: number) {
    const types: Shape["type"][] = ["circle", "triangle", "diamond", "star", "ring"]
    shapesRef.current.push({
      type: types[Math.floor(Math.random() * types.length)],
      x: Math.random() * W, y: Math.random() * H,
      size: 15 + Math.random() * (energy / 255) * 90,
      color: pickColor(),
      life: 1.0, decay: 0.005 + Math.random() * 0.012,
      vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
      rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.08,
    })
    if (shapesRef.current.length > 100) shapesRef.current.shift()
  }

  // ── Scene drawers ──
  function drawTunnel(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, freqData: Uint8Array) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H)
    const cx = W / 2, cy = H / 2, layers = 18, speed = t * 60
    for (let i = layers; i >= 1; i--) {
      const progress = ((i / layers) + (speed % 100) / 100) % 1
      const size = progress * Math.min(W, H) * 0.85
      const freq = freqData[Math.floor((i / layers) * freqData.length)] || 0
      const hue = (t * 40 + i * 25) % 360
      neonRect(ctx, cx - size / 2 - (freq/255)*15, cy - size / 2 - (freq/255)*15,
        size + (freq/255)*30, size + (freq/255)*30, `hsl(${hue},100%,60%)`, 1.5 + (freq/255)*2, 10)
    }
    const vanishY = H * 0.5
    for (let i = -8; i <= 8; i++) {
      const hue = (t * 60 + i * 30) % 360
      neonLine(ctx, cx + i * 70, H, cx, vanishY, `hsl(${hue},100%,60%)`, 1, 6)
    }
    for (let i = 0; i < 10; i++) {
      const prog = ((i / 10) + (speed % 100) / 100) % 1
      const y = vanishY + prog * (H - vanishY)
      const freq = freqData[Math.floor((i / 10) * freqData.length)] || 0
      const hue = (t * 60 + i * 20) % 360
      neonLine(ctx, 0, y, W, y, `hsl(${hue},100%,60%)`, 1 + (freq/255)*2, 6)
    }
  }

  function drawGrid80s(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, energy: number, freqData: Uint8Array) {
    ctx.fillStyle = "#0D0021"; ctx.fillRect(0, 0, W, H)
    const gsz = 70
    for (let x = -(gsz - (t * 25) % gsz); x < W + gsz; x += gsz) {
      const freq = freqData[Math.floor(Math.abs(x / W) * freqData.length)] || 0
      neonLine(ctx, x, 0, x, H, `hsl(${(t*50+x*0.3)%360},100%,55%)`, 0.8+(freq/255)*1.5, 8)
    }
    for (let y = -(gsz - (t * 15) % gsz); y < H + gsz; y += gsz) {
      const freq = freqData[Math.floor(Math.abs(y / H) * freqData.length)] || 0
      neonLine(ctx, 0, y, W, y, `hsl(${(t*50+y*0.3+120)%360},100%,55%)`, 0.8+(freq/255)*1.5, 8)
    }
    const sunY = H * 0.52, sunR = 90 + (energy / 255) * 40
    for (let s = 0; s < 8; s++) {
      const sy = sunY + s * sunR * 0.13
      if (sy > sunY + sunR) break
      const hw = Math.sqrt(Math.max(0, sunR * sunR - (sy - sunY) ** 2))
      ctx.fillStyle = s % 2 === 0 ? "#FF00FF" : "#000"
      ctx.fillRect(W / 2 - hw, sy, hw * 2, sunR * 0.13)
    }
    ctx.shadowColor = "#FF00FF"; ctx.shadowBlur = 30
    ctx.strokeStyle = "#FF00FF"; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(W / 2, sunY, sunR, Math.PI, 0); ctx.stroke()
    ctx.shadowBlur = 0
    ctx.fillStyle = "#1A0036"; ctx.beginPath(); ctx.moveTo(0, sunY + 10)
    const peaks = [0.1, 0.22, 0.35, 0.5, 0.65, 0.78, 0.9, 1.0]
    const heights = [0.18, 0.28, 0.22, 0.35, 0.25, 0.3, 0.2, 0.18]
    peaks.forEach((px, i) => ctx.lineTo(W * px, sunY - H * heights[i] * (0.8 + energy / 255 * 0.4)))
    ctx.lineTo(W, sunY + 10); ctx.closePath(); ctx.fill()
    ctx.shadowColor = "#00FFFF"; ctx.shadowBlur = 12
    ctx.strokeStyle = "#00FFFF"; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(0, sunY + 10)
    peaks.forEach((px, i) => ctx.lineTo(W * px, sunY - H * heights[i] * (0.8 + energy / 255 * 0.4)))
    ctx.stroke(); ctx.shadowBlur = 0
  }

  function drawKaleidoscope(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, freqData: Uint8Array) {
    ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(0, 0, W, H)
    const cx = W / 2, cy = H / 2, segments = 12
    for (let seg = 0; seg < segments; seg++) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(seg * (Math.PI * 2 / segments) + t * 0.4)
      for (let s = 0; s < 6; s++) {
        const freq = freqData[Math.floor((s / 6) * freqData.length)] || 0
        const dist = (s + 1) * (Math.min(W, H) * 0.08) + (freq / 255) * 20
        const sz = 10 + (freq / 255) * 30
        const hue = (t * 80 + seg * 30 + s * 60) % 360
        ctx.shadowColor = `hsl(${hue},100%,65%)`; ctx.shadowBlur = 10
        fillPoly(ctx, dist, 0, 3 + (s % 4), sz, t * (s % 2 === 0 ? 1 : -1), `hsl(${hue},100%,55%)`)
        ctx.shadowBlur = 0
      }
      ctx.restore()
    }
  }

  function drawStrobe(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, freqData: Uint8Array) {
    const bands = 8, bw = W / bands
    for (let i = 0; i < bands; i++) {
      const freq = freqData[Math.floor((i / bands) * freqData.length)] || 0
      ctx.fillStyle = `hsl(${(t*60+i*45)%360},100%,${30+(freq/255)*50}%)`
      ctx.fillRect(i * bw, 0, bw, H)
    }
    for (let i = 0; i < 6; i++) {
      const freq = freqData[Math.floor((i / 6) * freqData.length)] || 0
      const x = (i + 0.5) * (W / 6)
      const y = H / 2 + Math.sin(t * 2 + i) * H * 0.25
      const sz = 30 + (freq / 255) * 80
      const hue = (t * 40 + i * 60) % 360
      ctx.shadowColor = `hsl(${hue},100%,70%)`; ctx.shadowBlur = 25
      fillPoly(ctx, x, y, 3 + (i % 4), sz, t + i, `hsl(${hue},100%,60%)`)
      ctx.shadowBlur = 0
    }
  }

  function drawTriangleField(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, freqData: Uint8Array) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H)
    const sz = 55, cols = Math.ceil(W / sz) + 2, rows = Math.ceil(H / (sz * 0.866)) + 2
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols * 2; col++) {
        const isUp = col % 2 === 0
        const tileW = sz, tileH = sz * 0.866
        const cx = Math.floor(col / 2) * tileW + (isUp ? 0 : tileW / 2) - tileW
        const cy = row * tileH - tileH
        const freq = freqData[Math.floor(((row * cols * 2 + col) / (rows * cols * 2)) * freqData.length)] || 0
        const hue = (t * 50 + row * 25 + col * 15 + (freq / 255) * 60) % 360
        ctx.fillStyle = `hsl(${hue},100%,${20+(freq/255)*60}%)`
        ctx.beginPath()
        if (isUp) { ctx.moveTo(cx+tileW/2,cy); ctx.lineTo(cx+tileW,cy+tileH); ctx.lineTo(cx,cy+tileH) }
        else { ctx.moveTo(cx,cy); ctx.lineTo(cx+tileW,cy); ctx.lineTo(cx+tileW/2,cy+tileH) }
        ctx.closePath(); ctx.fill()
        if (freq > 80) {
          ctx.shadowColor = `hsl(${hue},100%,80%)`; ctx.shadowBlur = 5
          ctx.strokeStyle = `hsl(${hue},100%,80%)`; ctx.lineWidth = 0.8; ctx.stroke()
          ctx.shadowBlur = 0
        }
      }
    }
  }

  // ── Main draw loop ──
  const drawLoop = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    frameRef.current++
    const W = canvas.width, H = canvas.height
    const freqData = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(freqData)

    const energy     = freqData.reduce((a, b) => a + b, 0) / freqData.length
    const treble     = freqData.slice(-8).reduce((a, b) => a + b, 0) / 8

    // Beat detection
    if (beatCoolRef.current > 0) {
      beatCoolRef.current--
    } else if (prevEnergyRef.current > 10 && energy > prevEnergyRef.current * 1.4) {
      // Beat!
      sceneRef.current = (sceneRef.current + 1) % SCENES.length
      switchClip(clipUrls)
      for (let i = 0; i < 10; i++) spawnShape(W, H, energy)
      beatCoolRef.current = 12
    }
    prevEnergyRef.current = energy * 0.75 + prevEnergyRef.current * 0.25

    const t = Date.now() / 1000
    const sc: SceneName = SCENES[sceneRef.current % SCENES.length]

    if      (sc === "tunnel")        drawTunnel(ctx, W, H, t, freqData)
    else if (sc === "grid80s")       drawGrid80s(ctx, W, H, t, energy, freqData)
    else if (sc === "kaleidoscope")  drawKaleidoscope(ctx, W, H, t, freqData)
    else if (sc === "strobe")        drawStrobe(ctx, W, H, t, freqData)
    else                             drawTriangleField(ctx, W, H, t, freqData)

    // Floating shapes
    if (frameRef.current % 5 === 0 && treble > 25) spawnShape(W, H, treble)
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const s = shapesRef.current[i]
      s.x += s.vx; s.y += s.vy; s.rot += s.rotSpeed; s.life -= s.decay
      if (s.life <= 0) { shapesRef.current.splice(i, 1); continue }
      ctx.globalAlpha = Math.min(1, s.life)
      ctx.shadowColor = s.color; ctx.shadowBlur = 20
      if (s.type === "circle") {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI*2)
        ctx.fillStyle = s.color; ctx.fill()
      } else if (s.type === "ring") {
        ctx.strokeStyle = s.color; ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI*2); ctx.stroke()
      } else if (s.type === "star") {
        drawStar(ctx, s.x, s.y, s.size, s.color, s.rot)
      } else {
        fillPoly(ctx, s.x, s.y, s.type === "triangle" ? 3 : 4, s.size, s.rot, s.color)
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1
    }

    // VHS scanlines
    ctx.fillStyle = "rgba(0,0,0,0.06)"
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1)

    animRef.current = requestAnimationFrame(drawLoop)
  }, [clipUrls, switchClip])

  // ── Start mic ──
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      const ac = new AudioContext()
      audioCtxRef.current = ac
      const src = ac.createMediaStreamSource(stream)
      const an = ac.createAnalyser()
      an.fftSize = 128
      src.connect(an)
      analyserRef.current = an

      // Size canvas
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width  = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }

      // Start background video
      if (videoARef.current && clipUrls.length > 0) {
        videoARef.current.style.opacity = "1"
        videoARef.current.play().catch(() => {})
      }

      setIsRecording(true)
      setElapsed(0)
      setStatusMsg("Playing! Make some noise! 🎵")
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)

      animRef.current = requestAnimationFrame(drawLoop)
    } catch {
      setStatusMsg("Mic access needed — please allow it!")
    }
  }, [clipUrls, drawLoop])

  // ── Stop mic ──
  const stopMic = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()
    audioCtxRef.current = null; analyserRef.current = null
    if (videoARef.current) { videoARef.current.pause(); videoARef.current.style.opacity = "0" }
    if (videoBRef.current) { videoBRef.current.pause(); videoBRef.current.style.opacity = "0" }
    setIsRecording(false)
    setStatusMsg("Tap the mic and play!")
  }, [])

  // Cleanup on unmount
  useEffect(() => () => {
    cancelAnimationFrame(animRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()
  }, [])

  return (
    <div className="relative w-full flex-1 bg-black overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
      {/* Background videos */}
      <video
        ref={videoARef}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: 0 }}
        muted playsInline loop
      />
      <video
        ref={videoBRef}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: 0 }}
        muted playsInline loop
      />

      {/* Canvas — trippy visuals on top */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="text-white bg-black/40 hover:bg-black/60 rounded-full"
          onClick={() => { stopMic(); onBack() }}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-white font-bold text-lg drop-shadow-lg">
          ✨ Hablabeat Visualizer
        </div>
        {isRecording && (
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-xs font-mono">{elapsed}s</span>
          </div>
        )}
        {!isRecording && <div className="w-10" />}
      </div>

      {/* Center status / mic button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10">
        {!isRecording && (
          <p className="text-white text-center text-sm px-8 drop-shadow-lg bg-black/40 py-2 px-4 rounded-xl">
            {statusMsg}
          </p>
        )}
        <Button
          onClick={isRecording ? stopMic : startMic}
          disabled={!clipLoaded}
          className={`rounded-full w-20 h-20 text-white shadow-2xl transition-all ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 scale-110"
              : "bg-gradient-to-br from-pink-500 via-purple-600 to-cyan-500 hover:scale-105"
          }`}
        >
          {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>
        {!clipLoaded && (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </div>
  )
}
