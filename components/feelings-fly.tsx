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
