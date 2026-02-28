"use client"
// Feelings Fly — Bunny Fly for Feelings Color World (Songs 18-20)
// Phase 1: Colors → Phase 2: Emotions & Needs
import VocabFly, { VocabFlyProps } from "./vocab-fly"

const PHASE1_WORDS = [
  { spanish: "rojo",      english: "red"       },
  { spanish: "naranja",   english: "orange"    },
  { spanish: "amarillo",  english: "yellow"    },
  { spanish: "verde",     english: "green"     },
  { spanish: "azul",      english: "blue"      },
  { spanish: "morado",    english: "purple"    },
  { spanish: "blanco",    english: "white"     },
  { spanish: "negro",     english: "black"     },
  { spanish: "gris",      english: "gray"      },
  { spanish: "arco iris", english: "rainbow"   },
  { spanish: "mariposa",  english: "butterfly" },
  { spanish: "sol",       english: "sun"       },
  { spanish: "hoja",      english: "leaf"      },
  { spanish: "uva",       english: "grape"     },
  { spanish: "nube",      english: "cloud"     },
  { spanish: "piedra",    english: "stone"     },
]

const PHASE2_WORDS = [
  { spanish: "feliz",        english: "happy"     },
  { spanish: "triste",       english: "sad"       },
  { spanish: "enojado",      english: "angry"     },
  { spanish: "cansado",      english: "tired"     },
  { spanish: "sorprendido",  english: "surprised" },
  { spanish: "aburrido",     english: "bored"     },
  { spanish: "contento",     english: "content"   },
  { spanish: "nervioso",     english: "nervous"   },
  { spanish: "sed",          english: "thirsty"   },
  { spanish: "hambre",       english: "hungry"    },
  { spanish: "frío",         english: "cold"      },
  { spanish: "calor",        english: "hot"       },
  { spanish: "miedo",        english: "afraid"    },
  { spanish: "descansar",    english: "rest"      },
  { spanish: "prisa",        english: "in a hurry"},
]

// ── Color-sky map — each word gets its own themed gradient background ──────────
const COLOR_MAP: Record<string, string> = {
  // Pure colors
  rojo:        "linear-gradient(180deg,#450a0a 0%,#7f1d1d 30%,#dc2626 70%,#f87171 100%)",
  naranja:     "linear-gradient(180deg,#431407 0%,#9a3412 30%,#ea580c 70%,#fb923c 100%)",
  amarillo:    "linear-gradient(180deg,#422006 0%,#713f12 30%,#ca8a04 70%,#fde047 100%)",
  verde:       "linear-gradient(180deg,#052e16 0%,#14532d 30%,#16a34a 70%,#4ade80 100%)",
  azul:        "linear-gradient(180deg,#172554 0%,#1e3a8a 30%,#2563eb 70%,#60a5fa 100%)",
  morado:      "linear-gradient(180deg,#2e1065 0%,#4c1d95 30%,#7c3aed 70%,#c084fc 100%)",
  blanco:      "linear-gradient(180deg,#1e293b 0%,#475569 30%,#94a3b8 70%,#e2e8f0 100%)",
  negro:       "linear-gradient(180deg,#000000 0%,#0f172a 30%,#1e293b 70%,#334155 100%)",
  gris:        "linear-gradient(180deg,#0f172a 0%,#1e293b 30%,#475569 70%,#94a3b8 100%)",
  // Rainbow — full spectrum sweep
  "arco iris": "linear-gradient(180deg,#172554 0%,#4c1d95 18%,#6d28d9 30%,#1d4ed8 42%,#065f46 54%,#92400e 66%,#b91c1c 78%,#be185d 100%)",
  // Nature-associated colors
  mariposa:    "linear-gradient(180deg,#1e1b4b 0%,#312e81 30%,#4f46e5 70%,#a5b4fc 100%)",   // butterfly = indigo/violet
  sol:         "linear-gradient(180deg,#1c1917 0%,#78350f 30%,#d97706 70%,#fbbf24 100%)",   // sun = golden amber
  hoja:        "linear-gradient(180deg,#052e16 0%,#166534 30%,#15803d 70%,#86efac 100%)",   // leaf = forest green
  uva:         "linear-gradient(180deg,#1e0a3c 0%,#581c87 30%,#9333ea 70%,#d8b4fe 100%)",  // grape = deep purple
  nube:        "linear-gradient(180deg,#0c4a6e 0%,#0369a1 30%,#38bdf8 70%,#e0f2fe 100%)",  // cloud = sky blue→white
  piedra:      "linear-gradient(180deg,#0f172a 0%,#292524 30%,#57534e 70%,#a8a29e 100%)",  // stone = warm gray
}

const config: Omit<VocabFlyProps, "coins" | "onCoinsChange" | "onClose"> = {
  title: "Feelings Fly",
  icon: "🌈",
  phase1: {
    words: PHASE1_WORDS,
    speedBase: 0.28, speedVariance: 0.10, waveInterval: 4200,
    label: "Colors",
    bgGradient: "linear-gradient(180deg,#1a0a00 0%,#431407 30%,#9a3412 65%,#ea580c 100%)",
    bubbleBg: "#fed7aa", bubbleText: "#9a3412",
    progressGrad: "linear-gradient(90deg,#fb923c,#ea580c)",
    badgeColor: "rgba(154,52,18,0.5)",
    colorMap: COLOR_MAP,
  },
  phase2: {
    words: PHASE2_WORDS,
    speedBase: 0.36, speedVariance: 0.12, waveInterval: 3600,
    label: "Feelings",
    bgGradient: "linear-gradient(180deg,#1a0033 0%,#4a0072 30%,#7e22ce 65%,#a855f7 100%)",
    bubbleBg: "#fbcfe8", bubbleText: "#9d174d",
    progressGrad: "linear-gradient(90deg,#e879f9,#a855f7)",
    badgeColor: "rgba(126,34,206,0.5)",
  },
  transitionMsg: "Now: Feelings & Needs! 😊",
  transitionIcon: "😊",
  accentColor: "linear-gradient(135deg,#ea580c,#a855f7)",
}

interface Props { coins: number; onCoinsChange: (delta: number) => void; onClose: () => void }
export default function FeelingsFly({ coins, onCoinsChange, onClose }: Props) {
  return <VocabFly {...config} coins={coins} onCoinsChange={onCoinsChange} onClose={onClose} />
}
