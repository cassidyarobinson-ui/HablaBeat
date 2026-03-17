"use client"
import { useEffect, useRef, useCallback } from "react"

export type PadDirection = "up" | "down" | "left" | "right"
export type PadButton = PadDirection | "start" | "select"

/**
 * Maps common DDR dance mat button layouts.
 * Most USB dance mats report as standard gamepads with one of these mappings:
 *  - Standard mapping: d-pad buttons 12(up) 13(down) 14(left) 15(right)
 *  - Alt mapping: buttons 0-3 (varies by manufacturer)
 *  - Axis-based: axes[0] for left/right, axes[1] for up/down (some older mats)
 */
function readPadState(gp: Gamepad): Record<PadButton, boolean> {
  const b = gp.buttons
  const axes = gp.axes

  // Standard gamepad d-pad (buttons 12-15)
  const stdUp    = b[12]?.pressed ?? false
  const stdDown  = b[13]?.pressed ?? false
  const stdLeft  = b[14]?.pressed ?? false
  const stdRight = b[15]?.pressed ?? false

  // Alt mapping (buttons 0-3, common on cheap dance mats)
  const altUp    = b[0]?.pressed ?? false
  const altRight = b[1]?.pressed ?? false
  const altDown  = b[2]?.pressed ?? false
  const altLeft  = b[3]?.pressed ?? false

  // Axis-based (some mats use analog axes)
  const axisLeft  = (axes[0] ?? 0) < -0.5
  const axisRight = (axes[0] ?? 0) > 0.5
  const axisUp    = (axes[1] ?? 0) < -0.5
  const axisDown  = (axes[1] ?? 0) > 0.5

  // Axis-based secondary (axes 9 is used by some dance mats for d-pad)
  const ax9 = axes[9] ?? 2 // default to neutral
  const ax9Up    = ax9 > -1.1 && ax9 < -0.9
  const ax9Right = ax9 > -0.5 && ax9 < -0.3
  const ax9Down  = ax9 > 0.1 && ax9 < 0.3
  const ax9Left  = ax9 > 0.6 && ax9 < 0.8

  return {
    up:     stdUp    || altUp    || axisUp    || ax9Up,
    down:   stdDown  || altDown  || axisDown  || ax9Down,
    left:   stdLeft  || altLeft  || axisLeft  || ax9Left,
    right:  stdRight || altRight || axisRight || ax9Right,
    start:  b[9]?.pressed ?? false,
    select: b[8]?.pressed ?? false,
  }
}

interface UseGamepadOptions {
  /** Called on button-down edge (rising edge). Good for menu navigation & DDR hits. */
  onPress?: (button: PadButton) => void
  /** Called on button-up edge (falling edge). */
  onRelease?: (button: PadButton) => void
  /** Called every frame with current held state. Good for fly game continuous movement. */
  onHeld?: (held: Record<PadButton, boolean>) => void
  /** Set false to disable polling (e.g. when component is unmounted or paused) */
  enabled?: boolean
}

export function useGamepad({ onPress, onRelease, onHeld, enabled = true }: UseGamepadOptions) {
  const prevState = useRef<Record<PadButton, boolean>>({
    up: false, down: false, left: false, right: false, start: false, select: false,
  })
  const rafId = useRef<number>(0)
  const onPressRef = useRef(onPress)
  const onReleaseRef = useRef(onRelease)
  const onHeldRef = useRef(onHeld)

  // Keep callback refs fresh without re-triggering effect
  onPressRef.current = onPress
  onReleaseRef.current = onRelease
  onHeldRef.current = onHeld

  useEffect(() => {
    if (!enabled) return

    const poll = () => {
      const gamepads = navigator.getGamepads?.() ?? []
      // Merge state from all connected gamepads (user might have multiple)
      const merged: Record<PadButton, boolean> = {
        up: false, down: false, left: false, right: false, start: false, select: false,
      }
      for (const gp of gamepads) {
        if (!gp) continue
        const state = readPadState(gp)
        for (const key of Object.keys(state) as PadButton[]) {
          if (state[key]) merged[key] = true
        }
      }

      const prev = prevState.current
      const buttons: PadButton[] = ["up", "down", "left", "right", "start", "select"]

      for (const btn of buttons) {
        if (merged[btn] && !prev[btn]) {
          onPressRef.current?.(btn)
        }
        if (!merged[btn] && prev[btn]) {
          onReleaseRef.current?.(btn)
        }
      }

      onHeldRef.current?.(merged)
      prevState.current = merged
      rafId.current = requestAnimationFrame(poll)
    }

    rafId.current = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(rafId.current)
  }, [enabled])
}
