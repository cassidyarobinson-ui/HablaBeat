"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"

const DDRGame = dynamic(() => import("@/components/ddr-game"), { ssr: false })
const VisualizerView = dynamic(() => import("@/components/visualizer-view"), { ssr: false })
const SingModeView = dynamic(() => import("@/components/sing-mode-view"), { ssr: false })
import {
  Play,
  BookOpen,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Coins,
  Mic,
  MicOff,
  Sparkles,
} from "lucide-react"
import Image from "next/image"

// Add YouTube API integration
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void
    YT: any
  }
}

// Latino-inspired color palette
const latinoColors = {
  orange: "bg-orange-400", // Warm orange
  yellow: "bg-yellow-500", // Golden yellow
  teal: "bg-teal-500", // Teal
  aqua: "bg-cyan-400", // Light teal/aqua
  mint: "bg-emerald-300", // Sage green/mint
  purple: "bg-purple-500", // Purple/plum
}

const languages = {
  spanish: {
    name: "Spanish",
    flag: "🇪🇸",
    curriculum: [
      {
        id: "people-places-things",
        title: "People Places Things",
        icon: "🌟",
        color: latinoColors.orange,
        isMainCategory: true,
        sections: [
          {
            id: "alphabet-vowels",
            title: "Alphabet World",
            icon: "📚",
            color: latinoColors.yellow,
            badgeUnlocked: false,
            songs: [
              {
                id: "abecedario",
                title: "El Abecedario",
                number: 1,
                playCount: 15,
                completed: true,
                youtubeId: "rTPlTvjwgtc",
              },
              {
                id: "special-letters",
                title: "Ñ, CH, RR, LL",
                number: 2,
                playCount: 12,
                completed: true,
                youtubeId: "xmt3SlFs58g",
              },
              {
                id: "vowels",
                title: "A, E, I, O, U Canta Ya",
                number: 3,
                playCount: 8,
                completed: false,
                youtubeId: "FibXLsjh_zY",
              },
            ],
          },
          {
            id: "the-self",
            title: "You World",
            icon: "👤",
            color: latinoColors.teal,
            badgeUnlocked: false,
            songs: [
              {
                id: "cuerpo-cara",
                title: "Partes Del Cuerpo Y Cara",
                number: 4,
                playCount: 7,
                completed: false,
                youtubeId: "VKhs4BvGWAk",
              },
              { id: "ropa", title: "Ropa Linda", number: 5, playCount: 4, completed: false, youtubeId: "MW1ksRG6xOU" },
              {
                id: "familia",
                title: "Mi Familia",
                number: 6,
                playCount: 2,
                completed: false,
                youtubeId: "kEoVz2XXHBM",
              },
              {
                id: "trabajos",
                title: "Los Trabajos",
                number: 7,
                playCount: 0,
                completed: false,
                youtubeId: "OzHAvM1zq6A",
              },
            ],
          },
          {
            id: "pets-syllables",
            title: "Pet World",
            icon: "🐕",
            color: latinoColors.aqua,
            badgeUnlocked: false,
            songs: [
              {
                id: "unicornio",
                title: "A E I O Unicornio",
                number: 8,
                playCount: 5,
                completed: false,
                youtubeId: "dXjuMM6055Y",
              },
              {
                id: "mascotas",
                title: "Mis Mascotas",
                number: 9,
                playCount: 3,
                completed: false,
                youtubeId: "WFhEadyTDDI",
              },
              {
                id: "habitat",
                title: "Hábitat Animales",
                number: 10,
                playCount: 0,
                completed: false,
                youtubeId: "AQ5z8D7Ug8w",
              },
            ],
          },
          {
            id: "places",
            title: "Travel World",
            icon: "🏠",
            color: latinoColors.mint,
            badgeUnlocked: false,
            songs: [
              { id: "casa", title: "En Mi Casa", number: 11, playCount: 8, completed: true, youtubeId: "3PqO5CeMQKE" },
              {
                id: "donde-esta",
                title: "¿Dónde Está?",
                number: 12,
                playCount: 5,
                completed: true,
                youtubeId: "Weaf5CSDIjM",
              },
              {
                id: "direcciones",
                title: "Las Direcciones",
                number: 13,
                playCount: 0,
                completed: false,
                youtubeId: "bw58SLEY4-I",
              },
            ],
          },
          {
            id: "numbers-time",
            title: "Time World",
            icon: "🕐",
            color: latinoColors.purple,
            badgeUnlocked: false,
            songs: [
              {
                id: "uno-veinte",
                title: "Uno A Veinte",
                number: 14,
                playCount: 0,
                completed: false,
                youtubeId: "p4xCXjhlW7s",
              },
              {
                id: "diez-cien",
                title: "Diez A Cien",
                number: 15,
                playCount: 0,
                completed: false,
                youtubeId: "bPCBcZT9HTg",
              },
              {
                id: "dias-meses",
                title: "Días, Meses Y Estaciones",
                number: 16,
                playCount: 0,
                completed: false,
                youtubeId: "sBGmKOy2fqc",
              },
              {
                id: "que-hora",
                title: "¿Qué Hora Es?",
                number: 17,
                playCount: 0,
                completed: false,
                youtubeId: "ZBPH8D-_u6M",
              },
            ],
          },
          {
            id: "colors-feelings",
            title: "Feelings Color World",
            icon: "🌈",
            color: latinoColors.orange,
            badgeUnlocked: false,
            songs: [
              { id: "colores", title: "Colores", number: 18, playCount: 0, completed: false, youtubeId: "rlLf4YlGMf0" },
              {
                id: "feliz",
                title: "Estoy Feliz",
                number: 19,
                playCount: 0,
                completed: false,
                youtubeId: "ncDUEJR03d0",
              },
              { id: "sed", title: "Tengo Sed", number: 20, playCount: 0, completed: false, youtubeId: "Ip3KgS0rDno" },
            ],
          },
          {
            id: "foods",
            title: "Food World",
            icon: "🍎",
            color: latinoColors.yellow,
            badgeUnlocked: false,
            songs: [
              { id: "frutas", title: "Frutas", number: 21, playCount: 0, completed: false, youtubeId: "lqJOx7shWsU" },
              {
                id: "verduras",
                title: "Verduras",
                number: 22,
                playCount: 0,
                completed: false,
                youtubeId: "RnHHi6I9Le0",
              },
              {
                id: "comidas",
                title: "Desayuno, Almuerzo, Cena",
                number: 23,
                playCount: 0,
                completed: false,
                youtubeId: "266J5zFf8cI",
              },
            ],
          },
        ],
      },
      {
        id: "verbs",
        title: "Verbs",
        icon: "⚡",
        color: latinoColors.teal,
        isMainCategory: true,
        sections: [
          {
            id: "ar-verbs",
            title: "AR World",
            icon: "🅰️",
            color: latinoColors.aqua,
            badgeUnlocked: false,
            songs: [
              {
                id: "quiero-pedir",
                title: "Quiero Pedir",
                number: 24,
                playCount: 0,
                completed: false,
                youtubeId: "JC6MeBmQFrM",
              },
              {
                id: "verbos-ar",
                title: "Verbos AR",
                number: 25,
                playCount: 0,
                completed: false,
                youtubeId: "V3TqipemSfs",
              },
              { id: "gustar", title: "Gustar", number: 26, playCount: 0, completed: false, youtubeId: "QD3Jj1Bf7z0" },
              { id: "estar", title: "Estar", number: 27, playCount: 0, completed: false, youtubeId: "DIWnGu2fQr4" },
            ],
          },
          {
            id: "er-verbs",
            title: "ER World",
            icon: "🅴",
            color: latinoColors.mint,
            badgeUnlocked: false,
            songs: [
              {
                id: "verbos-er",
                title: "Verbos ER",
                number: 28,
                playCount: 0,
                completed: false,
                youtubeId: "tvYv7jwVIbY",
              },
              { id: "tener", title: "Tener", number: 29, playCount: 0, completed: false, youtubeId: "otEfuzRMkuM" },
              { id: "ser", title: "Ser", number: 30, playCount: 0, completed: false, youtubeId: "OiPWQlLU5QQ" },
            ],
          },
          {
            id: "ir-verbs",
            title: "IR World",
            icon: "🅸",
            color: latinoColors.purple,
            badgeUnlocked: false,
            songs: [
              {
                id: "verbos-ir",
                title: "Verbos IR",
                number: 31,
                playCount: 0,
                completed: false,
                youtubeId: "-OxWqPBV95k",
              },
              { id: "ir", title: "IR", number: 32, playCount: 0, completed: false, youtubeId: "oIYfvK-qkeU" },
              { id: "decir", title: "Decir", number: 33, playCount: 0, completed: false, youtubeId: "sHuDDKa323A" },
            ],
          },
          {
            id: "preterite",
            title: "Quick Past World",
            icon: "⏪",
            color: latinoColors.orange,
            badgeUnlocked: false,
            songs: [
              {
                id: "cuando-preterito",
                title: "Cuándo Usar El Pretérito",
                number: 34,
                playCount: 0,
                completed: false,
                youtubeId: "3t70lgDv0oo",
              },
              { id: "ar-pret", title: "AR Pret", number: 35, playCount: 0, completed: false, youtubeId: "phbODyPzbFI" },
              {
                id: "er-ir-pret",
                title: "Verbos De ER Y De IR Del Pretérito",
                number: 36,
                playCount: 0,
                completed: false,
                youtubeId: "JJfjIuJj0MQ",
              },
              {
                id: "pret-irregular",
                title: "Pretérito Irregular",
                number: 37,
                playCount: 0,
                completed: false,
                youtubeId: "R3jPlyKupv4",
              },
            ],
          },
          {
            id: "imperfecto",
            title: "Long Past World",
            icon: "🔄",
            color: latinoColors.yellow,
            badgeUnlocked: false,
            songs: [
              {
                id: "imperfecto",
                title: "El Imperfecto",
                number: 38,
                playCount: 0,
                completed: false,
                youtubeId: "f2kdhmwPRCI",
              },
              {
                id: "imperfecto-irreg",
                title: "Imperfecto Irregulares",
                number: 39,
                playCount: 0,
                completed: false,
                youtubeId: "uoGSAj3byy0",
              },
              {
                id: "imperfecto-preterito",
                title: "Imperfecto O Preterito",
                number: 40,
                playCount: 0,
                completed: false,
                youtubeId: "ibBXp3TRuAQ",
              },
            ],
          },
          {
            id: "futuro",
            title: "Future World",
            icon: "⏩",
            color: latinoColors.teal,
            badgeUnlocked: false,
            songs: [
              { id: "futuro", title: "Futuro", number: 41, playCount: 0, completed: false, youtubeId: "m1tE_FPzaQM" },
              {
                id: "futuro-irreg",
                title: "Irregulares Del Futuro",
                number: 42,
                playCount: 0,
                completed: false,
                youtubeId: "1tCTxSUW47c",
              },
            ],
          },
          {
            id: "conditional",
            title: "Conditional World",
            icon: "🤔",
            color: latinoColors.aqua,
            badgeUnlocked: false,
            songs: [
              {
                id: "condicional",
                title: "El Condicional",
                number: 43,
                playCount: 0,
                completed: false,
                youtubeId: "0qJSMX8FThg",
              },
              {
                id: "condicional-irreg",
                title: "Irregulares Del Condicional",
                number: 44,
                playCount: 0,
                completed: false,
                youtubeId: "rmob6ycSnq8",
              },
            ],
          },
          {
            id: "pronouns",
            title: "Pronoun World",
            icon: "👥",
            color: latinoColors.mint,
            badgeUnlocked: false,
            songs: [
              {
                id: "pronombres-personales",
                title: "Pronombres Personales + Reflexivos",
                number: 45,
                playCount: 0,
                completed: false,
                youtubeId: "eBogqKqcQn8",
              },
              {
                id: "objeto-directo",
                title: "Pronombres De Objeto Directo E Indirecto",
                number: 46,
                playCount: 0,
                completed: false,
                youtubeId: "zdDOPsZU0S0",
              },
            ],
          },
          {
            id: "advanced",
            title: "Advanced World",
            icon: "🎓",
            color: latinoColors.purple,
            badgeUnlocked: false,
            songs: [
              {
                id: "mandatos",
                title: "Mandatos",
                number: 47,
                playCount: 0,
                completed: false,
                youtubeId: "dARtS1pQKMM",
              },
              {
                id: "por-para",
                title: "Por Vs Para",
                number: 48,
                playCount: 0,
                completed: false,
                youtubeId: "JzH50K3nOZY",
              },
              {
                id: "subjuntivo",
                title: "Subjuntivo Básico",
                number: 49,
                playCount: 0,
                completed: false,
                youtubeId: "-USI7QEbND8",
              },
              {
                id: "frases-divertidas",
                title: "Frases Divertidas",
                number: 50,
                playCount: 0,
                completed: false,
                youtubeId: "Dq9PCgNszW0",
              },
            ],
          },
        ],
      },
    ],
  },
  english: {
    name: "English",
    flag: "🇺🇸",
    curriculum: [
      {
        id: "basics",
        title: "English Basics",
        icon: "🌟",
        color: latinoColors.orange,
        isMainCategory: true,
        sections: [
          {
            id: "alphabet-phonics",
            title: "Alphabet & Phonics",
            icon: "🔤",
            color: latinoColors.yellow,
            badgeUnlocked: false,
            songs: [
              { id: "abc-song", title: "ABC Song", number: 1, playCount: 12, completed: true, youtubeId: "" },
              { id: "phonics-fun", title: "Phonics Fun", number: 2, playCount: 8, completed: false, youtubeId: "" },
              { id: "letter-sounds", title: "Letter Sounds", number: 3, playCount: 5, completed: false, youtubeId: "" },
              {
                id: "vowel-sounds",
                title: "Short and Long Vowels",
                number: 4,
                playCount: 3,
                completed: false,
                youtubeId: "",
              },
            ],
          },
          {
            id: "family-friends",
            title: "Family & Friends",
            icon: "👨‍👩‍👧‍👦",
            color: latinoColors.teal,
            badgeUnlocked: false,
            songs: [
              { id: "family-tree", title: "My Family Tree", number: 5, playCount: 6, completed: false, youtubeId: "" },
              {
                id: "best-friends",
                title: "Best Friends Forever",
                number: 6,
                playCount: 3,
                completed: false,
                youtubeId: "",
              },
              { id: "helping-hands", title: "Helping Hands", number: 7, playCount: 0, completed: false, youtubeId: "" },
              {
                id: "community-helpers",
                title: "Community Helpers",
                number: 8,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
            ],
          },
          {
            id: "animals-nature",
            title: "Animals & Nature",
            icon: "🦁",
            color: latinoColors.aqua,
            badgeUnlocked: false,
            songs: [
              {
                id: "jungle-animals",
                title: "Jungle Animals",
                number: 9,
                playCount: 4,
                completed: false,
                youtubeId: "",
              },
              { id: "farm-friends", title: "Farm Friends", number: 10, playCount: 2, completed: false, youtubeId: "" },
              { id: "ocean-life", title: "Ocean Life", number: 11, playCount: 0, completed: false, youtubeId: "" },
              {
                id: "forest-creatures",
                title: "Forest Creatures",
                number: 12,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
            ],
          },
          {
            id: "home-school",
            title: "Home & School",
            icon: "🏠",
            color: latinoColors.mint,
            badgeUnlocked: false,
            songs: [
              {
                id: "rooms-in-house",
                title: "Rooms in My House",
                number: 13,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "school-supplies",
                title: "School Supplies",
                number: 14,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "classroom-rules",
                title: "Classroom Rules",
                number: 15,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "daily-routine",
                title: "My Daily Routine",
                number: 16,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
            ],
          },
          {
            id: "numbers-counting",
            title: "Numbers & Counting",
            icon: "🔢",
            color: latinoColors.purple,
            badgeUnlocked: false,
            songs: [
              {
                id: "counting-to-ten",
                title: "Counting to Ten",
                number: 17,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "counting-to-twenty",
                title: "Counting to Twenty",
                number: 18,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "counting-to-hundred",
                title: "Counting to One Hundred",
                number: 19,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "number-patterns",
                title: "Number Patterns",
                number: 20,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
            ],
          },
          {
            id: "colors-shapes",
            title: "Colors & Shapes",
            icon: "🌈",
            color: latinoColors.orange,
            badgeUnlocked: false,
            songs: [
              {
                id: "rainbow-colors",
                title: "Rainbow Colors",
                number: 21,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "basic-shapes", title: "Basic Shapes", number: 22, playCount: 0, completed: false, youtubeId: "" },
              {
                id: "mixing-colors",
                title: "Mixing Colors",
                number: 23,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "shape-patterns",
                title: "Shape Patterns",
                number: 24,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
            ],
          },
          {
            id: "food-health",
            title: "Food & Health",
            icon: "🍎",
            color: latinoColors.yellow,
            badgeUnlocked: false,
            songs: [
              {
                id: "healthy-foods",
                title: "Healthy Foods",
                number: 25,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "food-groups", title: "Food Groups", number: 26, playCount: 0, completed: false, youtubeId: "" },
              {
                id: "exercise-song",
                title: "Exercise Song",
                number: 27,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "body-parts", title: "Body Parts", number: 28, playCount: 0, completed: false, youtubeId: "" },
            ],
          },
        ],
      },
      {
        id: "grammar-structure",
        title: "Grammar & Structure",
        icon: "📝",
        color: latinoColors.purple,
        isMainCategory: true,
        sections: [
          {
            id: "simple-sentences",
            title: "Simple Sentences",
            icon: "💬",
            color: latinoColors.mint,
            badgeUnlocked: false,
            songs: [
              {
                id: "subject-verb",
                title: "Subject and Verb",
                number: 29,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "asking-questions",
                title: "Asking Questions",
                number: 30,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "telling-stories",
                title: "Telling Stories",
                number: 31,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "describing-words",
                title: "Describing Words",
                number: 32,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
            ],
          },
          {
            id: "action-words",
            title: "Action Words",
            icon: "🏃",
            color: latinoColors.aqua,
            badgeUnlocked: false,
            songs: [
              { id: "action-verbs", title: "Action Verbs", number: 33, playCount: 0, completed: false, youtubeId: "" },
              {
                id: "past-present-future",
                title: "Past, Present, Future",
                number: 34,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "helping-verbs",
                title: "Helping Verbs",
                number: 35,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "irregular-verbs",
                title: "Irregular Verbs",
                number: 36,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
            ],
          },
          {
            id: "describing-words",
            title: "Describing Words",
            icon: "✨",
            color: latinoColors.teal,
            badgeUnlocked: false,
            songs: [
              { id: "adjectives", title: "Adjectives", number: 37, playCount: 0, completed: false, youtubeId: "" },
              { id: "opposites", title: "Opposites", number: 38, playCount: 0, completed: false, youtubeId: "" },
              {
                id: "comparing-things",
                title: "Comparing Things",
                number: 39,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "feelings-emotions",
                title: "Feelings and Emotions",
                number: 40,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
            ],
          },
          {
            id: "connecting-words",
            title: "Connecting Words",
            icon: "🔗",
            color: latinoColors.orange,
            badgeUnlocked: false,
            songs: [
              { id: "prepositions", title: "Prepositions", number: 41, playCount: 0, completed: false, youtubeId: "" },
              { id: "conjunctions", title: "Conjunctions", number: 42, playCount: 0, completed: false, youtubeId: "" },
              {
                id: "articles",
                title: "Articles (A, An, The)",
                number: 43,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "pronouns", title: "Pronouns", number: 44, playCount: 0, completed: false, youtubeId: "" },
            ],
          },
          {
            id: "sentence-building",
            title: "Sentence Building",
            icon: "🏗️",
            color: latinoColors.yellow,
            badgeUnlocked: false,
            songs: [
              {
                id: "compound-sentences",
                title: "Compound Sentences",
                number: 45,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "complex-sentences",
                title: "Complex Sentences",
                number: 46,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "punctuation", title: "Punctuation", number: 47, playCount: 0, completed: false, youtubeId: "" },
              {
                id: "capitalization",
                title: "Capitalization",
                number: 48,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
            ],
          },
          {
            id: "advanced-concepts",
            title: "Advanced Concepts",
            icon: "🎓",
            color: latinoColors.purple,
            badgeUnlocked: false,
            songs: [
              {
                id: "synonyms-antonyms",
                title: "Synonyms and Antonyms",
                number: 49,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "creative-writing",
                title: "Creative Writing",
                number: 50,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
            ],
          },
        ],
      },
    ],
  },
  french: {
    name: "French",
    flag: "🇫🇷",
    curriculum: [
      {
        id: "fundamentals",
        title: "French Fundamentals",
        icon: "🌟",
        color: latinoColors.orange,
        isMainCategory: true,
        sections: [
          {
            id: "alphabet-pronunciation",
            title: "Alphabet & Pronunciation",
            icon: "🗣️",
            color: latinoColors.yellow,
            badgeUnlocked: false,
            songs: [
              {
                id: "alphabet-francais",
                title: "ABC",
                number: 1,
                playCount: 10,
                completed: true,
                youtubeId: "IM2gDcfzJgQ",
              },
              {
                id: "accent-marks",
                title: "Aujourd'hui, on va chanter",
                number: 2,
                playCount: 6,
                completed: false,
                youtubeId: "a0Cu38RcArs",
              },
              {
                id: "pronunciation",
                title: "A, E, I, O, U, chantez",
                number: 3,
                playCount: 4,
                completed: false,
                youtubeId: "HZ2ziOALuvs",
              },
              {
                id: "silent-letters",
                title: "Allons toucher les parties du corps",
                number: 4,
                playCount: 2,
                completed: false,
                youtubeId: "HIdoC0LrhXE",
              },
            ],
          },
          {
            id: "greetings-politeness",
            title: "Greetings & Politeness",
            icon: "🤝",
            color: latinoColors.teal,
            badgeUnlocked: false,
            songs: [
              {
                id: "bonjour-bonsoir",
                title: "Chemise, pantalon",
                number: 5,
                playCount: 8,
                completed: false,
                youtubeId: "rHd26gUQU9g",
              },
              {
                id: "sil-vous-plait",
                title: "Famille",
                number: 6,
                playCount: 3,
                completed: false,
                youtubeId: "kZkiuHjo2oM",
              },
              {
                id: "merci-beaucoup",
                title: "Que veux tu faire",
                number: 7,
                playCount: 0,
                completed: false,
                youtubeId: "7vhD4NABUYI",
              },
              {
                id: "excusez-moi",
                title: "A Antilope, A Antilope",
                number: 8,
                playCount: 0,
                completed: false,
                youtubeId: "pQS_Reh0ljU",
              },
            ],
          },
          {
            id: "family-home",
            title: "Family & Home",
            icon: "🏡",
            color: latinoColors.aqua,
            badgeUnlocked: false,
            songs: [
              {
                id: "ma-famille",
                title: "J'ai un chien et un bon chat",
                number: 9,
                playCount: 5,
                completed: false,
                youtubeId: "A2swhU4MMwE",
              },
              {
                id: "ma-maison",
                title: "Dans l'eau, dans le ciel, dans la forêt",
                number: 10,
                playCount: 2,
                completed: false,
                youtubeId: "1mYFPjc7dVE",
              },
              {
                id: "les-pieces",
                title: "Dans ma maison, dans ma maison",
                number: 11,
                playCount: 0,
                completed: false,
                youtubeId: "k8fiW2bD4nQ",
              },
              {
                id: "meubles",
                title: "Où sont les toilettes",
                number: 12,
                playCount: 0,
                completed: false,
                youtubeId: "rFth-NzWjVg",
              },
            ],
          },
          {
            id: "colors-numbers",
            title: "Colors & Numbers",
            icon: "🌈",
            color: latinoColors.mint,
            badgeUnlocked: false,
            songs: [
              {
                id: "les-couleurs",
                title: "Parfois je me perds, je ne sais où aller",
                number: 13,
                playCount: 0,
                completed: false,
                youtubeId: "19gAH2n7G6A",
              },
              {
                id: "nombres-un-dix",
                title: "Un, deux, trois, quatre, cinq",
                number: 14,
                playCount: 0,
                completed: false,
                youtubeId: "oIw-cMALkOI",
              },
              {
                id: "nombres-onze-vingt",
                title: "Dix, vingt, trente, quarante, cinquante",
                number: 15,
                playCount: 0,
                completed: false,
                youtubeId: "ofIIBPgZG2U",
              },
              {
                id: "nombres-grands",
                title: "Les jours de la semaine",
                number: 16,
                playCount: 0,
                completed: false,
                youtubeId: "VVA7BuGwCns",
              },
            ],
          },
          {
            id: "time-calendar",
            title: "Time & Calendar",
            icon: "🕐",
            color: latinoColors.purple,
            badgeUnlocked: false,
            songs: [
              {
                id: "jours-semaine",
                title: "Les Jours de la Semaine",
                number: 17,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "mois-annee",
                title: "Les Mois de l'Année",
                number: 18,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "saisons", title: "Les Saisons", number: 19, playCount: 0, completed: false, youtubeId: "" },
              {
                id: "quelle-heure",
                title: "Quelle Heure Est-il?",
                number: 20,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
            ],
          },
          {
            id: "body-clothing",
            title: "Body & Clothing",
            icon: "👕",
            color: latinoColors.orange,
            badgeUnlocked: false,
            songs: [
              {
                id: "parties-corps",
                title: "Les Parties du Corps",
                number: 21,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "vetements", title: "Les Vêtements", number: 22, playCount: 0, completed: false, youtubeId: "" },
              {
                id: "accessoires",
                title: "Les Accessoires",
                number: 23,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "emotions", title: "Les Émotions", number: 24, playCount: 0, completed: false, youtubeId: "" },
            ],
          },
        ],
      },
      {
        id: "grammar-verbs",
        title: "Grammar & Verbs",
        icon: "📚",
        color: latinoColors.purple,
        isMainCategory: true,
        sections: [
          {
            id: "basic-verbs",
            title: "Basic Verbs",
            icon: "🎯",
            color: latinoColors.mint,
            badgeUnlocked: false,
            songs: [
              { id: "etre-avoir", title: "Être et Avoir", number: 29, playCount: 0, completed: false, youtubeId: "" },
              { id: "aller-venir", title: "Aller et Venir", number: 30, playCount: 0, completed: false, youtubeId: "" },
              { id: "faire-dire", title: "Faire et Dire", number: 31, playCount: 0, completed: false, youtubeId: "" },
              { id: "voir-savoir", title: "Voir et Savoir", number: 32, playCount: 0, completed: false, youtubeId: "" },
            ],
          },
          {
            id: "regular-verbs",
            title: "Regular Verbs",
            icon: "📖",
            color: latinoColors.aqua,
            badgeUnlocked: false,
            songs: [
              {
                id: "verbes-er",
                title: "Les Verbes en -ER",
                number: 33,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "verbes-ir",
                title: "Les Verbes en -IR",
                number: 34,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "verbes-re",
                title: "Les Verbes en -RE",
                number: 35,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "conjugaison", title: "La Conjugaison", number: 36, playCount: 0, completed: false, youtubeId: "" },
            ],
          },
          {
            id: "articles-gender",
            title: "Articles & Gender",
            icon: "⚖️",
            color: latinoColors.teal,
            badgeUnlocked: false,
            songs: [
              {
                id: "articles-definis",
                title: "Les Articles Définis",
                number: 37,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "articles-indefinis",
                title: "Les Articles Indéfinis",
                number: 38,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "masculin-feminin",
                title: "Masculin et Féminin",
                number: 39,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "pluriel", title: "Le Pluriel", number: 40, playCount: 0, completed: false, youtubeId: "" },
            ],
          },
          {
            id: "adjectives-adverbs",
            title: "Adjectives & Adverbs",
            icon: "✨",
            color: latinoColors.orange,
            badgeUnlocked: false,
            songs: [
              { id: "adjectifs", title: "Les Adjectifs", number: 41, playCount: 0, completed: false, youtubeId: "" },
              {
                id: "accord-adjectifs",
                title: "L'Accord des Adjectifs",
                number: 42,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "adverbes", title: "Les Adverbes", number: 43, playCount: 0, completed: false, youtubeId: "" },
              { id: "comparaison", title: "La Comparaison", number: 44, playCount: 0, completed: false, youtubeId: "" },
            ],
          },
          {
            id: "questions-negation",
            title: "Questions & Negation",
            icon: "❓",
            color: latinoColors.yellow,
            badgeUnlocked: false,
            songs: [
              {
                id: "poser-questions",
                title: "Poser des Questions",
                number: 45,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "mots-interrogatifs",
                title: "Les Mots Interrogatifs",
                number: 46,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "negation", title: "La Négation", number: 47, playCount: 0, completed: false, youtubeId: "" },
              { id: "reponses", title: "Les Réponses", number: 48, playCount: 0, completed: false, youtubeId: "" },
            ],
          },
          {
            id: "advanced-grammar",
            title: "Advanced Grammar",
            icon: "🎓",
            color: latinoColors.purple,
            badgeUnlocked: false,
            songs: [
              {
                id: "passe-compose",
                title: "Le Passé Composé",
                number: 49,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "futur-proche",
                title: "Le Futur Proche",
                number: 50,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
            ],
          },
        ],
      },
    ],
  },
}

// Helper: load from localStorage
const loadPersisted = (key: string, fallback: any) => {
  if (typeof window === "undefined") return fallback
  try {
    const val = localStorage.getItem(key)
    return val !== null ? JSON.parse(val) : fallback
  } catch { return fallback }
}

// Helper: compress image file to small square JPEG base64 thumbnail (~80x80)
function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const size = 80
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")!
        // Cover-crop: center the image in the square
        const scale = Math.max(size / img.width, size / img.height)
        const dw = img.width * scale
        const dh = img.height * scale
        ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)
        resolve(canvas.toDataURL("image/jpeg", 0.7))
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function HablaBeat() {
  const [currentView, setCurrentView] = useState<"songs" | "player" | "coins" | "ddr" | "visualizer">("songs")
  const [selectedLanguage, setSelectedLanguage] = useState("spanish")
  const [curriculumData, setCurriculumData] = useState(languages[selectedLanguage].curriculum)
  const [totalPlayCount, setTotalPlayCount] = useState(35)
  const [lunasPurse, setLunasPurse] = useState([
    {
      id: "alphabet-vowels-coin",
      name: "Alphabet World",
      description: "Earned by completing Alphabet World section",
      icon: "📚",
      type: "coin",
      earnedDate: new Date().toLocaleDateString(),
    },
    {
      id: "the-self-coin",
      name: "You World",
      description: "Earned by completing You World section",
      icon: "👤",
      type: "coin",
      earnedDate: new Date().toLocaleDateString(),
    },
  ])
  const [currentSong, setCurrentSong] = useState(null)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [bestFlow, setBestFlow] = useState(0)
  const [totalVocabBank, setTotalVocabBank] = useState(0)
  const [openSectionId, setOpenSectionId] = useState<string>("alphabet-vowels")
  const [bestGrades, setBestGrades] = useState<Record<number, string>>({})
  const [songPlayCounts, setSongPlayCounts] = useState<Record<number, number>>({})

  // Profile state
  const [userName, setUserName] = useState("")
  const [userPhoto, setUserPhoto] = useState("") // base64 thumbnail
  const [showProfileModal, setShowProfileModal] = useState(false)
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null)

  // Streak + challenge stats
  const [totalChallengesSent, setTotalChallengesSent] = useState(0)
  const [challengesWon, setChallengesWon] = useState(0)
  const [dailyStreak, setDailyStreak] = useState(0)
  const [lastPlayDate, setLastPlayDate] = useState("") // YYYY-MM-DD

  // Singing detection state
  const [isMicActive, setIsMicActive] = useState(false)
  const [singScore, setSingScore] = useState(0)
  const [singLevel, setSingLevel] = useState(0) // 0-100 volume level for visual meter
  const micStreamRef = useRef<MediaStream | null>(null)
  const micAnalyserRef = useRef<AnalyserNode | null>(null)
  const micAnimFrameRef = useRef<number | null>(null)
  const singScoreRef = useRef(0)

  // Lyrics sync state
  const [lyricLines, setLyricLines] = useState<{id: number; words: {id: number; text: string; timestamp: number; duration: number}[]}[]>([])
  const [activeLyricId, setActiveLyricId] = useState<number>(-1)
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("")
  const lyricTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lyricStartTimeRef = useRef<number>(0)
  const lyricCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const lyricAnimRef = useRef<number | null>(null)

  // Load persisted stats on mount
  useEffect(() => {
    setBestFlow(loadPersisted("hablabeat-best-flow", 0))
    setTotalVocabBank(loadPersisted("hablabeat-total-vocab-bank", 0))
    setBestGrades(loadPersisted("hablabeat-best-grades", {}))
    setSongPlayCounts(loadPersisted("hablabeat-song-play-counts", {}))
    setUserName(loadPersisted("hablabeat-user-name", ""))
    setUserPhoto(loadPersisted("hablabeat-user-photo", ""))
    setTotalChallengesSent(loadPersisted("hablabeat-challenges-sent", 0))
    setChallengesWon(loadPersisted("hablabeat-challenges-won", 0))
    const savedStreak = loadPersisted("hablabeat-daily-streak", 0)
    const savedLastPlay = loadPersisted("hablabeat-last-play-date", "")
    // Update daily streak on app open
    const today = new Date().toISOString().slice(0, 10)
    if (!savedLastPlay) {
      setDailyStreak(1)
      setLastPlayDate(today)
    } else {
      const diffDays = Math.round((new Date(today).getTime() - new Date(savedLastPlay).getTime()) / 86400000)
      if (diffDays === 0) {
        setDailyStreak(savedStreak)
        setLastPlayDate(savedLastPlay)
      } else if (diffDays === 1) {
        setDailyStreak(savedStreak + 1)
        setLastPlayDate(today)
      } else {
        setDailyStreak(1)
        setLastPlayDate(today)
      }
    }
  }, [])

  // Persist stats when they change
  useEffect(() => { if (bestFlow > 0) localStorage.setItem("hablabeat-best-flow", JSON.stringify(bestFlow)) }, [bestFlow])
  useEffect(() => { if (totalVocabBank > 0) localStorage.setItem("hablabeat-total-vocab-bank", JSON.stringify(totalVocabBank)) }, [totalVocabBank])
  useEffect(() => { if (Object.keys(bestGrades).length > 0) localStorage.setItem("hablabeat-best-grades", JSON.stringify(bestGrades)) }, [bestGrades])
  useEffect(() => { if (Object.keys(songPlayCounts).length > 0) localStorage.setItem("hablabeat-song-play-counts", JSON.stringify(songPlayCounts)) }, [songPlayCounts])
  useEffect(() => { localStorage.setItem("hablabeat-user-name", JSON.stringify(userName)) }, [userName])
  useEffect(() => { localStorage.setItem("hablabeat-user-photo", JSON.stringify(userPhoto)) }, [userPhoto])
  useEffect(() => { localStorage.setItem("hablabeat-challenges-sent", JSON.stringify(totalChallengesSent)) }, [totalChallengesSent])
  useEffect(() => { localStorage.setItem("hablabeat-challenges-won", JSON.stringify(challengesWon)) }, [challengesWon])
  useEffect(() => { localStorage.setItem("hablabeat-daily-streak", JSON.stringify(dailyStreak)) }, [dailyStreak])
  useEffect(() => { localStorage.setItem("hablabeat-last-play-date", JSON.stringify(lastPlayDate)) }, [lastPlayDate])

  // Called when user sends a challenge
  const handleChallengeSent = () => {
    setTotalChallengesSent(prev => prev + 1)
  }

  // Singing detection: start/stop mic
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      micStreamRef.current = stream
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      micAnalyserRef.current = analyser

      singScoreRef.current = 0
      setSingScore(0)
      setIsMicActive(true)

      // Monitor mic volume
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const checkVolume = () => {
        if (!micAnalyserRef.current) return
        micAnalyserRef.current.getByteFrequencyData(dataArray)
        // Calculate average volume
        const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length
        const level = Math.min(100, Math.round(avg * 1.5))
        setSingLevel(level)

        // Award points when singing is detected (above threshold)
        if (level > 15) {
          singScoreRef.current += Math.round(level / 20)
          setSingScore(singScoreRef.current)
        }

        micAnimFrameRef.current = requestAnimationFrame(checkVolume)
      }
      checkVolume()
    } catch {
      console.error("Microphone access denied")
    }
  }

  const stopMic = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
    }
    if (micAnimFrameRef.current) {
      cancelAnimationFrame(micAnimFrameRef.current)
      micAnimFrameRef.current = null
    }
    micAnalyserRef.current = null
    setIsMicActive(false)
    setSingLevel(0)
  }

  // Per-song country data — exact mapping from world JSON (50 Spanish songs)
  type SongCountryData = { country: string; flag: string; palette: string[]; pexelsQuery: string }
  const SONG_COUNTRY_MAP: Record<number, SongCountryData> = {
    // World 1 — Alphabet World → Mexico (1-3)
    1:  { country: 'Mexico',             flag: '🇲🇽', palette: ['#00CED1','#FF1493','#FF8C00'], pexelsQuery: 'mexico papel picado colorful fiesta' },
    2:  { country: 'Mexico',             flag: '🇲🇽', palette: ['#00CED1','#FF1493','#FF8C00'], pexelsQuery: 'mexico talavera tiles colorful mosaic' },
    3:  { country: 'Mexico',             flag: '🇲🇽', palette: ['#00CED1','#FF1493','#FF8C00'], pexelsQuery: 'mexico huichol art colorful patterns' },
    // World 2 — Self World → Guatemala (4-7)
    4:  { country: 'Guatemala',          flag: '🇬🇹', palette: ['#FF00FF','#00FFFF','#FFD700'], pexelsQuery: 'guatemala mayan woven textiles colorful huipil' },
    5:  { country: 'Guatemala',          flag: '🇬🇹', palette: ['#FF00FF','#00FFFF','#FFD700'], pexelsQuery: 'guatemala colorful market fabric weaving' },
    6:  { country: 'Guatemala',          flag: '🇬🇹', palette: ['#FF00FF','#00FFFF','#FFD700'], pexelsQuery: 'guatemala jungle temple ancient mayan' },
    7:  { country: 'Guatemala',          flag: '🇬🇹', palette: ['#FF00FF','#00FFFF','#FFD700'], pexelsQuery: 'guatemala traditional dance colorful costume' },
    // World 3 — Pet World → El Salvador & Honduras (8-10)
    8:  { country: 'El Salvador',        flag: '🇸🇻', palette: ['#228B22','#FF6347','#1E90FF'], pexelsQuery: 'el salvador colorful wildlife tropical nature' },
    9:  { country: 'Honduras',           flag: '🇭🇳', palette: ['#228B22','#FF6347','#1E90FF'], pexelsQuery: 'honduras tropical wildlife colorful reef' },
    10: { country: 'El Salvador',        flag: '🇸🇻', palette: ['#228B22','#FF6347','#1E90FF'], pexelsQuery: 'central america ceramic folk art colorful' },
    // World 4 — Travel World → Nicaragua (11-13)
    11: { country: 'Nicaragua',          flag: '🇳🇮', palette: ['#FF4500','#00CED1','#FF8C00'], pexelsQuery: 'nicaragua lake volcano dramatic landscape' },
    12: { country: 'Nicaragua',          flag: '🇳🇮', palette: ['#FF4500','#00CED1','#FF8C00'], pexelsQuery: 'nicaragua colorful mosaic patterns streets' },
    13: { country: 'Nicaragua',          flag: '🇳🇮', palette: ['#FF4500','#00CED1','#FF8C00'], pexelsQuery: 'nicaragua colorful market street art' },
    // World 5 — Time World → Costa Rica (14-17)
    14: { country: 'Costa Rica',         flag: '🇨🇷', palette: ['#00FF7F','#32CD32','#008080'], pexelsQuery: 'costa rica rainforest wildlife colorful tropical' },
    15: { country: 'Costa Rica',         flag: '🇨🇷', palette: ['#00FF7F','#32CD32','#008080'], pexelsQuery: 'costa rica jungle animals bright colorful' },
    16: { country: 'Costa Rica',         flag: '🇨🇷', palette: ['#00FF7F','#32CD32','#008080'], pexelsQuery: 'costa rica colorful birds toucans nature' },
    17: { country: 'Costa Rica',         flag: '🇨🇷', palette: ['#00FF7F','#32CD32','#008080'], pexelsQuery: 'costa rica tropical flowers waterfall colorful' },
    // World 6 — Feelings & Color World → Panama (18-20)
    18: { country: 'Panama',             flag: '🇵🇦', palette: ['#FFFFFF','#FFD700','#DC143C'], pexelsQuery: 'panama pollera dress traditional colorful' },
    19: { country: 'Panama',             flag: '🇵🇦', palette: ['#FFFFFF','#FFD700','#DC143C'], pexelsQuery: 'panama tropical flowers bright colorful' },
    20: { country: 'Panama',             flag: '🇵🇦', palette: ['#FFFFFF','#FFD700','#DC143C'], pexelsQuery: 'panama colorful city canal tropical' },
    // World 7 — Food World → Caribbean: Cuba, Dominican Republic, Puerto Rico (21-23)
    21: { country: 'Cuba',               flag: '🇨🇺', palette: ['#FFD700','#87CEEB','#FF69B4'], pexelsQuery: 'cuba salsa dance colorful havana street' },
    22: { country: 'Dominican Republic', flag: '🇩🇴', palette: ['#FFD700','#87CEEB','#FF69B4'], pexelsQuery: 'dominican republic merengue dance colorful festival' },
    23: { country: 'Puerto Rico',        flag: '🇵🇷', palette: ['#FFD700','#87CEEB','#FF69B4'], pexelsQuery: 'puerto rico colorful streets old san juan' },
    // World 8 — AR World → Colombia (24-27)
    24: { country: 'Colombia',           flag: '🇨🇴', palette: ['#1E90FF','#FFD700','#FF0000'], pexelsQuery: 'colombia carnaval barranquilla colorful masks feathers' },
    25: { country: 'Colombia',           flag: '🇨🇴', palette: ['#1E90FF','#FFD700','#FF0000'], pexelsQuery: 'colombia cumbia dance colorful skirts' },
    26: { country: 'Colombia',           flag: '🇨🇴', palette: ['#1E90FF','#FFD700','#FF0000'], pexelsQuery: 'colombia medellin colorful street art flowers' },
    27: { country: 'Colombia',           flag: '🇨🇴', palette: ['#1E90FF','#FFD700','#FF0000'], pexelsQuery: 'colombia colorful coffee region flowers landscape' },
    // World 9 — ER World → Venezuela (28-30)
    28: { country: 'Venezuela',          flag: '🇻🇪', palette: ['#DAA520','#228B22','#CC0000'], pexelsQuery: 'venezuela angel falls waterfall dramatic nature' },
    29: { country: 'Venezuela',          flag: '🇻🇪', palette: ['#DAA520','#228B22','#CC0000'], pexelsQuery: 'venezuela joropo harp music traditional dance' },
    30: { country: 'Venezuela',          flag: '🇻🇪', palette: ['#DAA520','#228B22','#CC0000'], pexelsQuery: 'venezuela tepui table mountain colorful landscape' },
    // World 10 — IR World → Ecuador (31-33)
    31: { country: 'Ecuador',            flag: '🇪🇨', palette: ['#000080','#DC143C','#FFD700'], pexelsQuery: 'ecuador andean textiles colorful patterns market' },
    32: { country: 'Ecuador',            flag: '🇪🇨', palette: ['#000080','#DC143C','#FFD700'], pexelsQuery: 'ecuador galapagos islands colorful wildlife' },
    33: { country: 'Ecuador',            flag: '🇪🇨', palette: ['#000080','#DC143C','#FFD700'], pexelsQuery: 'ecuador otavalo market colorful textiles weaving' },
    // World 11 — Quick Past World → Peru (34-37)
    34: { country: 'Peru',               flag: '🇵🇪', palette: ['#FF1493','#CC0000','#FFD700'], pexelsQuery: 'peru chicha art fluorescent colorful poster' },
    35: { country: 'Peru',               flag: '🇵🇪', palette: ['#FF1493','#CC0000','#FFD700'], pexelsQuery: 'peru marinera dance silhouette colorful festival' },
    36: { country: 'Peru',               flag: '🇵🇪', palette: ['#FF1493','#CC0000','#FFD700'], pexelsQuery: 'peru machu picchu inca colorful sunrise' },
    37: { country: 'Peru',               flag: '🇵🇪', palette: ['#FF1493','#CC0000','#FFD700'], pexelsQuery: 'peru cusco colorful traditional carnival' },
    // World 12 — Long Past World → Bolivia (38-40)
    38: { country: 'Bolivia',            flag: '🇧🇴', palette: ['#FF4500','#00CC00','#8B4513'], pexelsQuery: 'bolivia diablada devil mask festival colorful' },
    39: { country: 'Bolivia',            flag: '🇧🇴', palette: ['#FF4500','#00CC00','#8B4513'], pexelsQuery: 'bolivia altiplano textile woven colorful patterns' },
    40: { country: 'Bolivia',            flag: '🇧🇴', palette: ['#FF4500','#00CC00','#8B4513'], pexelsQuery: 'bolivia salar de uyuni salt flat colorful sky' },
    // World 13 — Future World → Paraguay (41-42)
    41: { country: 'Paraguay',           flag: '🇵🇾', palette: ['#FFFFFF','#00CC00','#1E90FF'], pexelsQuery: 'paraguay nanduti lace colorful patterns weaving' },
    42: { country: 'Paraguay',           flag: '🇵🇾', palette: ['#FFFFFF','#00CC00','#1E90FF'], pexelsQuery: 'paraguay colorful traditional festival dance music' },
    // World 14 — Conditional World → Uruguay (43-44)
    43: { country: 'Uruguay',            flag: '🇺🇾', palette: ['#20B2AA','#FF8C00','#A9A9A9'], pexelsQuery: 'uruguay coastal ocean surf colorful sunset' },
    44: { country: 'Uruguay',            flag: '🇺🇾', palette: ['#20B2AA','#FF8C00','#A9A9A9'], pexelsQuery: 'uruguay candombe drum dance colorful afro' },
    // World 15 — Pronoun World → Chile (45-46)
    45: { country: 'Chile',              flag: '🇨🇱', palette: ['#ADD8E6','#DC143C','#696969'], pexelsQuery: 'chile andes mountains dramatic colorful landscape' },
    46: { country: 'Chile',              flag: '🇨🇱', palette: ['#ADD8E6','#DC143C','#696969'], pexelsQuery: 'chile patagonia colorful nature torres del paine' },
    // World 16 — Advanced World → Argentina (47-50)
    47: { country: 'Argentina',          flag: '🇦🇷', palette: ['#8B0000','#191970','#FFD700'], pexelsQuery: 'argentina tango dance dramatic couple silhouette' },
    48: { country: 'Argentina',          flag: '🇦🇷', palette: ['#8B0000','#191970','#FFD700'], pexelsQuery: 'argentina buenos aires colorful la boca street art' },
    49: { country: 'Argentina',          flag: '🇦🇷', palette: ['#8B0000','#191970','#FFD700'], pexelsQuery: 'argentina patagonia grand vista dramatic colorful' },
    50: { country: 'Argentina',          flag: '🇦🇷', palette: ['#8B0000','#191970','#FFD700'], pexelsQuery: 'argentina carnival colorful costume festival' },
  }
  function getSongCountry(songNum: number): SongCountryData {
    return SONG_COUNTRY_MAP[songNum] ?? { country: 'Latin America', flag: '🌎', palette: ['#FF00FF','#00FFFF','#FFD700'], pexelsQuery: 'latin america colorful festival dance' }
  }
  function getSongPalette(songNum: number): string[] {
    return getSongCountry(songNum).palette
  }

  // Load lyrics + audioUrl when song changes
  useEffect(() => {
    if (!currentSong?.number) { setLyricLines([]); setCurrentAudioUrl(""); return }
    fetch(`/timing/song-${currentSong.number}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.lyrics) setLyricLines(data.lyrics)
        else setLyricLines([])
        if (data?.audioUrl) setCurrentAudioUrl(data.audioUrl)
        else setCurrentAudioUrl("")
      })
      .catch(() => { setLyricLines([]); setCurrentAudioUrl("") })
    setActiveLyricId(-1)
    lyricStartTimeRef.current = Date.now() / 1000
  }, [currentSong])

  // Mini visualizer canvas loop for player view
  useEffect(() => {
    const canvas = lyricCanvasRef.current
    if (!canvas || currentView !== "player") return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let frame = 0
    const songNum = currentSong?.number ?? 1
    const countryData = getSongCountry(songNum)
    const palette = countryData.palette

    // Fetch one Pexels clip for this country and play it behind the bars
    const bgVideo = document.createElement('video')
    bgVideo.muted = true
    bgVideo.loop = true
    bgVideo.playsInline = true
    bgVideo.crossOrigin = 'anonymous'
    let bgReady = false
    const PEXELS_KEY = 'QRejvnDTjk8yS9g9TWg3PNP3xQVpHJMuWimILfdpOUVYqnFygj58czF1'
    fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(countryData.pexelsQuery)}&per_page=5`, {
      headers: { Authorization: PEXELS_KEY }
    }).then(r => r.json()).then(data => {
      const videos = data?.videos ?? []
      if (videos.length > 0) {
        const pick = videos[Math.floor(Math.random() * videos.length)]
        const files = pick.video_files ?? []
        const mp4 = files.filter((f: any) => f.file_type === 'video/mp4').sort((a: any, b: any) => a.height - b.height).find((f: any) => f.height <= 720)
        if (mp4?.link) { bgVideo.src = mp4.link; bgVideo.play().then(() => { bgReady = true }).catch(() => {}) }
      }
    }).catch(() => {})

    const draw = () => {
      lyricAnimRef.current = requestAnimationFrame(draw)
      frame++
      const W = canvas.width, H = canvas.height
      const t = Date.now() / 1000
      const analyser = micAnalyserRef.current
      const freqData = new Uint8Array(analyser ? analyser.frequencyBinCount : 32)
      if (analyser) analyser.getByteFrequencyData(freqData)
      const energy = freqData.reduce((a, b) => a + b, 0) / freqData.length

      // Background: country video or dark fade
      if (bgReady && bgVideo.readyState >= 2) {
        ctx.drawImage(bgVideo, 0, 0, W, H)
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(0, 0, W, H)
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.18)'
        ctx.fillRect(0, 0, W, H)
      }

      // Frequency bars using world palette
      const barCount = 24
      const barW = W / barCount
      for (let i = 0; i < barCount; i++) {
        const freq = freqData[Math.floor((i / barCount) * freqData.length)] || 0
        const barH = (freq / 255) * H * 0.85 + 3
        const col = palette[i % palette.length]
        ctx.shadowColor = col
        ctx.shadowBlur = 8
        ctx.fillStyle = col
        ctx.fillRect(i * barW + 1, H - barH, barW - 2, barH)
      }
      ctx.shadowBlur = 0

      // Floating particles on beat
      if (frame % 6 === 0 && energy > 20) {
        const col = palette[Math.floor(Math.random() * palette.length)]
        const x = Math.random() * W
        const y = Math.random() * H
        const r = 2 + Math.random() * (energy / 255) * 10
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = col
        ctx.shadowColor = col
        ctx.shadowBlur = 12
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Center pulse ring
      const pulseR = 18 + (energy / 255) * 24
      const col0 = palette[Math.floor(t * 2) % palette.length]
      ctx.strokeStyle = col0
      ctx.shadowColor = col0
      ctx.shadowBlur = 10
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(W / 2, H / 2, pulseR, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }
    draw()
    return () => {
      if (lyricAnimRef.current) cancelAnimationFrame(lyricAnimRef.current)
      bgVideo.pause()
      bgVideo.src = ''
    }
  }, [currentView, currentSong])

  // Clean up mic if it was active when leaving player view
  useEffect(() => {
    if (currentView !== "player") {
      stopMic()
    }
  }, [currentView])

  // Check if section badge is unlocked
  const isSectionBadgeUnlocked = (section: any) => {
    return section.songs.some((song: any) => song.playCount >= 5)
  }

  // Auto-collect any claimable coins when curriculum data changes
  useEffect(() => {
    const allSecs = curriculumData.flatMap((cat) => cat.sections)
    allSecs.forEach((section) => {
      if (isSectionBadgeUnlocked(section)) {
        const coinId = `${section.id}-coin`
        setLunasPurse((prev) => {
          if (prev.some((item) => item.id === coinId)) return prev
          return [
            ...prev,
            {
              id: coinId,
              name: section.title,
              description: `Earned by completing ${section.title}`,
              icon: section.icon,
              type: "coin",
              earnedDate: new Date().toLocaleDateString(),
            },
          ]
        })
      }
    })
  }, [curriculumData])

  // Callback when DDR game ends: update best flow, total vocab bank, best grade, play count
  const handleDDRGameEnd = (songNum: number, flow: number, bank: number, grade: string) => {
    // Best flow ever
    setBestFlow(prev => {
      const newVal = Math.max(prev, flow)
      return newVal
    })
    // Accumulate total vocab bank
    setTotalVocabBank(prev => prev + bank)
    // Best grade per song (compare letter grades)
    const gradeOrder = ["F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"]
    setBestGrades(prev => {
      const currentBest = prev[songNum]
      const currentIdx = currentBest ? gradeOrder.indexOf(currentBest) : -1
      const newIdx = gradeOrder.indexOf(grade)
      if (newIdx > currentIdx) return { ...prev, [songNum]: grade }
      return prev
    })
    // Track play count per song
    setSongPlayCounts(prev => ({ ...prev, [songNum]: (prev[songNum] || 0) + 1 }))
  }

  // Update allSongs calculation to use current language
  const allSongs = curriculumData.flatMap((category) =>
    category.sections.flatMap((section) =>
      section.songs.map((song) => ({
        ...song,
        category: category.title,
        section: section.title,
        categoryId: category.id,
        sectionId: section.id,
        sectionIcon: section.icon,
      })),
    ),
  )

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language)
    setCurriculumData(languages[language].curriculum)
    setCurrentSong(null)
    // Only switch to songs view if we're not currently on the coins page
    if (currentView !== "coins") {
      setCurrentView("songs")
    }
  }

  const handlePlaySong = (songId, categoryId, sectionId) => {
    // Unlock audio for this browser session — must happen inside a user gesture
    try {
      const ctx = new AudioContext()
      ctx.resume().then(() => ctx.close())
    } catch {}

    // Find the song details
    const category = curriculumData.find((c) => c.id === categoryId)
    const section = category?.sections.find((s) => s.id === sectionId)
    const song = section?.songs.find((s) => s.id === songId)

    if (song) {
      // Find the song index in the allSongs array
      const songIndex = allSongs.findIndex(
        (s) => s.id === songId && s.categoryId === categoryId && s.sectionId === sectionId,
      )

      setCurrentSong({
        ...song,
        categoryTitle: category?.title,
        sectionTitle: section?.title,
        sectionColor: section?.color,
        sectionIcon: section?.icon,
        categoryId: categoryId,
        sectionId: sectionId,
      })
      setCurrentSongIndex(songIndex)
      setCurrentView("player")
      setIsPlaying(true)
    }
  }

  const handlePlayDDR = (songId, categoryId, sectionId) => {
    const category = curriculumData.find((c) => c.id === categoryId)
    const section = category?.sections.find((s) => s.id === sectionId)
    const song = section?.songs.find((s) => s.id === songId)

    if (song) {
      setCurrentSong({
        ...song,
        categoryTitle: category?.title,
        sectionTitle: section?.title,
        sectionColor: section?.color,
        sectionIcon: section?.icon,
        categoryId: categoryId,
        sectionId: sectionId,
      })
      setCurrentView("ddr")
    }
  }

  // Add new function to handle play count increment when song completes
  const handleSongComplete = (songId, categoryId, sectionId) => {
    // Update play count only when song completes
    setCurriculumData((prev) =>
      prev.map((category) => {
        if (category.id === categoryId) {
          return {
            ...category,
            sections: category.sections.map((section) => {
              if (section.id === sectionId) {
                return {
                  ...section,
                  songs: section.songs.map((song) => {
                    if (song.id === songId) {
                      return { ...song, playCount: song.playCount + 1 }
                    }
                    return song
                  }),
                }
              }
              return section
            }),
          }
        }
        return category
      }),
    )
    setTotalPlayCount((prev) => prev + 1)
  }

  const handleNextSong = () => {
    if (currentSongIndex < allSongs.length - 1) {
      const nextSong = allSongs[currentSongIndex + 1]
      handlePlaySong(nextSong.id, nextSong.categoryId, nextSong.sectionId)
    }
  }

  const handlePreviousSong = () => {
    if (currentSongIndex > 0) {
      const previousSong = allSongs[currentSongIndex - 1]
      handlePlaySong(previousSong.id, previousSong.categoryId, previousSong.sectionId)
    }
  }

  // Filter songs based on search query
  const filteredSongs = allSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Mini Player Component
  const MiniPlayer = () => {
    if (!currentSong || currentView === "player") return null

    return (
      <div
        className="bg-white border-t border-gray-200 p-3 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
        onClick={() => setCurrentView("player")}
      >
        <div className="flex items-center gap-3">
          {/* Album Art */}
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{currentSong.sectionIcon}</span>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate">{currentSong.title}</h4>
            <p className="text-xs text-gray-500 truncate">{currentSong.sectionTitle}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-700 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation()
                setIsPlaying(!isPlaying)
              }}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // DDR Game View
  if (currentView === "ddr" && currentSong && selectedLanguage === "spanish") {
    return (
      <DDRGame
        songNumber={currentSong.number}
        songTitle={currentSong.title}
        userName={userName}
        userPhoto={userPhoto}
        totalChallengesSent={totalChallengesSent}
        challengesWon={challengesWon}
        dailyStreak={dailyStreak}
        totalVocabBank={totalVocabBank}
        bestFlow={bestFlow}
        onBack={() => setCurrentView("songs")}
        onNextSong={currentSongIndex < allSongs.length - 1 ? () => {
          handleNextSong()
          setCurrentView("ddr")
        } : undefined}
        onGameEnd={handleDDRGameEnd}
        onChallengeSent={handleChallengeSent}
      />
    )
  }

  if (currentView === "player" && currentSong) {
    return (
      <SingModeView
        song={currentSong}
        lyricLines={lyricLines}
        audioUrl={currentAudioUrl}
        onBack={() => setCurrentView("songs")}
        onNext={currentSongIndex < allSongs.length - 1 ? handleNextSong : undefined}
        onPrev={currentSongIndex > 0 ? handlePreviousSong : undefined}
      />
    )
  }

  if (currentView === "player_legacy" && currentSong) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pt-8">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-700 hover:bg-gray-200"
              onClick={() => { stopMic(); setCurrentView("songs") }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-lg font-bold text-gray-900">{currentSong.title}</h1>
              <p className="text-xs text-gray-500">{currentSong.sectionTitle}</p>
            </div>
            <div className="w-10" />
          </div>

          {/* Video */}
          <div className="px-4 mb-4">
            {currentSong.youtubeId ? (
              <div className="aspect-video rounded-xl overflow-hidden bg-black relative">
                <iframe
                  key={currentSong.youtubeId}
                  src={`https://www.youtube-nocookie.com/embed/${currentSong.youtubeId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&cc_load_policy=0&fs=0&playsinline=1&controls=1&disablekb=0`}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen={false}
                />
                <div className="absolute bottom-0 right-0 w-28 h-9 bg-gradient-to-l from-black via-black/95 to-transparent z-10 pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black via-black/60 to-transparent z-10 pointer-events-none" />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2">{currentSong.sectionIcon}</div>
                  <p className="text-white/80 text-sm">Video coming soon</p>
                </div>
              </div>
            )}
          </div>

          {/* Lyrics + Visualizer Section */}
          <div className="px-4 mb-4">
            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-black">
              {/* Country badge */}
              {currentSong?.number && selectedLanguage === "spanish" && (() => {
                const sc = getSongCountry(currentSong.number)
                return (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border-b border-gray-800">
                    <span className="text-lg">{sc.flag}</span>
                    <span className="text-xs font-bold text-white">{sc.country}</span>
                    <span className="ml-auto text-xs text-gray-500">Song {currentSong.number} of 50</span>
                  </div>
                )
              })()}
              {/* Mini visualizer canvas */}
              <canvas
                ref={lyricCanvasRef}
                width={400}
                height={70}
                className="w-full block"
                style={{ height: 70 }}
              />

              {/* Lyrics scroll area */}
              <div className="bg-gray-950 px-4 py-3" style={{ minHeight: 110 }}>
                {lyricLines.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm pt-6">🎵 Loading lyrics…</p>
                ) : (
                  <div className="space-y-1 overflow-hidden" style={{ maxHeight: 100 }}>
                    {lyricLines.map((line) => {
                      const isActive = line.id === activeLyricId
                      const isPast = line.id < activeLyricId
                      return (
                        <p
                          key={line.id}
                          className="text-center transition-all duration-200 leading-snug"
                          style={{
                            fontSize: isActive ? '1.15rem' : '0.8rem',
                            fontWeight: isActive ? 700 : 400,
                            color: isActive ? '#fff' : isPast ? '#4a4a6a' : '#6b6b8a',
                            textShadow: isActive ? `0 0 12px ${getSongPalette(currentSong?.number ?? 1)[0]}, 0 0 24px ${getSongPalette(currentSong?.number ?? 1)[1]}` : 'none',
                            transform: isActive ? 'scale(1.04)' : 'scale(1)',
                            display: isActive || Math.abs(line.id - activeLyricId) <= 2 ? 'block' : 'none',
                          }}
                        >
                          {line.words.map(w => w.text).join(' ')}
                        </p>
                      )
                    })}
                    {activeLyricId === -1 && (
                      <p className="text-center text-gray-500 text-sm pt-4">🎤 Sing along!</p>
                    )}
                  </div>
                )}
              </div>

              {/* Mic bar */}
              <div className="bg-gray-900 px-4 py-2 flex items-center gap-3">
                <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${singLevel}%`,
                      background: singLevel > 60
                        ? "linear-gradient(90deg, #22c55e, #eab308, #ef4444)"
                        : singLevel > 25
                        ? "linear-gradient(90deg, #22c55e, #eab308)"
                        : "#22c55e",
                    }}
                  />
                </div>
                <span className="text-yellow-400 font-bold text-sm whitespace-nowrap">⭐ {singScore}</span>
                {isMicActive ? (
                  <button
                    onClick={stopMic}
                    className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold text-white"
                  >
                    <MicOff className="h-3 w-3" /> Mute
                  </button>
                ) : (
                  <button
                    onClick={startMic}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white"
                  >
                    <Mic className="h-3 w-3" /> Unmute
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Skip controls */}
          <div className="px-4 mb-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-700 hover:bg-gray-200"
                onClick={handlePreviousSong}
                disabled={currentSongIndex === 0}
              >
                <SkipBack className="h-6 w-6" />
              </Button>
              {selectedLanguage === "spanish" && (
                <button
                  onClick={() => { stopMic(); setCurrentView("ddr") }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-400 hover:bg-blue-300 rounded-full font-bold text-sm text-white transition-colors"
                >
                  🥕 Play Mode
                </button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-700 hover:bg-gray-200"
                onClick={handleNextSong}
                disabled={currentSongIndex === allSongs.length - 1}
              >
                <SkipForward className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="flex justify-around">
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-gray-900 pt-3"
                onClick={() => { stopMic(); setCurrentView("songs") }}
              >
                <BookOpen className="h-5 w-5" />
                <span className="text-xs">Songs</span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-gray-500 pt-3"
                onClick={() => { stopMic(); setCurrentView("coins") }}
              >
                <Coins className="h-5 w-5" />
                <span className="text-xs">Coins</span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-gray-500 pt-3"
                onClick={() => { stopMic(); setCurrentView("visualizer") }}
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-xs">Visualizer</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "coins") {
    // Determine which sections have coins earned vs not
    const earnedCoins = lunasPurse.filter((item) => item.type === "coin")
    const allSectionsList = curriculumData.flatMap((cat) => cat.sections)
    const notYetCollected = allSectionsList.filter((section) => {
      const coinId = `${section.id}-coin`
      return !lunasPurse.some((item) => item.id === coinId)
    })

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
          {/* Header */}
          <div className="text-gray-900 p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-44 h-44 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/super-bunny-heart.gif"
                  alt="HablaBeat Bunny"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 text-left">
                <h1 className="text-3xl font-bold mb-1 mt-3 text-gray-900">HablaBeat</h1>
                <p className="text-lg" style={{ color: "#6A9FC0" }}>Your Vocab Bank 💰</p>
                <div className="flex items-center gap-2 mt-2">
                  <Coins className="h-4 w-4 text-teal-600" />
                  <span className="text-teal-600 font-medium">
                    {earnedCoins.length} coins collected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Coin Collection Display */}
          <div className="px-4 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Coins Collected</h2>

            {earnedCoins.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🪙</div>
                <p className="text-gray-500">No coins earned yet!</p>
                <p className="text-gray-400 text-sm mt-2">Play and Sing songs to earn coins</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {earnedCoins.map((coin) => (
                    <div key={coin.id} className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-4 border-yellow-400 shadow-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"></div>
                        <span className="text-2xl relative z-10">{coin.icon}</span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-xs mt-2 text-center">{coin.name}</h3>
                    </div>
                  ))}
              </div>
            )}

            {/* Not Yet Collected - greyed out, emoji only, 5 per row */}
            {notYetCollected.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Not Yet Collected</h3>
                <p className="text-xs text-gray-500 mb-4 italic">Play and Sing a song 3 times to unlock</p>
                <div className="flex flex-wrap gap-3">
                  {notYetCollected.map((section) => (
                    <div key={section.id} className="w-14 h-14 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center opacity-40">
                      <span className="text-2xl grayscale">{section.icon}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="flex justify-around">
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-gray-900 pt-3"
                onClick={() => setCurrentView("songs")}
              >
                <BookOpen className="h-5 w-5" />
                <span className="text-xs">Songs</span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-gray-900 pt-3"
                onClick={() => setCurrentView("coins")}
              >
                <Coins className="h-5 w-5" />
                <span className="text-xs">Coins</span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-gray-500 pt-3"
                onClick={() => setCurrentView("visualizer")}
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-xs">Visualizer</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "songs") {
    return (
      <div className="min-h-screen swirl-bg">
        {/* Animated swirl background styles */}
        <style>{`
          @keyframes swirlBg {
            0%   { background-position: 0% 50%; }
            25%  { background-position: 50% 100%; }
            50%  { background-position: 100% 50%; }
            75%  { background-position: 50% 0%; }
            100% { background-position: 0% 50%; }
          }
          .swirl-bg {
            background: linear-gradient(
              135deg,
              #e0fdf4 0%,
              #dbeeff 25%,
              #e0fdf4 50%,
              #cff3ff 75%,
              #e0fdf4 100%
            );
            background-size: 400% 400%;
            animation: swirlBg 12s ease-in-out infinite;
          }
        `}</style>
        <div className="max-w-md mx-auto min-h-screen">
          {/* Profile photo hidden input */}
          <input
            ref={profilePhotoInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const thumb = await compressPhoto(file)
                setUserPhoto(thumb)
              } catch { /* ignore */ }
              // reset so same file can be re-selected
              e.target.value = ""
            }}
          />

          {/* Profile Modal */}
          {showProfileModal && (
            <div
              className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
              onClick={() => setShowProfileModal(false)}
            >
              <div
                className="bg-white rounded-t-3xl p-6 w-full max-w-sm shadow-2xl pb-10"
                onClick={e => e.stopPropagation()}
              >
                {/* Drag handle */}
                <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

                {/* Avatar + name row */}
                <div className="flex items-center gap-4 mb-5">
                  <button
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-blue-300 shadow-lg hover:opacity-90 transition-opacity flex-shrink-0"
                    style={{ backgroundColor: "#e0f2fe" }}
                  >
                    {userPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userPhoto} alt="Your photo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-4xl">🐰</span>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs py-0.5 text-center">
                      {userPhoto ? "Change" : "Add Photo"}
                    </div>
                  </button>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Your name (e.g. Cassidy)"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      maxLength={24}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-base font-medium focus:outline-none focus:border-blue-400"
                    />
                    {userName && (
                      <p className="text-xs text-gray-400 mt-1 px-1">Your Name 🥕</p>
                    )}
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {/* Vocab Bank — green */}
                  <div className="relative overflow-hidden rounded-2xl p-3 shadow-md" style={{
                    background: "linear-gradient(135deg, #34d399 0%, #22d3ee 100%)",
                    border: "2px solid rgba(255,255,255,0.5)"
                  }}>
                    <span className="absolute top-1 right-2 text-white/40 text-xs select-none">✦</span>
                    <p className="text-white text-2xl font-black leading-none">💰 {totalVocabBank.toLocaleString()}</p>
                    <p className="text-white/90 font-bold text-xs mt-1">Vocab Bank</p>
                  </div>
                  {/* Best Flow — sky blue */}
                  <div className="relative overflow-hidden rounded-2xl p-3 shadow-md" style={{
                    background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
                    border: "2px solid rgba(255,255,255,0.5)"
                  }}>
                    <span className="absolute top-1 right-2 text-white/40 text-xs select-none">✦</span>
                    <p className="text-white text-2xl font-black leading-none">⚡ {bestFlow}</p>
                    <p className="text-white/90 font-bold text-xs mt-1">Best Flow</p>
                  </div>
                  {/* Challenges Won — purple */}
                  <div className="relative overflow-hidden rounded-2xl p-3 shadow-md" style={{
                    background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                    border: "2px solid rgba(255,255,255,0.5)"
                  }}>
                    <span className="absolute top-1 right-2 text-white/40 text-xs select-none">✦</span>
                    <p className="text-white text-2xl font-black leading-none">⚔️ {challengesWon}</p>
                    <p className="text-white/90 font-bold text-xs mt-1">Challenges Won</p>
                  </div>
                  {/* Day Streak — orange */}
                  <div className="relative overflow-hidden rounded-2xl p-3 shadow-md" style={{
                    background: "linear-gradient(135deg, #fbbf24, #f97316)",
                    border: "2px solid rgba(255,255,255,0.5)"
                  }}>
                    <span className="absolute top-1 right-2 text-white/40 text-xs select-none">✦</span>
                    <p className="text-white text-2xl font-black leading-none">🔥 {dailyStreak > 0 ? dailyStreak : "0"}</p>
                    <p className="text-white/90 font-bold text-xs mt-1">Day Streak</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-full py-3 rounded-xl font-bold text-white text-lg"
                  style={{ backgroundColor: "#6A9FC0" }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* ── HEADER ── */}
          <div className="relative overflow-hidden pb-5" style={{
            background: "linear-gradient(180deg, #e0f7ff 0%, #c7f0ff 40%, #d4f5e9 70%, #f0fff8 100%)"
          }}>
            {/* soft cloud blobs */}
            <div className="absolute top-6 left-[-20px] w-36 h-20 rounded-full opacity-40" style={{ background: "radial-gradient(ellipse, white, transparent)" }} />
            <div className="absolute top-2 right-[-10px] w-28 h-16 rounded-full opacity-35" style={{ background: "radial-gradient(ellipse, white, transparent)" }} />
            <div className="absolute bottom-8 left-1/3 w-24 h-12 rounded-full opacity-30" style={{ background: "radial-gradient(ellipse, white, transparent)" }} />
            {/* sparkle stars */}
            <span className="absolute top-8 right-8 text-yellow-300 text-xl select-none" style={{ filter: "drop-shadow(0 0 4px gold)" }}>✦</span>
            <span className="absolute top-16 left-6 text-yellow-200 text-sm select-none" style={{ filter: "drop-shadow(0 0 3px gold)" }}>✦</span>
            <span className="absolute top-5 left-1/2 text-white text-xs select-none opacity-60">✦</span>

            {/* Profile button — top right */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-11 h-11 rounded-full overflow-hidden border-2 shadow-lg hover:opacity-90 transition-opacity"
                style={{ borderColor: "rgba(255,255,255,0.8)", backgroundColor: "#e0f2fe" }}
                title="Edit profile"
              >
                {userPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userPhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-xl">🐰</span>
                )}
              </button>
            </div>

            {/* Bunny + Title ribbon row */}
            <div className="flex items-end px-3 pt-4 gap-0">
              {/* Bunny GIF — overlaps slightly downward */}
              <div className="w-36 h-36 flex-shrink-0 relative z-10" style={{ marginBottom: "-12px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/super-bunny-heart.gif" alt="HablaBeat Bunny" className="w-full h-full object-contain drop-shadow-xl" />
              </div>

              {/* Title ribbon */}
              <div className="flex-1 relative ml-1" style={{ marginBottom: "4px" }}>
                {/* ribbon shape */}
                <div className="relative rounded-2xl px-4 py-3 shadow-lg overflow-hidden" style={{
                  background: "linear-gradient(90deg, #fbbf24 0%, #a855f7 30%, #3b82f6 60%, #06b6d4 85%, #34d399 100%)",
                  border: "3px solid rgba(255,255,255,0.7)",
                  boxShadow: "0 4px 20px rgba(168,85,247,0.3), inset 0 1px 0 rgba(255,255,255,0.5)"
                }}>
                  {/* ribbon tail left */}
                  <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-0 h-0" style={{
                    borderTop: "14px solid transparent",
                    borderBottom: "14px solid transparent",
                    borderRight: "12px solid #fbbf24"
                  }} />
                  <span className="absolute top-1 left-4 text-white/40 text-xs select-none">✦</span>
                  <span className="absolute bottom-1 right-6 text-white/30 text-xs select-none">✦</span>
                  <h1 className="text-3xl font-black text-white text-center tracking-wide drop-shadow-md"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.3)" }}>
                    HablaBeat
                  </h1>
                </div>
                {/* ribbon bottom green tail */}
                <div className="mx-6 h-3 rounded-b-xl shadow-sm" style={{
                  background: "linear-gradient(90deg, #34d399, #06b6d4)",
                  clipPath: "polygon(0 0, 100% 0, 90% 100%, 10% 100%)"
                }} />
              </div>
            </div>

            {/* Stats row — 3 tiles */}
            <div className="px-3 mt-4 grid grid-cols-3 gap-2">
              {/* Day Streak */}
              <div className="relative overflow-hidden rounded-2xl p-3 shadow-md" style={{
                background: "linear-gradient(135deg, #fbbf24, #f97316)",
                border: "2px solid rgba(255,255,255,0.5)"
              }}>
                <span className="absolute top-1 right-2 text-white/50 text-sm select-none">✦</span>
                <p className="text-white text-2xl font-black leading-none">🔥 {dailyStreak > 0 ? dailyStreak : "0"}</p>
                <p className="text-white/90 font-bold text-xs mt-1">Day Streak</p>
              </div>
              {/* Challenges Won — purple matching ribbon */}
              <div className="relative overflow-hidden rounded-2xl p-3 shadow-md" style={{
                background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                border: "2px solid rgba(255,255,255,0.5)"
              }}>
                <span className="absolute top-1 right-2 text-white/50 text-sm select-none">✦</span>
                <p className="text-white text-2xl font-black leading-none">⚔️ {challengesWon}</p>
                <p className="text-white/90 font-bold text-xs mt-1">Challenges Won</p>
              </div>
              {/* Best Flow — blue */}
              <div className="relative overflow-hidden rounded-2xl p-3 shadow-md" style={{
                background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
                border: "2px solid rgba(255,255,255,0.5)"
              }}>
                <span className="absolute top-1 right-2 text-white/50 text-sm select-none">✦</span>
                <p className="text-white text-2xl font-black leading-none">⚡ {bestFlow}</p>
                <p className="text-white/90 font-bold text-xs mt-1">Best Flow</p>
              </div>
            </div>

            {/* Vocab Bank — wide card */}
            <div className="px-3 mt-2">
              <div className="relative overflow-hidden rounded-2xl px-5 py-4 shadow-lg" style={{
                background: "linear-gradient(135deg, #34d399 0%, #22d3ee 50%, #6ee7b7 100%)",
                border: "2px solid rgba(255,255,255,0.6)",
                boxShadow: "0 4px 20px rgba(52,211,153,0.4)"
              }}>
                {/* sparkle scatter */}
                <span className="absolute top-2 right-8 text-white/40 text-xl select-none">✦</span>
                <span className="absolute bottom-2 right-16 text-white/25 text-sm select-none">✦</span>
                <span className="absolute top-3 left-1/3 text-white/20 text-lg select-none">✦</span>
                <span className="absolute bottom-3 left-1/2 text-white/20 text-xs select-none opacity-60">✦</span>
                {/* inner glow blob */}
                <div className="absolute right-12 top-0 bottom-0 w-24 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(ellipse, white, transparent)" }} />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-black leading-none" style={{ fontSize: "2.4rem" }}>{totalVocabBank.toLocaleString()}</p>
                    <p className="text-white/90 font-black text-sm mt-0.5 tracking-widest">VOCAB BANK</p>
                  </div>
                  <span className="text-5xl drop-shadow-lg">💰</span>
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum - Accordion Sections */}
          <div className="p-2 space-y-4 pb-32">
              {curriculumData.map((category) => (
                <div key={category.id} className="space-y-2">
                  {/* Main Category Header */}
                  <div className="px-4 pt-4 pb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{category.title}</h1>
                    <div className="text-sm text-gray-500 mt-1">
                      {category.sections.reduce((sum, section) => sum + section.songs.length, 0)} songs total
                    </div>
                    <div className="h-0.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round(
                            (category.sections.reduce(
                              (sum, section) => sum + section.songs.filter((song) => song.completed).length,
                              0,
                            ) /
                              category.sections.reduce((sum, section) => sum + section.songs.length, 0)) *
                              100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Accordion Sections */}
                  {category.sections.map((section) => {
                    const isOpen = openSectionId === section.id
                    return (
                      <div key={section.id}>
                        {/* Section Header - clickable accordion toggle */}
                        <button
                          onClick={() => setOpenSectionId(isOpen ? "" : section.id)}
                          className={`w-full p-3 px-4 flex items-center gap-3 transition-all rounded-lg ${
                            isOpen ? "bg-white shadow-sm" : "hover:bg-white/60"
                          } ${isSectionBadgeUnlocked(section) ? "border-l-4 border-yellow-400" : ""}`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 flex items-center justify-center flex-shrink-0 transition-all shadow-sm ${
                              isSectionBadgeUnlocked(section)
                                ? "border-2 border-yellow-500 shadow-lg shadow-yellow-400/30"
                                : "opacity-50 from-gray-200 via-gray-300 to-gray-400"
                            }`}
                          >
                            {section.id === "ar-verbs" ? <span className="text-sm font-black text-cyan-700">AR</span>
                              : section.id === "er-verbs" ? <span className="text-sm font-black text-emerald-700">ER</span>
                              : section.id === "ir-verbs" ? <span className="text-sm font-black text-purple-700">IR</span>
                              : <span className="text-lg">{section.icon}</span>}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h2 className="text-base font-bold text-gray-900">{section.title}</h2>
                              {selectedLanguage === "spanish" && section.songs.length > 0 && (() => {
                                const seen = new Set<string>()
                                return section.songs
                                  .map(s => getSongCountry(s.number))
                                  .filter(c => { if (seen.has(c.flag)) return false; seen.add(c.flag); return true })
                                  .map(c => (
                                    <span key={c.flag} className="text-base leading-none" title={c.country}>
                                      {c.flag}
                                    </span>
                                  ))
                              })()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {section.songs.length} songs • {section.songs.reduce((sum: number, song: any) => sum + song.playCount, 0)} plays
                              {selectedLanguage === "spanish" && section.songs.length > 0 && (() => {
                                const seen = new Set<string>()
                                const countries = section.songs
                                  .map((s: any) => getSongCountry(s.number))
                                  .filter((c: SongCountryData) => { if (seen.has(c.country)) return false; seen.add(c.country); return true })
                                  .map((c: SongCountryData) => c.country)
                                  .join(', ')
                                return <span className="ml-1 text-gray-400">· {countries}</span>
                              })()}
                            </div>
                          </div>
                          <div className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </button>

                        {/* Song List - only shown when section is open */}
                        {isOpen && (
                          <div className="space-y-0.5 pl-4 pr-2 pb-2 bg-white rounded-b-lg">
                            {section.songs.map((song) => {
                              const isClickable = song.youtubeId && song.youtubeId !== ""
                              const songBestGrade = bestGrades[song.number]
                              return (
                                <div
                                  key={song.id}
                                  className="p-2.5 rounded-lg transition-all hover:bg-gray-100"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 flex items-center justify-center text-gray-500">
                                      <span className="text-sm font-medium">{song.number}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <h4 className="font-bold text-gray-900 truncate text-base">{song.title}</h4>
                                        {selectedLanguage === "spanish" && (
                                          <span className="text-sm leading-none flex-shrink-0" title={getSongCountry(song.number).country}>
                                            {getSongCountry(song.number).flag}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {/* Best grade badge */}
                                    {songBestGrade && (
                                      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300">
                                        {songBestGrade}
                                      </span>
                                    )}
                                  </div>
                                  {/* Action buttons - Play first, Sing second, bigger with spacing */}
                                  <div className="flex gap-3 mt-2 ml-10">
                                    {selectedLanguage === "spanish" && (
                                      <button
                                        onClick={() => handlePlayDDR(song.id, category.id, section.id)}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-black bg-white border-2 border-black transition-colors hover:bg-gray-50"
                                      >
                                        🥕 Play
                                      </button>
                                    )}
                                    {isClickable && (
                                      <button
                                        onClick={() => handlePlaySong(song.id, category.id, section.id)}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-black bg-white border-2 border-black transition-colors hover:bg-gray-50"
                                      >
                                        🎤 Sing
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Mini Player */}
            <MiniPlayer />

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4 shadow-lg">
              <div className="flex justify-around">
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 text-gray-900 pt-3"
                  onClick={() => setCurrentView("songs")}
                >
                  <BookOpen className="h-5 w-5" />
                  <span className="text-xs">Songs</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 text-gray-500 pt-3"
                  onClick={() => setCurrentView("coins")}
                >
                  <Coins className="h-5 w-5" />
                  <span className="text-xs">Coins</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 text-gray-500 pt-3"
                  onClick={() => setCurrentView("visualizer")}
                >
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs">Visualizer</span>
                </Button>
              </div>
            </div>
        </div>
      </div>
    )
  }

  if (currentView === "visualizer") {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-md mx-auto min-h-screen flex flex-col">
          <VisualizerView onBack={() => setCurrentView("songs")} />
          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4 shadow-lg z-50">
            <div className="flex justify-around">
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-gray-500 pt-3"
                onClick={() => setCurrentView("songs")}
              >
                <BookOpen className="h-5 w-5" />
                <span className="text-xs">Songs</span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-gray-500 pt-3"
                onClick={() => setCurrentView("coins")}
              >
                <Coins className="h-5 w-5" />
                <span className="text-xs">Coins</span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-gray-900 pt-3"
                onClick={() => setCurrentView("visualizer")}
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-xs">Visualizer</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
