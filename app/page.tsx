"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Play,
  Star,
  BookOpen,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  ChevronDown,
  MoreHorizontal,
  Search,
  Coins,
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
                title: "L'Alphabet Français",
                number: 1,
                playCount: 10,
                completed: true,
                youtubeId: "",
              },
              { id: "accent-marks", title: "Les Accents", number: 2, playCount: 6, completed: false, youtubeId: "" },
              { id: "pronunciation", title: "Prononciation", number: 3, playCount: 4, completed: false, youtubeId: "" },
              {
                id: "silent-letters",
                title: "Lettres Muettes",
                number: 4,
                playCount: 2,
                completed: false,
                youtubeId: "",
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
                title: "Bonjour, Bonsoir",
                number: 5,
                playCount: 8,
                completed: false,
                youtubeId: "",
              },
              {
                id: "sil-vous-plait",
                title: "S'il Vous Plaît",
                number: 6,
                playCount: 3,
                completed: false,
                youtubeId: "",
              },
              {
                id: "merci-beaucoup",
                title: "Merci Beaucoup",
                number: 7,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "excusez-moi", title: "Excusez-moi", number: 8, playCount: 0, completed: false, youtubeId: "" },
            ],
          },
          {
            id: "family-home",
            title: "Family & Home",
            icon: "🏡",
            color: latinoColors.aqua,
            badgeUnlocked: false,
            songs: [
              { id: "ma-famille", title: "Ma Famille", number: 9, playCount: 5, completed: false, youtubeId: "" },
              { id: "ma-maison", title: "Ma Maison", number: 10, playCount: 2, completed: false, youtubeId: "" },
              {
                id: "les-pieces",
                title: "Les Pièces de la Maison",
                number: 11,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "meubles", title: "Les Meubles", number: 12, playCount: 0, completed: false, youtubeId: "" },
            ],
          },
          {
            id: "colors-numbers",
            title: "Colors & Numbers",
            icon: "🌈",
            color: latinoColors.mint,
            badgeUnlocked: false,
            songs: [
              { id: "les-couleurs", title: "Les Couleurs", number: 13, playCount: 0, completed: false, youtubeId: "" },
              {
                id: "nombres-un-dix",
                title: "Les Nombres 1-10",
                number: 14,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "nombres-onze-vingt",
                title: "Les Nombres 11-20",
                number: 15,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              {
                id: "nombres-grands",
                title: "Les Grands Nombres",
                number: 16,
                playCount: 0,
                completed: false,
                youtubeId: "",
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
          {
            id: "food-meals",
            title: "Food & Meals",
            icon: "🍽️",
            color: latinoColors.yellow,
            badgeUnlocked: false,
            songs: [
              {
                id: "fruits-legumes",
                title: "Les Fruits et Légumes",
                number: 25,
                playCount: 0,
                completed: false,
                youtubeId: "",
              },
              { id: "repas", title: "Les Repas", number: 26, playCount: 0, completed: false, youtubeId: "" },
              { id: "boissons", title: "Les Boissons", number: 27, playCount: 0, completed: false, youtubeId: "" },
              { id: "restaurant", title: "Au Restaurant", number: 28, playCount: 0, completed: false, youtubeId: "" },
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

export default function SingNSpeak() {
  const [currentView, setCurrentView] = useState("songs")
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
  // Removed: const [dailyStreak, setDailyStreak] = useState(27)
  // Removed: const [songsPerDayAverage, setSongsPerDayAverage] = useState(4.2)

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

  // 1. Update the isSectionBadgeUnlocked function
  const isSectionBadgeUnlocked = (section) => {
    return section.songs.some((song) => song.playCount >= 5)
  }

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
        categoryId: categoryId, // Add categoryId to currentSong
        sectionId: sectionId, // Add sectionId to currentSong
      })
      setCurrentSongIndex(songIndex)
      setCurrentView("player")
      setIsPlaying(true)
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
        className="bg-gray-800 border-t border-gray-700 p-3 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => setCurrentView("player")}
      >
        <div className="flex items-center gap-3">
          {/* Album Art */}
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{currentSong.sectionIcon}</span>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white text-sm truncate">{currentSong.title}</h4>
            <p className="text-xs text-gray-400 truncate">{currentSong.sectionTitle}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-white hover:bg-gray-700"
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

  // YouTube Player Component with auto-next functionality
  const YouTubePlayer = ({ videoId }) => {
    const playerRef = useRef(null)
    const [player, setPlayer] = useState(null)

    useEffect(() => {
      if (!videoId) return

      // Load YouTube iframe API
      if (!window.YT) {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        const firstScriptTag = document.getElementsByTagName("script")[0]
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

        window.onYouTubeIframeAPIReady = () => {
          initializePlayer()
        }
      } else {
        initializePlayer()
      }

      function initializePlayer() {
        if (playerRef.current && window.YT && window.YT.Player) {
          const newPlayer = new window.YT.Player(playerRef.current, {
            height: "100%",
            width: "100%",
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              controls: 1,
              rel: 0,
              modestbranding: 1,
            },
            events: {
              onStateChange: (event) => {
                // When video ends (state 0), increment play count and play next song
                if (event.data === window.YT.PlayerState.ENDED) {
                  // Increment play count for the completed song
                  const category = curriculumData.find((c) => c.id === currentSong.categoryId)
                  const section = category?.sections.find((s) => s.id === currentSong.sectionId)
                  if (currentSong && category && section) {
                    handleSongComplete(currentSong.id, category.id, section.id)
                  }
                  // Then play next song
                  handleNextSong()
                }
              },
            },
          })
          setPlayer(newPlayer)
        }
      }

      return () => {
        if (player && player.destroy) {
          player.destroy()
        }
      }
    }, [videoId])

    if (!videoId) {
      return (
        <div className="aspect-square bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-4">{currentSong?.sectionIcon}</div>
            <p className="text-white/80 text-sm">Video will play here</p>
            <p className="text-white/60 text-xs mt-2">YouTube video + lyrics</p>
          </div>
        </div>
      )
    }

    return (
      <div className="aspect-square rounded-lg overflow-hidden bg-black">
        <div ref={playerRef} className="w-full h-full"></div>
      </div>
    )
  }

  if (currentView === "player" && currentSong) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="max-w-md mx-auto bg-gradient-to-b from-gray-900 to-black min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pt-12">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setCurrentView("songs")}
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-300">Playing from SingNSpeak</p>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <MoreHorizontal className="h-6 w-6" />
            </Button>
          </div>

          {/* Video/Lyrics Area */}
          <div className="px-6 mb-8">
            <YouTubePlayer videoId={currentSong.youtubeId} />
          </div>

          {/* Song Info with Skip Buttons */}
          <div className="px-6 mb-8">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={handlePreviousSong}
                disabled={currentSongIndex === 0}
              >
                <SkipBack className="h-8 w-8" />
              </Button>

              <div className="text-center flex-1">
                <h1 className="text-2xl font-bold mb-2">{currentSong.title}</h1>
                <p className="text-gray-300 text-lg">{currentSong.sectionTitle}</p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={handleNextSong}
                disabled={currentSongIndex === allSongs.length - 1}
              >
                <SkipForward className="h-8 w-8" />
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="px-6 mb-8">
            <div className="flex items-center justify-center gap-16">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Shuffle className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Repeat className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-gray-900 border-t border-gray-800 p-4">
            <div className="flex justify-around">
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-white pt-3"
                onClick={() => setCurrentView("songs")}
              >
                <BookOpen className="h-5 w-5" />
                <span className="text-xs">Songs</span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-gray-400 pt-3"
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

  if (currentView === "coins") {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-md mx-auto bg-gray-900 min-h-screen">
          {/* Header */}
          <div className="text-white p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-32 h-32 bg-white rounded-full p-3 flex-shrink-0">
                <Image
                  src="/images/luna-dog.png"
                  alt="Luna the dog"
                  width={104}
                  height={104}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 text-left">
                <h1 className="text-3xl font-bold mb-1 mt-3">SingNSpeak</h1>
                <p className="text-purple-100 text-lg">Coin Collection</p>
                <div className="flex items-center gap-2 mt-2">
                  <Coins className="h-4 w-4 text-purple-300" />
                  <span className="text-purple-200 font-medium">
                    {lunasPurse.filter((item) => item.type === "coin").length} coins collected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Language Selector */}
          <div className="px-4 mb-4">
            <div className="flex gap-2">
              {Object.entries(languages).map(([key, lang]) => (
                <Button
                  key={key}
                  variant={selectedLanguage === key ? "default" : "secondary"}
                  size="sm"
                  onClick={() => handleLanguageChange(key)}
                  className={`flex items-center gap-2 ${
                    selectedLanguage === key
                      ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Coin Collection Display */}
          <div className="px-4 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Luna's Coin Collection</h2>

            {/* 2. Replace rectangular coin display with circular coins */}
            {lunasPurse.filter((item) => item.type === "coin").length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🪙</div>
                <p className="text-gray-400">No coins earned yet!</p>
                {/* 3. Update the "Available to Earn" section description */}
                <p className="text-gray-500 text-sm mt-2">Listen to songs 5 times each to earn coins</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {lunasPurse
                  .filter((item) => item.type === "coin")
                  .map((coin) => (
                    <div key={coin.id} className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 border-4 border-yellow-300 shadow-lg flex items-center justify-center relative overflow-hidden">
                        {/* Coin shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
                        <span className="text-2xl relative z-10">{coin.icon}</span>
                      </div>
                      <h3 className="font-bold text-white text-xs mt-2 text-center">{coin.name}</h3>
                      <p className="text-xs text-gray-500 text-center">Earned: {coin.earnedDate}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* Available Coins to Earn */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-white mb-4">Available to Earn</h3>
              <div className="space-y-3">
                {curriculumData.map((category) =>
                  category.sections.map((section) => {
                    const isUnlocked = isSectionBadgeUnlocked(section)
                    const coinId = `${section.id}-coin`
                    const alreadyEarned = lunasPurse.some((item) => item.id === coinId)

                    if (alreadyEarned) return null

                    return (
                      <div
                        key={section.id}
                        className={`p-3 rounded-lg border ${isUnlocked ? "bg-yellow-900/20 border-yellow-400" : "bg-gray-800 border-gray-700"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full bg-white flex items-center justify-center cursor-pointer transition-all ${
                              isUnlocked
                                ? "hover:scale-110 border-2 border-yellow-400 shadow-lg shadow-yellow-400/30"
                                : "opacity-50"
                            }`}
                            // 4. Update the coin earning logic in the section header click handler
                            onClick={() => {
                              if (isSectionBadgeUnlocked(section)) {
                                // Auto-earn coin when clicking on unlocked section
                                const coinId = `${section.id}-coin`
                                const alreadyEarned = lunasPurse.some((item) => item.id === coinId)

                                if (!alreadyEarned) {
                                  setLunasPurse((prev) => [
                                    ...prev,
                                    {
                                      id: coinId,
                                      name: `${section.title}`,
                                      description: `Earned by listening to ${section.title} songs 5+ times`,
                                      icon: section.icon,
                                      type: "coin",
                                      earnedDate: new Date().toLocaleDateString(),
                                    },
                                  ])
                                }
                                setCurrentView("coins")
                              }
                            }}
                          >
                            <span className="text-xl">{section.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white text-sm">{section.title}</h4>
                            {/* 3. Update the "Available to Earn" section description */}
                            <p className="text-xs text-gray-400">
                              {isUnlocked ? "Ready to claim!" : `Listen to songs 5 times each to unlock`}
                            </p>
                          </div>
                          {isUnlocked && (
                            <div className="text-yellow-400">
                              <Coins className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }),
                )}
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-gray-900 border-t border-gray-800 p-4">
            <div className="flex justify-around">
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-white pt-3"
                onClick={() => setCurrentView("songs")}
              >
                <BookOpen className="h-5 w-5" />
                <span className="text-xs">Songs</span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-white pt-3"
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
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-md mx-auto bg-gray-900 min-h-screen">
          {/* Header with Large Luna Dog */}
          <div className="text-white p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-32 h-32 bg-white rounded-full p-3 flex-shrink-0">
                <Image
                  src="/images/luna-dog.png"
                  alt="Luna the dog"
                  width={104}
                  height={104}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 text-left">
                <h1 className="text-3xl font-bold mb-1 mt-3">SingNSpeak</h1>
                <p className="text-purple-100 text-lg">Learn languages through song with Luna</p>
                <div className="flex items-center gap-2 mt-2">
                  <Play className="h-4 w-4 text-purple-300" />
                  <span className="text-purple-200 font-medium">{totalPlayCount} total plays</span>
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="mb-4">
              <div className="flex gap-2">
                {Object.entries(languages).map(([key, lang]) => (
                  <Button
                    key={key}
                    variant={selectedLanguage === key ? "default" : "secondary"}
                    size="sm"
                    onClick={() => handleLanguageChange(key)}
                    className={`flex items-center gap-2 ${
                      selectedLanguage === key
                        ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Removed Stats Cards Section */}

            {/* Search Bar */}
            <div className="px-4 mb-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="What do you want to learn?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-0 text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Search Results or Curriculum */}
            <div className="p-2 space-y-6 pb-32">
              {searchQuery ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white">Search Results</h2>
                  {filteredSongs.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No songs found for "{searchQuery}"</p>
                  ) : (
                    <div className="space-y-1">
                      {filteredSongs.map((song) => (
                        <div
                          key={`${song.categoryId}-${song.sectionId}-${song.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-all group"
                          onClick={() => handlePlaySong(song.id, song.categoryId, song.sectionId)}
                        >
                          <div className="w-8 h-8 flex items-center justify-center text-gray-400 group-hover:text-purple-400">
                            <span className="text-sm font-medium group-hover:hidden">{song.number}</span>
                            <Play className="h-4 w-4 hidden group-hover:block" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{song.title}</h4>
                            <p className="text-sm text-gray-400 truncate">
                              {song.section} • {song.category}
                            </p>
                          </div>
                          {/* Updated play count display */}
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Play className="h-3 w-3" />
                              <span className="font-medium">{song.playCount}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                curriculumData.map((category) => (
                  <div key={category.id} className="space-y-6">
                    {/* Main Category Header */}
                    <div className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <h1 className="text-2xl font-bold mb-1 text-white">{category.title}</h1>
                          <div className="text-lg font-semibold mb-2 text-white">
                            {category.sections.reduce((sum, section) => sum + section.songs.length, 0)} songs total
                          </div>
                        </div>
                      </div>
                      <div className="h-0.5 bg-gray-600 rounded-full mt-4 overflow-hidden">
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

                    {/* Sections within Main Category */}
                    {category.sections.map((section) => (
                      <div key={section.id} className="space-y-4">
                        {/* Section Header */}
                        <div
                          className={`p-4 ${isSectionBadgeUnlocked(section) ? "border-2 border-yellow-400 rounded-lg" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-12 h-12 rounded-full bg-white flex items-center justify-center cursor-pointer transition-all ${
                                  isSectionBadgeUnlocked(section)
                                    ? "hover:scale-110 border-2 border-yellow-400 shadow-lg shadow-yellow-400/30"
                                    : "opacity-30"
                                }`}
                                // 4. Update the coin earning logic in the section header click handler
                                onClick={() => {
                                  if (isSectionBadgeUnlocked(section)) {
                                    // Auto-earn coin when clicking on unlocked section
                                    const coinId = `${section.id}-coin`
                                    const alreadyEarned = lunasPurse.some((item) => item.id === coinId)

                                    if (!alreadyEarned) {
                                      setLunasPurse((prev) => [
                                        ...prev,
                                        {
                                          id: coinId,
                                          name: `${section.title}`,
                                          description: `Earned by listening to ${section.title} songs 5+ times`,
                                          icon: section.icon,
                                          type: "coin",
                                          earnedDate: new Date().toLocaleDateString(),
                                        },
                                      ])
                                    }
                                    setCurrentView("coins")
                                  }
                                }}
                              >
                                <span className="text-2xl">{section.icon}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h2 className="text-lg font-bold text-white">{section.title}</h2>
                              <div className="text-sm font-medium text-white">
                                {section.songs.length} songs •{" "}
                                {section.songs.reduce((sum, song) => sum + song.playCount, 0)} plays
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-gray-700 text-gray-300 border-gray-600">
                              {section.songs.filter((song) => song.completed).length}/{section.songs.length} completed
                            </Badge>
                          </div>
                          <div className="h-0.5 bg-gray-600 rounded-full mt-4 overflow-hidden">
                            <div
                              className="h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.round(
                                  (section.songs.filter((song) => song.completed).length / section.songs.length) * 100,
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Song List */}
                        <div className="space-y-1 ml-4">
                          {section.songs.map((song) => (
                            <div
                              key={song.id}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-all group"
                              onClick={() => handlePlaySong(song.id, category.id, section.id)}
                            >
                              <div className="w-8 h-8 flex items-center justify-center text-gray-400 group-hover:text-purple-400">
                                <span className="text-sm font-medium group-hover:hidden">{song.number}</span>
                                <Play className="h-4 w-4 hidden group-hover:block" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white truncate">{song.title}</h4>
                                <p className="text-sm text-gray-400 truncate">{section.title}</p>
                              </div>
                              {/* Updated play count display */}
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Play className="h-3 w-3" />
                                  <span className="font-medium">{song.playCount}</span>
                                </div>
                              </div>
                              <div className="w-6 h-6 flex items-center justify-center">
                                {song.completed ? (
                                  <Star className="h-4 w-4 text-green-400 fill-current" />
                                ) : (
                                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Mini Player */}
            <MiniPlayer />

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-gray-900 border-t border-gray-800 p-4">
              <div className="flex justify-around">
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 text-white pt-3"
                  onClick={() => setCurrentView("songs")}
                >
                  <BookOpen className="h-5 w-5" />
                  <span className="text-xs">Songs</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 text-gray-400 pt-3"
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
