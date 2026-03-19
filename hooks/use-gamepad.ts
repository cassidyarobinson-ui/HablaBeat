"use client"
import { useEffect, useRef, useCallback } from "react"

export type PadDirection = "up" | "down" | "left" | "right"
export type PadButton = PadDirection | "start" | "select"

/**
 * Maps common DDR dance mat button layouts.
 * USB dance mats vary wildly — we check buttons, axes, and log raw data
 * so the user can tell us what their specific pad sends.
 */

let debugLogTimer = 0

function readPadState(gp: Gamepad, debug: boolean = false): Record<PadButton, boolean> {
  const b = gp.buttons
  const axes = gp.axes

  // Log raw data for debugging (throttled to every 500ms)
  if (debug) {
    const now = Date.now()
    if (now - debugLogTimer > 500) {
      const pressed = b.map((btn, i) => btn.pressed ? i : null).filter(i => i !== null)
      const activeAxes = axes.map((v, i) => Math.abs(v) > 0.1 ? `ax${i}=${v.toFixed(2)}` : null).filter(Boolean)
      if (pressed.length > 0 || activeAxes.length > 0) {
        console.log(`🎮 [${gp.id}] buttons: [${pressed.join(',')}] axes: [${activeAxes.join(', ')}]`)
        debugLogTimer = now
      }
    }
  }

  // Standard gamepad d-pad (buttons 12-15)
  const stdUp    = b[12]?.pressed ?? false
  const stdDown  = b[13]?.pressed ?? false
  const stdLeft  = b[14]?.pressed ?? false
  const stdRight = b[15]?.pressed ?? false

  // Alt mapping A (buttons 0-3, common on cheap dance mats)
  const altUp    = b[0]?.pressed ?? false
  const altRight = b[1]?.pressed ?? false
  const altDown  = b[2]?.pressed ?? false
  const altLeft  = b[3]?.pressed ?? false

  // Alt mapping B (some mats use 4-7)
  const alt2Up    = b[4]?.pressed ?? false
  const alt2Right = b[5]?.pressed ?? false
  const alt2Down  = b[6]?.pressed ?? false
  const alt2Left  = b[7]?.pressed ?? false

  // Axis-based (some mats use analog axes for d-pad)
  const axisLeft  = (axes[0] ?? 0) < -0.5
  const axisRight = (axes[0] ?? 0) > 0.5
  const axisUp    = (axes[1] ?? 0) < -0.5
  const axisDown  = (axes[1] ?? 0) > 0.5

  // Axis-based secondary (some mats use axes[2]/axes[5] or axes[9])
  const axisLeft2  = (axes[2] ?? 0) < -0.5
  const axisRight2 = (axes[2] ?? 0) > 0.5
  const axisUp2    = (axes[5] ?? 0) < -0.5
  const axisDown2  = (axes[5] ?? 0) > 0.5

  // Axis 9 (used by some dance mats for d-pad as hat switch)
  const ax9 = axes[9] ?? 2 // default to neutral
  const ax9Up    = ax9 > -1.1 && ax9 < -0.9
  const ax9Right = ax9 > -0.5 && ax9 < -0.3
  const ax9Down  = ax9 > 0.1 && ax9 < 0.3
  const ax9Left  = ax9 > 0.6 && ax9 < 0.8

  return {
    up:     stdUp    || altUp    || alt2Up    || axisUp    || axisUp2    || ax9Up,
    down:   stdDown  || altDown  || alt2Down  || axisDown  || axisDown2  || ax9Down,
    left:   stdLeft  || altLeft  || alt2Left  || axisLeft  || axisLeft2  || ax9Left,
    right:  stdRight || altRight || alt2Right || axisRight || axisRight2 || ax9Right,
    start:  b[9]?.pressed ?? b[7]?.pressed ?? false,
    select: b[8]?.pressed ?? b[6]?.pressed ?? false,
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
  /** Enable debug logging to console */
  debug?: boolean
}

export function useGamepad({ onPress, onRelease, onHeld, enabled = true, debug = false }: UseGamepadOptions) {
  const prevState = useRef<Record<PadButton, boolean>>({
    up: false, down: false, left: false, right: false, start: false, select: false,
  })
  const rafId = useRef<number>(0)
  const onPressRef = useRef(onPress)
  const onReleaseRef = useRef(onRelease)
  const onHeldRef = useRef(onHeld)
  const hasLoggedConnection = useRef(false)

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
      let foundGamepad = false
      for (const gp of gamepads) {
        if (!gp) continue
        foundGamepad = true
        if (!hasLoggedConnection.current) {
          console.log(`🎮 Dance pad connected: "${gp.id}" | ${gp.buttons.length} buttons, ${gp.axes.length} axes`)
          hasLoggedConnection.current = true
        }
        const state = readPadState(gp, debug)
        for (const key of Object.keys(state) as PadButton[]) {
          if (state[key]) merged[key] = true
        }
      }

      const prev = prevState.current
      const buttons: PadButton[] = ["up", "down", "left", "right", "start", "select"]

      for (const btn of buttons) {
        if (merged[btn] && !prev[btn]) {
          if (debug) console.log(`🎮 PRESS: ${btn}`)
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
  }, [enabled, debug])
}
