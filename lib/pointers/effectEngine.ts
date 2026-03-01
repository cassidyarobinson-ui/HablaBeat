// ─────────────────────────────────────────────────────────────────────────────
// lib/pointers/effectEngine.ts
// Renders DOM-based hit effects for each pointer type.
// All effects are self-cleaning (remove themselves after animation completes).
// ─────────────────────────────────────────────────────────────────────────────

import type { VisualEffect, PointerConfig } from "./types"

export interface EffectContext {
  container: HTMLElement
  lane: number            // 0-3
  laneLeft: number        // % from left edge
  laneWidth: number       // % width
  rainbowColor: string    // current rainbow cycle color
  isJustPerfect: boolean  // was this a perfect hit?
}

type EffectFn = (ctx: EffectContext, palette: string[]) => void

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function el(
  tag: string,
  cssText: string,
  extraClasses = "absolute pointer-events-none"
): HTMLElement {
  const e = document.createElement(tag)
  e.className = extraClasses
  e.style.cssText = cssText
  return e
}

function spawn(
  container: HTMLElement,
  elem: HTMLElement,
  lifetimeMs: number
): void {
  container.appendChild(elem)
  setTimeout(() => elem.remove(), lifetimeMs)
}

/** Spawn an emoji particle that floats in a direction using emojiFloat keyframe */
function spawnEmoji(
  container: HTMLElement,
  emoji: string,
  cx: number,          // % from left
  bottomPct: number,   // % from bottom
  tx: number,          // px x translation
  ty: number,          // px y translation (negative = up)
  fontSize = 18,
  duration = 500,
  zIndex = 95
): void {
  // Add ±6px random jitter to size so each emoji looks unique, clamped 8–42px
  const jitteredSize = Math.min(42, Math.max(8, fontSize + (Math.random() - 0.5) * 14))
  const e = document.createElement("div")
  e.className = "absolute pointer-events-none"
  e.style.cssText = `
    left: calc(${cx}% - ${jitteredSize / 2}px);
    bottom: ${bottomPct}%;
    font-size: ${jitteredSize}px;
    line-height: 1;
    --tx: ${tx}px;
    --ty: ${ty}px;
    animation: emojiFloat ${duration}ms ease-out forwards;
    z-index: ${zIndex};
  `
  e.textContent = emoji
  container.appendChild(e)
  setTimeout(() => e.remove(), duration + 20)
}

// ─────────────────────────────────────────────────────────────────────────────
// EFFECT IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** 🥕  Carrot: bubble pop + carrot emojis fly on hit */
const sparkle_burst: EffectFn = (ctx, palette) => {
  const { container, laneLeft, laneWidth, rainbowColor } = ctx
  const cx = laneLeft + laneWidth / 2

  // Bubble ring
  const ring = el("div", `
    left: ${laneLeft + 2}%; width: ${laneWidth - 4}%; bottom: 12%; aspect-ratio: 1;
    border-radius: 50%;
    border: 3px solid ${rainbowColor};
    box-shadow: 0 0 12px ${rainbowColor};
    animation: bubblePop 0.45s ease-out forwards; z-index: 90;
  `, "absolute pointer-events-none rounded-full")
  spawn(container, ring, 450)

  // 6 small sparks radiating out
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const dist = 22 + Math.random() * 18
    const tx = Math.cos(angle) * dist
    const ty = Math.sin(angle) * dist - 8
    const c = palette[i % palette.length]
    const s = el("div", `
      left: calc(${cx}% - 3px); bottom: 16%;
      width: 6px; height: 6px;
      background: ${c};
      border-radius: 50%;
      filter: drop-shadow(0 0 3px ${c});
      --tx: ${tx}px; --ty: ${ty}px; --rot: 0deg;
      animation: wandSparkFly 0.3s cubic-bezier(0.22,1,0.36,1) forwards;
      z-index: 91;
    `)
    spawn(container, s, 320)
  }

  // 4 carrot emojis floating upward — varied sizes
  const carrotEmojis = ["🥕", "🥕", "🥕", "🌿"]
  const carrotSizes = [12, 20, 28, 16]
  for (let i = 0; i < 4; i++) {
    const tx = (Math.random() - 0.5) * 44
    const ty = -(32 + Math.random() * 36)
    spawnEmoji(container, carrotEmojis[i], cx, 18, tx, ty, carrotSizes[i], 480 + i * 40)
  }
}

/** 🔴  Red Laser: tight sharp vertical beam + impact ring */
const laser_beam_up: EffectFn = (ctx, _palette) => {
  const { container, laneLeft, laneWidth } = ctx
  const cx = laneLeft + laneWidth / 2

  // Thin, sharp red beam (narrower than before = 1% wide)
  const beam = el("div", `
    left: ${cx - 0.5}%; bottom: 16%; width: 1%; height: 78%;
    background: linear-gradient(0deg, #ef4444 0%, #fca5a5 25%, #fff 50%, #fca5a5 75%, transparent 100%);
    box-shadow: 0 0 6px #ef4444, 0 0 16px #ef4444, 0 0 2px #fff;
    border-radius: 1px;
    animation: laserBeamUp 0.28s ease-out forwards; z-index: 96;
  `)
  spawn(container, beam, 300)

  // Wider soft glow behind beam
  const glow = el("div", `
    left: ${cx - 1.5}%; bottom: 16%; width: 3%; height: 75%;
    background: linear-gradient(0deg, #ef444488 0%, #fca5a544 40%, transparent 100%);
    border-radius: 2px;
    animation: laserBeamUp 0.32s ease-out forwards; z-index: 95;
  `)
  spawn(container, glow, 340)

  const ring = el("div", `
    left: ${cx - 3}%; bottom: 14%; width: 6%; aspect-ratio: 1;
    border: 3px solid #ef4444;
    box-shadow: 0 0 12px #ef4444;
    animation: laserImpact 0.28s ease-out forwards; z-index: 97;
  `, "absolute pointer-events-none rounded-full")
  spawn(container, ring, 300)

  const flash = el("div", `
    left: ${cx - 2}%; bottom: 14%; width: 4%; aspect-ratio: 1;
    background: radial-gradient(circle, #fff 20%, #fca5a5 50%, #ef4444 80%, transparent 100%);
    box-shadow: 0 0 20px #ef4444;
    animation: laserFlash 0.18s ease-out forwards; z-index: 98;
  `, "absolute pointer-events-none rounded-full")
  spawn(container, flash, 200)

  for (let i = 0; i < 5; i++) {
    const side = i % 2 === 0 ? 1 : -1
    const sp = el("div", `
      left: ${cx}%; bottom: 16%;
      width: 2px; height: ${8 + Math.random() * 8}px;
      background: linear-gradient(to top, #ef4444, #fca5a5);
      box-shadow: 0 0 5px #ef4444;
      border-radius: 1px;
      opacity: 1;
      transition: all 0.28s ease-out;
    `)
    spawn(container, sp, 320)
    setTimeout(() => {
      sp.style.transform = `translate(${side * (12 + Math.random() * 18)}px, -${18 + Math.random() * 24}px) rotate(${side * (25 + Math.random() * 25)}deg)`
      sp.style.opacity = "0"
    }, 16)
  }
}

/** 🍌  Banana Blaster: spinning banana projectile + banana emoji burst */
const banana_spin: EffectFn = (ctx, _palette) => {
  const { container, laneLeft, laneWidth } = ctx
  const cx = laneLeft + laneWidth / 2

  // Big spinning banana emoji flies up from hit zone
  const banana = el("div", `
    left: calc(${cx}% - 16px); bottom: 16%;
    font-size: 28px; line-height: 1;
    z-index: 96;
    animation: bananaSpin 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
  `)
  banana.textContent = "🍌"
  spawn(container, banana, 520)

  // Yellow burst ring
  const ring = el("div", `
    left: ${laneLeft + 1}%; width: ${laneWidth - 2}%; bottom: 12%; aspect-ratio: 1;
    border: 3px solid #fbbf24;
    box-shadow: 0 0 14px #f59e0b;
    animation: wandPulse 0.35s ease-out forwards; z-index: 94;
  `, "absolute pointer-events-none rounded-full")
  spawn(container, ring, 360)

  // Small yellow sparkles
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    const dist = 20 + Math.random() * 20
    const sp = el("div", `
      left: calc(${cx}% - 3px); bottom: 18%;
      width: 5px; height: 5px;
      background: #fde68a;
      border-radius: 50%;
      --tx: ${Math.cos(angle) * dist}px; --ty: ${Math.sin(angle) * dist}px; --rot: 0deg;
      animation: wandSparkFly 0.32s ease-out forwards; z-index: 95;
    `)
    spawn(container, sp, 340)
  }

  // Extra banana emojis flying out in different directions on hit — varied sizes
  const bananaSet = ["🍌", "🍌", "🍌", "✨"]
  const bananaSizes = [10, 24, 32, 16]
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    const dist = 24 + Math.random() * 20
    const tx = Math.cos(angle) * dist
    const ty = Math.sin(angle) * dist - 10
    spawnEmoji(container, bananaSet[i], cx, 18, tx, ty, bananaSizes[i], 460 + i * 40)
  }
}

/** 💧  Water Cannon: splash burst with droplets + water emoji particles */
const water_splash: EffectFn = (ctx, _palette) => {
  const { container, laneLeft, laneWidth } = ctx
  const cx = laneLeft + laneWidth / 2

  // Central splash ring
  const splash = el("div", `
    left: ${laneLeft + 1}%; width: ${laneWidth - 2}%; bottom: 11%; aspect-ratio: 1;
    border: 3px solid #38bdf8;
    box-shadow: 0 0 16px #0ea5e9, inset 0 0 8px rgba(56,189,248,0.3);
    animation: wandPulse 0.4s ease-out forwards; z-index: 94;
  `, "absolute pointer-events-none rounded-full")
  spawn(container, splash, 420)

  // Water droplet particles raining down from impact
  const drops = ["#38bdf8","#7dd3fc","#bae6fd","#e0f2fe"]
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const dist = 18 + Math.random() * 22
    const drop = el("div", `
      left: calc(${cx}% - 2px); bottom: 18%;
      width: 4px; height: ${6 + Math.random() * 6}px;
      background: ${drops[i % drops.length]};
      border-radius: 2px;
      --tx: ${Math.cos(angle) * dist}px; --ty: ${Math.sin(angle) * dist - 5}px; --rot: ${Math.random() * 90}deg;
      animation: wandSparkFly 0.38s ease-out forwards; z-index: 93;
    `)
    spawn(container, drop, 400)
  }

  // 3 water emoji particles floating up — varied sizes
  const waterEmojis = ["💧", "💦", "🌊"]
  const waterSizes = [14, 28, 22]
  for (let i = 0; i < 3; i++) {
    const tx = (Math.random() - 0.5) * 40
    const ty = -(30 + Math.random() * 30)
    spawnEmoji(container, waterEmojis[i], cx, 20, tx, ty, waterSizes[i], 460 + i * 50)
  }

  // Slow follow-up ring (the "ripple")
  setTimeout(() => {
    const ripple = el("div", `
      left: ${laneLeft}%; width: ${laneWidth}%; bottom: 10%; aspect-ratio: 1;
      border: 1.5px solid rgba(56,189,248,0.4);
      animation: wandPulse 0.5s ease-out forwards; z-index: 93;
    `, "absolute pointer-events-none rounded-full")
    spawn(container, ripple, 520)
  }, 120)
}

/** ⚡  Lightning: chain arc visual + zigzag bolt + yellow background flash */
const chain_arc: EffectFn = (ctx, _palette) => {
  const { container, laneLeft, laneWidth, isJustPerfect, rainbowColor } = ctx
  const cx = laneLeft + laneWidth / 2

  // Vertical lightning bolt
  const bolt = el("div", `
    left: ${cx - 3}%; bottom: 15%; width: 6%; height: 70%;
    background: linear-gradient(180deg, transparent 0%, ${rainbowColor} 30%, white 50%, ${rainbowColor} 70%, transparent 100%);
    clip-path: polygon(40% 0%, 70% 0%, 30% 45%, 60% 45%, 0% 100%, 30% 55%, 0% 55%);
    box-shadow: 0 0 20px ${rainbowColor}; filter: blur(0.5px);
    animation: lightningBolt 0.4s ease-out forwards; z-index: 92;
  `)
  spawn(container, bolt, 420)

  // Flash
  const flash = el("div", `
    left: ${cx - 2}%; bottom: 14%; width: 4%; aspect-ratio: 1;
    background: radial-gradient(circle, #fff 20%, #fef08a 50%, transparent 80%);
    animation: laserFlash 0.2s ease-out forwards; z-index: 97;
  `, "absolute pointer-events-none rounded-full")
  spawn(container, flash, 220)

  // Yellow background tint flash
  const prevBg = container.style.background
  container.style.background = `radial-gradient(circle at ${cx}% 80%, rgba(253,224,71,0.28) 0%, rgba(253,224,71,0.08) 60%, transparent 100%)`
  setTimeout(() => {
    container.style.background = prevBg
  }, 200)

  // 3 lightning emojis flying out — varied sizes
  const lightningSizes = [12, 30, 20]
  for (let i = 0; i < 3; i++) {
    const tx = (Math.random() - 0.5) * 38
    const ty = -(28 + Math.random() * 34)
    spawnEmoji(container, "⚡", cx, 20, tx, ty, lightningSizes[i], 440 + i * 40)
  }

  // If perfect hit: chain arc visual going to adjacent area
  if (isJustPerfect) {
    setTimeout(() => {
      const arc = el("div", `
        left: ${cx - 1}%; bottom: 30%; width: 2px; height: 40%;
        background: linear-gradient(to top, transparent, #fde047, white, transparent);
        box-shadow: 0 0 8px #fde047;
        opacity: 0.7;
        animation: lightningBolt 0.25s ease-out forwards; z-index: 91;
      `)
      spawn(container, arc, 280)
    }, 80)
  }
}

/** ❄️  Ice Blaster: freeze crystal + snowflake emoji shatter */
const freeze_shatter: EffectFn = (ctx, palette) => {
  const { container, laneLeft, laneWidth } = ctx
  const cx = laneLeft + laneWidth / 2

  // Ice crystal hex
  const crystal = el("div", `
    left: ${laneLeft + 2}%; width: ${laneWidth - 4}%; bottom: 11%; aspect-ratio: 1;
    border: 2.5px solid #bae6fd;
    background: rgba(186,230,253,0.15);
    box-shadow: 0 0 18px #38bdf8, inset 0 0 12px rgba(186,230,253,0.3);
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    animation: wandPulse 0.5s ease-out forwards; z-index: 94;
  `)
  spawn(container, crystal, 500)

  // ❄️ snowflake emojis flying out — varied sizes for organic feel
  const snowflakeTypes = ["❄️", "❄️", "❄️", "🌨️", "❄️", "❄️", "🌨️", "❄️"]
  const snowSizes = [10, 22, 16, 30, 12, 26, 18, 14]
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const dist = 24 + Math.random() * 20
    const tx = Math.cos(angle) * dist
    const ty = Math.sin(angle) * dist - 8
    spawnEmoji(container, snowflakeTypes[i], cx, 16, tx, ty, snowSizes[i], 440 + i * 20)
  }

  // Soft ice blue particles still for visual depth
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    const dist = 18 + Math.random() * 14
    const shard = el("div", `
      left: calc(${cx}% - 2px); bottom: 16%;
      width: 3px; height: ${6 + Math.random() * 6}px;
      background: ${palette[i % palette.length]};
      opacity: 0.7;
      --tx: ${Math.cos(angle) * dist}px; --ty: ${Math.sin(angle) * dist - 4}px; --rot: ${i * 90}deg;
      animation: wandSparkFly 0.38s ease-out forwards; z-index: 93;
    `)
    spawn(container, shard, 400)
  }
}

/** 🌈  Rainbow Laser: wide multicolor beam + rainbow emoji burst */
const rainbow_beam: EffectFn = (ctx, palette) => {
  const { container, laneLeft, laneWidth } = ctx
  const cx = laneLeft + laneWidth / 2

  // Fat rainbow beam
  const beam = el("div", `
    left: ${laneLeft - 1}%; width: ${laneWidth + 2}%; bottom: 16%; height: 6px;
    background: linear-gradient(90deg, ${palette.join(", ")});
    box-shadow: ${palette.map(c => `0 0 10px ${c}`).join(", ")};
    border-radius: 3px;
    animation: laserSlash 0.38s ease-out forwards; z-index: 96;
  `)
  spawn(container, beam, 400)

  // Vertical rainbow beam going up
  const vbeam = el("div", `
    left: ${cx - 2}%; bottom: 16%; width: 4%; height: 70%;
    background: linear-gradient(to top, ${palette.join(", ")});
    box-shadow: ${palette.slice(0,3).map(c => `0 0 8px ${c}`).join(", ")};
    border-radius: 2px;
    animation: laserBeamUp 0.38s ease-out forwards; z-index: 95;
  `)
  spawn(container, vbeam, 400)

  // Rainbow ring
  const ring = el("div", `
    left: ${laneLeft + 1}%; width: ${laneWidth - 2}%; bottom: 11%; aspect-ratio: 1;
    border: 3px solid transparent;
    border-image: linear-gradient(135deg, ${palette.join(", ")}) 1;
    box-shadow: 0 0 14px rgba(168,85,247,0.5);
    animation: wandPulse 0.35s ease-out forwards; z-index: 93;
  `, "absolute pointer-events-none rounded-full")
  spawn(container, ring, 370)

  // 5 rainbow emojis flying out radially — varied sizes
  const rainbowEmojis = ["🌈", "✨", "💫", "🌟", "🎨"]
  const rainbowSizes = [32, 12, 24, 18, 28]
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    const dist = 28 + Math.random() * 22
    const tx = Math.cos(angle) * dist
    const ty = Math.sin(angle) * dist - 10
    spawnEmoji(container, rainbowEmojis[i], cx, 18, tx, ty, rainbowSizes[i], 480 + i * 30)
  }
}

/** 🚀  Rocket Launcher: rocket travels up + explosion */
const rocket_trail: EffectFn = (ctx, palette) => {
  const { container, laneLeft, laneWidth } = ctx
  const cx = laneLeft + laneWidth / 2

  // Rocket emoji flying up
  const rocket = el("div", `
    left: calc(${cx}% - 12px); bottom: 16%;
    font-size: 24px; line-height: 1;
    z-index: 97;
    animation: rocketFly 0.5s cubic-bezier(0.2,1,0.4,1) forwards;
  `)
  rocket.textContent = "🚀"
  spawn(container, rocket, 520)

  // Trail particles
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const t = el("div", `
        left: calc(${cx + (Math.random() - 0.5) * 10}% - 2px); bottom: ${16 + i * 4}%;
        width: 4px; height: 4px;
        background: ${palette[i % palette.length]};
        border-radius: 50%;
        opacity: 0.8;
        animation: bananaSpin 0.3s ease-out forwards; z-index: 94;
      `)
      spawn(container, t, 320)
    }, i * 40)
  }

  // Explosion ring after rocket lands
  setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      const ring = el("div", `
        left: ${laneLeft - i * 2}%; width: ${laneWidth + i * 4}%; bottom: ${10 - i}%; aspect-ratio: 1;
        border: 2px solid ${palette[i % palette.length]};
        box-shadow: 0 0 10px ${palette[0]};
        animation: wandPulse ${0.3 + i * 0.06}s ease-out ${i * 50}ms forwards; z-index: ${92 - i};
      `, "absolute pointer-events-none rounded-full")
      spawn(container, ring, 400)
    }
  }, 300)
}

/** ⭐  Star Shooter: stars + occasional UFO/alien emojis */
const star_shower: EffectFn = (ctx, palette) => {
  const { container, laneLeft, laneWidth } = ctx
  const cx = laneLeft + laneWidth / 2

  const starEmojis = ["⭐", "🌟", "💫"]
  const ufoEmojis  = ["🛸", "👾"]

  // 12 emoji particles radiating out — 80% star, 20% UFO
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const dist = 28 + Math.random() * 30
    const tx = Math.cos(angle) * dist
    const ty = Math.sin(angle) * dist - 10
    const isUfo = Math.random() < 0.20
    const emoji = isUfo
      ? ufoEmojis[Math.floor(Math.random() * ufoEmojis.length)]
      : starEmojis[Math.floor(Math.random() * starEmojis.length)]
    const size = isUfo ? 20 + Math.random() * 8 : 14 + Math.random() * 8
    spawnEmoji(container, emoji, cx, 16, tx, ty, size, 400 + i * 20)
  }

  // Central gold flash
  const flash = el("div", `
    left: ${cx - 3}%; bottom: 12%; width: 6%; aspect-ratio: 1;
    background: radial-gradient(circle, #fff 20%, #fde68a 50%, transparent 80%);
    box-shadow: 0 0 20px #fbbf24;
    animation: laserFlash 0.25s ease-out forwards; z-index: 98;
  `, "absolute pointer-events-none rounded-full")
  spawn(container, flash, 270)

  // A few DOM star sparks for extra shine
  const starPath = "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const dist = 18 + Math.random() * 18
    const c = palette[i % palette.length]
    const star = el("div", `
      left: calc(${cx}% - 4px); bottom: 16%;
      width: 8px; height: 8px;
      background: ${c};
      clip-path: ${starPath};
      filter: drop-shadow(0 0 4px ${c});
      --tx: ${Math.cos(angle) * dist}px; --ty: ${Math.sin(angle) * dist - 8}px; --rot: ${i * 60}deg;
      animation: wandSparkFly 0.32s cubic-bezier(0.22,1,0.36,1) forwards; z-index: 94;
    `)
    spawn(container, star, 350)
  }
}

/** 🐉  Dragon Breath: fire beam + dragon + flame emojis */
const dragon_flame: EffectFn = (ctx, palette) => {
  const { container, laneLeft, laneWidth } = ctx
  const cx = laneLeft + laneWidth / 2

  // Wide fire beam — longer duration
  const flame = el("div", `
    left: ${laneLeft - 1}%; width: ${laneWidth + 2}%; bottom: 14%; height: 8px;
    background: linear-gradient(90deg, transparent, #dc2626, #f97316, #fbbf24, #f97316, #dc2626, transparent);
    box-shadow: 0 0 12px #ef4444, 0 0 24px #f97316;
    border-radius: 4px;
    animation: laserSlash 0.8s ease-out forwards; z-index: 96;
  `)
  spawn(container, flame, 850)

  // Vertical fire beam going up — longer
  const vflame = el("div", `
    left: ${cx - 3}%; bottom: 16%; width: 6%; height: 80%;
    background: linear-gradient(to top, #dc2626 0%, #f97316 30%, #fbbf24 55%, transparent 100%);
    box-shadow: 0 0 12px #ef4444, 0 0 28px #f97316;
    border-radius: 3px;
    opacity: 0.85;
    animation: laserBeamUp 0.8s ease-out forwards; z-index: 95;
  `)
  spawn(container, vflame, 850)

  // Fire embers flying out
  for (let i = 0; i < 8; i++) {
    const angle = (Math.random() - 0.5) * Math.PI // upper hemisphere
    const dist = 20 + Math.random() * 28
    const ember = el("div", `
      left: calc(${cx}% - 3px); bottom: 18%;
      width: ${3 + Math.random() * 4}px; height: ${3 + Math.random() * 4}px;
      background: ${palette[i % palette.length]};
      border-radius: 50%;
      filter: drop-shadow(0 0 3px #f97316);
      --tx: ${Math.cos(angle) * dist}px; --ty: ${-(Math.sin(angle) * dist + 10)}px; --rot: 0deg;
      animation: wandSparkFly ${0.5 + Math.random() * 0.3}s ease-out forwards; z-index: 93;
    `)
    spawn(container, ember, 820)
  }

  // 3 dragon emojis + 3 flame emojis flying out — varied sizes
  const dragonSet = ["🐉", "🔥", "🐉", "🔥", "🔥", "🐉"]
  const dragonSizes = [34, 14, 20, 28, 12, 26]
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const dist = 26 + Math.random() * 24
    const tx = Math.cos(angle) * dist
    const ty = Math.sin(angle) * dist - 12
    spawnEmoji(container, dragonSet[i], cx, 18, tx, ty, dragonSizes[i], 500 + i * 60)
  }

  // Dragon shield indicator bar
  const shield = el("div", `
    left: ${laneLeft}%; width: ${laneWidth}%; bottom: 6%; height: 3px;
    background: linear-gradient(90deg, transparent, #dc2626, #fbbf24, #dc2626, transparent);
    box-shadow: 0 0 8px #f97316;
    opacity: 0.7;
    animation: laserSlash 0.8s ease-out forwards; z-index: 92;
  `)
  spawn(container, shield, 850)
}

// ─────────────────────────────────────────────────────────────────────────────
// EFFECT REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

const EFFECT_FNS: Record<VisualEffect, EffectFn> = {
  sparkle_burst,
  laser_beam_up,
  banana_spin,
  water_splash,
  chain_arc,
  freeze_shatter,
  rainbow_beam,
  rocket_trail,
  star_shower,
  dragon_flame,
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fire the visual hit effect for a pointer.
 * Called from the game's showHitEffect function.
 */
export function firePointerEffect(
  pointer: PointerConfig,
  ctx: EffectContext
): void {
  const fn = EFFECT_FNS[pointer.visualEffect]
  if (fn) fn(ctx, pointer.palette)
}

/**
 * CSS keyframes that must be injected into the page once.
 * Append these to a <style> tag in the game component.
 */
export const POINTER_KEYFRAMES = `
  @keyframes wandSparkFly {
    0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
    60%  { opacity: 0.8; }
    100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.1); opacity: 0; }
  }
  @keyframes wandPulse {
    0%   { transform: scale(0.3); opacity: 1; }
    50%  { transform: scale(1.6); opacity: 0.6; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes wandTrail {
    0%   { opacity: 0; transform: scale(0.3) rotate(0deg); }
    40%  { opacity: 1; transform: scale(1.2) rotate(180deg); }
    100% { opacity: 0; transform: scale(0.5) rotate(360deg); }
  }
  @keyframes laserBeamUp {
    0%   { transform: scaleY(0); transform-origin: bottom; opacity: 1; }
    40%  { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
    100% { transform: scaleY(1); transform-origin: bottom; opacity: 0; }
  }
  @keyframes laserImpact {
    0%   { transform: scale(0.5); opacity: 1; }
    60%  { transform: scale(2.5); opacity: 0.7; }
    100% { transform: scale(3.5); opacity: 0; }
  }
  @keyframes laserFlash {
    0%   { transform: scale(0.5); opacity: 1; }
    50%  { transform: scale(2); opacity: 0.8; }
    100% { transform: scale(3); opacity: 0; }
  }
  @keyframes laserSlash {
    0%   { transform: scaleX(0); opacity: 1; }
    40%  { transform: scaleX(1.1); opacity: 1; }
    100% { transform: scaleX(1); opacity: 0; }
  }
  @keyframes lightningBolt {
    0%   { opacity: 0; transform: scaleY(0); transform-origin: bottom; }
    20%  { opacity: 1; transform: scaleY(1); }
    80%  { opacity: 0.8; }
    100% { opacity: 0; }
  }
  @keyframes bananaSpin {
    0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
    60%  { transform: translateY(-40px) rotate(360deg) scale(1.2); opacity: 0.9; }
    100% { transform: translateY(-70px) rotate(540deg) scale(0.4); opacity: 0; }
  }
  @keyframes rocketFly {
    0%   { transform: translateY(0) scale(1); opacity: 1; }
    50%  { transform: translateY(-50px) scale(1.2); opacity: 1; }
    100% { transform: translateY(-100px) scale(0.3); opacity: 0; }
  }
  @keyframes bubblePop {
    0%   { transform: scale(1); opacity: 1; border-width: 3px; }
    60%  { opacity: 0.6; }
    100% { transform: scale(2.8); opacity: 0; border-width: 0.5px; }
  }
  @keyframes emojiFloat {
    0%   { transform: translate(0,0) scale(1); opacity: 1; }
    60%  { opacity: 0.8; }
    100% { transform: translate(var(--tx), var(--ty)) scale(0.4); opacity: 0; }
  }
  @keyframes streakPulse {
    0%   { opacity: 0; transform: scale(0.85); }
    25%  { opacity: 1; transform: scale(1.12); }
    65%  { opacity: 0.85; transform: scale(1.04); }
    100% { opacity: 0; transform: scale(1); }
  }
`
