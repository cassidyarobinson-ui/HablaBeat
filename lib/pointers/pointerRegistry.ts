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
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="16" width="28" height="8" rx="2" fill="#444" stroke="#333" stroke-width="1"/><rect x="32" y="18" width="10" height="4" rx="1" fill="#666"/><circle cx="56" cy="20" r="3" fill="#222"/><line x1="0" y1="20" x2="30" y2="20" stroke="#ef4444" stroke-width="2.5" opacity="0.9"/><line x1="0" y1="20" x2="30" y2="20" stroke="#fca5a5" stroke-width="1" opacity="0.6"/><circle cx="2" cy="20" r="3" fill="#ef4444" opacity="0.8"/><circle cx="2" cy="20" r="1.5" fill="#fff" opacity="0.9"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="16" width="28" height="8" rx="2" fill="#444" stroke="#333" stroke-width="1"/><rect x="18" y="18" width="10" height="4" rx="1" fill="#666"/><circle cx="4" cy="20" r="3" fill="#222"/><line x1="30" y1="20" x2="60" y2="20" stroke="#ef4444" stroke-width="2.5" opacity="0.9"/><line x1="30" y1="20" x2="60" y2="20" stroke="#fca5a5" stroke-width="1" opacity="0.6"/><circle cx="58" cy="20" r="3" fill="#ef4444" opacity="0.8"/><circle cx="58" cy="20" r="1.5" fill="#fff" opacity="0.9"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="30" width="8" height="28" rx="2" fill="#444" stroke="#333" stroke-width="1"/><rect x="18" y="32" width="4" height="10" rx="1" fill="#666"/><circle cx="20" cy="56" r="3" fill="#222"/><line x1="20" y1="0" x2="20" y2="30" stroke="#ef4444" stroke-width="2.5" opacity="0.9"/><line x1="20" y1="0" x2="20" y2="30" stroke="#fca5a5" stroke-width="1" opacity="0.6"/><circle cx="20" cy="2" r="3" fill="#ef4444" opacity="0.8"/><circle cx="20" cy="2" r="1.5" fill="#fff" opacity="0.9"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="2" width="8" height="28" rx="2" fill="#444" stroke="#333" stroke-width="1"/><rect x="18" y="18" width="4" height="10" rx="1" fill="#666"/><circle cx="20" cy="4" r="3" fill="#222"/><line x1="20" y1="30" x2="20" y2="60" stroke="#ef4444" stroke-width="2.5" opacity="0.9"/><line x1="20" y1="30" x2="20" y2="60" stroke="#fca5a5" stroke-width="1" opacity="0.6"/><circle cx="20" cy="58" r="3" fill="#ef4444" opacity="0.8"/><circle cx="20" cy="58" r="1.5" fill="#fff" opacity="0.9"/></svg>`,
}

// ── 🍌 Banana Blaster (common) ────────────────────────────────────────────────
const BANANA_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M4,22 Q8,6 28,4 Q40,4 48,12 L44,14 Q38,8 28,8 Q14,10 10,22Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/><path d="M10,22 Q14,32 32,34 Q44,34 50,28 L48,12 Q42,20 30,22 Q18,24 10,22Z" fill="#fde047" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/><path d="M14,22 Q18,28 30,28 Q40,28 46,20" fill="none" stroke="#fef9c3" stroke-width="1.5" opacity="0.6"/><circle cx="50" cy="28" r="3" fill="#92400e" opacity="0.7"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M56,22 Q52,6 32,4 Q20,4 12,12 L16,14 Q22,8 32,8 Q46,10 50,22Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/><path d="M50,22 Q46,32 28,34 Q16,34 10,28 L12,12 Q18,20 30,22 Q42,24 50,22Z" fill="#fde047" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/><path d="M46,22 Q42,28 30,28 Q20,28 14,20" fill="none" stroke="#fef9c3" stroke-width="1.5" opacity="0.6"/><circle cx="10" cy="28" r="3" fill="#92400e" opacity="0.7"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><path d="M22,4 Q6,8 4,28 Q4,40 12,48 L14,44 Q8,38 8,28 Q10,14 22,10Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/><path d="M22,10 Q32,14 34,32 Q34,44 28,50 L12,48 Q20,42 22,30 Q24,18 22,10Z" fill="#fde047" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/><path d="M22,14 Q28,18 28,30 Q28,40 20,46" fill="none" stroke="#fef9c3" stroke-width="1.5" opacity="0.6"/><circle cx="28" cy="50" r="3" fill="#92400e" opacity="0.7"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><path d="M22,56 Q6,52 4,32 Q4,20 12,12 L14,16 Q8,22 8,32 Q10,46 22,50Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/><path d="M22,50 Q32,46 34,28 Q34,16 28,10 L12,12 Q20,18 22,30 Q24,42 22,50Z" fill="#fde047" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/><path d="M22,46 Q28,42 28,30 Q28,20 20,14" fill="none" stroke="#fef9c3" stroke-width="1.5" opacity="0.6"/><circle cx="28" cy="10" r="3" fill="#92400e" opacity="0.7"/></svg>`,
}

// ── 💧 Water Cannon (common) ──────────────────────────────────────────────────
const WATER_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><rect x="28" y="14" width="24" height="12" rx="3" fill="#0ea5e9" stroke="#0284c7" stroke-width="1.5"/><rect x="36" y="22" width="8" height="10" rx="2" fill="#0284c7"/><rect x="48" y="16" width="8" height="8" rx="2" fill="#0369a1"/><circle cx="50" cy="20" r="2" fill="#7dd3fc" opacity="0.6"/><rect x="20" y="18" width="10" height="4" rx="1" fill="#38bdf8"/><path d="M2,20 Q8,14 14,18 Q18,16 20,20 Q18,24 14,22 Q8,26 2,20Z" fill="#7dd3fc" stroke="#38bdf8" stroke-width="1" opacity="0.9"/><circle cx="6" cy="18" r="2" fill="#bae6fd" opacity="0.7"/><circle cx="10" cy="22" r="1.5" fill="#bae6fd" opacity="0.5"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="14" width="24" height="12" rx="3" fill="#0ea5e9" stroke="#0284c7" stroke-width="1.5"/><rect x="16" y="22" width="8" height="10" rx="2" fill="#0284c7"/><rect x="4" y="16" width="8" height="8" rx="2" fill="#0369a1"/><circle cx="10" cy="20" r="2" fill="#7dd3fc" opacity="0.6"/><rect x="30" y="18" width="10" height="4" rx="1" fill="#38bdf8"/><path d="M58,20 Q52,14 46,18 Q42,16 40,20 Q42,24 46,22 Q52,26 58,20Z" fill="#7dd3fc" stroke="#38bdf8" stroke-width="1" opacity="0.9"/><circle cx="54" cy="18" r="2" fill="#bae6fd" opacity="0.7"/><circle cx="50" cy="22" r="1.5" fill="#bae6fd" opacity="0.5"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="28" width="12" height="24" rx="3" fill="#0ea5e9" stroke="#0284c7" stroke-width="1.5"/><rect x="22" y="36" width="10" height="8" rx="2" fill="#0284c7"/><rect x="16" y="48" width="8" height="8" rx="2" fill="#0369a1"/><circle cx="20" cy="50" r="2" fill="#7dd3fc" opacity="0.6"/><rect x="18" y="20" width="4" height="10" rx="1" fill="#38bdf8"/><path d="M20,2 Q14,8 18,14 Q16,18 20,20 Q24,18 22,14 Q26,8 20,2Z" fill="#7dd3fc" stroke="#38bdf8" stroke-width="1" opacity="0.9"/><circle cx="18" cy="6" r="2" fill="#bae6fd" opacity="0.7"/><circle cx="22" cy="10" r="1.5" fill="#bae6fd" opacity="0.5"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="8" width="12" height="24" rx="3" fill="#0ea5e9" stroke="#0284c7" stroke-width="1.5"/><rect x="22" y="16" width="10" height="8" rx="2" fill="#0284c7"/><rect x="16" y="4" width="8" height="8" rx="2" fill="#0369a1"/><circle cx="20" cy="10" r="2" fill="#7dd3fc" opacity="0.6"/><rect x="18" y="30" width="4" height="10" rx="1" fill="#38bdf8"/><path d="M20,58 Q14,52 18,46 Q16,42 20,40 Q24,42 22,46 Q26,52 20,58Z" fill="#7dd3fc" stroke="#38bdf8" stroke-width="1" opacity="0.9"/><circle cx="18" cy="54" r="2" fill="#bae6fd" opacity="0.7"/><circle cx="22" cy="50" r="1.5" fill="#bae6fd" opacity="0.5"/></svg>`,
}

// ── ⚡ Lightning Bolt (rare) ───────────────────────────────────────────────────
const LIGHTNING_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="0,20 18,8 14,18 30,10 22,20 38,14 20,26 28,22 10,32" fill="#fde047" stroke="#eab308" stroke-width="1.5" stroke-linejoin="round"/><polygon points="2,20 18,10 15,18 28,12 23,20 36,15 21,25 27,22 12,30" fill="#fef9c3" opacity="0.6"/><circle cx="4" cy="20" r="3" fill="#fff" opacity="0.8"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="60,20 42,8 46,18 30,10 38,20 22,14 40,26 32,22 50,32" fill="#fde047" stroke="#eab308" stroke-width="1.5" stroke-linejoin="round"/><polygon points="58,20 42,10 45,18 32,12 37,20 24,15 39,25 33,22 48,30" fill="#fef9c3" opacity="0.6"/><circle cx="56" cy="20" r="3" fill="#fff" opacity="0.8"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,0 8,18 18,14 10,30 20,22 14,38 26,20 22,28 32,10" fill="#fde047" stroke="#eab308" stroke-width="1.5" stroke-linejoin="round"/><polygon points="20,2 10,18 17,15 12,28 20,23 15,36 25,21 22,27 30,12" fill="#fef9c3" opacity="0.6"/><circle cx="20" cy="4" r="3" fill="#fff" opacity="0.8"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,60 8,42 18,46 10,30 20,38 14,22 26,40 22,32 32,50" fill="#fde047" stroke="#eab308" stroke-width="1.5" stroke-linejoin="round"/><polygon points="20,58 10,42 17,45 12,32 20,37 15,24 25,39 22,33 30,48" fill="#fef9c3" opacity="0.6"/><circle cx="20" cy="56" r="3" fill="#fff" opacity="0.8"/></svg>`,
}

// ── ❄️ Ice Blaster (rare) ─────────────────────────────────────────────────────
const ICE_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><rect x="26" y="14" width="22" height="12" rx="2" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/><polygon points="26,16 20,18 20,22 26,24" fill="#7dd3fc" stroke="#0284c7" stroke-width="1"/><rect x="34" y="24" width="7" height="8" rx="2" fill="#0284c7"/><rect x="44" y="16" width="10" height="8" rx="3" fill="#0369a1"/><path d="M2,20 L20,20" stroke="#bae6fd" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/><path d="M4,20 L18,20" stroke="#e0f2fe" stroke-width="1" opacity="0.7"/><circle cx="4" cy="20" r="3" fill="#e0f2fe" opacity="0.6"/><text x="8" y="17" font-size="6" opacity="0.5">❄</text><text x="14" y="24" font-size="5" opacity="0.4">❄</text></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="14" width="22" height="12" rx="2" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/><polygon points="34,16 40,18 40,22 34,24" fill="#7dd3fc" stroke="#0284c7" stroke-width="1"/><rect x="19" y="24" width="7" height="8" rx="2" fill="#0284c7"/><rect x="6" y="16" width="10" height="8" rx="3" fill="#0369a1"/><path d="M40,20 L58,20" stroke="#bae6fd" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/><path d="M42,20 L56,20" stroke="#e0f2fe" stroke-width="1" opacity="0.7"/><circle cx="56" cy="20" r="3" fill="#e0f2fe" opacity="0.6"/><text x="46" y="17" font-size="6" opacity="0.5">❄</text><text x="52" y="24" font-size="5" opacity="0.4">❄</text></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="26" width="12" height="22" rx="2" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/><polygon points="16,26 18,20 22,20 24,26" fill="#7dd3fc" stroke="#0284c7" stroke-width="1"/><rect x="24" y="34" width="8" height="7" rx="2" fill="#0284c7"/><rect x="16" y="44" width="8" height="10" rx="3" fill="#0369a1"/><path d="M20,2 L20,20" stroke="#bae6fd" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/><path d="M20,4 L20,18" stroke="#e0f2fe" stroke-width="1" opacity="0.7"/><circle cx="20" cy="4" r="3" fill="#e0f2fe" opacity="0.6"/><text x="16" y="10" font-size="6" opacity="0.5">❄</text><text x="22" y="16" font-size="5" opacity="0.4">❄</text></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="12" width="12" height="22" rx="2" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/><polygon points="16,34 18,40 22,40 24,34" fill="#7dd3fc" stroke="#0284c7" stroke-width="1"/><rect x="24" y="19" width="8" height="7" rx="2" fill="#0284c7"/><rect x="16" y="6" width="8" height="10" rx="3" fill="#0369a1"/><path d="M20,40 L20,58" stroke="#bae6fd" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/><path d="M20,42 L20,56" stroke="#e0f2fe" stroke-width="1" opacity="0.7"/><circle cx="20" cy="56" r="3" fill="#e0f2fe" opacity="0.6"/><text x="16" y="48" font-size="6" opacity="0.5">❄</text><text x="22" y="54" font-size="5" opacity="0.4">❄</text></svg>`,
}

// ── 🌈 Rainbow Laser (epic) ───────────────────────────────────────────────────
const RAINBOW_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="rl" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="20%" stop-color="#f97316"/><stop offset="40%" stop-color="#fbbf24"/><stop offset="60%" stop-color="#22c55e"/><stop offset="80%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><rect x="30" y="14" width="22" height="12" rx="2" fill="#666" stroke="#444" stroke-width="1.5"/><rect x="38" y="24" width="6" height="8" rx="2" fill="#555"/><circle cx="48" cy="20" r="3" fill="#888"/><rect x="30" y="17" width="3" height="6" rx="1" fill="url(#rl)"/><rect x="4" y="18" width="28" height="4" rx="2" fill="url(#rl)" opacity="0.9"/><rect x="6" y="19" width="24" height="2" fill="#fff" opacity="0.4"/><circle cx="4" cy="20" r="4" fill="#fff" opacity="0.7"/><circle cx="4" cy="20" r="2" fill="#fff" opacity="0.9"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="rr" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="20%" stop-color="#f97316"/><stop offset="40%" stop-color="#fbbf24"/><stop offset="60%" stop-color="#22c55e"/><stop offset="80%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><rect x="8" y="14" width="22" height="12" rx="2" fill="#666" stroke="#444" stroke-width="1.5"/><rect x="16" y="24" width="6" height="8" rx="2" fill="#555"/><circle cx="12" cy="20" r="3" fill="#888"/><rect x="27" y="17" width="3" height="6" rx="1" fill="url(#rr)"/><rect x="28" y="18" width="28" height="4" rx="2" fill="url(#rr)" opacity="0.9"/><rect x="30" y="19" width="24" height="2" fill="#fff" opacity="0.4"/><circle cx="56" cy="20" r="4" fill="#fff" opacity="0.7"/><circle cx="56" cy="20" r="2" fill="#fff" opacity="0.9"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ru" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="20%" stop-color="#f97316"/><stop offset="40%" stop-color="#fbbf24"/><stop offset="60%" stop-color="#22c55e"/><stop offset="80%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><rect x="14" y="30" width="12" height="22" rx="2" fill="#666" stroke="#444" stroke-width="1.5"/><rect x="24" y="38" width="8" height="6" rx="2" fill="#555"/><circle cx="20" cy="48" r="3" fill="#888"/><rect x="17" y="30" width="6" height="3" rx="1" fill="url(#ru)"/><rect x="18" y="4" width="4" height="28" rx="2" fill="url(#ru)" opacity="0.9"/><rect x="19" y="6" width="2" height="24" fill="#fff" opacity="0.4"/><circle cx="20" cy="4" r="4" fill="#fff" opacity="0.7"/><circle cx="20" cy="4" r="2" fill="#fff" opacity="0.9"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="rd" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ef4444"/><stop offset="20%" stop-color="#f97316"/><stop offset="40%" stop-color="#fbbf24"/><stop offset="60%" stop-color="#22c55e"/><stop offset="80%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><rect x="14" y="8" width="12" height="22" rx="2" fill="#666" stroke="#444" stroke-width="1.5"/><rect x="24" y="16" width="8" height="6" rx="2" fill="#555"/><circle cx="20" cy="12" r="3" fill="#888"/><rect x="17" y="27" width="6" height="3" rx="1" fill="url(#rd)"/><rect x="18" y="28" width="4" height="28" rx="2" fill="url(#rd)" opacity="0.9"/><rect x="19" y="30" width="2" height="24" fill="#fff" opacity="0.4"/><circle cx="20" cy="56" r="4" fill="#fff" opacity="0.7"/><circle cx="20" cy="56" r="2" fill="#fff" opacity="0.9"/></svg>`,
}

// ── 🚀 Rocket Launcher (epic) ─────────────────────────────────────────────────
const ROCKET_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M4,20 Q4,12 20,10 L38,14 L38,26 Q20,30 4,20Z" fill="#e0e7ff" stroke="#818cf8" stroke-width="1.5"/><path d="M4,20 Q4,14 16,12 L30,14 L30,26 Q16,28 4,20Z" fill="#c7d2fe"/><polygon points="38,12 46,14 46,26 38,28" fill="#ef4444" stroke="#dc2626" stroke-width="1"/><polygon points="38,12 34,6 34,14" fill="#6366f1"/><polygon points="38,28 34,34 34,26" fill="#6366f1"/><circle cx="32" cy="20" r="3" fill="#38bdf8" stroke="#818cf8" stroke-width="0.5"/><ellipse cx="50" cy="20" rx="5" ry="4" fill="#f97316" opacity="0.8"/><ellipse cx="54" cy="20" rx="3" ry="2.5" fill="#fbbf24" opacity="0.9"/><ellipse cx="56" cy="20" rx="1.5" ry="1" fill="#fff" opacity="0.8"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M56,20 Q56,12 40,10 L22,14 L22,26 Q40,30 56,20Z" fill="#e0e7ff" stroke="#818cf8" stroke-width="1.5"/><path d="M56,20 Q56,14 44,12 L30,14 L30,26 Q44,28 56,20Z" fill="#c7d2fe"/><polygon points="22,12 14,14 14,26 22,28" fill="#ef4444" stroke="#dc2626" stroke-width="1"/><polygon points="22,12 26,6 26,14" fill="#6366f1"/><polygon points="22,28 26,34 26,26" fill="#6366f1"/><circle cx="28" cy="20" r="3" fill="#38bdf8" stroke="#818cf8" stroke-width="0.5"/><ellipse cx="10" cy="20" rx="5" ry="4" fill="#f97316" opacity="0.8"/><ellipse cx="6" cy="20" rx="3" ry="2.5" fill="#fbbf24" opacity="0.9"/><ellipse cx="4" cy="20" rx="1.5" ry="1" fill="#fff" opacity="0.8"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><path d="M20,4 Q12,4 10,20 L14,38 L26,38 Q30,20 20,4Z" fill="#e0e7ff" stroke="#818cf8" stroke-width="1.5"/><path d="M20,4 Q14,4 12,16 L14,30 L26,30 Q28,16 20,4Z" fill="#c7d2fe"/><polygon points="12,38 14,46 26,46 28,38" fill="#ef4444" stroke="#dc2626" stroke-width="1"/><polygon points="12,38 6,34 14,34" fill="#6366f1"/><polygon points="28,38 34,34 26,34" fill="#6366f1"/><circle cx="20" cy="32" r="3" fill="#38bdf8" stroke="#818cf8" stroke-width="0.5"/><ellipse cx="20" cy="50" rx="4" ry="5" fill="#f97316" opacity="0.8"/><ellipse cx="20" cy="54" rx="2.5" ry="3" fill="#fbbf24" opacity="0.9"/><ellipse cx="20" cy="56" rx="1" ry="1.5" fill="#fff" opacity="0.8"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><path d="M20,56 Q12,56 10,40 L14,22 L26,22 Q30,40 20,56Z" fill="#e0e7ff" stroke="#818cf8" stroke-width="1.5"/><path d="M20,56 Q14,56 12,44 L14,30 L26,30 Q28,44 20,56Z" fill="#c7d2fe"/><polygon points="12,22 14,14 26,14 28,22" fill="#ef4444" stroke="#dc2626" stroke-width="1"/><polygon points="12,22 6,26 14,26" fill="#6366f1"/><polygon points="28,22 34,26 26,26" fill="#6366f1"/><circle cx="20" cy="28" r="3" fill="#38bdf8" stroke="#818cf8" stroke-width="0.5"/><ellipse cx="20" cy="10" rx="4" ry="5" fill="#f97316" opacity="0.8"/><ellipse cx="20" cy="6" rx="2.5" ry="3" fill="#fbbf24" opacity="0.9"/><ellipse cx="20" cy="4" rx="1" ry="1.5" fill="#fff" opacity="0.8"/></svg>`,
}

// ── ⭐ Star Shooter (epic) ────────────────────────────────────────────────────
const STAR_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="0,20 14,14 10,20 14,26" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><line x1="14" y1="20" x2="30" y2="20" stroke="#fbbf24" stroke-width="2.5"/><polygon points="38,20 34,10 40,16 48,8 42,18 54,14 44,22 54,26 42,22 48,32 40,24 34,30" fill="#fde047" stroke="#f59e0b" stroke-width="1"/><polygon points="38,20 36,15 40,18 44,12 42,19 48,18 43,22 48,24 42,22 44,28 40,23 36,26" fill="#fef9c3" opacity="0.7"/><circle cx="38" cy="20" r="4" fill="#fff" opacity="0.4"/></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><polygon points="60,20 46,14 50,20 46,26" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><line x1="30" y1="20" x2="46" y2="20" stroke="#fbbf24" stroke-width="2.5"/><polygon points="22,20 26,10 20,16 12,8 18,18 6,14 16,22 6,26 18,22 12,32 20,24 26,30" fill="#fde047" stroke="#f59e0b" stroke-width="1"/><polygon points="22,20 24,15 20,18 16,12 18,19 12,18 17,22 12,24 18,22 16,28 20,23 24,26" fill="#fef9c3" opacity="0.7"/><circle cx="22" cy="20" r="4" fill="#fff" opacity="0.4"/></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,0 14,14 20,10 26,14" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><line x1="20" y1="14" x2="20" y2="30" stroke="#fbbf24" stroke-width="2.5"/><polygon points="20,38 10,34 16,40 8,48 18,42 14,54 22,44 26,54 22,42 32,48 24,40 30,34" fill="#fde047" stroke="#f59e0b" stroke-width="1"/><polygon points="20,38 15,36 18,40 12,44 19,42 18,48 22,43 24,48 22,42 28,44 23,40 26,36" fill="#fef9c3" opacity="0.7"/><circle cx="20" cy="38" r="4" fill="#fff" opacity="0.4"/></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><polygon points="20,60 14,46 20,50 26,46" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><line x1="20" y1="30" x2="20" y2="46" stroke="#fbbf24" stroke-width="2.5"/><polygon points="20,22 10,26 16,20 8,12 18,18 14,6 22,16 26,6 22,18 32,12 24,20 30,26" fill="#fde047" stroke="#f59e0b" stroke-width="1"/><polygon points="20,22 15,24 18,20 12,16 19,18 18,12 22,17 24,12 22,18 28,16 23,20 26,24" fill="#fef9c3" opacity="0.7"/><circle cx="20" cy="22" r="4" fill="#fff" opacity="0.4"/></svg>`,
}

// ── 🐉 Dragon Breath (legendary) ─────────────────────────────────────────────
const DRAGON_SVGS = {
  left:  `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M4,20 Q4,8 22,8 L36,12 Q42,14 42,20 Q42,26 36,28 L22,32 Q4,32 4,20Z" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/><path d="M8,20 Q8,12 20,12 L32,14 Q36,16 36,20 Q36,24 32,26 L20,28 Q8,28 8,20Z" fill="#ef4444" opacity="0.7"/><path d="M42,18 Q48,12 54,14 Q50,16 56,18 Q50,20 56,22 Q50,24 54,26 Q48,28 42,22Z" fill="#f97316" opacity="0.9"/><path d="M44,19 Q48,16 52,18 Q48,20 52,22 Q48,24 44,21Z" fill="#fbbf24" opacity="0.7"/><text x="16" y="24" font-size="12">🐉</text></svg>`,
  right: `<svg viewBox="0 0 60 40" width="48" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M56,20 Q56,8 38,8 L24,12 Q18,14 18,20 Q18,26 24,28 L38,32 Q56,32 56,20Z" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/><path d="M52,20 Q52,12 40,12 L28,14 Q24,16 24,20 Q24,24 28,26 L40,28 Q52,28 52,20Z" fill="#ef4444" opacity="0.7"/><path d="M18,18 Q12,12 6,14 Q10,16 4,18 Q10,20 4,22 Q10,24 6,26 Q12,28 18,22Z" fill="#f97316" opacity="0.9"/><path d="M16,19 Q12,16 8,18 Q12,20 8,22 Q12,24 16,21Z" fill="#fbbf24" opacity="0.7"/><text x="32" y="24" font-size="12">🐉</text></svg>`,
  up:    `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><path d="M20,4 Q8,4 8,22 L12,36 Q14,42 20,42 Q26,42 28,36 L32,22 Q32,4 20,4Z" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/><path d="M20,8 Q12,8 12,20 L14,32 Q16,36 20,36 Q24,36 26,32 L28,20 Q28,8 20,8Z" fill="#ef4444" opacity="0.7"/><path d="M18,42 Q12,48 14,54 Q16,50 18,56 Q20,50 22,56 Q24,50 26,54 Q28,48 22,42Z" fill="#f97316" opacity="0.9"/><path d="M19,44 Q16,48 18,52 Q20,48 22,52 Q24,48 21,44Z" fill="#fbbf24" opacity="0.7"/><text x="14" y="28" font-size="10">🐉</text></svg>`,
  down:  `<svg viewBox="0 0 40 60" width="32" height="48" xmlns="http://www.w3.org/2000/svg"><path d="M20,56 Q8,56 8,38 L12,24 Q14,18 20,18 Q26,18 28,24 L32,38 Q32,56 20,56Z" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/><path d="M20,52 Q12,52 12,40 L14,28 Q16,24 20,24 Q24,24 26,28 L28,40 Q28,52 20,52Z" fill="#ef4444" opacity="0.7"/><path d="M18,18 Q12,12 14,6 Q16,10 18,4 Q20,10 22,4 Q24,10 26,6 Q28,12 22,18Z" fill="#f97316" opacity="0.9"/><path d="M19,16 Q16,12 18,8 Q20,12 22,8 Q24,12 21,16Z" fill="#fbbf24" opacity="0.7"/><text x="14" y="42" font-size="10">🐉</text></svg>`,
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
