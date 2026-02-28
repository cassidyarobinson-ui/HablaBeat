"use client"
// Numbers Fly — Bunny Fly for Numbers World (Songs 14-15)
// Phase 1: Numbers 1-20 → Phase 2: Counting by Tens
import VocabFly, { VocabFlyProps } from "./vocab-fly"

const PHASE1_WORDS = [
  { spanish: "uno",        english: "one"       },
  { spanish: "dos",        english: "two"       },
  { spanish: "tres",       english: "three"     },
  { spanish: "cuatro",     english: "four"      },
  { spanish: "cinco",      english: "five"      },
  { spanish: "seis",       english: "six"       },
  { spanish: "siete",      english: "seven"     },
  { spanish: "ocho",       english: "eight"     },
  { spanish: "nueve",      english: "nine"      },
  { spanish: "diez",       english: "ten"       },
  { spanish: "once",       english: "eleven"    },
  { spanish: "doce",       english: "twelve"    },
  { spanish: "trece",      english: "thirteen"  },
  { spanish: "catorce",    english: "fourteen"  },
  { spanish: "quince",     english: "fifteen"   },
  { spanish: "dieciséis",  english: "sixteen"   },
  { spanish: "diecisiete", english: "seventeen" },
  { spanish: "dieciocho",  english: "eighteen"  },
  { spanish: "diecinueve", english: "nineteen"  },
  { spanish: "veinte",     english: "twenty"    },
]

const PHASE2_WORDS = [
  { spanish: "diez",     english: "ten"          },
  { spanish: "veinte",   english: "twenty"       },
  { spanish: "treinta",  english: "thirty"       },
  { spanish: "cuarenta", english: "forty"        },
  { spanish: "cincuenta",english: "fifty"        },
  { spanish: "sesenta",  english: "sixty"        },
  { spanish: "setenta",  english: "seventy"      },
  { spanish: "ochenta",  english: "eighty"       },
  { spanish: "noventa",  english: "ninety"       },
  { spanish: "cien",     english: "one hundred"  },
]

const config: Omit<VocabFlyProps, "coins" | "onCoinsChange" | "onClose"> = {
  title: "Numbers Fly",
  icon: "🔢",
  phase1: {
    words: PHASE1_WORDS,
    speedBase: 0.28, speedVariance: 0.10, waveInterval: 4200,
    label: "1 – 20",
    bgGradient: "linear-gradient(180deg,#1a0a33 0%,#2e1065 30%,#5b21b6 65%,#7c3aed 100%)",
    bubbleBg: "#ede9fe", bubbleText: "#5b21b6",
    progressGrad: "linear-gradient(90deg,#a78bfa,#7c3aed)",
    badgeColor: "rgba(91,33,182,0.5)",
  },
  phase2: {
    words: PHASE2_WORDS,
    speedBase: 0.36, speedVariance: 0.12, waveInterval: 3200,
    label: "Tens",
    bgGradient: "linear-gradient(180deg,#0f0a2e 0%,#1e1b4b 30%,#312e81 65%,#4338ca 100%)",
    bubbleBg: "#e0e7ff", bubbleText: "#3730a3",
    progressGrad: "linear-gradient(90deg,#818cf8,#4338ca)",
    badgeColor: "rgba(67,56,202,0.5)",
  },
  transitionMsg: "Now: Counting by 10s! 🔟",
  transitionIcon: "🔟",
  accentColor: "linear-gradient(135deg,#7c3aed,#4338ca)",
}

interface Props { coins: number; onCoinsChange: (delta: number) => void; onClose: () => void }
export default function NumbersFly({ coins, onCoinsChange, onClose }: Props) {
  return <VocabFly {...config} coins={coins} onCoinsChange={onCoinsChange} onClose={onClose} />
}
