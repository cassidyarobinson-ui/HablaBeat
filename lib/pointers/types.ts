// ─────────────────────────────────────────────────────────────────────────────
// lib/pointers/types.ts
// Central type definitions for the modular pointer system.
// ─────────────────────────────────────────────────────────────────────────────

export type PointerRarity = "common" | "rare" | "epic" | "legendary"

export type ProjectileType =
  | "beam"        // instant line from arrow to bubble
  | "projectile"  // visible object that travels
  | "burst"       // radial explosion at hit zone
  | "spark"       // scatter particles
  | "wave"        // expanding ring

export type VisualEffect =
  | "sparkle_burst"
  | "laser_beam_up"
  | "banana_spin"
  | "water_splash"
  | "chain_arc"
  | "freeze_shatter"
  | "rainbow_beam"
  | "rocket_trail"
  | "star_shower"
  | "dragon_flame"

export interface GameplayModifier {
  /** Multiplier on the ±MISS window radius (1.0 = no change). Keep 0.95–1.10. */
  hitRadiusMultiplier: number
  /** Flat combo bonus added on each perfect hit. Max 1. */
  comboBoost: number
  /** Extra seconds of timing forgiveness. Max 0.03s. */
  timingForgiveness: number
  /** Multiplier on coins earned per hit. 1.0 = no change. */
  coinMultiplier: number
  /** If true, the first miss per song does not break combo. Once per level. */
  comboShield: boolean
  /** 0–1 probability a perfect hit chains to the next note in the same lane. */
  chainChance: number
  /** Milliseconds the next incoming note in the lane is slowed after a perfect. */
  laneSlowMs: number
  /** Fill combo meter X% faster (0 = no effect). */
  comboMeterBoost: number
}

export interface PointerConfig {
  id: string
  name: string
  rarity: PointerRarity
  price: number
  emoji: string
  description: string
  flavorText: string
  projectileType: ProjectileType
  visualEffect: VisualEffect
  /** Arrow SVGs keyed by direction */
  svgs: {
    left: string
    right: string
    up: string
    down: string
  }
  /** Colors used by the effect engine */
  palette: string[]
  gameplayModifier: GameplayModifier
}

/** The game state slice the modifier system reads/writes */
export interface ModifierContext {
  hitWindowMs: number
  comboCount: number
  comboShieldUsed: boolean
  scoreMultiplier: number
}
