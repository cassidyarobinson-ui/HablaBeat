"use client"
import { useEffect, useRef } from "react"
import type { PadButton } from "./use-gamepad"

interface UseKeyboardNavOptions {
  onPress?: (button: PadButton) => void
  enabled?: boolean
}

/**
 * Translates keyboard arrow keys into PadButton events,
 * matching the useGamepad interface so both inputs share one handler.
 */
export function useKeyboardNav({ onPress, enabled = true }: UseKeyboardNavOptions) {
  const onPressRef = useRef(onPress)
  const lastFireRef = useRef(0)
  onPressRef.current = onPress

  useEffect(() => {
    if (!enabled) return

    const handleKey = (e: KeyboardEvent) => {
      let btn: PadButton | null = null
      switch (e.key) {
        case "ArrowUp":    btn = "up"; break
        case "ArrowDown":  btn = "down"; break
        case "ArrowLeft":  btn = "left"; break
        case "ArrowRight": btn = "right"; break
        case "Enter":
        case " ":          btn = "start"; break
        case "Escape":
        case "Backspace":  btn = "select"; break
        default: return
      }

      e.preventDefault()

      // Throttle repeats to 180ms
      const now = Date.now()
      if (now - lastFireRef.current < 180) return
      lastFireRef.current = now

      onPressRef.current?.(btn)
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [enabled])
}
