"use client"
// Pet Fly — Bunny Fly for Pet World (Songs 8-10)
// Phase 1: Pets (Mis Mascotas) → Phase 2: Habitats (Hábitat Animales)
import VocabFly, { VocabFlyProps } from "./vocab-fly"

const PHASE1_WORDS = [
  { spanish: "perro",   english: "dog"     },
  { spanish: "gato",    english: "cat"     },
  { spanish: "conejo",  english: "rabbit"  },
  { spanish: "pato",    english: "duck"    },
  { spanish: "vaca",    english: "cow"     },
  { spanish: "oveja",   english: "sheep"   },
  { spanish: "gallina", english: "hen"     },
  { spanish: "caballo", english: "horse"   },
  { spanish: "cabra",   english: "goat"    },
  { spanish: "tortuga", english: "turtle"  },
  { spanish: "feliz",   english: "happy"   },
  { spanish: "juntos",  english: "together"},
]

const PHASE2_WORDS = [
  { spanish: "agua",     english: "water"      },
  { spanish: "cielo",    english: "sky"        },
  { spanish: "bosque",   english: "forest"     },
  { spanish: "montaña",  english: "mountain"   },
  { spanish: "pez",      english: "fish"       },
  { spanish: "rana",     english: "frog"       },
  { spanish: "cangrejo", english: "crab"       },
  { spanish: "pájaro",   english: "bird"       },
  { spanish: "águila",   english: "eagle"      },
  { spanish: "abeja",    english: "bee"        },
  { spanish: "colibrí",  english: "hummingbird"},
  { spanish: "oso",      english: "bear"       },
  { spanish: "zorro",    english: "fox"        },
  { spanish: "ardilla",  english: "squirrel"   },
  { spanish: "araña",    english: "spider"     },
  { spanish: "ciempiés", english: "centipede"  },
]

const config: Omit<VocabFlyProps, "coins" | "onCoinsChange" | "onClose"> = {
  title: "Pet Fly",
  icon: "🐾",
  phase1: {
    words: PHASE1_WORDS,
    speedBase: 0.28, speedVariance: 0.10, waveInterval: 4200,
    label: "Pets",
    bgGradient: "linear-gradient(180deg,#0c1a33 0%,#0a3d52 30%,#0e7490 65%,#06b6d4 100%)",
    bubbleBg: "#a5f3fc", bubbleText: "#0e7490",
    progressGrad: "linear-gradient(90deg,#22d3ee,#06b6d4)",
    badgeColor: "rgba(6,182,212,0.45)",
  },
  phase2: {
    words: PHASE2_WORDS,
    speedBase: 0.36, speedVariance: 0.12, waveInterval: 3600,
    label: "Habitats",
    bgGradient: "linear-gradient(180deg,#0a1f0a 0%,#0f3b14 30%,#166534 65%,#22c55e 100%)",
    bubbleBg: "#bbf7d0", bubbleText: "#065f46",
    progressGrad: "linear-gradient(90deg,#4ade80,#22c55e)",
    badgeColor: "rgba(34,197,94,0.45)",
  },
  transitionMsg: "Now: Habitats! 🌳",
  transitionIcon: "🌳",
  accentColor: "linear-gradient(135deg,#06b6d4,#0891b2)",
}

interface Props { coins: number; onCoinsChange: (delta: number) => void; onClose: () => void }
export default function PetFly({ coins, onCoinsChange, onClose }: Props) {
  return <VocabFly {...config} coins={coins} onCoinsChange={onCoinsChange} onClose={onClose} />
}
