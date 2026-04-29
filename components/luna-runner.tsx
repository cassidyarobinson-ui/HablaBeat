"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getCountryTheme } from "@/lib/runner-themes"

type Lane = "low" | "high"
type Kind = "spanish" | "coin" | "treat" | "carrot" | "box" | "boxSpent"
type PowerUp = "fire" | "wings" | "bubble"
const POWER_UP_MS = 8000  // power-ups last 8 seconds (bubble pops on first save)
type Item = {
  id: number
  x: number       // viewport % from left
  lane: Lane
  kind: Kind
  label: string   // Spanish word for "spanish" items, emoji otherwise
  pairIdx: number // PAIRS index for "spanish" items, otherwise -1
  alive: boolean
  poppedAt?: number // ms timestamp when a box was bumped (for pop animation)
}

// Geometry constants (px). Origin: y=0 at ground.
const BUNNY_W = 88
const BUNNY_H = 88
const BUNNY_LEFT_VW = 18
const LOW_LANE_Y  = 28           // item center, px above ground
const HIGH_LANE_Y = 240          // item center, px above ground
const LANE_HIT_R  = 80           // vertical collision tolerance (px)
const COLLIDE_PCT = 9            // horizontal collision tolerance (vw %)

// Physics — each tap applies a fresh upward impulse. Rapid taps stack
// height (single ≈ 150px, double ≈ 300px, triple ≈ 450px), but the user
// can keep tapping mid-air or after starting to fall to gain more height.
const GRAVITY      = 2000        // px/s²
const JUMP_IMPULSE = 770         // px/s — initial upward velocity per tap

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
  const [powerUp, setPowerUp] = useState<PowerUp | null>(null)
  const powerUpUntilRef = useRef(0)
  const powerUpRef = useRef<PowerUp | null>(null)
  useEffect(() => { powerUpRef.current = powerUp }, [powerUp])
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
    // No cap — every tap gives an upward impulse, even while airborne.
    // Wings boost the impulse so the bunny flies higher.
    const impulse = powerUpRef.current === "wings" ? JUMP_IMPULSE * 1.4 : JUMP_IMPULSE
    bunnyVyRef.current = impulse
    jumpsUsedRef.current += 1
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

      // Power-up expiration (fire / wings auto-expire; bubble drops on save)
      if (powerUpUntilRef.current && now > powerUpUntilRef.current) {
        powerUpUntilRef.current = 0
        setPowerUp(null)
      }

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
      // occasional gold coins, small carrots, and bumpable ?-boxes
      // reward the player on top of the matching score.
      if (!carrotSpawnedRef.current && elapsed - lastSpawnRef.current > ITEM_GAP_MS) {
        lastSpawnRef.current = elapsed
        const r = Math.random()
        const lane: Lane = Math.random() < 0.55 ? "low" : "high"
        if (r < 0.10) {
          // ?-box: always at high lane, must bump from below moving up
          setItems(prev => [...prev, {
            id: itemIdRef.current++, x: 110, lane: "high",
            kind: "box", label: "?", pairIdx: -1, alive: true,
          }])
        } else if (r < 0.22) {
          // gold coin
          setItems(prev => [...prev, {
            id: itemIdRef.current++, x: 110, lane,
            kind: "coin", label: "🪙", pairIdx: -1, alive: true,
          }])
        } else if (r < 0.32) {
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
        const movingUp = bunnyVyRef.current > 0
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
            if (it.kind === "carrot") { hitCarrot = true; continue }
            if (it.kind === "coin")  { coinDelta++;  continue }
            if (it.kind === "treat") { treatDelta++; continue }
            if (it.kind === "spanish") {
              if (it.pairIdx === t) { scoreDelta++; advance = true }
              else {
                // Fire and bubble both shield from a wrong-word penalty.
                // Bubble is single-use (pops); fire holds for the rest of
                // its duration.
                const pu = powerUpRef.current
                if (pu === "fire") {
                  // burns through the wrong word; no penalty
                } else if (pu === "bubble") {
                  setPowerUp(null)
                  powerUpUntilRef.current = 0
                } else {
                  mistakeDelta++
                }
              }
              continue
            }
            if (it.kind === "box") {
              // Only triggers when bunny is bumping it from below (moving up).
              if (movingUp) {
                // Surprise power-up: fire | wings | bubble. The visible
                // box has only "?" so the player doesn't know which.
                const choices: PowerUp[] = ["fire", "wings", "bubble"]
                const pick = choices[Math.floor(Math.random() * choices.length)]
                setPowerUp(pick)
                powerUpUntilRef.current = now + POWER_UP_MS
                next.push({ ...it, x, kind: "boxSpent", poppedAt: now })
              } else {
                next.push({ ...it, x })
              }
              continue
            }
            // boxSpent and any other inert kinds — keep traveling
            next.push({ ...it, x })
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

      {/* Optional landmark video bg — looping muted scenery behind gameplay */}
      {theme.videoBg && (
        <>
          <video
            src={theme.videoBg}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover", pointerEvents: "none" }}
          />
          {/* Soft dim so the bunny + vocab pills stay readable on bright footage */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(180deg,rgba(0,0,0,0.18) 0%,rgba(0,0,0,0.05) 35%,rgba(0,0,0,0.05) 65%,rgba(0,0,0,0.32) 100%)",
            pointerEvents: "none",
          }} />
        </>
      )}

      {/* Far mountains parallax — only shown when no landmark video set */}
      {!theme.videoBg && (
        <div
          className="absolute left-0 right-0"
          style={{
            top: "32%", height: "32%",
            background: `linear-gradient(180deg,${theme.mountain[0]} 0%,${theme.mountain[1]} 100%)`,
            clipPath: "polygon(0 60%, 8% 30%, 16% 55%, 24% 20%, 34% 50%, 44% 25%, 54% 55%, 66% 18%, 76% 50%, 86% 28%, 100% 50%, 100% 100%, 0 100%)",
            opacity: 0.55,
          }}
        />
      )}

      {/* Sun */}
      <div
        className="absolute"
        style={{
          top: "8%", right: "12%", width: 90, height: 90, borderRadius: "50%",
          background: "radial-gradient(circle,#FFF3B0 0%,#FFCB52 65%,#FF7E1F 100%)",
          boxShadow: "0 0 60px rgba(255,159,28,0.55)",
        }}
      />

      {/* Health bar — full-width across the very top, segments every two
          mistakes shift the color: green → light green → yellow → red. */}
      {(() => {
        const remaining = Math.max(0, MAX_HITS - mistakes)
        const pct = (remaining / MAX_HITS) * 100
        const color =
          mistakes <= 0 ? "#16a34a" :
          mistakes <= 2 ? "#84cc16" :
          mistakes <= 4 ? "#facc15" :
                          "#ef4444"
        return (
          <div className="absolute left-0 right-0 top-0 px-3 pt-2 pointer-events-none">
            <div className="h-3 rounded-full overflow-hidden w-full" style={{
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

      {/* Collected stats — full-width row directly below the health bar */}
      <div
        className="absolute left-0 right-0 px-3 flex items-center justify-between text-white font-black"
        style={{
          top: 22,
          fontSize: 13,
          letterSpacing: 0.5,
          textShadow: "0 1px 3px rgba(0,0,0,0.55)",
          pointerEvents: "none",
        }}
      >
        <span className="flex items-center gap-1"><span>⭐</span><span>{score}</span></span>
        <span className="flex items-center gap-1"><span>🪙</span><span>{coins}</span></span>
        <span className="flex items-center gap-1"><span>🥕</span><span>{treats}</span></span>
      </div>

      {/* Back — top left, below the new HUD rows */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-12 left-3 w-9 h-9 rounded-full flex items-center justify-center text-white"
        style={{ background: "rgba(15,23,42,0.6)" }}
        aria-label="Back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Target prompt — pinned to the bottom so it doesn't compete with
          the top HUD rows. Shows the English word the bunny must catch. */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-white font-black"
        style={{
          bottom: "calc(15% + 18px)",
          background: "rgba(15,23,42,0.82)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.32)",
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
            position: "relative",
          }}
        >
          {/* Bubble shield — translucent ring around the bunny */}
          {powerUp === "bubble" && (
            <div style={{
              position: "absolute",
              inset: -10,
              borderRadius: "50%",
              background: "radial-gradient(circle,rgba(125,211,252,0.25) 50%,rgba(56,189,248,0.55) 100%)",
              border: "2px solid rgba(125,211,252,0.85)",
              boxShadow: "0 0 18px rgba(56,189,248,0.55), inset 0 0 18px rgba(255,255,255,0.6)",
              animation: "mxBunnyIdle 1.2s ease-in-out infinite",
              pointerEvents: "none",
            }} />
          )}
          {/* Fire trail — flickering flames behind the bunny */}
          {powerUp === "fire" && (
            <div style={{
              position: "absolute",
              left: -18, bottom: 4, fontSize: 28, lineHeight: 1,
              filter: "drop-shadow(0 0 8px rgba(251,146,60,0.85))",
              animation: "mxBunnyIdle 0.18s ease-in-out infinite",
              pointerEvents: "none",
            }}>🔥</div>
          )}
          {/* Wings — flap on either side of the bunny */}
          {powerUp === "wings" && (
            <>
              <div style={{
                position: "absolute", left: -22, top: 14, fontSize: 30,
                transform: "scaleX(-1)",
                animation: "mxBunnyIdle 0.22s ease-in-out infinite",
                filter: "drop-shadow(0 0 6px rgba(255,255,255,0.7))",
                pointerEvents: "none",
              }}>🪽</div>
              <div style={{
                position: "absolute", right: -22, top: 14, fontSize: 30,
                animation: "mxBunnyIdle 0.22s ease-in-out infinite",
                filter: "drop-shadow(0 0 6px rgba(255,255,255,0.7))",
                pointerEvents: "none",
              }}>🪽</div>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/me-bunny.svg"
            alt="Luna"
            className="w-full h-full object-contain"
            style={{
              filter: powerUp === "fire"
                ? "drop-shadow(0 4px 8px rgba(0,0,0,0.35)) drop-shadow(0 0 12px rgba(251,146,60,0.9))"
                : "drop-shadow(0 4px 8px rgba(0,0,0,0.35))",
              position: "relative",
            }}
          />
        </div>
      </div>

      {/* Power-up badge in HUD when active */}
      {powerUp && (
        <div
          className="absolute left-1/2 -translate-x-1/2 px-3 py-1 rounded-full font-black text-white"
          style={{
            top: 100,
            background: powerUp === "fire"   ? "rgba(234,88,12,0.92)"
                       : powerUp === "wings" ? "rgba(168,85,247,0.92)"
                       :                       "rgba(56,189,248,0.92)",
            fontSize: 12, letterSpacing: 0.6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.22)",
          }}
        >
          {powerUp === "fire" ? "🔥 FIRE" : powerUp === "wings" ? "🪽 WINGS" : "🫧 BUBBLE"}
        </div>
      )}

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
        if (it.kind === "box" || it.kind === "boxSpent") {
          const live = it.kind === "box"
          const recentlyPopped = !!it.poppedAt && (Date.now() - it.poppedAt) < 320
          return (
            <div key={it.id} className="absolute" style={baseStyle}>
              <div
                style={{
                  width: 46, height: 46,
                  borderRadius: 8,
                  background: live
                    ? "linear-gradient(180deg,#FCD34D 0%,#F59E0B 60%,#B45309 100%)"
                    : "linear-gradient(180deg,#7C5C2C 0%,#5C3F1A 100%)",
                  border: `3px solid ${live ? "#92400E" : "#3F1F08"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: live ? "#7C2D12" : "#1C0B02",
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 900,
                  fontSize: 26, lineHeight: 1,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.3), inset 0 -3px 0 rgba(0,0,0,0.18)",
                  textShadow: live ? "0 1px 0 rgba(255,255,255,0.4)" : "none",
                  transform: recentlyPopped ? "translateY(-6px) scale(1.06)" : "translateY(0) scale(1)",
                  transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                {live ? "?" : ""}
              </div>
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
