"use client"
// Travel Fly — Bunny Fly for Travel World (Songs 11-13)
// Phase 1: My House (En Mi Casa) → Phase 2: Places & Directions
import VocabFly, { VocabFlyProps } from "./vocab-fly"

const PHASE1_WORDS = [
  { spanish: "sillón",    english: "armchair"  },
  { spanish: "taza",      english: "cup"       },
  { spanish: "mesa",      english: "table"     },
  { spanish: "sartén",    english: "pan"       },
  { spanish: "vitrina",   english: "cabinet"   },
  { spanish: "plato",     english: "plate"     },
  { spanish: "hornilla",  english: "stove"     },
  { spanish: "jabón",     english: "soap"      },
  { spanish: "toalla",    english: "towel"     },
  { spanish: "lavamanos", english: "sink"      },
  { spanish: "cama",      english: "bed"       },
  { spanish: "marco",     english: "frame"     },
  { spanish: "lámpara",   english: "lamp"      },
  { spanish: "zapato",    english: "shoe"      },
]

const PHASE2_WORDS = [
  { spanish: "baño",        english: "bathroom"  },
  { spanish: "escuela",     english: "school"    },
  { spanish: "biblioteca",  english: "library"   },
  { spanish: "playa",       english: "beach"     },
  { spanish: "parque",      english: "park"      },
  { spanish: "tienda",      english: "store"     },
  { spanish: "hospital",    english: "hospital"  },
  { spanish: "panadería",   english: "bakery"    },
  { spanish: "cine",        english: "cinema"    },
  { spanish: "izquierda",   english: "left"      },
  { spanish: "derecha",     english: "right"     },
  { spanish: "arriba",      english: "up"        },
  { spanish: "abajo",       english: "down"      },
  { spanish: "delante",     english: "forward"   },
  { spanish: "detrás",      english: "behind"    },
  { spanish: "cerca",       english: "near"      },
  { spanish: "lejos",       english: "far"       },
]

const config: Omit<VocabFlyProps, "coins" | "onCoinsChange" | "onClose"> = {
  title: "Travel Fly",
  icon: "🏠",
  phase1: {
    words: PHASE1_WORDS,
    speedBase: 0.28, speedVariance: 0.10, waveInterval: 4200,
    label: "My House",
    bgGradient: "linear-gradient(180deg,#0a1a1a 0%,#0a3030 30%,#0f5757 65%,#0d9488 100%)",
    bubbleBg: "#ccfbf1", bubbleText: "#0f766e",
    progressGrad: "linear-gradient(90deg,#2dd4bf,#0d9488)",
    badgeColor: "rgba(13,148,136,0.45)",
  },
  phase2: {
    words: PHASE2_WORDS,
    speedBase: 0.36, speedVariance: 0.12, waveInterval: 3600,
    label: "Out & About",
    bgGradient: "linear-gradient(180deg,#0a1a0a 0%,#0a3020 30%,#065f46 65%,#059669 100%)",
    bubbleBg: "#a7f3d0", bubbleText: "#047857",
    progressGrad: "linear-gradient(90deg,#34d399,#059669)",
    badgeColor: "rgba(5,150,105,0.45)",
  },
  transitionMsg: "Now: Places & Directions! 🗺️",
  transitionIcon: "🗺️",
  accentColor: "linear-gradient(135deg,#0d9488,#059669)",
}

interface Props { coins: number; onCoinsChange: (delta: number) => void; onClose: () => void }
export default function TravelFly({ coins, onCoinsChange, onClose }: Props) {
  return <VocabFly {...config} coins={coins} onCoinsChange={onCoinsChange} onClose={onClose} bgVideoQuery="nicaragua granada colonial city volcano lake" />
}
