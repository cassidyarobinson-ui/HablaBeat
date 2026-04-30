"use client"
// Time Fly — Bunny Fly for Time World (Songs 16-17)
// Phase 1: Days, Months & Seasons → Phase 2: Telling Time
import VocabFly, { VocabFlyProps } from "./vocab-fly"

const PHASE1_WORDS = [
  { spanish: "lunes",       english: "Monday"    },
  { spanish: "martes",      english: "Tuesday"   },
  { spanish: "miércoles",   english: "Wednesday" },
  { spanish: "jueves",      english: "Thursday"  },
  { spanish: "viernes",     english: "Friday"    },
  { spanish: "sábado",      english: "Saturday"  },
  { spanish: "domingo",     english: "Sunday"    },
  { spanish: "enero",       english: "January"   },
  { spanish: "febrero",     english: "February"  },
  { spanish: "marzo",       english: "March"     },
  { spanish: "abril",       english: "April"     },
  { spanish: "mayo",        english: "May"       },
  { spanish: "junio",       english: "June"      },
  { spanish: "julio",       english: "July"      },
  { spanish: "agosto",      english: "August"    },
  { spanish: "septiembre",  english: "September" },
  { spanish: "octubre",     english: "October"   },
  { spanish: "noviembre",   english: "November"  },
  { spanish: "diciembre",   english: "December"  },
  { spanish: "primavera",   english: "spring"    },
  { spanish: "verano",      english: "summer"    },
  { spanish: "otoño",       english: "fall"      },
  { spanish: "invierno",    english: "winter"    },
]

const PHASE2_WORDS = [
  { spanish: "reloj",         english: "clock"         },
  { spanish: "la una",        english: "one o'clock"   },
  { spanish: "las dos",       english: "two o'clock"   },
  { spanish: "las tres",      english: "three o'clock" },
  { spanish: "las cuatro",    english: "four o'clock"  },
  { spanish: "las cinco",     english: "five o'clock"  },
  { spanish: "las seis",      english: "six o'clock"   },
  { spanish: "las siete",     english: "seven o'clock" },
  { spanish: "las ocho",      english: "eight o'clock" },
  { spanish: "las nueve",     english: "nine o'clock"  },
  { spanish: "las diez",      english: "ten o'clock"   },
  { spanish: "y cuarto",      english: "quarter past"  },
  { spanish: "y media",       english: "half past"     },
  { spanish: "en punto",      english: "on the dot"    },
  { spanish: "menos cuarto",  english: "quarter to"    },
]

const config: Omit<VocabFlyProps, "coins" | "onCoinsChange" | "onClose"> = {
  title: "Time Fly",
  icon: "🕐",
  phase1: {
    words: PHASE1_WORDS,
    speedBase: 0.26, speedVariance: 0.10, waveInterval: 4200,
    label: "Days & Months",
    bgGradient: "linear-gradient(180deg,#0a1535 0%,#0c2461 30%,#1e40af 65%,#3b82f6 100%)",
    bubbleBg: "#bfdbfe", bubbleText: "#1d4ed8",
    progressGrad: "linear-gradient(90deg,#60a5fa,#3b82f6)",
    badgeColor: "rgba(29,78,216,0.5)",
  },
  phase2: {
    words: PHASE2_WORDS,
    speedBase: 0.34, speedVariance: 0.12, waveInterval: 3600,
    label: "Telling Time",
    bgGradient: "linear-gradient(180deg,#030714 0%,#0c1a33 30%,#1e3a5f 65%,#1d4ed8 100%)",
    bubbleBg: "#dbeafe", bubbleText: "#1e40af",
    progressGrad: "linear-gradient(90deg,#93c5fd,#1d4ed8)",
    badgeColor: "rgba(30,64,175,0.5)",
  },
  transitionMsg: "Now: Telling Time! 🕐",
  transitionIcon: "🕐",
  accentColor: "linear-gradient(135deg,#1d4ed8,#1e40af)",
}

interface Props { coins: number; onCoinsChange: (delta: number) => void; onClose: () => void }
export default function TimeFly({ coins, onCoinsChange, onClose }: Props) {
  return <VocabFly {...config} coins={coins} onCoinsChange={onCoinsChange} onClose={onClose} bgVideoQuery="panama canal old town casco viejo skyline" />
}
