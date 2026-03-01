// ─────────────────────────────────────────────────────────────────────────────
// lib/pointers/pointerRegistry.ts
// Single source of truth for every pointer in HablaBeat.
// Add new pointers here — the game, store, and effect engine read from this.
// ─────────────────────────────────────────────────────────────────────────────

import type { PointerConfig, GameplayModifier } from "./types"

// ── Baseline modifier (no change to gameplay) ────────────────────────────────
const BASE_MODIFIER: GameplayModifier = {
  hitRadiusMultiplier: 1.0,
  comboBoost: 0,
  timingForgiveness: 0,
  coinMultiplier: 1.0,
  comboShield: false,
  chainChance: 0,
  laneSlowMs: 0,
  comboMeterBoost: 0,
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG HELPERS
// Each pointer has 4 directional SVGs (left / right / up / down).
// Horizontal arrows: viewBox "0 0 60 40", width 48 height 32
// Vertical arrows:   viewBox "0 0 40 60", width 32 height 48
// ─────────────────────────────────────────────────────────────────────────────

// ── 🥕 Carrot (free default) ─────────────────────────────────────────────────
const CARROT_SVGS = {
  left: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="0,20 40,4 36,20 40,36" fill="#F97316" stroke="#000" stroke-width="2"/><line x1="14" y1="14" x2="20" y2="17" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/><line x1="18" y1="12" x2="24" y2="16" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/><line x1="22" y1="24" x2="28" y2="21" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="46" cy="14" rx="7" ry="5" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(-20,46,14)"/><ellipse cx="50" cy="20" rx="7" ry="5" fill="#16A34A" stroke="#000" stroke-width="1" transform="rotate(10,50,20)"/><ellipse cx="44" cy="24" rx="6" ry="4" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(25,44,24)"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="60,20 20,4 24,20 20,36" fill="#F97316" stroke="#000" stroke-width="2"/><line x1="40" y1="14" x2="34" y2="17" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/><line x1="36" y1="12" x2="30" y2="16" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/><line x1="36" y1="24" x2="30" y2="21" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="14" cy="14" rx="7" ry="5" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(20,14,14)"/><ellipse cx="10" cy="20" rx="7" ry="5" fill="#16A34A" stroke="#000" stroke-width="1" transform="rotate(-10,10,20)"/><ellipse cx="16" cy="24" rx="6" ry="4" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(-25,16,24)"/></svg>`,
  up: `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,0 36,40 20,36 4,40" fill="#F97316" stroke="#000" stroke-width="2"/><line x1="14" y1="26" x2="17" y2="20" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="22" x2="16" y2="16" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/><line x1="24" y1="26" x2="21" y2="20" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="14" cy="48" rx="5" ry="7" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(15,14,48)"/><ellipse cx="20" cy="52" rx="5" ry="7" fill="#16A34A" stroke="#000" stroke-width="1" transform="rotate(-5,20,52)"/><ellipse cx="26" cy="47" rx="4" ry="6" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(-20,26,47)"/></svg>`,
  down: `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,60 4,20 20,24 36,20" fill="#F97316" stroke="#000" stroke-width="2"/><line x1="14" y1="34" x2="17" y2="40" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="38" x2="16" y2="44" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/><line x1="24" y1="34" x2="21" y2="40" stroke="#EA580C" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="14" cy="12" rx="5" ry="7" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(-15,14,12)"/><ellipse cx="20" cy="8" rx="5" ry="7" fill="#16A34A" stroke="#000" stroke-width="1" transform="rotate(5,20,8)"/><ellipse cx="26" cy="13" rx="4" ry="6" fill="#22C55E" stroke="#000" stroke-width="1" transform="rotate(20,26,13)"/></svg>`,
}

// ── 🔴 Red Laser (common) ─────────────────────────────────────────────────────
const RED_LASER_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="0,20 44,12 40,20 44,28" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/><line x1="44" y1="20" x2="60" y2="20" stroke="#ef4444" stroke-width="2"/><line x1="44" y1="14" x2="56" y2="14" stroke="#fca5a5" stroke-width="1" opacity="0.5"/><line x1="44" y1="26" x2="56" y2="26" stroke="#fca5a5" stroke-width="1" opacity="0.5"/><circle cx="56" cy="20" r="4" fill="#ff6b6b" stroke="#fff" stroke-width="1"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="60,20 16,12 20,20 16,28" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/><line x1="16" y1="20" x2="0" y2="20" stroke="#ef4444" stroke-width="2"/><line x1="16" y1="14" x2="4" y2="14" stroke="#fca5a5" stroke-width="1" opacity="0.5"/><line x1="16" y1="26" x2="4" y2="26" stroke="#fca5a5" stroke-width="1" opacity="0.5"/><circle cx="4" cy="20" r="4" fill="#ff6b6b" stroke="#fff" stroke-width="1"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,0 12,44 20,40 28,44" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/><line x1="20" y1="44" x2="20" y2="60" stroke="#ef4444" stroke-width="2"/><line x1="14" y1="44" x2="14" y2="56" stroke="#fca5a5" stroke-width="1" opacity="0.5"/><line x1="26" y1="44" x2="26" y2="56" stroke="#fca5a5" stroke-width="1" opacity="0.5"/><circle cx="20" cy="56" r="4" fill="#ff6b6b" stroke="#fff" stroke-width="1"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,60 12,16 20,20 28,16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/><line x1="20" y1="16" x2="20" y2="0" stroke="#ef4444" stroke-width="2"/><line x1="14" y1="16" x2="14" y2="4" stroke="#fca5a5" stroke-width="1" opacity="0.5"/><line x1="26" y1="16" x2="26" y2="4" stroke="#fca5a5" stroke-width="1" opacity="0.5"/><circle cx="20" cy="4" r="4" fill="#ff6b6b" stroke="#fff" stroke-width="1"/></svg>`,
}

// ── 🍌 Banana Blaster (common) ────────────────────────────────────────────────
const BANANA_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M0,20 Q20,5 44,18 Q20,15 40,22 Q20,35 0,20Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><path d="M0,20 Q15,13 35,20" fill="none" stroke="#fde68a" stroke-width="1" opacity="0.7"/><circle cx="50" cy="18" r="6" fill="#fbbf24" stroke="#f59e0b" stroke-width="1"/><path d="M47,14 Q55,16 53,22" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M60,20 Q40,5 16,18 Q40,15 20,22 Q40,35 60,20Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><path d="M60,20 Q45,13 25,20" fill="none" stroke="#fde68a" stroke-width="1" opacity="0.7"/><circle cx="10" cy="18" r="6" fill="#fbbf24" stroke="#f59e0b" stroke-width="1"/><path d="M13,14 Q5,16 7,22" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><path d="M20,0 Q5,20 18,44 Q15,20 22,40 Q35,20 20,0Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><path d="M20,0 Q13,15 20,35" fill="none" stroke="#fde68a" stroke-width="1" opacity="0.7"/><circle cx="18" cy="50" r="6" fill="#fbbf24" stroke="#f59e0b" stroke-width="1"/><path d="M14,47 Q16,55 22,53" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><path d="M20,60 Q5,40 18,16 Q15,40 22,20 Q35,40 20,60Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><path d="M20,60 Q13,45 20,25" fill="none" stroke="#fde68a" stroke-width="1" opacity="0.7"/><circle cx="18" cy="10" r="6" fill="#fbbf24" stroke="#f59e0b" stroke-width="1"/><path d="M14,13 Q16,5 22,7" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/></svg>`,
}

// ── 💧 Water Cannon (common) ──────────────────────────────────────────────────
const WATER_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="0,20 38,10 34,20 38,30" fill="#38bdf8" stroke="#0ea5e9" stroke-width="1.5"/><rect x="38" y="16" width="14" height="8" rx="4" fill="#0ea5e9"/><circle cx="42" cy="20" r="3" fill="#7dd3fc" opacity="0.8"/><circle cx="56" cy="14" r="2" fill="#38bdf8" opacity="0.7"/><circle cx="58" cy="22" r="1.5" fill="#38bdf8" opacity="0.5"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="60,20 22,10 26,20 22,30" fill="#38bdf8" stroke="#0ea5e9" stroke-width="1.5"/><rect x="8" y="16" width="14" height="8" rx="4" fill="#0ea5e9"/><circle cx="18" cy="20" r="3" fill="#7dd3fc" opacity="0.8"/><circle cx="4" cy="14" r="2" fill="#38bdf8" opacity="0.7"/><circle cx="2" cy="22" r="1.5" fill="#38bdf8" opacity="0.5"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,0 10,38 20,34 30,38" fill="#38bdf8" stroke="#0ea5e9" stroke-width="1.5"/><rect x="16" y="38" width="8" height="14" rx="4" fill="#0ea5e9"/><circle cx="20" cy="42" r="3" fill="#7dd3fc" opacity="0.8"/><circle cx="14" cy="56" r="2" fill="#38bdf8" opacity="0.7"/><circle cx="22" cy="58" r="1.5" fill="#38bdf8" opacity="0.5"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,60 10,22 20,26 30,22" fill="#38bdf8" stroke="#0ea5e9" stroke-width="1.5"/><rect x="16" y="8" width="8" height="14" rx="4" fill="#0ea5e9"/><circle cx="20" cy="18" r="3" fill="#7dd3fc" opacity="0.8"/><circle cx="14" cy="4" r="2" fill="#38bdf8" opacity="0.7"/><circle cx="22" cy="2" r="1.5" fill="#38bdf8" opacity="0.5"/></svg>`,
}

// ── ⚡ Lightning Bolt (rare) ───────────────────────────────────────────────────
const LIGHTNING_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="0,20 36,8 28,20 40,20 14,34" fill="#fde047" stroke="#eab308" stroke-width="1.5"/><polygon points="2,20 36,10 29,20 40,20 16,32" fill="#fef08a" opacity="0.5"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="60,20 24,8 32,20 20,20 46,34" fill="#fde047" stroke="#eab308" stroke-width="1.5"/><polygon points="58,20 24,10 31,20 20,20 44,32" fill="#fef08a" opacity="0.5"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,0 8,36 20,28 20,40 34,14" fill="#fde047" stroke="#eab308" stroke-width="1.5"/><polygon points="20,2 10,36 20,30 20,40 32,16" fill="#fef08a" opacity="0.5"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,60 8,24 20,32 20,20 34,46" fill="#fde047" stroke="#eab308" stroke-width="1.5"/><polygon points="20,58 10,24 20,30 20,20 32,44" fill="#fef08a" opacity="0.5"/></svg>`,
}

// ── ❄️ Ice Blaster (rare) ─────────────────────────────────────────────────────
const ICE_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="0,20 40,8 36,20 40,32" fill="#bae6fd" stroke="#38bdf8" stroke-width="1.5"/><line x1="40" y1="20" x2="58" y2="20" stroke="#7dd3fc" stroke-width="2"/><line x1="46" y1="14" x2="52" y2="26" stroke="#bae6fd" stroke-width="1" opacity="0.7"/><line x1="46" y1="26" x2="52" y2="14" stroke="#bae6fd" stroke-width="1" opacity="0.7"/><circle cx="52" cy="20" r="5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="60,20 20,8 24,20 20,32" fill="#bae6fd" stroke="#38bdf8" stroke-width="1.5"/><line x1="20" y1="20" x2="2" y2="20" stroke="#7dd3fc" stroke-width="2"/><line x1="14" y1="14" x2="8" y2="26" stroke="#bae6fd" stroke-width="1" opacity="0.7"/><line x1="14" y1="26" x2="8" y2="14" stroke="#bae6fd" stroke-width="1" opacity="0.7"/><circle cx="8" cy="20" r="5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,0 8,40 20,36 32,40" fill="#bae6fd" stroke="#38bdf8" stroke-width="1.5"/><line x1="20" y1="40" x2="20" y2="58" stroke="#7dd3fc" stroke-width="2"/><line x1="14" y1="46" x2="26" y2="52" stroke="#bae6fd" stroke-width="1" opacity="0.7"/><line x1="26" y1="46" x2="14" y2="52" stroke="#bae6fd" stroke-width="1" opacity="0.7"/><circle cx="20" cy="52" r="5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,60 8,20 20,24 32,20" fill="#bae6fd" stroke="#38bdf8" stroke-width="1.5"/><line x1="20" y1="20" x2="20" y2="2" stroke="#7dd3fc" stroke-width="2"/><line x1="14" y1="14" x2="26" y2="8" stroke="#bae6fd" stroke-width="1" opacity="0.7"/><line x1="26" y1="14" x2="14" y2="8" stroke="#bae6fd" stroke-width="1" opacity="0.7"/><circle cx="20" cy="8" r="5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1"/></svg>`,
}

// ── 🌈 Rainbow Laser (epic) ───────────────────────────────────────────────────
const RAINBOW_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="0,20 40,10 36,20 40,30" fill="url(#rl)" stroke="none"/><defs><linearGradient id="rl" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="33%" stop-color="#22c55e"/><stop offset="66%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><line x1="36" y1="20" x2="58" y2="20" stroke="url(#rl)" stroke-width="3"/><circle cx="56" cy="20" r="4" fill="white" opacity="0.9"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="60,20 20,10 24,20 20,30" fill="url(#rr)" stroke="none"/><defs><linearGradient id="rr" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="33%" stop-color="#22c55e"/><stop offset="66%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><line x1="24" y1="20" x2="2" y2="20" stroke="url(#rr)" stroke-width="3"/><circle cx="4" cy="20" r="4" fill="white" opacity="0.9"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,0 10,40 20,36 30,40" fill="url(#ru)" stroke="none"/><defs><linearGradient id="ru" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ef4444"/><stop offset="33%" stop-color="#22c55e"/><stop offset="66%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><line x1="20" y1="40" x2="20" y2="58" stroke="url(#ru)" stroke-width="3"/><circle cx="20" cy="56" r="4" fill="white" opacity="0.9"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,60 10,20 20,24 30,20" fill="url(#rd)" stroke="none"/><defs><linearGradient id="rd" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="33%" stop-color="#22c55e"/><stop offset="66%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><line x1="20" y1="20" x2="20" y2="2" stroke="url(#rd)" stroke-width="3"/><circle cx="20" cy="4" r="4" fill="white" opacity="0.9"/></svg>`,
}

// ── 🚀 Rocket Launcher (epic) ─────────────────────────────────────────────────
const ROCKET_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><ellipse cx="26" cy="20" rx="20" ry="9" fill="#6366f1" stroke="#818cf8" stroke-width="1.5"/><polygon points="46,20 52,14 56,20 52,26" fill="#e0e7ff"/><polygon points="6,11 12,20 6,29" fill="#4f46e5"/><polygon points="22,11 16,14 16,20" fill="#c7d2fe" opacity="0.7"/><ellipse cx="4" cy="20" rx="4" ry="5" fill="#f97316" opacity="0.8"/><ellipse cx="2" cy="20" rx="2" ry="3" fill="#fbbf24" opacity="0.9"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><ellipse cx="34" cy="20" rx="20" ry="9" fill="#6366f1" stroke="#818cf8" stroke-width="1.5"/><polygon points="14,20 8,14 4,20 8,26" fill="#e0e7ff"/><polygon points="54,11 48,20 54,29" fill="#4f46e5"/><polygon points="38,11 44,14 44,20" fill="#c7d2fe" opacity="0.7"/><ellipse cx="56" cy="20" rx="4" ry="5" fill="#f97316" opacity="0.8"/><ellipse cx="58" cy="20" rx="2" ry="3" fill="#fbbf24" opacity="0.9"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="26" rx="9" ry="20" fill="#6366f1" stroke="#818cf8" stroke-width="1.5"/><polygon points="20,6 14,12 20,16 26,12" fill="#e0e7ff"/><polygon points="11,46 20,40 29,46" fill="#4f46e5"/><ellipse cx="20" cy="56" rx="5" ry="4" fill="#f97316" opacity="0.8"/><ellipse cx="20" cy="58" rx="3" ry="2" fill="#fbbf24" opacity="0.9"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="34" rx="9" ry="20" fill="#6366f1" stroke="#818cf8" stroke-width="1.5"/><polygon points="20,54 14,48 20,44 26,48" fill="#e0e7ff"/><polygon points="11,14 20,20 29,14" fill="#4f46e5"/><ellipse cx="20" cy="4" rx="5" ry="4" fill="#f97316" opacity="0.8"/><ellipse cx="20" cy="2" rx="3" ry="2" fill="#fbbf24" opacity="0.9"/></svg>`,
}

// ── ⭐ Star Shooter (epic) ────────────────────────────────────────────────────
const STAR_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="0,20 36,8 32,20 36,32" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><polygon points="48,20 44,14 52,16 46,10 50,18 56,14 54,22 60,18 54,26 50,22 46,30 52,24 44,26" fill="#fde68a" stroke="#fbbf24" stroke-width="0.5"/><circle cx="48" cy="20" r="6" fill="#fef3c7" opacity="0.3"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="60,20 24,8 28,20 24,32" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><polygon points="12,20 16,14 8,16 14,10 10,18 4,14 6,22 0,18 6,26 10,22 14,30 8,24 16,26" fill="#fde68a" stroke="#fbbf24" stroke-width="0.5"/><circle cx="12" cy="20" r="6" fill="#fef3c7" opacity="0.3"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,0 8,36 20,32 32,36" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><polygon points="20,48 14,44 16,52 10,46 18,50 14,56 22,54 18,60 26,56 22,50 30,46 24,52 26,44" fill="#fde68a" stroke="#fbbf24" stroke-width="0.5"/><circle cx="20" cy="48" r="6" fill="#fef3c7" opacity="0.3"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,60 8,24 20,28 32,24" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><polygon points="20,12 14,16 16,8 10,14 18,10 14,4 22,6 18,0 26,4 22,10 30,14 24,8 26,16" fill="#fde68a" stroke="#fbbf24" stroke-width="0.5"/><circle cx="20" cy="12" r="6" fill="#fef3c7" opacity="0.3"/></svg>`,
}

// ── 🐉 Dragon Breath (legendary) ─────────────────────────────────────────────
const DRAGON_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="0,20 38,6 32,20 38,34" fill="#dc2626" stroke="#b91c1c" stroke-width="1.5"/><path d="M38,20 Q44,14 52,10 Q48,18 56,16 Q50,22 58,22 Q50,24 54,30 Q46,26 50,34 Q42,28 38,20Z" fill="#f97316" opacity="0.9"/><path d="M42,20 Q46,16 52,14 Q48,20 54,20 Q48,22 52,26 Q44,24 42,20Z" fill="#fbbf24" opacity="0.7"/><circle cx="52" cy="20" r="3" fill="#fff7ed" opacity="0.6"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="60,20 22,6 28,20 22,34" fill="#dc2626" stroke="#b91c1c" stroke-width="1.5"/><path d="M22,20 Q16,14 8,10 Q12,18 4,16 Q10,22 2,22 Q10,24 6,30 Q14,26 10,34 Q18,28 22,20Z" fill="#f97316" opacity="0.9"/><path d="M18,20 Q14,16 8,14 Q12,20 6,20 Q12,22 8,26 Q16,24 18,20Z" fill="#fbbf24" opacity="0.7"/><circle cx="8" cy="20" r="3" fill="#fff7ed" opacity="0.6"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,0 6,38 20,32 34,38" fill="#dc2626" stroke="#b91c1c" stroke-width="1.5"/><path d="M20,38 Q14,44 10,52 Q18,48 16,56 Q22,50 22,58 Q24,50 30,54 Q26,46 34,50 Q28,42 20,38Z" fill="#f97316" opacity="0.9"/><path d="M20,42 Q16,46 14,52 Q20,48 20,54 Q22,48 26,52 Q24,44 20,42Z" fill="#fbbf24" opacity="0.7"/><circle cx="20" cy="52" r="3" fill="#fff7ed" opacity="0.6"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,60 6,22 20,28 34,22" fill="#dc2626" stroke="#b91c1c" stroke-width="1.5"/><path d="M20,22 Q14,16 10,8 Q18,12 16,4 Q22,10 22,2 Q24,10 30,6 Q26,14 34,10 Q28,18 20,22Z" fill="#f97316" opacity="0.9"/><path d="M20,18 Q16,14 14,8 Q20,12 20,6 Q22,12 26,8 Q24,16 20,18Z" fill="#fbbf24" opacity="0.7"/><circle cx="20" cy="8" r="3" fill="#fff7ed" opacity="0.6"/></svg>`,
}

// ─────────────────────────────────────────────────────────────────────────────
// POINTER REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export const POINTER_REGISTRY: PointerConfig[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // 🟢 COMMON  —  Pure style + micro feel shift. No real balance impact.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "pointer-carrot",
    name: "Carrot",
    rarity: "common",
    price: 0,
    emoji: "🥕",
    description: "The original HablaBeat arrow",
    flavorText: "Every legend starts somewhere.",
    projectileType: "burst",
    visualEffect: "sparkle_burst",
    svgs: CARROT_SVGS,
    palette: ["#f97316", "#fbbf24", "#22c55e"],
    gameplayModifier: { ...BASE_MODIFIER },
  },

  {
    id: "pointer-red-laser",
    name: "Red Laser",
    rarity: "common",
    price: 150,
    emoji: "🔴",
    description: "Precision beam. Feels sharp, not stronger.",
    flavorText: "Accuracy is its own reward.",
    projectileType: "beam",
    visualEffect: "laser_beam_up",
    svgs: RED_LASER_SVGS,
    palette: ["#ef4444", "#fca5a5", "#fff"],
    gameplayModifier: {
      ...BASE_MODIFIER,
      // Tighter hit feedback — feels more accurate but same window
      hitRadiusMultiplier: 0.97,
    },
  },

  {
    id: "pointer-banana",
    name: "Banana Blaster",
    rarity: "common",
    price: 200,
    emoji: "🍌",
    description: "Visible spinning banana. Playful chaos.",
    flavorText: "It's always the right time for a banana.",
    projectileType: "projectile",
    visualEffect: "banana_spin",
    svgs: BANANA_SVGS,
    palette: ["#fbbf24", "#fde68a", "#f59e0b"],
    gameplayModifier: {
      ...BASE_MODIFIER,
      hitRadiusMultiplier: 1.05,  // +5% hit radius, just feels good
    },
  },

  {
    id: "pointer-water",
    name: "Water Cannon",
    rarity: "common",
    price: 250,
    emoji: "💧",
    description: "Splash burst. Micro slow on next bubble.",
    flavorText: "Stay calm. Stay strategic.",
    projectileType: "burst",
    visualEffect: "water_splash",
    svgs: WATER_SVGS,
    palette: ["#38bdf8", "#7dd3fc", "#e0f2fe"],
    gameplayModifier: {
      ...BASE_MODIFIER,
      laneSlowMs: 250,   // slight slow on next note — feels strategic
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔵 RARE  —  Introduce ONE new mechanic each. Not stronger, just different.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "pointer-lightning",
    name: "Lightning Bolt",
    rarity: "rare",
    price: 400,
    emoji: "⚡",
    description: "10% chance to chain to the next note on a perfect hit.",
    flavorText: "Skill unlocks the chain. Luck is just 10%.",
    projectileType: "beam",
    visualEffect: "chain_arc",
    svgs: LIGHTNING_SVGS,
    palette: ["#fde047", "#fef08a", "#fff"],
    gameplayModifier: {
      ...BASE_MODIFIER,
      chainChance: 0.10,   // 10% — only on perfect hits, handled in game logic
    },
  },

  {
    id: "pointer-ice",
    name: "Ice Blaster",
    rarity: "rare",
    price: 500,
    emoji: "❄️",
    description: "Freeze & shatter pop. Slows next note for 1s after a perfect.",
    flavorText: "Time is yours to bend.",
    projectileType: "burst",
    visualEffect: "freeze_shatter",
    svgs: ICE_SVGS,
    palette: ["#bae6fd", "#7dd3fc", "#e0f2fe", "#fff"],
    gameplayModifier: {
      ...BASE_MODIFIER,
      laneSlowMs: 1000,    // longer slow vs Water Cannon — but only on perfect
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🟣 EPIC  —  Noticeable gameplay feel. Each has a clear identity + drawback.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "pointer-rainbow",
    name: "Rainbow Laser",
    rarity: "epic",
    price: 900,
    emoji: "🌈",
    description: "Combo meter fills slightly faster. Flow state accelerator.",
    flavorText: "Feel it. Ride it. Don't stop.",
    projectileType: "beam",
    visualEffect: "rainbow_beam",
    svgs: RAINBOW_SVGS,
    palette: ["#ef4444", "#f97316", "#fbbf24", "#22c55e", "#3b82f6", "#a855f7"],
    gameplayModifier: {
      ...BASE_MODIFIER,
      comboMeterBoost: 0.08,   // combo fills 8% faster (visual feel, not points)
    },
  },

  {
    id: "pointer-rocket",
    name: "Rocket Launcher",
    rarity: "epic",
    price: 1000,
    emoji: "🚀",
    description: "Splash radius. High impact — but slightly slower re-fire.",
    flavorText: "Big reward. Play it patient.",
    projectileType: "projectile",
    visualEffect: "rocket_trail",
    svgs: ROCKET_SVGS,
    palette: ["#6366f1", "#818cf8", "#f97316", "#fbbf24"],
    gameplayModifier: {
      ...BASE_MODIFIER,
      hitRadiusMultiplier: 1.07,   // slightly bigger hit area
      // Drawback: the rocket visual takes longer — accounted for in effect timing
    },
  },

  {
    id: "pointer-star",
    name: "Star Shooter",
    rarity: "epic",
    price: 1100,
    emoji: "⭐",
    description: "+10% coins per hit. No gameplay advantage. Pure grind tool.",
    flavorText: "Work smarter. Earn faster.",
    projectileType: "spark",
    visualEffect: "star_shower",
    svgs: STAR_SVGS,
    palette: ["#fbbf24", "#fde68a", "#fef3c7", "#fff"],
    gameplayModifier: {
      ...BASE_MODIFIER,
      coinMultiplier: 1.10,     // +10% coins, zero skill advantage
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🟡 LEGENDARY  —  Unique mechanic. Not bigger numbers. Just different.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "pointer-dragon",
    name: "Dragon Breath",
    rarity: "legendary",
    price: 2000,
    emoji: "🐉",
    description: "One miss per song doesn't break your combo. Once only.",
    flavorText: "Even dragons stumble. The flame never dies.",
    projectileType: "wave",
    visualEffect: "dragon_flame",
    svgs: DRAGON_SVGS,
    palette: ["#dc2626", "#f97316", "#fbbf24", "#fff7ed"],
    gameplayModifier: {
      ...BASE_MODIFIER,
      comboShield: true,    // first miss per level does not break combo
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Map for O(1) lookup by id */
export const POINTER_MAP: Record<string, PointerConfig> = Object.fromEntries(
  POINTER_REGISTRY.map(p => [p.id, p])
)

/** Get a pointer by id, falling back to carrot */
export function getPointer(id: string): PointerConfig {
  return POINTER_MAP[id] ?? POINTER_MAP["pointer-carrot"]!
}

/** Rarity display helpers */
export const RARITY_LABEL: Record<string, string> = {
  common:    "Common",
  rare:      "Rare",
  epic:      "Epic",
  legendary: "Legendary",
}

export const RARITY_COLOR: Record<string, string> = {
  common:    "#9ca3af",   // gray
  rare:      "#60a5fa",   // blue
  epic:      "#a855f7",   // purple
  legendary: "#f59e0b",   // gold
}

export const RARITY_GLOW: Record<string, string> = {
  common:    "none",
  rare:      "0 0 8px rgba(96,165,250,0.5)",
  epic:      "0 0 12px rgba(168,85,247,0.6)",
  legendary: "0 0 16px rgba(245,158,11,0.7), 0 0 32px rgba(245,158,11,0.3)",
}
