"use client"
import { useEffect, useRef } from "react"

export type PadDirection = "up" | "down" | "left" | "right"
export type PadButton = PadDirection | "start" | "select"

/**
 * Custom pad mapping — maps a raw input identifier to a direction.
 * Raw input identifiers are like "b0" (button 0), "a0-" (axis 0 negative), "a9=0.71" (axis 9 hat value).
 * Stored in localStorage so it persists across sessions.
 */
export interface PadMapping {
  up: string
  down: string
  left: string
  right: string
}

const PAD_MAPPING_KEY = "hablabeat-pad-mapping"

export function loadPadMapping(): PadMapping | null {
  try {
    const raw = localStorage.getItem(PAD_MAPPING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.up && parsed.down && parsed.left && parsed.right) return parsed
    return null
  } catch { return null }
}

export function savePadMapping(mapping: PadMapping) {
  localStorage.setItem(PAD_MAPPING_KEY, JSON.stringify(mapping))
}

export function clearPadMapping() {
  localStorage.removeItem(PAD_MAPPING_KEY)
}

let debugLogTimer = 0

/**
 * Get all currently-active raw input identifiers from a gamepad.
 * Returns strings like "b0", "b3", "a0-", "a1+", "a9=0.71"
 */
export function getRawPressedInputs(gp: Gamepad): string[] {
  const result: string[] = []
  // Buttons
  for (let i = 0; i < gp.buttons.length; i++) {
    if (gp.buttons[i].pressed) result.push(`b${i}`)
  }
  // Axes
  for (let i = 0; i < gp.axes.length; i++) {
    const v = gp.axes[i]
    if (v < -0.5) result.push(`a${i}-`)
    else if (v > 0.5) result.push(`a${i}+`)
  }
  return result
}

/**
 * Read pad state using a custom mapping (if available) or fall back to defaults.
 */
function readPadState(gp: Gamepad, debug: boolean = false, mapping: PadMapping | null = null): Record<PadButton, boolean> {
  const b = gp.buttons
  const axes = gp.axes

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

  // If we have a custom mapping, use it
  if (mapping) {
    const check = (id: string): boolean => {
      if (id.startsWith("b")) {
        const idx = parseInt(id.slice(1))
        return b[idx]?.pressed ?? false
      }
      if (id.startsWith("a")) {
        const rest = id.slice(1)
        if (rest.endsWith("-")) {
          const idx = parseInt(rest.slice(0, -1))
          return (axes[idx] ?? 0) < -0.5
        }
        if (rest.endsWith("+")) {
          const idx = parseInt(rest.slice(0, -1))
          return (axes[idx] ?? 0) > 0.5
        }
      }
      return false
    }
    return {
      up: check(mapping.up),
      down: check(mapping.down),
      left: check(mapping.left),
      right: check(mapping.right),
      start: b[9]?.pressed ?? b[7]?.pressed ?? false,
      select: b[8]?.pressed ?? b[6]?.pressed ?? false,
    }
  }

  // Default mappings — try all common layouts

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

  // Axis-based secondary (some mats use axes[2]/axes[5])
  const axisLeft2  = (axes[2] ?? 0) < -0.5
  const axisRight2 = (axes[2] ?? 0) > 0.5
  const axisUp2    = (axes[5] ?? 0) < -0.5
  const axisDown2  = (axes[5] ?? 0) > 0.5

  // Axis 9 (used by some dance mats for d-pad as hat switch)
  const ax9 = axes[9] ?? 2
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
  onPress?: (button: PadButton) => void
  onRelease?: (button: PadButton) => void
  onHeld?: (held: Record<PadButton, boolean>) => void
  /** Called with raw button/axis info string whenever any input is detected */
  onRawInput?: (info: string) => void
  /** Called with raw input identifiers (e.g. "b0", "a1-") on new press */
  onRawPress?: (inputs: string[]) => void
  enabled?: boolean
  debug?: boolean
  /** Custom pad mapping — overrides default button detection */
  padMapping?: PadMapping | null
}

export function useGamepad({ onPress, onRelease, onHeld, onRawInput, onRawPress, enabled = true, debug = false, padMapping = null }: UseGamepadOptions) {
  const prevState = useRef<Record<PadButton, boolean>>({
    up: false, down: false, left: false, right: false, start: false, select: false,
  })
  const prevRawInputs = useRef<Set<string>>(new Set())
  const onPressRef = useRef(onPress)
  const onReleaseRef = useRef(onRelease)
  const onHeldRef = useRef(onHeld)
  const onRawInputRef = useRef(onRawInput)
  const onRawPressRef = useRef(onRawPress)
  const debugRef = useRef(debug)
  const mappingRef = useRef(padMapping)

  onPressRef.current = onPress
  onReleaseRef.current = onRelease
  onHeldRef.current = onHeld
  onRawInputRef.current = onRawInput
  onRawPressRef.current = onRawPress
  debugRef.current = debug
  mappingRef.current = padMapping

  // Listen for gamepad connect/disconnect events
  useEffect(() => {
    const onConnect = (e: GamepadEvent) => {
      console.log(`🎮 Dance pad CONNECTED: "${e.gamepad.id}" | ${e.gamepad.buttons.length} buttons, ${e.gamepad.axes.length} axes`)
    }
    const onDisconnect = (e: GamepadEvent) => {
      console.log(`🎮 Dance pad DISCONNECTED: "${e.gamepad.id}"`)
    }
    window.addEventListener("gamepadconnected", onConnect)
    window.addEventListener("gamepaddisconnected", onDisconnect)
    return () => {
      window.removeEventListener("gamepadconnected", onConnect)
      window.removeEventListener("gamepaddisconnected", onDisconnect)
    }
  }, [])

  // Poll using BOTH requestAnimationFrame AND setInterval as fallback
  useEffect(() => {
    if (!enabled) return

    const poll = () => {
      const gamepads = navigator.getGamepads?.() ?? []
      const merged: Record<PadButton, boolean> = {
        up: false, down: false, left: false, right: false, start: false, select: false,
      }
      const allRawInputs: string[] = []
      for (const gp of gamepads) {
        if (!gp) continue
        // Report raw button/axis data for debugging
        const pressed = gp.buttons.map((btn, i) => btn.pressed ? i : null).filter(i => i !== null)
        const values = gp.buttons.map((btn, i) => btn.value > 0.1 ? `b${i}=${btn.value.toFixed(1)}` : null).filter(Boolean)
        const activeAxes = gp.axes.map((v, i) => Math.abs(v) > 0.1 ? `a${i}=${v.toFixed(2)}` : null).filter(Boolean)
        if (pressed.length > 0 || values.length > 0 || activeAxes.length > 0) {
          onRawInputRef.current?.(`BTN:[${pressed.join(',')}] VAL:[${values.join(',')}] AX:[${activeAxes.join(',')}]`)
        }

        // Collect raw inputs for calibration
        const rawInputs = getRawPressedInputs(gp)
        allRawInputs.push(...rawInputs)

        const state = readPadState(gp, debugRef.current, mappingRef.current)
        for (const key of Object.keys(state) as PadButton[]) {
          if (state[key]) merged[key] = true
        }
      }

      // Detect new raw presses for calibration
      const prevRaw = prevRawInputs.current
      const newRaw = allRawInputs.filter(id => !prevRaw.has(id))
      if (newRaw.length > 0) {
        onRawPressRef.current?.(newRaw)
      }
      prevRawInputs.current = new Set(allRawInputs)

      const prev = prevState.current
      const buttons: PadButton[] = ["up", "down", "left", "right", "start", "select"]

      for (const btn of buttons) {
        if (merged[btn] && !prev[btn]) {
          if (debugRef.current) console.log(`🎮 PRESS: ${btn}`)
          onPressRef.current?.(btn)
        }
        if (!merged[btn] && prev[btn]) {
          onReleaseRef.current?.(btn)
        }
      }

      onHeldRef.current?.(merged)
      prevState.current = { ...merged }
    }

    // Primary: requestAnimationFrame for low-latency in-game polling
    let rafId = 0
    const rafLoop = () => {
      poll()
      rafId = requestAnimationFrame(rafLoop)
    }
    rafId = requestAnimationFrame(rafLoop)

    // Fallback: setInterval at ~60fps to catch inputs if rAF stalls
    const intervalId = setInterval(poll, 16)

    return () => {
      cancelAnimationFrame(rafId)
      clearInterval(intervalId)
    }
  }, [enabled])
}
