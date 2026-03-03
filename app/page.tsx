"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { LYRIC_TRANSLATIONS } from "@/lib/lyric-translations"
import { SONG_FLY_DATA } from "@/lib/song-fly-data"

const DDRGame = dynamic(() => import("@/components/ddr-game"), { ssr: false })
const VisualizerView = dynamic(() => import("@/components/visualizer-view"), { ssr: false })
const SingModeView = dynamic(() => import("@/components/sing-mode-view"), { ssr: false })
const SongFly      = dynamic(() => import("@/components/song-fly"),      { ssr: false })
import {
  Play,
  BookOpen,
  Music,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Coins,
  Mic,
  MicOff,
  Sparkles,
  ShoppingBag,
} from "lucide-react"
import Image from "next/image"

// Add YouTube API integration
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void
    YT: any
  }
}

// ── STORE CATALOG ───────────────────────────────────────────────────────────
type StoreItemCategory = "pointer"
interface StoreItem {
  id: string
  name: string
  emoji: string
  cost: number
  category: StoreItemCategory
  description: string
  previewBg?: string      // CSS background for theme preview swatch
  previewEmoji?: string   // large emoji shown in the card image area
}

// ── COUNTRY FLAG URLS (used as world button backgrounds) ────────────────────
const COUNTRY_FLAG: Record<string, { url: string; pos: string; size: string }> = {
  "Mexico":             { url: "https://flagcdn.com/w640/mx.png",  pos: "center center", size: "cover" },
  "Guatemala":          { url: "https://flagcdn.com/w640/gt.png",  pos: "center center", size: "cover" },
  "El Salvador":        { url: "https://flagcdn.com/w640/sv.png",  pos: "center center", size: "cover" },
  "Honduras":           { url: "https://flagcdn.com/w640/hn.png",  pos: "center center", size: "cover" },
  "Nicaragua":          { url: "https://flagcdn.com/w640/ni.png",  pos: "center center", size: "cover" },
  "Costa Rica":         { url: "https://flagcdn.com/w640/cr.png",  pos: "center center", size: "cover" },
  "Panama":             { url: "https://flagcdn.com/w640/pa.png",  pos: "center center", size: "cover" },
  "Puerto Rico / DR":   { url: "https://flagcdn.com/w640/pr.png",  pos: "center center", size: "cover" },
  "Cuba":               { url: "https://flagcdn.com/w640/cu.png",  pos: "center center", size: "cover" },
  "Colombia":           { url: "https://flagcdn.com/w640/co.png",  pos: "40% 15%",       size: "180%" },
  "Venezuela":          { url: "https://flagcdn.com/w640/ve.png",  pos: "center 85%",    size: "180%" },
  "Ecuador":            { url: "https://flagcdn.com/w640/ec.png",  pos: "60% 50%",       size: "160%" },
  "Peru":               { url: "https://flagcdn.com/w640/pe.png",  pos: "center center", size: "cover" },
  "Bolivia":            { url: "https://flagcdn.com/w640/bo.png",  pos: "center center", size: "cover" },
  "Paraguay":           { url: "https://flagcdn.com/w640/py.png",  pos: "center center", size: "cover" },
  "Uruguay":            { url: "https://flagcdn.com/w640/uy.png",  pos: "center center", size: "cover" },
  "Chile":              { url: "https://flagcdn.com/w640/cl.png",  pos: "center center", size: "cover" },
  "Argentina":          { url: "https://flagcdn.com/w640/ar.png",  pos: "center center", size: "cover" },
}

// ── SECTION GRADIENTS (fallback) ────────────────────────────────────────────
const SECTION_GRADIENTS: Record<string, string> = {
  "alphabet-vowels":  "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "the-self":         "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "body-world":       "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "roles-world":      "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "pets-syllables":   "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "places":           "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "numbers":          "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "numbers-time":     "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "colors-feelings":  "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "foods":            "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "ar-verbs":         "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "er-verbs":         "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "ir-verbs":         "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "preterite":        "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "imperfecto":       "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "futuro":           "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "conditional":      "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "pronouns":         "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
  "advanced":         "linear-gradient(135deg, #7ba3e8, #4a7cdb)",
}

const STORE_CATALOG: StoreItem[] = [
  // ── Pointer Arrows ──
  // 🟢 Common (easy to unlock early)
  { id: "pointer-carrot",    name: "Carrot",          emoji: "🥕", cost: 0,    category: "pointer", description: "The original HablaBeat arrow",              previewEmoji: "🥕" },
  { id: "pointer-red-laser", name: "Red Laser",       emoji: "🔴", cost: 250,  category: "pointer", description: "Precision beam. Feels sharp, not stronger", previewEmoji: "🔴" },
  { id: "pointer-banana",    name: "Banana Blaster",  emoji: "🍌", cost: 500,  category: "pointer", description: "Visible spinning banana. Playful chaos",    previewEmoji: "🍌" },
  { id: "pointer-water",     name: "Water Cannon",    emoji: "💧", cost: 750,  category: "pointer", description: "Splash burst. Micro slow on next bubble",   previewEmoji: "💧" },
  // 🔵 Rare
  { id: "pointer-lightning", name: "Lightning Bolt",  emoji: "⚡", cost: 1500, category: "pointer", description: "10% chance to chain to the next note",      previewEmoji: "⚡" },
  { id: "pointer-ice",       name: "Ice Blaster",     emoji: "❄️", cost: 2000, category: "pointer", description: "Freeze & shatter. Slows next note for 1s",  previewEmoji: "❄️" },
  // 🟣 Epic
  { id: "pointer-rainbow",   name: "Rainbow Laser",   emoji: "🌈", cost: 3500, category: "pointer", description: "Combo meter fills slightly faster",         previewEmoji: "🌈" },
  { id: "pointer-rocket",    name: "Rocket Launcher", emoji: "🚀", cost: 5000, category: "pointer", description: "Splash radius. High impact, play patient",  previewEmoji: "🚀" },
  { id: "pointer-star",      name: "Star Shooter",    emoji: "⭐", cost: 6500, category: "pointer", description: "+10% coins per hit. Pure grind tool",       previewEmoji: "⭐" },
  // 🟡 Legendary
  { id: "pointer-dragon",    name: "Dragon Breath",   emoji: "🐉", cost: 10000, category: "pointer", description: "One miss per song won't break your combo",  previewEmoji: "🐉" },
]

// Rarity metadata for pointer store cards
const POINTER_RARITY: Record<string, { label: string; color: string; bg: string; glow: string }> = {
  "pointer-carrot":    { label: "Common",    color: "#9ca3af", bg: "linear-gradient(135deg,#f0fdf4,#e0f7ff)",   glow: "none" },
  "pointer-red-laser": { label: "Common",    color: "#9ca3af", bg: "linear-gradient(135deg,#1a0000,#330000)",   glow: "none" },
  "pointer-banana":    { label: "Common",    color: "#9ca3af", bg: "linear-gradient(135deg,#fffbeb,#fef3c7)",   glow: "none" },
  "pointer-water":     { label: "Common",    color: "#9ca3af", bg: "linear-gradient(135deg,#e0f7ff,#bae6fd)",   glow: "none" },
  "pointer-lightning": { label: "Rare",      color: "#60a5fa", bg: "linear-gradient(135deg,#1a1a00,#3d3300)",   glow: "0 0 8px rgba(96,165,250,0.4)" },
  "pointer-ice":       { label: "Rare",      color: "#60a5fa", bg: "linear-gradient(135deg,#e0f7ff,#dbeafe)",   glow: "0 0 8px rgba(96,165,250,0.4)" },
  "pointer-rainbow":   { label: "Epic",      color: "#a855f7", bg: "linear-gradient(135deg,#ef4444,#f97316,#22c55e,#3b82f6,#a855f7)", glow: "0 0 12px rgba(168,85,247,0.5)" },
  "pointer-rocket":    { label: "Epic",      color: "#a855f7", bg: "linear-gradient(135deg,#0f0c29,#302b63)",   glow: "0 0 12px rgba(168,85,247,0.5)" },
  "pointer-star":      { label: "Epic",      color: "#a855f7", bg: "linear-gradient(135deg,#1a1200,#4a3800)",   glow: "0 0 12px rgba(168,85,247,0.5)" },
  "pointer-dragon":    { label: "Legendary", color: "#f59e0b", bg: "linear-gradient(135deg,#1a0000,#4a0000,#7f1d1d)", glow: "0 0 16px rgba(245,158,11,0.6), 0 0 32px rgba(245,158,11,0.25)" },
}

const THEME_GRADIENTS: Record<string, string> = {
  "theme-default":  "linear-gradient(135deg, #e0f7ff 0%, #c7f0ff 50%, #d4f5e9 100%)",
  "theme-galaxy":   "linear-gradient(135deg, #0f0520 0%, #1e1b4b 50%, #312e81 100%)",
  "theme-cyber":    "linear-gradient(135deg, #0a0a1a 0%, #001a33 50%, #003355 100%)",
  "theme-sunset":   "linear-gradient(135deg, #ff6b35 0%, #f7c59f 40%, #ffe0cc 100%)",
  "theme-aurora":   "linear-gradient(135deg, #001a00 0%, #004d1a 30%, #002244 60%, #1a0033 100%)",
  "theme-shadow":   "linear-gradient(135deg, #0a0000 0%, #1a0000 40%, #2d0a0a 100%)",
  "theme-cloud":    "linear-gradient(135deg, #e0f0ff 0%, #f0f8ff 40%, #fff8f0 100%)",
  "theme-gold":     "linear-gradient(135deg, #1a1200 0%, #4a3800 40%, #c9a227 100%)",
  "theme-anime":    "linear-gradient(135deg, #ffe0f0 0%, #e0d4ff 50%, #c8e8ff 100%)",
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
        title: "NOUNS",
        titleSub: "in North, Central America & Caribbean Islands",
        icon: "🌟",
        color: latinoColors.orange,
        isMainCategory: true,
        sections: [
          {
            id: "alphabet-vowels",
            title: "Alphabet",
            country: "Mexico",
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
            id: "body-world",
            title: "Body",
            country: "Guatemala",
            icon: "🧍",
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
            ],
          },
          {
            id: "roles-world",
            title: "Roles",
            country: "El Salvador",
            icon: "👨‍👩‍👧",
            color: latinoColors.orange,
            badgeUnlocked: false,
            songs: [
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
            title: "Pet",
            country: "Honduras",
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
            title: "Travel",
            country: "Nicaragua",
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
            id: "numbers",
            title: "Numbers",
            country: "Costa Rica",
            icon: "🔢",
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
            ],
          },
          {
            id: "numbers-time",
            title: "Time",
            country: "Panama",
            icon: "🕐",
            color: latinoColors.aqua,
            badgeUnlocked: false,
            songs: [
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
            id: "foods",
            title: "Food",
            country: "Cuba",
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
          {
            id: "colors-feelings",
            title: "Feelings Color",
            country: "Puerto Rico / DR",
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
        ],
      },
      {
        id: "verbs",
        title: "VERBS",
        titleSub: "in South America",
        icon: "⚡",
        color: latinoColors.teal,
        isMainCategory: true,
        sections: [
          {
            id: "ar-verbs",
            title: "AR",
            country: "Colombia",
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
            title: "ER",
            country: "Venezuela",
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
            title: "IR",
            country: "Ecuador",
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
            title: "Quick Past",
            country: "Peru",
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
            title: "Long Past",
            country: "Bolivia",
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
            title: "Future",
            country: "Paraguay",
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
            country: "Uruguay",
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
            title: "Pronoun",
            country: "Chile",
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
            country: "Argentina",
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
  const [showSplash, setShowSplash] = useState(true)
  const [splashFading, setSplashFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 2400)
    const hideTimer = setTimeout(() => setShowSplash(false), 2900)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  const [currentView, setCurrentView] = useState<"songs" | "player" | "coins" | "ddr" | "visualizer" | "leaderboard">("songs")
  const [selectedLanguage, setSelectedLanguage] = useState("spanish")
  const [curriculumData, setCurriculumData] = useState(languages[selectedLanguage].curriculum)
  const [totalPlayCount, setTotalPlayCount] = useState(35)
  const [lunasPurse, setLunasPurse] = useState<{id: string; name: string; description: string; icon: string; type: string; earnedDate: string}[]>([])
  const [currentSong, setCurrentSong] = useState(null)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [bestFlow, setBestFlow] = useState(0)
  const [totalVocabBank, setTotalVocabBank] = useState(0)

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<{ name: string; flow: number; bank: number; grade: string; song: string; date: string; mode?: "pop" | "fly" }[]>([])
  const [leaderboardNameInput, setLeaderboardNameInput] = useState("")
  const [pendingLeaderboardEntry, setPendingLeaderboardEntry] = useState<{ flow: number; bank: number; grade: string; song: string; mode?: "pop" | "fly" } | null>(null)
  const [leaderboardSubmitted, setLeaderboardSubmitted] = useState(false)
  const [openSectionId, setOpenSectionId] = useState<string>("")
  const [worldClosing, setWorldClosing] = useState(false)
  const [worldZoomOrigin, setWorldZoomOrigin] = useState({ x: "50%", y: "50%" })
  const [loadoutOpen, setLoadoutOpen] = useState<"effect" | "pointer" | null>(null)
  const [openCategoryId, setOpenCategoryId] = useState<string>("people-places-things")
  const [bestGrades, setBestGrades] = useState<Record<number, string>>({})
  const [songPlayCounts, setSongPlayCounts] = useState<Record<number, number>>({})
  const [popHighScores, setPopHighScores] = useState<Record<number, number>>({})
  const [flyHighScores, setFlyHighScores] = useState<Record<number, number>>({})

  // Challenge pre-select state
  const [showFriendPicker, setShowFriendPicker] = useState(false)
  const [pendingChallengeSong, setPendingChallengeSong] = useState<{songId: string; categoryId: string; sectionId: string} | null>(null)
  const [friendPhone, setFriendPhone] = useState("")

  // Profile state
  const [userName, setUserName] = useState("")
  const [userPhoto, setUserPhoto] = useState("") // base64 thumbnail
  const [showProfileModal, setShowProfileModal] = useState(false)
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Streak + challenge stats
  const [totalChallengesSent, setTotalChallengesSent] = useState(0)
  const [challengesWon, setChallengesWon] = useState(0)
  const [dailyStreak, setDailyStreak] = useState(0)
  const [lastPlayDate, setLastPlayDate] = useState("") // YYYY-MM-DD

  // Bank tab toggle
  const [bankTab, setBankTab] = useState<"worlds" | "items">("worlds")

  // Fly game state — which song's fly game is open (null = closed)
  const [flySongNumber, setFlySongNumber] = useState<number | null>(null)

  // Store state
  const [challengeCoins, setChallengeCoins] = useState(0)
  const [storeOwned, setStoreOwned] = useState<string[]>(["pointer-carrot"])
  const [activeTheme, setActiveTheme] = useState("theme-default")
  const [activePointer, setActivePointer] = useState("pointer-carrot")

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
    setPopHighScores(loadPersisted("hablabeat-pop-high-scores", {}))
    setFlyHighScores(loadPersisted("hablabeat-fly-high-scores", {}))
    setUserName(loadPersisted("hablabeat-user-name", ""))
    setUserPhoto(loadPersisted("hablabeat-user-photo", ""))
    setTotalChallengesSent(loadPersisted("hablabeat-challenges-sent", 0))
    setChallengesWon(loadPersisted("hablabeat-challenges-won", 0))
    setChallengeCoins(loadPersisted("hablabeat-challenge-coins", 0))
    setStoreOwned(loadPersisted("hablabeat-store-owned", ["pointer-carrot"]))
    setActiveTheme(loadPersisted("hablabeat-active-theme", "theme-default"))
    setActivePointer(loadPersisted("hablabeat-active-pointer", "pointer-carrot"))
    setLunasPurse(loadPersisted("hablabeat-lunas-purse", []))
    setLeaderboard(loadPersisted("hablabeat-leaderboard", []))
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
  useEffect(() => { if (Object.keys(popHighScores).length > 0) localStorage.setItem("hablabeat-pop-high-scores", JSON.stringify(popHighScores)) }, [popHighScores])
  useEffect(() => { if (Object.keys(flyHighScores).length > 0) localStorage.setItem("hablabeat-fly-high-scores", JSON.stringify(flyHighScores)) }, [flyHighScores])
  useEffect(() => { localStorage.setItem("hablabeat-user-name", JSON.stringify(userName)) }, [userName])
  useEffect(() => { localStorage.setItem("hablabeat-user-photo", JSON.stringify(userPhoto)) }, [userPhoto])
  useEffect(() => { localStorage.setItem("hablabeat-challenges-sent", JSON.stringify(totalChallengesSent)) }, [totalChallengesSent])
  useEffect(() => { localStorage.setItem("hablabeat-challenges-won", JSON.stringify(challengesWon)) }, [challengesWon])
  useEffect(() => { localStorage.setItem("hablabeat-daily-streak", JSON.stringify(dailyStreak)) }, [dailyStreak])
  useEffect(() => { localStorage.setItem("hablabeat-last-play-date", JSON.stringify(lastPlayDate)) }, [lastPlayDate])
  useEffect(() => { localStorage.setItem("hablabeat-challenge-coins", JSON.stringify(challengeCoins)) }, [challengeCoins])
  useEffect(() => { localStorage.setItem("hablabeat-store-owned", JSON.stringify(storeOwned)) }, [storeOwned])
  useEffect(() => { localStorage.setItem("hablabeat-active-pointer", JSON.stringify(activePointer)) }, [activePointer])
  useEffect(() => { localStorage.setItem("hablabeat-lunas-purse", JSON.stringify(lunasPurse)) }, [lunasPurse])
  useEffect(() => { if (leaderboard.length > 0) localStorage.setItem("hablabeat-leaderboard", JSON.stringify(leaderboard)) }, [leaderboard])

  // Called when user sends a challenge
  const handleChallengeSent = (songNum?: number) => {
    setTotalChallengesSent(prev => prev + 1)
    // Simulate winning: award coin for this song's section and increment challengeCoins
    if (songNum !== undefined) {
      awardChallengeWinCoin(songNum)
      setChallengeCoins(prev => prev + 5)
    }
  }

  // Store helpers — purchases deduct from vocab bank coins
  const handleStorePurchase = (item: StoreItem) => {
    if (totalVocabBank < item.cost || storeOwned.includes(item.id)) return
    setTotalVocabBank(prev => prev - item.cost)
    setStoreOwned(prev => [...prev, item.id])
    setActivePointer(item.id)
  }
  const handleStoreEquip = (item: StoreItem) => {
    if (!storeOwned.includes(item.id)) return
    setActivePointer(item.id)
  }

  // Submit leaderboard score
  const submitLeaderboardScore = () => {
    if (!pendingLeaderboardEntry) return
    const name = leaderboardNameInput.trim() || "Anonymous"
    const entry = {
      name,
      flow: pendingLeaderboardEntry.flow,
      bank: pendingLeaderboardEntry.bank,
      grade: pendingLeaderboardEntry.grade,
      song: pendingLeaderboardEntry.song,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      mode: pendingLeaderboardEntry.mode || "pop" as const,
    }
    setLeaderboard(prev => {
      const updated = [...prev, entry]
      // Sort by bank (desc) then flow (desc) — bank is the universal score metric
      updated.sort((a, b) => b.bank - a.bank || b.flow - a.flow)
      // Keep top 100
      return updated.slice(0, 100)
    })
    setPendingLeaderboardEntry(null)
    setLeaderboardSubmitted(true)
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
    // World 1 (Nouns) — Alphabet → Mexico (1-3)
    1:  { country: 'Mexico',             flag: '🇲🇽', palette: ['#00CED1','#FF1493','#FF8C00'], pexelsQuery: 'mexico papel picado colorful fiesta' },
    2:  { country: 'Mexico',             flag: '🇲🇽', palette: ['#00CED1','#FF1493','#FF8C00'], pexelsQuery: 'mexico talavera tiles colorful mosaic' },
    3:  { country: 'Mexico',             flag: '🇲🇽', palette: ['#00CED1','#FF1493','#FF8C00'], pexelsQuery: 'mexico huichol art colorful patterns' },
    // World 2 — Body → Guatemala (4-5)
    4:  { country: 'Guatemala',          flag: '🇬🇹', palette: ['#FF00FF','#00FFFF','#FFD700'], pexelsQuery: 'guatemala mayan woven textiles colorful huipil' },
    5:  { country: 'Guatemala',          flag: '🇬🇹', palette: ['#FF00FF','#00FFFF','#FFD700'], pexelsQuery: 'guatemala colorful market fabric weaving' },
    // World 3 — Roles → El Salvador (6-7)
    6:  { country: 'El Salvador',        flag: '🇸🇻', palette: ['#228B22','#FF6347','#1E90FF'], pexelsQuery: 'el salvador colorful pupusas market street' },
    7:  { country: 'El Salvador',        flag: '🇸🇻', palette: ['#228B22','#FF6347','#1E90FF'], pexelsQuery: 'el salvador tropical nature volcano flowers' },
    // World 4 — Pet → Honduras (8-10)
    8:  { country: 'Honduras',           flag: '🇭🇳', palette: ['#228B22','#FF6347','#1E90FF'], pexelsQuery: 'honduras tropical wildlife colorful reef' },
    9:  { country: 'Honduras',           flag: '🇭🇳', palette: ['#228B22','#FF6347','#1E90FF'], pexelsQuery: 'honduras roatan island colorful caribbean' },
    10: { country: 'Honduras',           flag: '🇭🇳', palette: ['#228B22','#FF6347','#1E90FF'], pexelsQuery: 'honduras copan mayan ruins jungle colorful' },
    // World 5 (Nouns) — Travel → Nicaragua (11-13)
    11: { country: 'Nicaragua',          flag: '🇳🇮', palette: ['#FF4500','#00CED1','#FF8C00'], pexelsQuery: 'nicaragua lake volcano dramatic landscape' },
    12: { country: 'Nicaragua',          flag: '🇳🇮', palette: ['#FF4500','#00CED1','#FF8C00'], pexelsQuery: 'nicaragua colorful mosaic patterns streets' },
    13: { country: 'Nicaragua',          flag: '🇳🇮', palette: ['#FF4500','#00CED1','#FF8C00'], pexelsQuery: 'nicaragua colorful market street art' },
    // World 6 — Numbers → Costa Rica (14-15)
    14: { country: 'Costa Rica',         flag: '🇨🇷', palette: ['#00FF7F','#32CD32','#008080'], pexelsQuery: 'costa rica rainforest wildlife colorful tropical' },
    15: { country: 'Costa Rica',         flag: '🇨🇷', palette: ['#00FF7F','#32CD32','#008080'], pexelsQuery: 'costa rica jungle animals bright colorful' },
    // World 7 — Time → Panama (16-17)
    16: { country: 'Panama',             flag: '🇵🇦', palette: ['#FFFFFF','#FFD700','#DC143C'], pexelsQuery: 'panama pollera dress traditional colorful' },
    17: { country: 'Panama',             flag: '🇵🇦', palette: ['#FFFFFF','#FFD700','#DC143C'], pexelsQuery: 'panama colorful city canal tropical' },
    // World 8 — Feelings Color → Caribbean Islands: Puerto Rico & Dominican Republic (18-20)
    18: { country: 'Puerto Rico',        flag: '🇵🇷', palette: ['#FFD700','#87CEEB','#FF69B4'], pexelsQuery: 'puerto rico colorful streets old san juan' },
    19: { country: 'Puerto Rico',        flag: '🇵🇷', palette: ['#FFD700','#87CEEB','#FF69B4'], pexelsQuery: 'puerto rico tropical beach colorful sunset' },
    20: { country: 'Dominican Republic', flag: '🇩🇴', palette: ['#FFD700','#87CEEB','#FF69B4'], pexelsQuery: 'dominican republic merengue dance colorful festival' },
    // World 9 — Food → Cuba (21-23)
    21: { country: 'Cuba',               flag: '🇨🇺', palette: ['#FFD700','#87CEEB','#FF69B4'], pexelsQuery: 'cuba salsa dance colorful havana street' },
    22: { country: 'Cuba',               flag: '🇨🇺', palette: ['#FFD700','#87CEEB','#FF69B4'], pexelsQuery: 'cuba vintage cars colorful buildings havana' },
    23: { country: 'Cuba',               flag: '🇨🇺', palette: ['#FFD700','#87CEEB','#FF69B4'], pexelsQuery: 'cuba tropical music colorful streets festival' },
    // World 1 (Verbs) — AR → Colombia (24-27)
    24: { country: 'Colombia',           flag: '🇨🇴', palette: ['#1E90FF','#FFD700','#FF0000'], pexelsQuery: 'colombia carnaval barranquilla colorful masks feathers' },
    25: { country: 'Colombia',           flag: '🇨🇴', palette: ['#1E90FF','#FFD700','#FF0000'], pexelsQuery: 'colombia cumbia dance colorful skirts' },
    26: { country: 'Colombia',           flag: '🇨🇴', palette: ['#1E90FF','#FFD700','#FF0000'], pexelsQuery: 'colombia medellin colorful street art flowers' },
    27: { country: 'Colombia',           flag: '🇨🇴', palette: ['#1E90FF','#FFD700','#FF0000'], pexelsQuery: 'colombia colorful coffee region flowers landscape' },
    // World 2 (Verbs) — ER → Venezuela (28-30)
    28: { country: 'Venezuela',          flag: '🇻🇪', palette: ['#DAA520','#228B22','#CC0000'], pexelsQuery: 'venezuela angel falls waterfall dramatic nature' },
    29: { country: 'Venezuela',          flag: '🇻🇪', palette: ['#DAA520','#228B22','#CC0000'], pexelsQuery: 'venezuela joropo harp music traditional dance' },
    30: { country: 'Venezuela',          flag: '🇻🇪', palette: ['#DAA520','#228B22','#CC0000'], pexelsQuery: 'venezuela tepui table mountain colorful landscape' },
    // World 3 (Verbs) — IR → Ecuador (31-33)
    31: { country: 'Ecuador',            flag: '🇪🇨', palette: ['#000080','#DC143C','#FFD700'], pexelsQuery: 'ecuador andean textiles colorful patterns market' },
    32: { country: 'Ecuador',            flag: '🇪🇨', palette: ['#000080','#DC143C','#FFD700'], pexelsQuery: 'ecuador galapagos islands colorful wildlife' },
    33: { country: 'Ecuador',            flag: '🇪🇨', palette: ['#000080','#DC143C','#FFD700'], pexelsQuery: 'ecuador otavalo market colorful textiles weaving' },
    // World 4 (Verbs) — Quick Past → Peru (34-37)
    34: { country: 'Peru',               flag: '🇵🇪', palette: ['#FF1493','#CC0000','#FFD700'], pexelsQuery: 'peru chicha art fluorescent colorful poster' },
    35: { country: 'Peru',               flag: '🇵🇪', palette: ['#FF1493','#CC0000','#FFD700'], pexelsQuery: 'peru marinera dance silhouette colorful festival' },
    36: { country: 'Peru',               flag: '🇵🇪', palette: ['#FF1493','#CC0000','#FFD700'], pexelsQuery: 'peru machu picchu inca colorful sunrise' },
    37: { country: 'Peru',               flag: '🇵🇪', palette: ['#FF1493','#CC0000','#FFD700'], pexelsQuery: 'peru cusco colorful traditional carnival' },
    // World 5 (Verbs) — Long Past → Bolivia (38-40)
    38: { country: 'Bolivia',            flag: '🇧🇴', palette: ['#FF4500','#00CC00','#8B4513'], pexelsQuery: 'bolivia diablada devil mask festival colorful' },
    39: { country: 'Bolivia',            flag: '🇧🇴', palette: ['#FF4500','#00CC00','#8B4513'], pexelsQuery: 'bolivia altiplano textile woven colorful patterns' },
    40: { country: 'Bolivia',            flag: '🇧🇴', palette: ['#FF4500','#00CC00','#8B4513'], pexelsQuery: 'bolivia salar de uyuni salt flat colorful sky' },
    // World 6 (Verbs) — Future → Paraguay (41-42)
    41: { country: 'Paraguay',           flag: '🇵🇾', palette: ['#FFFFFF','#00CC00','#1E90FF'], pexelsQuery: 'paraguay nanduti lace colorful patterns weaving' },
    42: { country: 'Paraguay',           flag: '🇵🇾', palette: ['#FFFFFF','#00CC00','#1E90FF'], pexelsQuery: 'paraguay colorful traditional festival dance music' },
    // World 7 (Verbs) — Conditional → Uruguay (43-44)
    43: { country: 'Uruguay',            flag: '🇺🇾', palette: ['#20B2AA','#FF8C00','#A9A9A9'], pexelsQuery: 'uruguay coastal ocean surf colorful sunset' },
    44: { country: 'Uruguay',            flag: '🇺🇾', palette: ['#20B2AA','#FF8C00','#A9A9A9'], pexelsQuery: 'uruguay candombe drum dance colorful afro' },
    // World 8 (Verbs) — Pronoun → Chile (45-46)
    45: { country: 'Chile',              flag: '🇨🇱', palette: ['#ADD8E6','#DC143C','#696969'], pexelsQuery: 'chile andes mountains dramatic colorful landscape' },
    46: { country: 'Chile',              flag: '🇨🇱', palette: ['#ADD8E6','#DC143C','#696969'], pexelsQuery: 'chile patagonia colorful nature torres del paine' },
    // World 9 (Verbs) — Advanced → Argentina (47-50)
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

  // Check if section badge is unlocked (now requires a challenge win)
  const isSectionBadgeUnlocked = (section: any) => {
    return challengesWon > 0 && section.songs.some((song: any) => song.playCount >= 1)
  }

  // Play a soft bloop on world hover — original pitch (440→660 Hz)
  const playWorldHover = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.07)
      gain.gain.setValueAtTime(0.07, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    } catch { /* audio not available */ }
  }

  // Play a whoosh/zoom sound when tapping into a world
  const playWorldClick = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") ctx.resume()

      // Layer 1: low whoosh — noise filtered upward
      const bufferSize = ctx.sampleRate * 0.6
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const bpf = ctx.createBiquadFilter()
      bpf.type = "bandpass"
      bpf.frequency.setValueAtTime(120, ctx.currentTime)
      bpf.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.5)
      bpf.Q.value = 1.2
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.18, ctx.currentTime)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55)
      noise.connect(bpf)
      bpf.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noise.start(ctx.currentTime)

      // Layer 2: rising tone for the "zoom" feel
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      osc.connect(oscGain)
      oscGain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.setValueAtTime(180, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.45)
      oscGain.gain.setValueAtTime(0.12, ctx.currentTime)
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch { /* audio not available */ }
  }

  // Award a coin for a section when a challenge is won for a song in that section
  const awardChallengeWinCoin = (songNum: number) => {
    const allSecs = curriculumData.flatMap((cat) => cat.sections)
    const section = allSecs.find((sec: any) => sec.songs.some((s: any) => s.number === songNum))
    if (!section) return
    const coinId = `${section.id}-coin`
    setLunasPurse((prev) => {
      if (prev.some((item) => item.id === coinId)) return prev
      return [
        ...prev,
        {
          id: coinId,
          name: section.title,
          description: `Earned by beating a friend on ${section.title}`,
          icon: section.icon,
          type: "coin",
          earnedDate: new Date().toLocaleDateString(),
        },
      ]
    })
    setChallengesWon(prev => prev + 1)
  }

  // Callback when DDR game ends: update best flow, total vocab bank, best grade, play count
  const handleDDRGameEnd = (songNum: number, flow: number, bank: number, grade: string) => {
    // Best flow ever
    setBestFlow(prev => Math.max(prev, flow))
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
    // Track Pop high score per song
    setPopHighScores(prev => {
      if (bank > (prev[songNum] || 0)) return { ...prev, [songNum]: bank }
      return prev
    })
    // Queue leaderboard entry — user will enter name on leaderboard page
    const songTitle = curriculumData.flatMap(c => c.sections.flatMap(s => s.songs)).find((s: any) => s.number === songNum)?.title ?? `Song ${songNum}`
    setPendingLeaderboardEntry({ flow, bank, grade, song: songTitle, mode: "pop" })
    setLeaderboardSubmitted(false)
    setLeaderboardNameInput(userName || "")
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

  // Challenge flow — show friend picker first, then start DDR with pre-filled phone
  const handleChallengeSong = (songId: string, categoryId: string, sectionId: string) => {
    setPendingChallengeSong({ songId, categoryId, sectionId })
    setFriendPhone("")
    setShowFriendPicker(true)
  }

  const startChallengeWithFriend = () => {
    if (!pendingChallengeSong) return
    setShowFriendPicker(false)
    handlePlayDDR(pendingChallengeSong.songId, pendingChallengeSong.categoryId, pendingChallengeSong.sectionId)
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
  const MiniPlayer = () => null

  // ── SPLASH SCREEN ──────────────────────────────────────────────────────────
  if (showSplash) {
    // Generate 18 falling coins with randomized positions/delays/sizes
    const coins = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${5 + (i * 5.5) % 90}%`,
      delay: `${(i * 0.11) % 1.2}s`,
      duration: `${1.0 + (i * 0.13) % 0.8}s`,
      size: 18 + (i * 7) % 20,
      rotate: (i * 37) % 360,
    }))
    // Generate 10 falling carrots
    const carrots = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: `${8 + (i * 11) % 82}%`,
      delay: `${0.3 + (i * 0.19) % 1.5}s`,
      duration: `${1.6 + (i * 0.17) % 1.0}s`,
      size: 22 + (i * 5) % 14,
      rotate: (i * 41) % 360,
    }))

    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#fafafa",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: splashFading ? 0 : 1,
          transition: "opacity 0.5s ease",
          overflow: "hidden",
        }}
      >
        <style>{`
          @keyframes coinFall {
            0%   { transform: translateY(-60px) rotate(var(--r)); opacity: 0; }
            15%  { opacity: 1; }
            85%  { opacity: 1; }
            100% { transform: translateY(110vh) rotate(calc(var(--r) + 360deg)); opacity: 0; }
          }
          @keyframes carrotFall {
            0%   { transform: translateY(-50px) rotate(var(--r)) scale(0.8); opacity: 0; }
            10%  { opacity: 1; transform: translateY(0) rotate(var(--r)) scale(1); }
            50%  { transform: translateY(50vh) rotate(calc(var(--r) + 180deg)) scale(1); }
            90%  { opacity: 1; }
            100% { transform: translateY(110vh) rotate(calc(var(--r) + 360deg)) scale(0.9); opacity: 0; }
          }
          @keyframes splashPulse {
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 18px rgba(251,191,36,0.4)); }
            50%       { transform: scale(1.04); filter: drop-shadow(0 0 28px rgba(251,191,36,0.65)); }
          }
          @keyframes splashWordFade {
            0%   { opacity: 0; transform: translateY(8px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes titleShimmer {
            0%   { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          .splash-bunny { animation: splashPulse 2s ease-in-out infinite; }
          .splash-word  { animation: splashWordFade 0.6s ease 0.3s both; }
          .shimmer-title {
            color: #fff;
            -webkit-text-fill-color: #fff;
          }
        `}</style>

        {/* Falling coins */}
        {coins.map(c => (
          <div key={c.id} style={{
            position: "absolute",
            left: c.left,
            top: "-60px",
            width: `${c.size}px`,
            height: `${c.size}px`,
            borderRadius: "50%",
            background: "conic-gradient(from 160deg,#D97706,#FBBF24 30%,#FDE68A 50%,#FBBF24 70%,#D97706)",
            border: `${c.size > 30 ? 2 : 1.5}px solid #92400E`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15), inset 0 -2px 4px rgba(120,53,0,0.4), inset 1px 1px 4px rgba(254,243,199,0.5)",
            animation: `coinFall ${c.duration} ${c.delay} ease-in infinite`,
            ["--r" as any]: `${c.rotate}deg`,
          }}>
            <div style={{ position: "absolute", top: "15%", left: "20%", width: "30%", height: "18%", background: "radial-gradient(ellipse,rgba(255,255,255,0.55),rgba(255,255,255,0) 70%)", borderRadius: "50%", transform: "rotate(-15deg)" }} />
          </div>
        ))}

        {/* Falling carrots */}
        {carrots.map(c => (
          <div key={`carrot-${c.id}`} style={{
            position: "absolute",
            left: c.left,
            top: "-50px",
            fontSize: `${c.size}px`,
            animation: `carrotFall ${c.duration} ${c.delay} ease-in infinite`,
            ["--r" as any]: `${c.rotate}deg`,
            zIndex: 1,
            pointerEvents: "none",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          }}>🥕</div>
        ))}

        {/* Bunny centered */}
        <div className="splash-bunny" style={{ zIndex: 2, marginBottom: "-4px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/super-bunny-heart.gif" alt="HablaBeat" style={{ width: "140px", height: "140px", objectFit: "contain" }} />
        </div>

        {/* Logo text — blue with black outline + yellow glow behind */}
        <div className="splash-word" style={{ zIndex: 2, textAlign: "center", position: "relative" }}>
          <div style={{ position: "absolute", top: "-20px", left: "50%", transform: "translateX(-50%)", width: "340px", height: "160px", background: "radial-gradient(circle, rgba(251,191,36,0.32) 0%, rgba(251,191,36,0.18) 30%, rgba(251,191,36,0.08) 55%, transparent 80%)", pointerEvents: "none", zIndex: -1 }} />
          <p style={{
            fontSize: "2.6rem", fontWeight: 900, letterSpacing: "0.08em",
            color: "#ffffff",
            lineHeight: 1, margin: 0,
            WebkitTextStroke: "3px #1a1a2e",
            paintOrder: "stroke fill",
            textTransform: "uppercase" as const,
            textShadow: "3px 3px 0 #888, 4px 4px 0 #999, 5px 5px 0 #aaa, 6px 6px 0 #bbb, 7px 7px 0 #ccc",
          }}>HablaBeat</p>
          <p style={{ color: "rgba(0,0,0,0.35)", fontSize: "0.75rem", fontWeight: 700, marginTop: "12px", letterSpacing: "0.18em" }}>LEARN SPANISH THROUGH MUSIC</p>
        </div>
      </div>
    )
  }

  // Fly Game View — per-song fly
  if (flySongNumber !== null) {
    return (
      <SongFly
        songNumber={flySongNumber}
        coins={challengeCoins}
        onCoinsChange={(delta: number) => setChallengeCoins(c => Math.max(0, c + delta))}
        onClose={() => setFlySongNumber(null)}
        onGameEnd={(score) => {
          setFlyHighScores(prev => {
            if (score > (prev[flySongNumber!] || 0)) return { ...prev, [flySongNumber!]: score }
            return prev
          })
          // Queue Fly score for leaderboard
          const flyData = SONG_FLY_DATA[flySongNumber!]
          const flyTitle = flyData?.title ?? `Song ${flySongNumber}`
          setPendingLeaderboardEntry({ flow: 0, bank: score, grade: "—", song: flyTitle, mode: "fly" })
          setLeaderboardSubmitted(false)
          setLeaderboardNameInput(userName || "")
        }}
        onChallenge={(score) => {
          const flyData = SONG_FLY_DATA[flySongNumber!]
          if (!flyData) return
          // Generate challenge URL and open SMS directly
          const payload: Record<string, unknown> = {
            mode: "fly",
            s: flySongNumber!,
            t: flyData.title,
            sc: score,
          }
          if (userName) payload.n = userName
          if (userPhoto) payload.p = userPhoto
          if (totalVocabBank) payload.vb = totalVocabBank
          if (totalChallengesSent) payload.cs = totalChallengesSent + 1
          if (challengesWon) payload.cw = challengesWon
          if (dailyStreak) payload.str = dailyStreak
          const raw = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
          const url = `${window.location.origin}/challenge/${raw}`
          const senderName = userName || "Someone"
          const message = encodeURIComponent(`🥕 ${senderName} challenges you to beat their Fly score on HablaBeat! Can you top it?\n\n${url}`)
          window.location.href = `sms:?&body=${message}`
          setTotalChallengesSent(prev => prev + 1)
        }}
        activePointer={activePointer}
        storeOwned={storeOwned}
        onEquipPointer={setActivePointer}
      />
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
        initialChallengePhone={friendPhone}
        onBack={() => { setCurrentView("songs"); setFriendPhone("") }}
        onNextSong={currentSongIndex < allSongs.length - 1 ? () => {
          handleNextSong()
          setCurrentView("ddr")
        } : undefined}
        onGameEnd={handleDDRGameEnd}
        onChallengeSent={handleChallengeSent}
        activeTheme={activeTheme}
        activePointer={activePointer}
        storeOwned={storeOwned}
        onEquipTheme={setActiveTheme}
        onEquipPointer={setActivePointer}
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
              <div className="bg-gray-950 px-4 py-3" style={{ minHeight: 120 }}>
                {lyricLines.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm pt-6">🎵 Loading lyrics…</p>
                ) : (
                  <div className="space-y-2 overflow-hidden" style={{ maxHeight: 120 }}>
                    {lyricLines.map((line) => {
                      const isActive = line.id === activeLyricId
                      const isPast = line.id < activeLyricId
                      const isNearby = Math.abs(line.id - activeLyricId) <= 2
                      if (!isActive && !isNearby) return null
                      const englishText = LYRIC_TRANSLATIONS[currentSong?.number ?? 0]?.[line.id]
                      return (
                        <div
                          key={line.id}
                          className="text-center transition-all duration-200"
                          style={{
                            transform: isActive ? 'scale(1.04)' : 'scale(1)',
                          }}
                        >
                          {/* Spanish line */}
                          <p
                            className="leading-snug"
                            style={{
                              fontSize: isActive ? '1.1rem' : '0.78rem',
                              fontWeight: isActive ? 700 : 400,
                              color: isActive ? '#fff' : isPast ? '#4a4a6a' : '#6b6b8a',
                              textShadow: isActive ? `0 0 12px ${getSongPalette(currentSong?.number ?? 1)[0]}, 0 0 24px ${getSongPalette(currentSong?.number ?? 1)[1]}` : 'none',
                            }}
                          >
                            {line.words.map(w => w.text).join(' ')}
                          </p>
                          {/* English translation directly below */}
                          {englishText && (
                            <p
                              className="leading-snug"
                              style={{
                                fontSize: isActive ? '0.8rem' : '0.65rem',
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? 'rgba(255,240,140,0.9)' : isPast ? '#3a3a5a' : '#4a4a6a',
                                marginTop: '1px',
                              }}
                            >
                              {englishText}
                            </p>
                          )}
                        </div>
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
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-3 shadow-lg z-50">
            <div className="flex justify-around">
              <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl" style={{ color: "#4a7cdb", backgroundColor: "#f0f4ff" }} onClick={() => { stopMic(); setCurrentView("songs") }}>
                <Music className="h-6 w-6" />
                <span className="text-xs font-bold">Songs</span>
              </Button>
              <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl text-gray-400" onClick={() => { stopMic(); setCurrentView("coins") }}>
                <Coins className="h-6 w-6" />
                <span className="text-xs font-semibold">Bank</span>
              </Button>
              <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl text-gray-400" onClick={() => { stopMic(); setCurrentView("visualizer") }}>
                <Sparkles className="h-6 w-6" />
                <span className="text-xs font-semibold">Visualizer</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "leaderboard") {
    const gradeColor: Record<string, string> = {
      "A+": "#fbbf24", "A": "#fbbf24", "A-": "#fbbf24",
      "B+": "#34d399", "B": "#34d399", "B-": "#34d399",
      "C+": "#60a5fa", "C": "#60a5fa", "C-": "#60a5fa",
      "D+": "#f97316", "D": "#f97316", "D-": "#f97316",
      "F": "#f87171",
    }
    const rankEmoji = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`

    return (
      <div className="min-h-screen swirl-bg">
        <style>{`
          @keyframes lbRowIn {
            from { opacity: 0; transform: translateX(-16px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes lbPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.4); }
            50%       { box-shadow: 0 0 0 8px rgba(168,85,247,0); }
          }
          @keyframes bunnyTilt {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(1deg); }
          }
          .bunny-tilt { animation: bunnyTilt 4s ease-in-out infinite; }
        `}</style>
        <div className="max-w-md mx-auto min-h-screen pb-24">

          {/* Header — solid blue bar */}
          <div style={{ background: "#4a7cdb" }}>
            <div className="flex items-center px-4 pt-10 pb-3 gap-3">
              <h1 className="text-2xl font-black text-white flex-1">🏆 Leaderboard</h1>
            </div>
            <div className="flex gap-4 px-4 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-white/60 text-xs font-bold">Scores</span>
                <span className="text-white font-black text-sm">{leaderboard.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/60 text-xs font-bold">Top</span>
                <span className="text-white font-black text-sm">{leaderboard[0]?.bank ?? "—"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/60 text-xs font-bold">Flow</span>
                <span className="text-white font-black text-sm">{leaderboard.filter(e => e.mode !== "fly")[0]?.flow ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* Pending score entry — shown after a game ends */}
          {pendingLeaderboardEntry && !leaderboardSubmitted && (
            <div className="mx-2 mt-3 rounded-3xl overflow-hidden shadow-xl" style={{
              background: "linear-gradient(135deg, #1e1b4b, #4c1d95)",
              border: "2px solid rgba(168,85,247,0.6)",
              animation: "lbPulse 2s ease-in-out infinite",
            }}>
              <div className="px-5 py-4">
                <p className="text-white font-black text-lg text-center mb-1">🎉 New {pendingLeaderboardEntry.mode === "fly" ? "Fly" : "Pop"} Score!</p>
                <div className="flex justify-center gap-4 mb-3">
                  {pendingLeaderboardEntry.mode === "fly" ? (
                    <span className="text-white/80 text-sm">💰 <span className="font-black text-yellow-300">{pendingLeaderboardEntry.bank}</span> Score</span>
                  ) : (
                    <>
                      <span className="text-white/80 text-sm">🔥 <span className="font-black text-white">{pendingLeaderboardEntry.flow}</span> Flow</span>
                      <span className="text-white/80 text-sm">💰 <span className="font-black text-white">{pendingLeaderboardEntry.bank}</span> Bank</span>
                      <span className="text-white/80 text-sm">🎓 <span className="font-black" style={{ color: gradeColor[pendingLeaderboardEntry.grade] ?? "#fff" }}>{pendingLeaderboardEntry.grade}</span></span>
                    </>
                  )}
                </div>
                <p className="text-white/60 text-xs text-center mb-3">{pendingLeaderboardEntry.song}</p>
                <p className="text-white/80 text-sm font-bold text-center mb-2">Enter your name:</p>
                <input
                  type="text"
                  value={leaderboardNameInput}
                  onChange={e => setLeaderboardNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") submitLeaderboardScore() }}
                  placeholder="Your name..."
                  maxLength={20}
                  className="w-full rounded-2xl px-4 py-3 text-center font-black text-gray-900 text-base outline-none mb-3"
                  style={{ background: "rgba(255,255,255,0.95)", border: "2px solid rgba(168,85,247,0.5)" }}
                  autoFocus
                />
                <button
                  onClick={submitLeaderboardScore}
                  className="w-full py-3 rounded-2xl font-black text-white text-base active:scale-95 transition-all"
                  style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 4px 16px rgba(168,85,247,0.5)" }}
                >
                  📋 Post My Score
                </button>
              </div>
            </div>
          )}

          {leaderboardSubmitted && (
            <div className="mx-2 mt-3 rounded-2xl px-4 py-3 text-center" style={{ background: "rgba(52,211,153,0.15)", border: "1.5px solid rgba(52,211,153,0.4)" }}>
              <p className="text-emerald-300 font-black">✓ Score posted!</p>
            </div>
          )}

          {/* Leaderboard list */}
          <div className="px-2 mt-4 space-y-2">
            {leaderboard.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-white/60 font-bold text-lg">No scores yet!</p>
                <p className="text-white/40 text-sm mt-1">Play a song to get on the board</p>
              </div>
            ) : (
              leaderboard.map((entry, i) => {
                const isTop3 = i < 3
                const rowBg = i === 0
                  ? "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(245,158,11,0.15))"
                  : i === 1
                    ? "linear-gradient(135deg, rgba(148,163,184,0.2), rgba(100,116,139,0.1))"
                    : i === 2
                      ? "linear-gradient(135deg, rgba(251,146,60,0.2), rgba(234,88,12,0.1))"
                      : "rgba(255,255,255,0.06)"
                const rowBorder = i === 0 ? "1.5px solid rgba(251,191,36,0.5)"
                  : i === 1 ? "1.5px solid rgba(148,163,184,0.35)"
                  : i === 2 ? "1.5px solid rgba(251,146,60,0.35)"
                  : "1px solid rgba(255,255,255,0.08)"
                return (
                  <div
                    key={i}
                    className="rounded-2xl px-4 py-3 flex items-center gap-3"
                    style={{
                      background: rowBg,
                      border: rowBorder,
                      animation: `lbRowIn 0.3s ease ${Math.min(i * 0.04, 0.6)}s both`,
                    }}
                  >
                    {/* Rank */}
                    <div className="w-9 text-center flex-shrink-0">
                      {isTop3
                        ? <span style={{ fontSize: 24 }}>{rankEmoji(i)}</span>
                        : <span className="text-white/40 font-black text-sm">#{i + 1}</span>
                      }
                    </div>

                    {/* Name + song + mode */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-black text-sm leading-tight truncate">{entry.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0" style={{
                          background: entry.mode === "fly" ? "rgba(6,182,212,0.2)" : "rgba(249,115,22,0.2)",
                          color: entry.mode === "fly" ? "#67e8f9" : "#fdba74",
                          border: `1px solid ${entry.mode === "fly" ? "rgba(6,182,212,0.3)" : "rgba(249,115,22,0.3)"}`,
                        }}>{entry.mode === "fly" ? "🦋" : "🥕"}</span>
                      </div>
                      <p className="text-white/45 text-[10px] truncate">{entry.song} · {entry.date}</p>
                    </div>

                    {entry.mode === "fly" ? (
                      /* Fly: just show score */
                      <div className="flex-shrink-0 text-center min-w-[52px]">
                        <p className="text-yellow-300 font-black text-lg leading-none">💰{entry.bank}</p>
                        <p className="text-white/40 text-[9px]">Score</p>
                      </div>
                    ) : (
                      <>
                        {/* Grade */}
                        <div className="flex-shrink-0 text-center">
                          <p className="font-black text-lg leading-none" style={{ color: gradeColor[entry.grade] ?? "#fff" }}>{entry.grade}</p>
                          <p className="text-white/40 text-[9px]">Grade</p>
                        </div>

                        {/* Flow */}
                        <div className="flex-shrink-0 text-center min-w-[42px]">
                          <p className="text-orange-300 font-black text-base leading-none">🔥{entry.flow}</p>
                          <p className="text-white/40 text-[9px]">Flow</p>
                        </div>

                        {/* Bank */}
                        <div className="flex-shrink-0 text-center min-w-[42px]">
                          <p className="text-yellow-300 font-black text-base leading-none">💰{entry.bank}</p>
                          <p className="text-white/40 text-[9px]">Bank</p>
                        </div>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-3 shadow-lg z-50">
          <div className="flex justify-around">
            <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl text-gray-400" onClick={() => setCurrentView("songs")}>
              <Music className="h-6 w-6" />
              <span className="text-xs font-semibold">Songs</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl text-gray-400" onClick={() => setCurrentView("coins")}>
              <Coins className="h-6 w-6" />
              <span className="text-xs font-semibold">Bank</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl text-gray-400" onClick={() => setCurrentView("visualizer")}>
              <Sparkles className="h-6 w-6" />
              <span className="text-xs font-semibold">Visualizer</span>
            </Button>
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
      <div className="min-h-screen swirl-bg">
        <div className="max-w-md mx-auto min-h-screen">

          {/* Header — solid blue bar */}
          <div style={{ background: "#4a7cdb" }}>
            <div className="flex items-center px-4 pt-10 pb-2 gap-3">
              <h1 className="text-2xl font-black text-white flex-1">Vocab Bank 💰</h1>
            </div>
            <div className="flex gap-5 px-4 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-black text-lg">{totalVocabBank.toLocaleString()}</span>
                <span className="text-white/60 text-xs font-bold">vocab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-black text-lg">{earnedCoins.length}</span>
                <span className="text-white/60 text-xs font-bold">worlds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-black text-lg">{storeOwned.length}</span>
                <span className="text-white/60 text-xs font-bold">items</span>
              </div>
            </div>
          </div>

          {/* ── Worlds / Items toggle + content ── */}
          <div className="px-4 pt-4 pb-32">

            {/* Toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl mb-5">
              <button
                onClick={() => setBankTab("worlds")}
                className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                style={bankTab === "worlds" ? {
                  background: "#4a7cdb",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(74,124,219,0.3)"
                } : { color: "#6b7280" }}
              >🌍 Worlds</button>
              <button
                onClick={() => setBankTab("items")}
                className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                style={bankTab === "items" ? {
                  background: "#4a7cdb",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(74,124,219,0.3)"
                } : { color: "#6b7280" }}
              >👛 Items</button>
            </div>

            {/* ── WORLDS TAB ── */}
            {bankTab === "worlds" && (
              <div className="space-y-6">
                {/* Earned worlds */}
                {earnedCoins.length === 0 ? (
                  <div className="text-center py-8">
                    <span style={{ fontSize: "52px" }}>🌍</span>
                    <p className="text-gray-500 mt-3">No worlds collected yet!</p>
                    <p className="text-gray-400 text-sm mt-1">Beat a friend in a challenge to collect worlds 🏆</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-base font-black text-gray-800 mb-3">Collected ✅</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {earnedCoins.map((coin) => {
                          // Find the matching section to get its gradient + icon
                          const matchSection = curriculumData.flatMap(c => c.sections).find(s => s.id === coin.id.replace("-coin",""))
                          const sectionGradient = matchSection ? (SECTION_GRADIENTS[matchSection.id] ?? "linear-gradient(135deg, #7ba3e8, #4a7cdb)") : "linear-gradient(135deg, #fbbf24, #f59e0b)"
                          const displayIcon = matchSection?.icon ?? coin.icon
                          const words = coin.name.split(" ")
                          const topText = words.slice(0, -1).join(" ")
                          const botText = words[words.length - 1]
                          const r = 38, cx = 50
                          const topArc = `M ${cx - r} 52 A ${r} ${r} 0 0 1 ${cx + r} 52`
                          const botArc = `M ${cx - r} 55 A ${r} ${r} 0 0 0 ${cx + r} 55`
                          return (
                            <div key={coin.id} className="flex flex-col items-center">
                              <div
                                className="relative flex items-center justify-center rounded-full overflow-hidden world-float"
                                style={{
                                  width: "80px", height: "80px",
                                  background: sectionGradient,
                                  border: "2.5px solid rgba(255,255,255,0.6)",
                                  boxShadow: "0 3px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
                                  animationDelay: `${(earnedCoins.indexOf(coin) * 0.4) % 3}s`,
                                }}
                              >
                                <span className="absolute inset-0 flex items-center justify-center select-none" style={{ fontSize: "52px", lineHeight: 1 }}>
                                  {matchSection?.id === "ar-verbs"
                                    ? <span className="flex items-center justify-center font-black rounded-2xl" style={{ fontSize: "38px", width: "52px", height: "52px", background: "linear-gradient(135deg,#1e1b4b,#312e81)", color: "#fbbf24" }}>A</span>
                                    : matchSection?.id === "er-verbs"
                                      ? <span className="flex items-center justify-center font-black rounded-2xl" style={{ fontSize: "38px", width: "52px", height: "52px", background: "linear-gradient(135deg,#164e63,#0e7490)", color: "#6ee7b7" }}>E</span>
                                      : matchSection?.id === "ir-verbs"
                                        ? <span className="flex items-center justify-center font-black rounded-2xl" style={{ fontSize: "38px", width: "52px", height: "52px", background: "linear-gradient(135deg,#4a1942,#831843)", color: "#f9a8d4" }}>I</span>
                                        : displayIcon}
                                </span>
                                <svg className="absolute inset-0 z-10 pointer-events-none" viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
                                  <defs>
                                    <path id={`earned-top-${coin.id}`} d={topArc} />
                                    <path id={`earned-bot-${coin.id}`} d={botArc} />
                                    <filter id={`earned-outline-${coin.id}`} x="-20%" y="-20%" width="140%" height="140%">
                                      <feMorphology in="SourceAlpha" operator="dilate" radius="0.8" result="expanded"/>
                                      <feFlood floodColor="#000" result="color"/>
                                      <feComposite in="color" in2="expanded" operator="in" result="outline"/>
                                      <feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge>
                                    </filter>
                                  </defs>
                                  {topText && (
                                    <text fontSize="10" fontWeight="900" fill="white" textAnchor="middle" filter={`url(#earned-outline-${coin.id})`}>
                                      <textPath href={`#earned-top-${coin.id}`} startOffset="50%">{topText}</textPath>
                                    </text>
                                  )}
                                  <text fontSize="10" fontWeight="900" fill="white" textAnchor="middle" filter={`url(#earned-outline-${coin.id})`} dy="-2">
                                    <textPath href={`#earned-bot-${coin.id}`} startOffset="50%">{botText}</textPath>
                                  </text>
                                </svg>
                                {/* Sheen */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none rounded-full" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Worlds to earn */}
                {notYetCollected.length > 0 && (
                  <div>
                    <h3 className="text-base font-black text-gray-800 mb-1">Worlds to Earn 🔒</h3>
                    <p className="text-xs text-gray-400 mb-3 italic">Beat a friend in a challenge to unlock 🏆</p>
                    <div className="grid grid-cols-3 gap-4">
                      {notYetCollected.map((section, sectionIdx) => {
                        const sectionGradient = SECTION_GRADIENTS[section.id] ?? "linear-gradient(135deg, #7ba3e8, #4a7cdb)"
                        const words = section.title.split(" ")
                        const topText = words.slice(0, -1).join(" ")
                        const botText = words[words.length - 1]
                        const r = 38, cx = 50
                        const topArc = `M ${cx - r} 52 A ${r} ${r} 0 0 1 ${cx + r} 52`
                        const botArc = `M ${cx - r} 55 A ${r} ${r} 0 0 0 ${cx + r} 55`
                        return (
                          <div key={section.id} className="flex flex-col items-center">
                            <div
                              className="relative flex items-center justify-center rounded-full aspect-square overflow-hidden"
                              style={{
                                width: "80px", height: "80px",
                                background: sectionGradient,
                                border: "2px solid rgba(255,255,255,0.3)",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                                filter: "grayscale(1) brightness(0.55)",
                              }}
                            >
                              {/* Big emoji centered */}
                              <span className="absolute inset-0 flex items-center justify-center select-none" style={{ fontSize: "52px", lineHeight: 1 }}>
                                {section.id === "ar-verbs"
                                  ? <span className="flex items-center justify-center font-black rounded-2xl" style={{ fontSize: "38px", width: "52px", height: "52px", background: "linear-gradient(135deg,#1e1b4b,#312e81)", color: "#fbbf24" }}>A</span>
                                  : section.id === "er-verbs"
                                    ? <span className="flex items-center justify-center font-black rounded-2xl" style={{ fontSize: "38px", width: "52px", height: "52px", background: "linear-gradient(135deg,#164e63,#0e7490)", color: "#6ee7b7" }}>E</span>
                                    : section.id === "ir-verbs"
                                      ? <span className="flex items-center justify-center font-black rounded-2xl" style={{ fontSize: "38px", width: "52px", height: "52px", background: "linear-gradient(135deg,#4a1942,#831843)", color: "#f9a8d4" }}>I</span>
                                      : section.icon}
                              </span>
                              {/* Curved text label */}
                              <svg className="absolute inset-0 z-10 pointer-events-none" viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
                                <defs>
                                  <path id={`locked-top-${section.id}`} d={topArc} />
                                  <path id={`locked-bot-${section.id}`} d={botArc} />
                                  <filter id={`locked-outline-${section.id}`} x="-20%" y="-20%" width="140%" height="140%">
                                    <feMorphology in="SourceAlpha" operator="dilate" radius="0.8" result="expanded"/>
                                    <feFlood floodColor="#000" result="color"/>
                                    <feComposite in="color" in2="expanded" operator="in" result="outline"/>
                                    <feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge>
                                  </filter>
                                </defs>
                                {topText && (
                                  <text fontSize="10" fontWeight="900" fill="white" textAnchor="middle" filter={`url(#locked-outline-${section.id})`}>
                                    <textPath href={`#locked-top-${section.id}`} startOffset="50%">{topText}</textPath>
                                  </text>
                                )}
                                <text fontSize="10" fontWeight="900" fill="white" textAnchor="middle" filter={`url(#locked-outline-${section.id})`} dy="-2">
                                  <textPath href={`#locked-bot-${section.id}`} startOffset="50%">{botText}</textPath>
                                </text>
                              </svg>
                              {/* Lock overlay */}
                              <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: "rgba(0,0,0,0.15)" }}>
                                <span style={{ fontSize: "22px", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>🔒</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ITEMS TAB ── */}
            {bankTab === "items" && (() => {
              // Reusable coin SVG
              const CoinDot = ({ size = 14 }: { size?: number }) => (
                <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:"conic-gradient(from 160deg,#D97706,#FBBF24 30%,#FDE68A 50%,#FBBF24 70%,#D97706)", border:"1.5px solid #92400E", verticalAlign:"middle", flexShrink:0 }} />
              )
              // Reusable store card
              const StoreCard = ({ item, isActive, canAfford }: { item: StoreItem; isActive: boolean; canAfford: boolean }) => {
                const isOwned = storeOwned.includes(item.id)
                const isFree = item.cost === 0
                const rarityInfo = item.category === "pointer" ? POINTER_RARITY[item.id] : null
                return (
                  <div
                    className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center gap-1.5 transition-all active:scale-[0.97]"
                    style={{ border: isActive ? "2px solid #34d399" : rarityInfo && rarityInfo.label !== "Common" ? `1.5px solid ${rarityInfo.color}40` : "1px solid #f3f4f6", boxShadow: isActive ? "0 0 0 3px rgba(52,211,153,0.15)" : rarityInfo ? rarityInfo.glow : undefined }}
                  >
                    {/* Preview area */}
                    {item.previewBg ? (
                      <div className="w-full h-14 rounded-xl overflow-hidden relative" style={{ background: item.previewBg }}>
                        {/* Stars for dark themes */}
                        {(item.id === "theme-galaxy" || item.id === "theme-aurora" || item.id === "theme-shadow" || item.id === "theme-cyber" || item.id === "theme-gold") && (
                          <>
                            <span className="absolute text-white/60" style={{ top:"15%", left:"15%", fontSize:6 }}>★</span>
                            <span className="absolute text-white/40" style={{ top:"25%", left:"55%", fontSize:5 }}>✦</span>
                            <span className="absolute text-white/70" style={{ top:"55%", left:"30%", fontSize:7 }}>★</span>
                            <span className="absolute text-white/50" style={{ top:"40%", left:"75%", fontSize:5 }}>★</span>
                            <span className="absolute text-white/60" style={{ top:"70%", left:"65%", fontSize:6 }}>✦</span>
                          </>
                        )}
                        {/* Cyber grid lines */}
                        {item.id === "theme-cyber" && (
                          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)", backgroundSize: "10px 10px" }} />
                        )}
                        {/* Sparkles for anime */}
                        {item.id === "theme-anime" && (
                          <>
                            <span className="absolute" style={{ top:"10%", left:"20%", fontSize:10 }}>✨</span>
                            <span className="absolute" style={{ top:"50%", left:"60%", fontSize:8 }}>⭐</span>
                            <span className="absolute" style={{ top:"30%", left:"80%", fontSize:9 }}>✨</span>
                          </>
                        )}
                        {/* Gold crown */}
                        {item.id === "theme-gold" && (
                          <span className="absolute" style={{ top:"50%", left:"50%", transform:"translate(-50%,-50%)", fontSize:22 }}>👑</span>
                        )}
                        {item.emoji && !["theme-gold","theme-anime","theme-cyber"].includes(item.id) && (
                          <span className="absolute" style={{ top:"50%", left:"50%", transform:"translate(-50%,-50%)", fontSize:22, filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.3))" }}>{item.emoji}</span>
                        )}
                      </div>
                    ) : item.previewEmoji ? (
                      <div className="w-full h-14 rounded-xl flex items-center justify-center relative overflow-hidden"
                        style={{ background: rarityInfo
                          ? rarityInfo.bg
                          : "linear-gradient(135deg,#e0f7ff,#c7f0ff)"
                        }}>
                        <span style={{ fontSize:28, position:"relative", zIndex:1, filter: "drop-shadow(0 0 6px rgba(255,255,255,0.8))" }}>{item.previewEmoji}</span>
                      </div>
                    ) : null}

                    <p className="font-bold text-gray-900 text-xs text-center leading-tight mt-0.5">{item.name}</p>
                    {/* Rarity badge for pointers */}
                    {rarityInfo && (
                      <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ color: rarityInfo.color, background: `${rarityInfo.color}18`, border: `1px solid ${rarityInfo.color}40`, fontSize: 9 }}>
                        {rarityInfo.label === "Legendary" ? "✦ " : ""}{rarityInfo.label}
                      </span>
                    )}
                    <p className="text-xs text-gray-400 text-center leading-tight" style={{ fontSize:10 }}>{item.description}</p>

                    {/* Action button */}
                    {isActive ? (
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">✓ Active</span>
                    ) : isOwned ? (
                      <button onClick={() => handleStoreEquip(item)} className="w-full py-1.5 rounded-full text-xs font-black active:scale-95" style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee)", color: "white" }}>Equip</button>
                    ) : isFree ? (
                      <button onClick={() => handleStorePurchase(item)} className="w-full py-1.5 rounded-full text-xs font-black active:scale-95" style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee)", color: "white" }}>Get Free</button>
                    ) : canAfford ? (
                      <button onClick={() => handleStorePurchase(item)} className="w-full py-1.5 rounded-full text-xs font-black active:scale-95" style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)", color: "white" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:3, justifyContent:"center" }}>Buy — {item.cost} <CoinDot size={12} /></span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 font-semibold" style={{ display:"inline-flex", alignItems:"center", gap:3, justifyContent:"center" }}>Need {item.cost} <CoinDot size={11} /></span>
                    )}
                  </div>
                )
              }

              return (
                <div className="space-y-5">
                  {/* Balance pill */}
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm" style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", border: "2px solid rgba(255,255,255,0.6)" }}>
                      <span style={{ fontSize: "16px" }}>💰</span>
                      <span className="text-white font-black text-lg">{totalVocabBank.toLocaleString()}</span>
                      <span className="text-white/80 font-semibold text-sm">vocab coins</span>
                    </div>
                  </div>

                  {/* Pointer arrows grid */}
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">🪄 Pointer Arrows</p>
                    <div className="grid grid-cols-2 gap-3">
                      {STORE_CATALOG.filter(item => item.id.startsWith("pointer-")).map(item => (
                        <StoreCard key={item.id} item={item} isActive={activePointer === item.id} canAfford={totalVocabBank >= item.cost} />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-3 shadow-lg z-50">
            <div className="flex justify-around">
              <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl text-gray-400" onClick={() => setCurrentView("songs")}>
                <Music className="h-6 w-6" />
                <span className="text-xs font-semibold">Songs</span>
              </Button>
              <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl" style={{ color: "#4a7cdb", backgroundColor: "#f0f4ff" }} onClick={() => setCurrentView("coins")}>
                <Coins className="h-6 w-6" />
                <span className="text-xs font-bold">Bank</span>
              </Button>
              <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl text-gray-400" onClick={() => setCurrentView("visualizer")}>
                <Sparkles className="h-6 w-6" />
                <span className="text-xs font-semibold">Visualizer</span>
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
          .swirl-bg {
            background: linear-gradient(180deg, #edf2fa 0%, #f5f7fb 40%, #fafafa 100%);
          }
          @keyframes titleShimmer {
            0%   { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          .shimmer-title {
            color: #fff;
            -webkit-text-fill-color: #fff;
          }
          @keyframes fireFlicker {
            0%,100% { transform: scaleY(1) rotate(-3deg); }
            25%      { transform: scaleY(1.08) rotate(2deg); }
            50%      { transform: scaleY(0.95) rotate(-2deg); }
            75%      { transform: scaleY(1.05) rotate(3deg); }
          }
          @keyframes swordSparks {
            0%,100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
            30%      { transform: scale(1.12) rotate(-4deg); filter: brightness(1.4); }
            60%      { transform: scale(0.96) rotate(4deg); filter: brightness(1.2); }
          }
          @keyframes lightningShimmer {
            0%,100% { transform: scaleX(1); filter: brightness(1); }
            40%      { transform: scaleX(1.15) skewX(-5deg); filter: brightness(1.6) drop-shadow(0 0 4px #fff); }
            70%      { transform: scaleX(0.9) skewX(3deg); filter: brightness(1.2); }
          }
          @keyframes moneybagBounce {
            0%,100% { transform: translateY(0) rotate(0deg); }
            30%      { transform: translateY(-5px) rotate(-4deg); }
            60%      { transform: translateY(-2px) rotate(3deg); }
          }
          .emoji-fire     { display:inline-block; animation: fireFlicker 1.8s ease-in-out infinite; transform-origin: bottom center; }
          .emoji-swords   { display:inline-block; animation: swordSparks 2.4s ease-in-out infinite; }
          .emoji-lightning{ display:inline-block; animation: lightningShimmer 2s ease-in-out infinite; }
          .emoji-moneybag { display:inline-block; animation: moneybagBounce 2.2s ease-in-out infinite; }
          @keyframes bunnyTilt {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(1deg); }
          }
          .bunny-tilt { animation: bunnyTilt 4s ease-in-out infinite; }
          @keyframes worldFloat {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-4px); }
          }
          .world-float { animation: worldFloat 3.5s ease-in-out infinite; }
          @keyframes worldZoomIn {
            0%   { clip-path: circle(20% at var(--ox) var(--oy)); opacity: 0.7; }
            50%  { clip-path: circle(60% at 50% 50%); opacity: 1; }
            100% { clip-path: circle(150% at 50% 50%); opacity: 1; }
          }
          @keyframes worldZoomOut {
            0%   { clip-path: circle(150% at 50% 50%); opacity: 1; }
            100% { clip-path: circle(20% at var(--ox) var(--oy)); opacity: 0; }
          }
          .world-zoom-in  { animation: worldZoomIn  0.9s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
          .world-zoom-out { animation: worldZoomOut 0.4s cubic-bezier(0.4,0,0.2,1) forwards; }
          @keyframes worldStarBurst {
            0%   { transform: translate(-50%, -50%) rotate(var(--sa)) translateX(0) scale(1); opacity: 1; }
            60%  { opacity: 0.8; }
            100% { transform: translate(-50%, -50%) rotate(var(--sa)) translateX(var(--sd)) scale(0.1); opacity: 0; }
          }
          @keyframes worldContentFadeIn {
            0%   { opacity: 0; transform: scale(0.92); }
            100% { opacity: 1; transform: scale(1); }
          }
          .world-content-in { animation: worldContentFadeIn 0.4s ease 0.7s both; }
          .world-content-in .flag-text {
            color: #fff;
            text-shadow: 0 1px 6px rgba(0,0,0,0.6);
          }
          .world-content-in .flag-text-light {
            color: rgba(255,255,255,0.85);
            text-shadow: 0 1px 4px rgba(0,0,0,0.5);
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.15; transform: scale(0.7); }
            50%       { opacity: 1;    transform: scale(1.3); }
          }
          @keyframes twinkleSlow {
            0%, 100% { opacity: 0.1; transform: scale(0.6) rotate(0deg); }
            50%       { opacity: 0.9; transform: scale(1.4) rotate(20deg); }
          }
          @keyframes alienFloat {
            0%, 100% { transform: translateY(0px) rotate(-5deg) translateX(0px); }
            33%       { transform: translateY(-12px) rotate(3deg) translateX(6px); }
            66%       { transform: translateY(-6px) rotate(-2deg) translateX(-4px); }
          }
          .star-twinkle { animation: twinkle ease-in-out infinite; }
          .star-twinkle-slow { animation: twinkleSlow ease-in-out infinite; }
          .shooting-star { animation: shootingStar linear infinite; }
          .shooting-star-b { animation: shootingStarB linear infinite; }
          .alien-float { animation: alienFloat ease-in-out infinite; }
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
              className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center pb-16"
              onClick={() => setShowProfileModal(false)}
            >
              <div
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl mx-4"
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
                  {/* Best Flow — sky blue */}
                  <div className="relative overflow-hidden rounded-2xl p-3 shadow-md" style={{
                    background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
                    border: "2px solid rgba(255,255,255,0.5)"
                  }}>
                    <span className="absolute top-1 right-2 text-white/40 text-xs select-none">✦</span>
                    <p className="text-white text-2xl font-black leading-none"><span className="emoji-lightning">⚡</span> {bestFlow}</p>
                    <p className="text-white/90 font-bold text-xs mt-1">Best Flow</p>
                  </div>
                  {/* Challenges Won — purple */}
                  <div className="relative overflow-hidden rounded-2xl p-3 shadow-md" style={{
                    background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                    border: "2px solid rgba(255,255,255,0.5)"
                  }}>
                    <span className="absolute top-1 right-2 text-white/40 text-xs select-none">✦</span>
                    <p className="text-white text-2xl font-black leading-none"><span className="emoji-swords">⚔️</span> {challengesWon}</p>
                    <p className="text-white/90 font-bold text-xs mt-1">Challenges Won</p>
                  </div>
                  {/* Day Streak — orange */}
                  <div className="relative overflow-hidden rounded-2xl p-3 shadow-md" style={{
                    background: "linear-gradient(135deg, #fbbf24, #f97316)",
                    border: "2px solid rgba(255,255,255,0.5)"
                  }}>
                    <span className="absolute top-1 right-2 text-white/40 text-xs select-none">✦</span>
                    <p className="text-white text-2xl font-black leading-none"><span className="emoji-fire">🔥</span> {dailyStreak > 0 ? dailyStreak : "0"}</p>
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

          {/* ── HEADER — Duolingo-style solid blue bar ── */}
          <div style={{ background: "#4a7cdb" }}>
            {/* Top bar: bunny + title + profile */}
            <div className="flex items-center px-4 pt-4 pb-2 gap-3">
              <div className="w-20 h-20 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/super-bunny-heart.gif" alt="HablaBeat Bunny" className="w-full h-full object-contain" />
              </div>
              <h1 className="flex-1" style={{
                fontSize: "2rem", fontWeight: 900, letterSpacing: "0.08em",
                color: "#ffffff",
                lineHeight: 1,
                WebkitTextStroke: "2px #1a1a2e",
                paintOrder: "stroke fill",
                textTransform: "uppercase" as const,
                textShadow: "2px 2px 0 #888, 3px 3px 0 #999, 4px 4px 0 #aaa, 5px 5px 0 #bbb",
              }}>HablaBeat</h1>
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-20 h-20 flex-shrink-0 hover:opacity-90 transition-opacity"
                title="Edit profile"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/super-bunny-heart.gif" alt="Profile" className="w-full h-full object-contain" style={{ transform: "scaleX(-1)" }} />
              </button>
            </div>
            {/* Stats row — inline with labels */}
            <div className="flex items-center justify-center gap-5 px-4 pb-3">
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="emoji-fire text-lg">🔥</span>
                  <span className="text-white font-black text-sm">{dailyStreak > 0 ? dailyStreak : "0"}</span>
                </div>
                <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Streak</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="emoji-swords text-lg">⚔️</span>
                  <span className="text-white font-black text-sm">{challengesWon}</span>
                </div>
                <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Challenges</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="emoji-lightning text-lg">⚡</span>
                  <span className="text-white font-black text-sm">{bestFlow}</span>
                </div>
                <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Flow</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-lg">💰</span>
                  <span className="text-white font-black text-sm">{totalVocabBank}</span>
                </div>
                <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Bank</span>
              </div>
            </div>
          </div>

          {/* ✨ World overlay — zooms in when a world is tapped */}
          {(() => {
            if (!openSectionId) return null
            // Find the open section + its category
            let openSection: typeof curriculumData[0]["sections"][0] | null = null
            let openCategory: typeof curriculumData[0] | null = null
            for (const cat of curriculumData) {
              const sec = cat.sections.find(s => s.id === openSectionId)
              if (sec) { openSection = sec; openCategory = cat; break }
            }
            if (!openSection || !openCategory) return null
            const sectionGradient = SECTION_GRADIENTS[openSection.id] ?? "linear-gradient(135deg, #7ba3e8, #4a7cdb)"
            const countryName = (openSection as any).country ?? ""
            const flagBg = COUNTRY_FLAG[countryName]
            const closeWorld = () => {
              setWorldClosing(true)
              setTimeout(() => { setOpenSectionId(""); setWorldClosing(false) }, 450)
            }
            return (
              <div
                className={worldClosing ? "world-zoom-out" : "world-zoom-in"}
                style={{
                  position: "fixed", inset: 0, zIndex: 60,
                  background: "#fafafa",
                  "--ox": worldZoomOrigin.x, "--oy": worldZoomOrigin.y,
                } as React.CSSProperties}
              >
                {/* Content */}
                <div className="world-content-in flex flex-col h-full max-w-md mx-auto">
                  {/* Header — solid blue bar like Duolingo */}
                  <div style={{ background: "#4a7cdb" }}>
                    <div className="flex items-center gap-3 px-4 pt-10 pb-3">
                      <button
                        onClick={closeWorld}
                        className="w-9 h-9 rounded-full flex items-center justify-center font-black text-lg active:scale-90 transition-all flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff" }}
                      >←</button>
                      <span className="text-2xl flex-shrink-0">{openSection.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-black text-lg leading-tight text-white">{openSection.title}</h2>
                        <p className="text-xs font-semibold text-white/70">{openSection.songs.length} songs · {countryName}</p>
                      </div>
                      {flagBg && (
                        <div className="w-10 h-7 rounded-md overflow-hidden flex-shrink-0" style={{ border: "2px solid rgba(255,255,255,0.4)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={flagBg.url.replace("w640", "w80")} alt={countryName} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Song list */}
                  <div className="flex-1 overflow-y-auto px-3 pt-3" style={{ paddingBottom: "120px" }}>
                    <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
                      {openSection.songs.map((song, idx) => {
                        const isClickable = song.youtubeId && song.youtubeId !== ""
                        const songBestGrade = bestGrades[song.number]
                        return (
                          <div
                            key={song.id}
                            className="px-4 py-4 transition-all active:scale-[0.99]"
                            style={{ borderBottom: idx < openSection!.songs.length - 1 ? "1px solid #f4f4f5" : "none" }}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-bold w-5 text-center flex-shrink-0" style={{ color: "#a1a1aa" }}>{song.number}</span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold truncate text-sm" style={{ color: "#18181b" }}>{song.title}</h4>
                                <div className="h-1 w-20 rounded-full mt-1 overflow-hidden" style={{ background: "#f4f4f5" }}>
                                  <div className="h-full rounded-full transition-all duration-500" style={{
                                    width: `${Math.min(100, ((song.playCount || 0) / 3) * 100)}%`,
                                    background: song.playCount >= 3 ? "#4a7cdb" : "#b3cff0"
                                  }} />
                                </div>
                              </div>
                              {songBestGrade && (
                                <span className="text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "#f0f4ff", color: "#4a7cdb", border: "1px solid #d6e4f5" }}>
                                  {songBestGrade}
                                </span>
                              )}
                            </div>
                            {/* Sing · Pop · Fly — pill buttons with high scores */}
                            <div className="flex flex-wrap gap-2 mt-2.5 ml-7">
                              {isClickable && (
                                <div className="flex flex-col items-center">
                                  <button
                                    onClick={() => handlePlaySong(song.id, openCategory!.id, openSection!.id)}
                                    className="mode-btn px-4 py-2 rounded-full font-black text-sm active:scale-90"
                                    style={{ background: "#f0f4ff", color: "#4a7cdb", boxShadow: "0 1px 2px rgba(74,124,219,0.08)", border: "1.5px solid #bdd0ef" }}
                                  >
                                    🎤 Sing
                                  </button>
                                </div>
                              )}
                              {selectedLanguage === "spanish" && (
                                <div className="flex flex-col items-center">
                                  <button
                                    onClick={() => handlePlayDDR(song.id, openCategory!.id, openSection!.id)}
                                    className="mode-btn px-4 py-2 rounded-full font-black text-sm active:scale-90"
                                    style={{ background: "#f0f4ff", color: "#4a7cdb", boxShadow: "0 1px 2px rgba(74,124,219,0.08)", border: "1.5px solid #bdd0ef" }}
                                  >
                                    🥕 Pop
                                  </button>
                                  {popHighScores[song.number] > 0 && (
                                    <span className="text-xs font-bold mt-1" style={{ color: "#fbbf24" }}>💰 {popHighScores[song.number]}</span>
                                  )}
                                </div>
                              )}
                              {selectedLanguage === "spanish" && SONG_FLY_DATA[song.number] && (
                                <div className="flex flex-col items-center">
                                  <button
                                    onClick={() => setFlySongNumber(song.number)}
                                    className="mode-btn px-4 py-2 rounded-full font-black text-sm active:scale-90"
                                    style={{ background: "#f0f4ff", color: "#4a7cdb", boxShadow: "0 1px 2px rgba(74,124,219,0.08)", border: "1.5px solid #bdd0ef" }}
                                  >
                                    ☁️ Fly
                                  </button>
                                  {flyHighScores[song.number] > 0 && (
                                    <span className="text-xs font-bold mt-1" style={{ color: "#fbbf24" }}>💰 {flyHighScores[song.number]}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                  </div>

                  {/* Bottom bar — next world + vocab bank */}
                  {(() => {
                    const allSections = curriculumData.flatMap(cat => cat.sections)
                    const currentIdx = allSections.findIndex(s => s.id === openSection!.id)
                    const nextSection = allSections[currentIdx + 1]
                    return (
                      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-3" style={{ background: "linear-gradient(0deg, #fafafa 60%, transparent 100%)" }}>
                        <div className="flex items-center justify-between rounded-2xl px-4 py-3 max-w-md mx-auto" style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#a1a1aa" }}>Next World</p>
                            <p className="font-black text-sm leading-tight" style={{ color: "#18181b" }}>{nextSection ? nextSection.title : "🏆 All worlds complete!"}</p>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#f0f4ff", border: "1px solid #bdd0ef" }}>
                            <span style={{ fontSize: "15px" }}>💰</span>
                            <span className="font-black text-sm" style={{ color: "#4a7cdb" }}>{totalVocabBank.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )
          })()}

          {/* ── GALAXY MAP — stacked, one always open ── */}
          <div className="px-3 pt-4 pb-[88px] space-y-4">
            <style>{`
              @keyframes galaxyOpen {
                from { opacity: 0; transform: scaleY(0.9); }
                to   { opacity: 1; transform: scaleY(1); }
              }
              .galaxy-worlds-in { animation: galaxyOpen 0.28s ease forwards; transform-origin: top; }
              .world-btn {
                transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease;
                transform: scale(1);
              }
              .world-btn:hover {
                transform: scale(1.08);
                box-shadow: 0 4px 16px rgba(0,0,0,0.2), 0 0 0 2px rgba(74,124,219,0.25);
              }
              .world-btn:active {
                transform: scale(0.88) !important;
                transition-duration: 0.08s;
              }
              .mode-btn {
                transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease;
              }
              .mode-btn:hover {
                transform: scale(1.08);
                filter: brightness(0.92);
              }
              @keyframes storeTabIn {
                0%   { opacity: 0; transform: scale(0.95) translateY(6px); }
                60%  { opacity: 1; transform: scale(1.01) translateY(-1px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
              }
              @keyframes btnBounce {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-3px); }
              }
            `}</style>
            {curriculumData.map((category, catIdx) => {
              const isOpen = openCategoryId === category.id
              const catGradient = "#ffffff"
              const catGlow = "0 1px 3px rgba(0,0,0,0.04)"
              const catAccent = ["#4a7cdb","#7ba3e8","#5b7fbf"]

              return (
                <div key={category.id} className="rounded-3xl transition-all duration-300"
                  style={{ background: catGradient, boxShadow: catGlow, border: `1px solid ${isOpen ? "#d6e4f5" : "#e5e7eb"}`, overflow: isOpen ? "visible" : "hidden", borderRadius: "24px" }}>

                  {/* ── Header row — always visible ── */}
                  <button
                    onClick={() => setOpenCategoryId(category.id)}
                    className="relative w-full flex items-center gap-3 px-3 overflow-hidden active:opacity-80 transition-all"
                    style={{ height: "60px" }}
                  >
                    {/* Title */}
                    <div className="flex-1 text-left pl-1">
                      <p className="text-gray-900 text-[13px] leading-tight"><span className="font-black">{category.title}</span>{(category as any).titleSub ? <span className="font-normal text-gray-600"> {(category as any).titleSub}</span> : null}</p>
                      <p className="font-semibold text-[10px] mt-0.5" style={{ color: "#71717a" }}>{catIdx === 0 ? 10 : category.sections.length} countries, {category.sections.reduce((s, sec) => s + sec.songs.length, 0)} songs, 3 battles</p>
                    </div>

                    {/* Chevron */}
                    <span className="text-gray-400 text-sm font-bold">{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {/* ── World grid — only when open ── */}
                  {isOpen && (
                    <div className="galaxy-worlds-in px-2 pt-1 pb-4" style={{ overflow: "visible" }}>
                      <div className="grid grid-cols-3 gap-x-3 gap-y-5 relative" style={{ overflow: "visible" }}>
                        {/* Diagonal connectors — behind the circles */}
                        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, width: "100%", height: "100%" }} viewBox="0 0 300 300" preserveAspectRatio="none">
                          <defs>
                            <filter id={`path-glow-${category.id}`} x="-50%" y="-50%" width="200%" height="200%">
                              <feGaussianBlur stdDeviation="1.5" result="blur"/>
                              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                            </filter>
                          </defs>
                          {[0, 1].map(row => {
                            const lastIdx = Math.min(row * 3 + 2, category.sections.length - 1)
                            const nextIdx = (row + 1) * 3
                            if (nextIdx >= category.sections.length) return null
                            const x1 = (lastIdx % 3) * 100 + 50
                            const y1 = row * 100 + 50
                            const x2 = (nextIdx % 3) * 100 + 50
                            const y2 = (row + 1) * 100 + 50
                            return (
                              <path key={`diag-${row}`} fill="none"
                                d={`M ${x1} ${y1 + 44} C ${x1 - 15} ${y2 - 15}, ${x2 + 15} ${y1 + 15}, ${x2} ${y2 - 44}`}
                                stroke="rgba(0,0,0,0.12)" strokeWidth="2"
                                strokeDasharray="6 4" strokeLinecap="round"
                                filter={`url(#path-glow-${category.id})`}
                              />
                            )
                          })}
                        </svg>
                        {category.sections.map((section, sectionIdx) => {
                          const countryName = (section as any).country ?? ""
                          const flagData = COUNTRY_FLAG[countryName]
                          const sectionGradient = SECTION_GRADIENTS[section.id] ?? "linear-gradient(135deg, #7ba3e8, #4a7cdb)"
                          return (
                            <div key={section.id} className="world-float aspect-square relative" style={{ zIndex: 10, animationDelay: `${(sectionIdx * 0.4) % 3}s` }}>
                            <button
                              onClick={(e) => {
                                playWorldClick()
                                const rect = e.currentTarget.getBoundingClientRect()
                                const cx = ((rect.left + rect.width / 2) / window.innerWidth * 100).toFixed(1) + "%"
                                const cy = ((rect.top + rect.height / 2) / window.innerHeight * 100).toFixed(1) + "%"
                                setWorldZoomOrigin({ x: cx, y: cy })
                                setOpenSectionId(section.id)
                              }}
                              onMouseEnter={playWorldHover}
                              onTouchStart={playWorldHover}
                              className="world-btn relative flex items-center justify-center rounded-full w-full h-full overflow-hidden"
                              style={{
                                background: "linear-gradient(180deg, #5b9be6 0%, #4a7cdb 50%, #3d6bc4 100%)",
                                border: "3px solid rgba(255,255,255,0.6)",
                                boxShadow: "0 3px 12px rgba(74,124,219,0.3)",
                              }}
                            >
                              {isSectionBadgeUnlocked(section) && (
                                <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm z-10" />
                              )}
                              <span className="absolute inset-0 flex items-center justify-center select-none" style={{ fontSize: "72px", lineHeight: 1 }}>
                                {section.id === "ar-verbs"
                                  ? <span className="flex items-center justify-center font-black rounded-2xl" style={{ fontSize: "52px", width: "72px", height: "72px", background: "linear-gradient(135deg,#1e1b4b,#312e81)", color: "#fbbf24", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>A</span>
                                  : section.id === "er-verbs"
                                    ? <span className="flex items-center justify-center font-black rounded-2xl" style={{ fontSize: "52px", width: "72px", height: "72px", background: "linear-gradient(135deg,#164e63,#0e7490)", color: "#6ee7b7", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>E</span>
                                    : section.id === "ir-verbs"
                                      ? <span className="flex items-center justify-center font-black rounded-2xl" style={{ fontSize: "52px", width: "72px", height: "72px", background: "linear-gradient(135deg,#4a1942,#831843)", color: "#f9a8d4", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>I</span>
                                      : section.icon}
                              </span>
                              {(() => {
                                const topText = section.title
                                const botText = (section as any).country ?? ""
                                const r = 38, cx = 50
                                const topArc = `M ${cx - r} 52 A ${r} ${r} 0 0 1 ${cx + r} 52`
                                const botArc = `M ${cx - r} 55 A ${r} ${r} 0 0 0 ${cx + r} 55`
                                return (
                                  <svg className="absolute inset-0 z-10 pointer-events-none" viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
                                    <defs>
                                      <path id={`g-top-${section.id}`} d={topArc} />
                                      <path id={`g-bot-${section.id}`} d={botArc} />
                                      <filter id={`g-outline-${section.id}`} x="-20%" y="-20%" width="140%" height="140%">
                                        <feMorphology in="SourceAlpha" operator="dilate" radius="0.8" result="expanded"/>
                                        <feFlood floodColor="#000" result="color"/>
                                        <feComposite in="color" in2="expanded" operator="in" result="outline"/>
                                        <feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge>
                                      </filter>
                                    </defs>
                                    <text fill="white" fontSize="12" fontWeight="900" textAnchor="middle" filter={`url(#g-outline-${section.id})`} style={{ fontFamily: "inherit" }}>
                                      <textPath href={`#g-top-${section.id}`} startOffset="50%">{topText}</textPath>
                                    </text>
                                    <text fill="white" fontSize="12" fontWeight="900" textAnchor="middle" filter={`url(#g-outline-${section.id})`} style={{ fontFamily: "inherit" }}>
                                      <textPath href={`#g-bot-${section.id}`} startOffset="50%">{botText}</textPath>
                                    </text>
                                  </svg>
                                )
                              })()}
                            </button>
                            </div>
                          )
                        })}
                        {/* Horizontal dashed lines across each row — on top of circles */}
                        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5, width: "100%", height: "100%" }} viewBox="0 0 300 300" preserveAspectRatio="none">
                          {[0, 1, 2].map(row => {
                            const itemsInRow = Math.min(3, category.sections.length - row * 3)
                            if (itemsInRow <= 1) return null
                            const y = row * 100 + 50
                            return (
                              <line key={`hrow-${row}`} x1={50} y1={y} x2={(itemsInRow - 1) * 100 + 50} y2={y}
                                stroke="rgba(0,0,0,0.1)" strokeWidth="2.5"
                                strokeDasharray="8 5" strokeLinecap="round"
                              />
                            )
                          })}
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

            {/* Mini Player — fixed above nav */}
            <MiniPlayer />

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-3 shadow-lg z-50">
              <div className="flex justify-around">
                <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl" style={{ color: "#4a7cdb", backgroundColor: "#f0f4ff" }} onClick={() => setCurrentView("songs")}>
                  <Music className="h-6 w-6" />
                  <span className="text-xs font-bold">Songs</span>
                </Button>
                <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl text-gray-400" onClick={() => setCurrentView("coins")}>
                  <Coins className="h-6 w-6" />
                  <span className="text-xs font-semibold">Bank</span>
                </Button>
                <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl text-gray-400" onClick={() => setCurrentView("visualizer")}>
                  <Sparkles className="h-6 w-6" />
                  <span className="text-xs font-semibold">Visualizer</span>
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
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-3 shadow-lg z-50">
            <div className="flex justify-around">
              <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl text-gray-400" onClick={() => setCurrentView("songs")}>
                <Music className="h-6 w-6" />
                <span className="text-xs font-semibold">Songs</span>
              </Button>
              <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl text-gray-400" onClick={() => setCurrentView("coins")}>
                <Coins className="h-6 w-6" />
                <span className="text-xs font-semibold">Bank</span>
              </Button>
              <Button variant="ghost" className="flex flex-col items-center gap-1 pt-2 px-4 rounded-2xl" style={{ color: "#4a7cdb", backgroundColor: "#f0f4ff" }} onClick={() => setCurrentView("visualizer")}>
                <Sparkles className="h-6 w-6" />
                <span className="text-xs font-bold">Visualizer</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return null
}
