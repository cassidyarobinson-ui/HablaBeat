"use client"
// Food Fly — Bunny Fly for Food World (Songs 21-23)
// Phase 1: Fruits → Phase 2: Vegetables & Meals
import VocabFly, { VocabFlyProps } from "./vocab-fly"

const PHASE1_WORDS = [
  { spanish: "manzana",   english: "apple"      },
  { spanish: "frutilla",  english: "strawberry" },
  { spanish: "naranja",   english: "orange"     },
  { spanish: "papaya",    english: "papaya"     },
  { spanish: "sandía",    english: "watermelon" },
  { spanish: "durazno",   english: "peach"      },
  { spanish: "banana",    english: "banana"     },
  { spanish: "melón",     english: "melon"      },
  { spanish: "piña",      english: "pineapple"  },
  { spanish: "pera",      english: "pear"       },
  { spanish: "guayaba",   english: "guava"      },
  { spanish: "uva",       english: "grape"      },
  { spanish: "ciruela",   english: "plum"       },
  { spanish: "mora",      english: "blueberry"  },
  { spanish: "arándano",  english: "cranberry"  },
  { spanish: "higo",      english: "fig"        },
  { spanish: "tamarindo", english: "tamarind"   },
]

const PHASE2_WORDS = [
  { spanish: "tomate",    english: "tomato"     },
  { spanish: "pimiento",  english: "pepper"     },
  { spanish: "zanahoria", english: "carrot"     },
  { spanish: "maíz",      english: "corn"       },
  { spanish: "papa",      english: "potato"     },
  { spanish: "lechuga",   english: "lettuce"    },
  { spanish: "berenjena", english: "eggplant"   },
  { spanish: "cebolla",   english: "onion"      },
  { spanish: "acelga",    english: "chard"      },
  { spanish: "leche",     english: "milk"       },
  { spanish: "pan",       english: "bread"      },
  { spanish: "huevo",     english: "egg"        },
  { spanish: "sopa",      english: "soup"       },
  { spanish: "arroz",     english: "rice"       },
  { spanish: "pollo",     english: "chicken"    },
  { spanish: "pasta",     english: "pasta"      },
  { spanish: "pescado",   english: "fish"       },
  { spanish: "avena",     english: "oatmeal"    },
]

const config: Omit<VocabFlyProps, "coins" | "onCoinsChange" | "onClose"> = {
  title: "Food Fly",
  icon: "🍎",
  phase1: {
    words: PHASE1_WORDS,
    speedBase: 0.28, speedVariance: 0.10, waveInterval: 4200,
    label: "Fruits",
    bgGradient: "linear-gradient(180deg,#1a0f00 0%,#451a03 30%,#92400e 65%,#d97706 100%)",
    bubbleBg: "#fef3c7", bubbleText: "#92400e",
    progressGrad: "linear-gradient(90deg,#fbbf24,#d97706)",
    badgeColor: "rgba(146,64,14,0.5)",
  },
  phase2: {
    words: PHASE2_WORDS,
    speedBase: 0.36, speedVariance: 0.12, waveInterval: 3600,
    label: "Veggies & Meals",
    bgGradient: "linear-gradient(180deg,#0a1f0a 0%,#14401a 30%,#166534 65%,#16a34a 100%)",
    bubbleBg: "#bbf7d0", bubbleText: "#065f46",
    progressGrad: "linear-gradient(90deg,#4ade80,#16a34a)",
    badgeColor: "rgba(22,163,74,0.5)",
  },
  transitionMsg: "Now: Veggies & Meals! 🥗",
  transitionIcon: "🥗",
  accentColor: "linear-gradient(135deg,#d97706,#16a34a)",
}

interface Props { coins: number; onCoinsChange: (delta: number) => void; onClose: () => void }
export default function FoodFly({ coins, onCoinsChange, onClose }: Props) {
  return <VocabFly {...config} coins={coins} onCoinsChange={onCoinsChange} onClose={onClose} />
}
