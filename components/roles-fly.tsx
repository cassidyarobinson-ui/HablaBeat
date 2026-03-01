"use client"
// Roles Fly — Bunny Fly for Roles World (Songs 6-7)
// Phase 1: Mi Familia (family members) → Phase 2: ¿Qué Quieres Ser? (careers)
import VocabFly, { VocabFlyProps } from "./vocab-fly"

const PHASE1_WORDS = [
  { spanish: "familia",   english: "family"      },
  { spanish: "papá",      english: "dad"         },
  { spanish: "mamá",      english: "mom"         },
  { spanish: "hermano",   english: "brother"     },
  { spanish: "hermana",   english: "sister"      },
  { spanish: "tío",       english: "uncle"       },
  { spanish: "tía",       english: "aunt"        },
  { spanish: "abuela",    english: "grandma"     },
  { spanish: "abuelo",    english: "grandpa"     },
  { spanish: "primo",     english: "cousin (m)"  },
  { spanish: "prima",     english: "cousin (f)"  },
  { spanish: "sobrino",   english: "nephew"      },
  { spanish: "sobrina",   english: "niece"       },
  { spanish: "mascota",   english: "pet"         },
  { spanish: "sano",      english: "healthy"     },
  { spanish: "contento",  english: "happy"       },
  { spanish: "caminar",   english: "to walk"     },
  { spanish: "mejor",     english: "best"        },
  { spanish: "para mí",   english: "for me"      },
]

const PHASE2_WORDS = [
  { spanish: "doctor",       english: "doctor"        },
  { spanish: "bombero",      english: "firefighter"   },
  { spanish: "panadero",     english: "baker"         },
  { spanish: "maestra",      english: "teacher"       },
  { spanish: "piloto",       english: "pilot"         },
  { spanish: "carpintero",   english: "carpenter"     },
  { spanish: "cantante",     english: "singer"        },
  { spanish: "chef",         english: "chef"          },
  { spanish: "jardinero",    english: "gardener"      },
  { spanish: "dentista",     english: "dentist"       },
  { spanish: "artista",      english: "artist"        },
  { spanish: "ingeniero",    english: "engineer"      },
  { spanish: "policía",      english: "police officer"},
  { spanish: "granjero",     english: "farmer"        },
  { spanish: "pintor",       english: "painter"       },
  { spanish: "actor",        english: "actor"         },
  { spanish: "enfermera",    english: "nurse"         },
  { spanish: "escritor",     english: "writer"        },
  { spanish: "veterinario",  english: "vet"           },
  { spanish: "conductor",    english: "driver"        },
  { spanish: "arquitecto",   english: "architect"     },
  { spanish: "traductor",    english: "translator"    },
  { spanish: "alegría",      english: "joy"           },
  { spanish: "amor",         english: "love"          },
  { spanish: "profesión",    english: "profession"    },
  { spanish: "puedes",       english: "you can"       },
  { spanish: "aprender",     english: "to learn"      },
  { spanish: "elige",        english: "choose"        },
  { spanish: "quieres",      english: "you want"      },
  { spanish: "ser",          english: "to be"         },
  { spanish: "tantas cosas", english: "so many things"},
]

const config: Omit<VocabFlyProps, "coins" | "onCoinsChange" | "onClose"> = {
  title: "Roles Fly",
  icon: "👨‍👩‍👧",
  phase1: {
    words: PHASE1_WORDS,
    speedBase: 0.28, speedVariance: 0.10, waveInterval: 4200,
    label: "Mi Familia",
    bgGradient: "linear-gradient(180deg,#1c0500 0%,#7c2d12 30%,#c2410c 65%,#fb923c 100%)",
    bubbleBg: "#fed7aa", bubbleText: "#9a3412",
    progressGrad: "linear-gradient(90deg,#fb923c,#ea580c)",
    badgeColor: "rgba(154,52,18,0.5)",
  },
  phase2: {
    words: PHASE2_WORDS,
    speedBase: 0.34, speedVariance: 0.12, waveInterval: 3600,
    label: "¿Qué Quieres Ser?",
    bgGradient: "linear-gradient(180deg,#0a1628 0%,#1e3a8a 30%,#2563eb 65%,#60a5fa 100%)",
    bubbleBg: "#bfdbfe", bubbleText: "#1d4ed8",
    progressGrad: "linear-gradient(90deg,#60a5fa,#2563eb)",
    badgeColor: "rgba(37,99,235,0.5)",
  },
  transitionMsg: "Now: Jobs & Careers! ⭐",
  transitionIcon: "⭐",
  accentColor: "linear-gradient(135deg,#fb923c,#2563eb)",
}

interface Props { coins: number; onCoinsChange: (delta: number) => void; onClose: () => void }
export default function RolesFly({ coins, onCoinsChange, onClose }: Props) {
  return <VocabFly {...config} coins={coins} onCoinsChange={onCoinsChange} onClose={onClose} />
}
