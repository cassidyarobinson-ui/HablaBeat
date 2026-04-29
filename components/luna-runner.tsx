"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getCountryTheme } from "@/lib/runner-themes"

type Lane = "low" | "high"
type Kind = "spanish" | "coin" | "treat" | "carrot"
type Item = {
  id: number
  x: number       // viewport % from left
  lane: Lane
  kind: Kind
  label: string   // Spanish word for "spanish" items, emoji otherwise
  pairIdx: number // PAIRS index for "spanish" items, otherwise -1
  alive: boolean
}

// Geometry constants (px). Origin: y=0 at ground.
const BUNNY_W = 88
const BUNNY_H = 88
const BUNNY_LEFT_VW = 18
const LOW_LANE_Y  = 28           // item center, px above ground
const HIGH_LANE_Y = 240          // item center, px above ground
const LANE_HIT_R  = 80           // vertical collision tolerance (px)
const COLLIDE_PCT = 9            // horizontal collision tolerance (vw %)

// Physics — each tap snaps the bunny to the NEXT tier height. Successive
// taps reach higher tiers, so triple-tap is the highest hop.
const GRAVITY  = 2000           // px/s²
const TIERS    = [0, 130, 260, 390] // px above ground: ground / 1× / 2× / 3×
const MAX_JUMPS = 3

const GAME_MS     = 32000
const ITEM_GAP_MS = 1100
const SCROLL_PX_PER_S = 320      // for cosmetic decor only; items use vw/s below
const ITEM_DRIFT_VW_BASE = 28    // baseline speed
const ITEM_DRIFT_VW_MIN  = 22    // floor (after taking hits)
const ITEM_DRIFT_VW_MAX  = 38    // ceiling (still readable)
const SPEED_UP_PER_HIT   = 0.7   // +vw/s per correct match
const SLOW_DOWN_PER_MISS = 2.0   // −vw/s per mistake

const MAX_HITS = 6               // total wrong items the bunny can take

export default function LunaRunner({
  country,
  onComplete,
  onClose,
}: {
  country: string
  onComplete: (result: { won: boolean; score: number; mistakes: number }) => void
  onClose: () => void
}) {
  const theme = useMemo(() => getCountryTheme(country), [country])
  const PAIRS = theme.vocab
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [coins, setCoins] = useState(0)
  const [treats, setTreats] = useState(0)
  const [items, setItems] = useState<Item[]>([])
  const [bunnyY, setBunnyY] = useState(0)        // px above ground
  const [phase, setPhase] = useState<"play" | "won" | "lost">("play")
  const [targetIdx, setTargetIdx] = useState(() => Math.floor(Math.random() * PAIRS.length))
  const targetIdxRef = useRef(targetIdx)
  useEffect(() => { targetIdxRef.current = targetIdx }, [targetIdx])
  const advanceTarget = useCallback(() => {
    setTargetIdx(prev => {
      let next = prev
      while (next === prev && PAIRS.length > 1) next = Math.floor(Math.random() * PAIRS.length)
      return next
    })
  }, [PAIRS.length])
  const startedRef       = useRef(0)
  const lastTickRef      = useRef(0)
  const lastSpawnRef     = useRef(0)
  const itemIdRef        = useRef(0)
  const carrotSpawnedRef = useRef(false)
  const containerRef     = useRef<HTMLDivElement | null>(null)
  const bunnyYRef        = useRef(0)
  const bunnyVyRef       = useRef(0)
  const jumpsUsedRef     = useRef(0)
  const speedRef         = useRef(ITEM_DRIFT_VW_BASE)

  const jump = useCallback(() => {
    if (phase !== "play") return
    if (jumpsUsedRef.current >= MAX_JUMPS) return
    jumpsUsedRef.current += 1
    // Snap upward velocity so the bunny just reaches the next tier height
    // from wherever it is right now. v = sqrt(2g·Δh).
    const target = TIERS[jumpsUsedRef.current]
    const dh = Math.max(0, target - bunnyYRef.current)
    bunnyVyRef.current = Math.sqrt(2 * GRAVITY * dh)
  }, [phase])

  // Game loop
  useEffect(() => {
    if (phase !== "play") return
    let raf = 0
    let alive = true
    const tick = (now: number) => {
      if (!alive) return
      if (!startedRef.current) { startedRef.current = now; lastTickRef.current = now }
      const dt = Math.min(0.05, (now - lastTickRef.current) / 1000)
      lastTickRef.current = now
      const elapsed = now - startedRef.current

      // Bunny physics — semi-implicit Euler
      bunnyVyRef.current -= GRAVITY * dt
      let newY = bunnyYRef.current + bunnyVyRef.current * dt
      if (newY <= 0) {
        newY = 0
        bunnyVyRef.current = 0
        jumpsUsedRef.current = 0
      }
      bunnyYRef.current = newY
      setBunnyY(newY)

      // Spawn vocab + bonus collectibles. Most spawns are Spanish words;
      // occasional gold coins and small carrots reward the player for
      // grabbing them, on top of the matching score.
      if (!carrotSpawnedRef.current && elapsed - lastSpawnRef.current > ITEM_GAP_MS) {
        lastSpawnRef.current = elapsed
        const r = Math.random()
        const lane: Lane = Math.random() < 0.55 ? "low" : "high"
        if (r < 0.18) {
          // gold coin
          setItems(prev => [...prev, {
            id: itemIdRef.current++, x: 110, lane,
            kind: "coin", label: "🪙", pairIdx: -1, alive: true,
          }])
        } else if (r < 0.30) {
          // bonus carrot treat
          setItems(prev => [...prev, {
            id: itemIdRef.current++, x: 110, lane,
            kind: "treat", label: "🥕", pairIdx: -1, alive: true,
          }])
        } else {
          const t = targetIdxRef.current
          const useTarget = Math.random() < 0.5
          let pickIdx = t
          if (!useTarget) {
            do { pickIdx = Math.floor(Math.random() * PAIRS.length) } while (pickIdx === t && PAIRS.length > 1)
          }
          setItems(prev => [...prev, {
            id: itemIdRef.current++, x: 110, lane,
            kind: "spanish", label: PAIRS[pickIdx].es, pairIdx: pickIdx, alive: true,
          }])
        }
      }

      // Carrot spawn near end of run
      if (!carrotSpawnedRef.current && elapsed > GAME_MS - 4000) {
        carrotSpawnedRef.current = true
        setItems(prev => [...prev, {
          id: itemIdRef.current++, x: 110, lane: "low",
          kind: "carrot", label: "🥕", pairIdx: -1, alive: true,
        }])
      }

      // Move items leftward + collide
      setItems(prev => {
        const dxVw = speedRef.current * dt
        let scoreDelta = 0
        let mistakeDelta = 0
        let coinDelta = 0
        let treatDelta = 0
        let hitCarrot = false
        let advance = false
        const t = targetIdxRef.current
        const next: Item[] = []
        for (const it of prev) {
          if (!it.alive) continue
          const x = it.x - dxVw
          if (x < -25) continue
          const dxOK = Math.abs(x - BUNNY_LEFT_VW) < COLLIDE_PCT
          const itemY = it.lane === "low" ? LOW_LANE_Y : HIGH_LANE_Y
          const bunnyCenterY = bunnyYRef.current + BUNNY_H / 2
          const dyOK = Math.abs(bunnyCenterY - itemY) < LANE_HIT_R
          if (dxOK && dyOK) {
            if (it.kind === "carrot") hitCarrot = true
            else if (it.kind === "coin")  coinDelta++
            else if (it.kind === "treat") treatDelta++
            else if (it.kind === "spanish") {
              if (it.pairIdx === t) { scoreDelta++; advance = true }
              else mistakeDelta++
            }
            continue
          }
          next.push({ ...it, x })
        }
        if (scoreDelta)   setScore(s => s + scoreDelta)
        if (mistakeDelta) setMistakes(m => {
          const m2 = m + mistakeDelta
          if (m2 >= MAX_HITS) setPhase("lost")
          return m2
        })
        if (coinDelta)    setCoins(c => c + coinDelta)
        if (treatDelta)   setTreats(t => t + treatDelta)
        // Adjust speed: matches accelerate, mistakes decelerate
        if (scoreDelta || mistakeDelta) {
          const next = speedRef.current
            + scoreDelta * SPEED_UP_PER_HIT
            - mistakeDelta * SLOW_DOWN_PER_MISS
          speedRef.current = Math.max(ITEM_DRIFT_VW_MIN, Math.min(ITEM_DRIFT_VW_MAX, next))
        }
        if (advance) advanceTarget()
        if (hitCarrot) setPhase("won")
        return next
      })

      if (carrotSpawnedRef.current && elapsed > GAME_MS + 5000) {
        setPhase("lost")
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { alive = false; cancelAnimationFrame(raf) }
  }, [phase, advanceTarget])

  // Notify parent on game end
  useEffect(() => {
    if (phase === "won" || phase === "lost") {
      const t = window.setTimeout(() => onComplete({ won: phase === "won", score, mistakes }), 1400)
      return () => window.clearTimeout(t)
    }
  }, [phase, score, mistakes, onComplete])

  // Spacebar / arrow up to jump, Esc to quit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " " || e.code === "ArrowUp") {
        e.preventDefault(); jump()
      } else if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [jump, onClose])

  // Bunny tilt during physics: leans forward going up, back when falling
  const bunnyTilt = Math.max(-22, Math.min(22, -bunnyVyRef.current * 0.04))

  return (
    <div
      ref={containerRef}
      onClick={jump}
      className="fixed inset-0 z-[200] overflow-hidden select-none cursor-pointer"
      style={{
        background: `linear-gradient(180deg,${theme.sky[0]} 0%,${theme.sky[1]} 45%,${theme.sky[2]} 70%,${theme.sky[3]} 100%)`,
      }}
    >
      <style jsx>{`
        @keyframes mxBunnyIdle {
          0%, 100% { transform: rotate(-2deg) translateY(0); }
          50%      { transform: rotate(2deg)  translateY(-3px); }
        }
        @keyframes mxItemMove { from { transform: translateX(0); } to { transform: translateX(-100vw); } }
        @keyframes mxPop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Far mountains parallax */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: "32%", height: "32%",
          background: `linear-gradient(180deg,${theme.mountain[0]} 0%,${theme.mountain[1]} 100%)`,
          clipPath: "polygon(0 60%, 8% 30%, 16% 55%, 24% 20%, 34% 50%, 44% 25%, 54% 55%, 66% 18%, 76% 50%, 86% 28%, 100% 50%, 100% 100%, 0 100%)",
          opacity: 0.55,
        }}
      />

      {/* Sun */}
      <div
        className="absolute"
        style={{
          top: "8%", right: "12%", width: 90, height: 90, borderRadius: "50%",
          background: "radial-gradient(circle,#FFF3B0 0%,#FFCB52 65%,#FF7E1F 100%)",
          boxShadow: "0 0 60px rgba(255,159,28,0.55)",
        }}
      />

      {/* Papel picado bunting along the top */}
      <div className="absolute left-0 right-0 flex justify-around" style={{ top: "3%", padding: "0 4%" }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{
            width: 22, height: 26,
            background: ["#FF1493","#FFD700","#00CED1","#FF6347","#9370DB","#32CD32"][i % 6],
            clipPath: "polygon(0 0, 100% 0, 80% 100%, 50% 80%, 20% 100%)",
            transform: `translateY(${(i % 2) * 4}px)`,
            opacity: 0.9,
          }} />
        ))}
      </div>

      {/* HUD — score / coins / treats */}
      <div
        className="absolute top-3 left-3 px-3 py-1.5 rounded-full font-black text-white"
        style={{ background: "rgba(15,23,42,0.6)", fontSize: 14, letterSpacing: 0.5 }}
      >
        ⭐ {score} · 🪙 {coins} · 🥕 {treats}
      </div>

      {/* Health bar — 6 hits total. Color steps every 2 mistakes:
          green → light green → yellow → red. */}
      {(() => {
        const remaining = Math.max(0, MAX_HITS - mistakes)
        const pct = (remaining / MAX_HITS) * 100
        const color =
          mistakes <= 0 ? "#16a34a" :        // 6/6 left  — green
          mistakes <= 2 ? "#84cc16" :        // 5–4 left  — light green
          mistakes <= 4 ? "#facc15" :        // 3–2 left  — yellow
                          "#ef4444"          // 1–0 left  — red
        return (
          <div className="absolute top-3 right-3 flex items-center gap-2" style={{ width: 140 }}>
            <span className="text-[11px] font-black text-white" style={{
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              letterSpacing: 0.6,
            }}>♥</span>
            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{
              background: "rgba(15,23,42,0.55)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.35)",
            }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: color,
                  transition: "width 240ms ease, background 240ms ease",
                  boxShadow: `0 0 8px ${color}88`,
                }}
              />
            </div>
          </div>
        )
      })()}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-12 right-3 w-8 h-8 rounded-full font-black text-white"
        style={{ background: "rgba(15,23,42,0.6)", fontSize: 14 }}
        aria-label="Close"
      >✕</button>

      {/* Target prompt — English word the bunny must match */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-white font-black"
        style={{
          top: 56,
          background: "rgba(15,23,42,0.78)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: 0.6, opacity: 0.7 }}>CATCH</span>
        <span style={{ fontSize: 18, color: theme.bannerHighlight }}>{PAIRS[targetIdx].en}</span>
      </div>

      {/* Ground */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: `calc(85% + 5px)`, bottom: 0,
          background:
            `repeating-linear-gradient(90deg, ${theme.ground.stripeA} 0 30px, ${theme.ground.stripeB} 30px 60px), linear-gradient(180deg,${theme.ground.stripeA},${theme.ground.base})`,
          backgroundBlendMode: "multiply",
          borderTop: `3px solid ${theme.ground.topBorder}`,
        }}
      />

      {/* Bunny — y is measured from ground, top combines % ground line + px upward offset */}
      <div
        className="absolute"
        style={{
          left: `${BUNNY_LEFT_VW}vw`,
          top: `calc(85% - ${bunnyY}px)`,
          transform: `translate(-50%, -100%) rotate(${bunnyTilt}deg)`,
          width: BUNNY_W, height: BUNNY_H,
          willChange: "top, transform",
        }}
      >
        <div
          style={{
            width: "100%", height: "100%",
            animation: bunnyY < 4 ? "mxBunnyIdle 0.5s ease-in-out infinite" : undefined,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/me-bunny.svg"
            alt="Luna"
            className="w-full h-full object-contain"
            style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.35))" }}
          />
        </div>
      </div>

      {/* Items — Spanish vocab pills, gold coins, bonus carrots, finish carrot */}
      {items.map(it => {
        const itemY = it.lane === "low" ? LOW_LANE_Y : HIGH_LANE_Y
        const baseStyle: React.CSSProperties = {
          left: `${it.x}vw`,
          top: `calc(85% - ${itemY}px)`,
          transform: "translate(-50%, -50%)",
          willChange: "left",
        }
        if (it.kind === "carrot") {
          return (
            <div key={it.id} className="absolute" style={baseStyle}>
              <div
                style={{
                  fontSize: 110, lineHeight: 1,
                  filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.4))",
                  animation: "mxPop 380ms ease both",
                }}
              >🥕</div>
            </div>
          )
        }
        if (it.kind === "coin") {
          return (
            <div key={it.id} className="absolute" style={baseStyle}>
              <div
                className="rounded-full flex items-center justify-center font-black"
                style={{
                  width: 36, height: 36,
                  background: "radial-gradient(circle at 35% 35%,#FEF3C7 0%,#FBBF24 55%,#B45309 100%)",
                  border: "2px solid #92400E",
                  boxShadow: "0 3px 8px rgba(120,53,15,0.45), inset 0 -2px 3px rgba(120,53,15,0.45)",
                  color: "#92400E",
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ¢
              </div>
            </div>
          )
        }
        if (it.kind === "treat") {
          return (
            <div key={it.id} className="absolute" style={baseStyle}>
              <div
                style={{
                  fontSize: 36, lineHeight: 1,
                  filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.28))",
                }}
              >🥕</div>
            </div>
          )
        }
        // spanish vocab pill
        return (
          <div key={it.id} className="absolute" style={baseStyle}>
            <div
              className="px-3 py-1.5 rounded-full font-black text-white"
              style={{
                background: theme.itemColor,
                border: "3px solid rgba(255,255,255,0.92)",
                boxShadow: "0 4px 10px rgba(0,0,0,0.28)",
                fontSize: 14,
                letterSpacing: 0.4,
                whiteSpace: "nowrap",
                textShadow: "1px 1px 0 rgba(0,0,0,0.35)",
              }}
            >
              {it.label}
            </div>
          </div>
        )
      })}

      {/* Foreground decor — sliding past so the scene feels alive */}
      {[15, 38, 62, 85].map((leftPct, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${leftPct}%`,
            top: `calc(85% - 4px)`,
            transform: "translate(-50%, -100%)",
            fontSize: 36,
            opacity: 0.9,
            animation: `mxItemMove ${10 - (i % 2)}s linear infinite`,
            animationDelay: `${i * -2.4}s`,
          }}
        >
          {theme.decor[i % theme.decor.length]}
        </div>
      ))}

      {/* End screens */}
      {phase !== "play" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        >
          <div className="bg-white rounded-3xl p-6 mx-6 text-center" style={{ maxWidth: 360 }}>
            <div className="text-5xl mb-2">{phase === "won" ? "🏆" : "💔"}</div>
            <div className="text-2xl font-black mb-1">{phase === "won" ? "¡Bravo, Luna!" : "Almost!"}</div>
            <div className="text-sm font-bold text-slate-600 mb-3">
              {phase === "won"
                ? `You collected ${score} word${score === 1 ? "" : "s"}.`
                : theme.loseHint}
            </div>
            <div className="text-xs text-slate-500">Returning to dashboard…</div>
          </div>
        </div>
      )}

      {/* Start hint */}
      <div
        className="absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full font-black text-white"
        style={{
          bottom: "8%",
          background: "rgba(15,23,42,0.55)",
          fontSize: 12, letterSpacing: 0.5,
          opacity: items.length > 2 ? 0 : 1,
          transition: "opacity 300ms ease",
          pointerEvents: "none",
        }}
      >
        TAP TO HOP AND COLLECT VOCAB
      </div>
    </div>
  )
}
