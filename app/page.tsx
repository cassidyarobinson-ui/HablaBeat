"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"

const DDRGame = dynamic(() => import("@/components/ddr-game"), { ssr: false })
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
            title: "Alphabet, Vowels",
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
            title: "The Self",
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
            title: "Pets And Syllables",
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
            title: "Places",
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
            title: "Numbers And Time",
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
            title: "Colors And Feelings",
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
            title: "Foods",
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
            title: "AR Verbs",
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
            title: "ER Verbs",
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
            title: "IR Verbs",
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
            title: "Preterite",
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
            title: "Imperfecto",
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
            title: "Futuro",
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
            title: "Conditional",
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
            title: "Pronouns",
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
            title: "Advanced",
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

export default function HablaBeat() {
  const [currentView, setCurrentView] = useState<"songs" | "player" | "coins" | "ddr">("songs")
  const [selectedLanguage, setSelectedLanguage] = useState("spanish")
  const [curriculumData, setCurriculumData] = useState(languages[selectedLanguage].curriculum)
  const [totalPlayCount, setTotalPlayCount] = useState(35)
  const [lunasPurse, setLunasPurse] = useState([
    {
      id: "alphabet-vowels-coin",
      name: "Alphabet Vowels",
      description: "Earned by completing Alphabet, Vowels section",
      icon: "📚",
      type: "coin",
      earnedDate: new Date().toLocaleDateString(),
    },
    {
      id: "the-self-coin",
      name: "The Self",
      description: "Earned by completing The Self section",
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

  // Singing detection state
  const [isMicActive, setIsMicActive] = useState(false)
  const [singScore, setSingScore] = useState(0)
  const [singLevel, setSingLevel] = useState(0) // 0-100 volume level for visual meter
  const micStreamRef = useRef<MediaStream | null>(null)
  const micAnalyserRef = useRef<AnalyserNode | null>(null)
  const micAnimFrameRef = useRef<number | null>(null)
  const singScoreRef = useRef(0)

  // Load persisted stats on mount
  useEffect(() => {
    setBestFlow(loadPersisted("hablabeat-best-flow", 0))
    setTotalVocabBank(loadPersisted("hablabeat-total-vocab-bank", 0))
    setBestGrades(loadPersisted("hablabeat-best-grades", {}))
    setSongPlayCounts(loadPersisted("hablabeat-song-play-counts", {}))
  }, [])

  // Persist stats when they change
  useEffect(() => { if (bestFlow > 0) localStorage.setItem("hablabeat-best-flow", JSON.stringify(bestFlow)) }, [bestFlow])
  useEffect(() => { if (totalVocabBank > 0) localStorage.setItem("hablabeat-total-vocab-bank", JSON.stringify(totalVocabBank)) }, [totalVocabBank])
  useEffect(() => { if (Object.keys(bestGrades).length > 0) localStorage.setItem("hablabeat-best-grades", JSON.stringify(bestGrades)) }, [bestGrades])
  useEffect(() => { if (Object.keys(songPlayCounts).length > 0) localStorage.setItem("hablabeat-song-play-counts", JSON.stringify(songPlayCounts)) }, [songPlayCounts])

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

  // Auto-start mic when entering player view, clean up when leaving
  useEffect(() => {
    if (currentView === "player") {
      // Small delay to ensure the view is rendered before requesting mic
      const timer = setTimeout(() => {
        if (!isMicActive) {
          startMic()
        }
      }, 500)
      return () => clearTimeout(timer)
    } else {
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
        onBack={() => setCurrentView("songs")}
        onNextSong={currentSongIndex < allSongs.length - 1 ? () => {
          handleNextSong()
          setCurrentView("ddr")
        } : undefined}
        onGameEnd={handleDDRGameEnd}
      />
    )
  }

  if (currentView === "player" && currentSong) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
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

          {/* Sing Along Section - always active */}
          <div className="px-4 mb-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-blue-700">🎤 Sing Along</h3>
                <span className="text-yellow-600 font-bold text-lg">⭐ {singScore}</span>
              </div>

              <div className="space-y-3">
                {/* Live volume meter */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-75"
                      style={{
                        width: `${singLevel}%`,
                        background: singLevel > 60
                          ? "linear-gradient(90deg, #22c55e, #eab308, #ef4444)"
                          : singLevel > 25
                          ? "linear-gradient(90deg, #22c55e, #eab308)"
                          : singLevel > 10
                          ? "#22c55e"
                          : "#d1d5db",
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{singLevel}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {singLevel > 40 ? "🔥 Great singing!" : singLevel > 15 ? "🎵 Keep going!" : "🎤 Sing along!"}
                  </p>
                  {isMicActive ? (
                    <button
                      onClick={stopMic}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-400 rounded-lg text-xs font-bold text-white transition-all"
                    >
                      <MicOff className="h-3.5 w-3.5" />
                      Mute
                    </button>
                  ) : (
                    <button
                      onClick={startMic}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-lg text-xs font-bold text-white transition-all"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      Unmute
                    </button>
                  )}
                </div>
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
          {/* Header */}
          <div className="text-gray-900 p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-44 h-44 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/super-bunny-blue.gif"
                  alt="Blue Bunny"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 text-left">
                <h1 className="text-3xl font-bold mb-1 mt-3 text-gray-900">HablaBeat</h1>
                <p className="text-blue-600 text-lg">Your Vocab Bank 💰</p>
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
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "songs") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
          {/* Header with Super Bunny */}
          <div className="text-gray-900 p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-44 h-44 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/super-bunny-blue.gif"
                  alt="Blue Bunny"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 text-left">
                <h1 className="text-3xl font-bold mb-1 mt-3 text-gray-900">HablaBeat</h1>
                <p className="text-blue-400 text-lg leading-tight">Collect coins with</p>
                <p className="text-blue-400 text-lg leading-tight font-bold">Blue Bunny!</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xl">🔥</span>
                  <span className="text-teal-600 font-bold">Best Flow: {bestFlow}</span>
                </div>
              </div>
            </div>

            {/* Vocab Bank */}
            <div className="px-4 mb-3">
              <div className="bg-yellow-100 rounded-xl p-3 border border-yellow-300 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span className="text-yellow-800 font-bold text-lg">Vocab Bank</span>
                </div>
                <span className="text-yellow-700 font-black text-2xl">{totalVocabBank}</span>
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
                            <h2 className="text-base font-bold text-gray-900">{section.title}</h2>
                            <div className="text-xs text-gray-500">
                              {section.songs.length} songs • {section.songs.reduce((sum, song) => sum + song.playCount, 0)} plays
                            </div>
                          </div>
                          <div className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </button>

                        {/* Song List - only shown when section is open */}
                        {isOpen && (
                          <div className="space-y-0.5 pl-4 pr-2 pb-2 bg-white/50">
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
                                      <h4 className="font-bold text-gray-900 truncate text-base">{song.title}</h4>
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
                                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-400 hover:bg-blue-300 rounded-lg text-sm font-bold text-white transition-colors"
                                      >
                                        🥕 Play
                                      </button>
                                    )}
                                    {isClickable && (
                                      <button
                                        onClick={() => handlePlaySong(song.id, category.id, section.id)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-400 hover:bg-blue-300 rounded-lg text-sm font-bold text-white transition-colors"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
