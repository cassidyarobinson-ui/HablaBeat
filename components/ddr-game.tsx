"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Play, Pause } from "lucide-react"
import { translateWord } from "@/lib/spanish-dictionary"
import Image from "next/image"
import { getPointer, firePointerEffect, POINTER_KEYFRAMES } from "@/lib/pointers"
import { useGamepad, type PadButton, type PadMapping, loadPadMapping, savePadMapping, clearPadMapping } from "@/hooks/use-gamepad"
import { useKeyboardNav } from "@/hooks/use-keyboard-nav"
import VocabFly, { type FlyWord } from "./vocab-fly"

// Types
interface KaraokeWord {
  id: number
  text: string
  duration: number
  timestamp: number
}

interface KaraokeLine {
  id: number
  words: KaraokeWord[]
}

interface TimingData {
  songNumber: number
  title: string
  audioUrl: string
  lyrics: KaraokeLine[]
}

interface Note {
  text: string
  english: string
  timestamp: number
  duration: number
  lane: number
  hit: boolean
  missed: boolean
  id: string
  isFill?: boolean
}

// ── Rhythmic Step Pattern Generator ─────────────────────────────────────
// Generates danceable lane patterns using templates instead of sequential modulo

// Direction pairs: [A, B] mapped to lane numbers
const DIRECTION_PAIRS: [number, number][] = [
  [0, 3], // left ↔ right (horizontal)
  [1, 2], // down ↔ up (vertical)
  [0, 1], // left ↔ down (adjacent)
  [3, 2], // right ↔ up (adjacent)
]

// Pattern templates with weights
// 60% alternating, 25% anchored, 15% mixed
const PATTERN_TEMPLATES: { pattern: string; weight: number }[] = [
  // Alternating (60%)
  { pattern: "ABAB", weight: 20 },
  { pattern: "ABBA", weight: 15 },
  { pattern: "BABA", weight: 15 },
  { pattern: "BAAB", weight: 10 },
  // Anchored repeats (25%)
  { pattern: "AABA", weight: 8 },
  { pattern: "AAAB", weight: 5 },
  { pattern: "BBAB", weight: 7 },
  { pattern: "AABB", weight: 5 },
  // Mixed short (15%)
  { pattern: "ABA", weight: 8 },
  { pattern: "BAB", weight: 7 },
]

const TOTAL_WEIGHT = PATTERN_TEMPLATES.reduce((s, t) => s + t.weight, 0)

function pickWeightedPattern(): string {
  let r = Math.random() * TOTAL_WEIGHT
  for (const t of PATTERN_TEMPLATES) {
    r -= t.weight
    if (r <= 0) return t.pattern
  }
  return "ABAB"
}

function generateLanePattern(noteCount: number): number[] {
  const lanes: number[] = []
  let phraseLen = 0

  while (lanes.length < noteCount) {
    // Pick a new direction pair and pattern every phrase (8-16 notes)
    if (phraseLen <= 0) {
      phraseLen = 8 + Math.floor(Math.random() * 9) // 8-16 notes per phrase
    }

    const pair = DIRECTION_PAIRS[Math.floor(Math.random() * DIRECTION_PAIRS.length)]
    const template = pickWeightedPattern()

    // 10% chance to mirror (swap A↔B)
    const mirror = Math.random() < 0.1
    const [a, b] = mirror ? [pair[1], pair[0]] : pair

    // Expand template to fill phrase
    for (let i = 0; i < phraseLen && lanes.length < noteCount; i++) {
      const ch = template[i % template.length]
      lanes.push(ch === "A" ? a : b)
    }

    phraseLen = 0 // reset for next phrase
  }

  return lanes
}

// ── Gap-Filling System ──────────────────────────────────────────────────
// Inserts groove notes during long gaps between lyrics

const FILL_ARROWS = ["◀", "▼", "▲", "▶"]
const GAP_THRESHOLD_MIN = 1.5  // seconds — gaps shorter than this are fine
const GAP_FILL_SPACING = 0.5   // seconds between fill notes

function fillGaps(notes: Note[]): Note[] {
  if (notes.length < 2) return notes

  // Sort by timestamp
  const sorted = [...notes].sort((a, b) => a.timestamp - b.timestamp)
  const fills: Note[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = sorted[i].timestamp + (sorted[i].duration || 0.2)
    const gapEnd = sorted[i + 1].timestamp
    const gapLen = gapEnd - gapStart

    if (gapLen < GAP_THRESHOLD_MIN) continue

    // Determine how many fills to insert
    const maxFills = gapLen > 5 ? 6 : gapLen > 3 ? 4 : 2
    const fillCount = Math.min(maxFills, Math.floor(gapLen / GAP_FILL_SPACING) - 1)
    if (fillCount <= 0) continue

    // Space fills evenly within the gap (with margin at edges)
    const margin = 0.3
    const usableGap = gapLen - margin * 2
    const step = usableGap / (fillCount + 1)

    // Pick a simple alternating pattern for fills
    const pair = DIRECTION_PAIRS[Math.floor(Math.random() * 2)] // prefer horizontal/vertical
    for (let f = 0; f < fillCount; f++) {
      const t = gapStart + margin + step * (f + 1)
      const lane = pair[f % 2]
      fills.push({
        text: FILL_ARROWS[lane],
        english: "",
        timestamp: t,
        duration: 0.15,
        lane,
        hit: false,
        missed: false,
        id: `fill-${i}-${f}`,
        isFill: true,
      })
    }
  }

  return [...sorted, ...fills].sort((a, b) => a.timestamp - b.timestamp)
}

interface DDRGameProps {
  songNumber: number
  songTitle: string
  userName?: string
  userPhoto?: string        // base64 thumbnail
  totalChallengesSent?: number
  challengesWon?: number
  dailyStreak?: number
  totalVocabBank?: number
  bestFlow?: number
  initialChallengePhone?: string  // pre-filled from challenge button flow
  onBack: () => void
  onNextSong?: () => void
  onGameEnd?: (songNumber: number, flow: number, bank: number, grade: string) => void
  onChallengeSent?: () => void
  activeTheme?: string
  activePointer?: string
  storeOwned?: string[]
  onEquipTheme?: (id: string) => void
  onEquipPointer?: (id: string) => void
  danceMode?: boolean
  onOpenBank?: () => void
  recallBreaks?: { timestamp: number; words: FlyWord[]; label: string }[]
}

// Mini catalog for in-game loadout UI (pointers only)
const GAME_CATALOG = [
  { id: "pointer-bunny",     name: "Bunny",            emoji: "🐰", category: "pointer", cost: 0 },
  { id: "pointer-dog",       name: "Dog",              emoji: "🐕", category: "pointer", cost: 0 },
  { id: "pointer-cat",       name: "Cat",              emoji: "🐱", category: "pointer", cost: 0 },
  { id: "pointer-hearts",    name: "Hearts",           emoji: "💗", category: "pointer", cost: 0 },
  { id: "pointer-rainbow",   name: "Rainbow",          emoji: "🌈", category: "pointer", cost: 0 },
  { id: "pointer-banana",    name: "Banana",           emoji: "🍌", category: "pointer", cost: 0 },
  { id: "pointer-star",      name: "Stars",            emoji: "💫", category: "pointer", cost: 0 },
  { id: "pointer-flower",    name: "Flowers",          emoji: "🌸", category: "pointer", cost: 0 },
  { id: "pointer-space",     name: "Space",            emoji: "🪐", category: "pointer", cost: 0 },
]

// Constants
const NOTE_TRAVEL_TIME = 3.0
const HIT_LINE_POSITION = 0.88
const HIT_WINDOWS = { PERFECT: 0.12, GOOD: 0.22, MISS: 0.35 }
// Lane colors: left=Green, down=Red, up=Yellow, right=Purple
const LANE_COLORS = ["bg-green-500", "bg-red-500", "bg-yellow-400", "bg-purple-500"]
const LANE_TEXT_COLORS = ["text-green-500", "text-red-500", "text-yellow-400", "text-purple-500"]
const LANE_HEX = ["#22c55e", "#ef4444", "#facc15", "#a855f7"]

// Keywords per song for "Key Words" mode — words as they appear in the lyrics (lowercase, no punctuation)
const SONG_KEYWORDS: Record<number, Set<string>> = {
  // ── Alphabet World ──
  1: new Set(["a","b","c","d","e","f","g","h","i","j","k","l","m","n","ñ","o","p","q","r","s","t","u","v","w","x","y","z","abecedario","cántalo","bien","otra","vez","vamos","bailar","puedes","parar","manos","arriba","mueve","cintura","aprender","cumbia","mover","recordar","ritmo","igual","listos","gozar","dale","despacito"]),
  2: new Set(["ñ","ch","rr","ll","niño","baño","churro","chico","muchacho","perro","carro","llama","lluvia","llorar","letras","ruge","tren","divertida","especial","genial","bonito","suena","hace","especiales"]),
  3: new Set(["a","e","i","o","u","vocales","canta","ya","son","letras","dan","vida"]),
  // ── Body World ──
  4: new Set(["cuerpo","cara","cabeza","pelo","cuello","garganta","hombros","brazos","codos","dedos","muñecas","manos","espalda","barriga","pierna","rodilla","pies","ojos","nariz","labios","dientes","oreja","boca","lengua","frente","vamos","tocar","toca","baila","ahora","bailar"]),
  // ── Roles World (Clothes + Family + Jobs) ──
  5: new Set(["ropa","camisa","pantalón","zapatos","cinturón","gorra","guantes","calcetín","falda","suéter","chaqueta","bufanda","traje","vestido","pijama","botas","sandalias","linda","visto","estrella","frío","tío","cada","día","aprenderé"]),
  6: new Set(["familia","papá","mamá","hermano","hermana","tío","tía","abuela","abuelo","primo","prima","sobrino","sobrina","mascota","contento","sana","mejor","camina","hola","vamos","cantar","voy","nombrar"]),
  7: new Set(["doctor","bombero","panadero","maestra","piloto","carpintero","cantante","chef","jardinero","dentista","artista","ingeniero","policía","granjero","pintor","actor","enfermera","escritor","veterinario","conductor","arquitecto","traductor","profesión","trabajos"]),
  // ── Pet World ──
  8: new Set(["araña","búho","conejo","chivo","delfín","elefante","flamenco","gato","hipopótamo","iguana","jirafa","koala","león","mono","nutria","ñandú","oso","grande","pingüino","quetzal","rinoceronte","serpiente","tigre","unicornio","vaca","wombat","xoloitzcuintle","yak","zorro","la","le","li","lo","lu","ma","me","mi","mo","mu","na","ne","ni","no","nu","ña","ñe","ñi","ño","ñu","pa","pe","pi","po","pu","que","qui","quo","ra","re","ri","ro","ru","sa","se","si","so","su","ta","te","ti","to","tu","va","ve","vi","vo","vu","wa","we","wi","wo","wu","xa","xe","xi","xo","xu","ya","ye","yi","yo","yu","za","ze","zi","zo","zu"]),
  9: new Set(["perro","gato","conejo","pato","vaca","oveja","gallina","caballo","cabra","tortuga","mascotas","buen","vieja","grande","un","una","la","el","todos","me","tengo","viven","quieren","siento","abraza","qué","feliz","aquí"]),
  10: new Set(["pez","tortuga","rana","cangrejo","pájaro","águila","abeja","colibrí","oso","zorro","ardilla","araña","ciempiés","agua","cielo","bosque","montaña","viven","nadan","vuelan","ven","aprende","vive","felices","libres","bien","también","sin","allí","este"]),
  // ── Travel World ──
  11: new Set(["casa","casita","cocina","baño","cuarto","sillón","mesa","taza","plato","sartén","vitrina","hornilla","cama","lámpara","marco","zapato","toalla","lavamanos","jabón","bonita","feliz","hay","tiene","hace","mi","su","qué","es"]),
  12: new Set(["dónde","está","baño","escuela","biblioteca","playa","parque","tienda","hospital","panadería","casa","cine","vamos","al","la","el","mi","tantos","lugares","visitar","juntos","caminar"]),
  13: new Set(["izquierda","derecha","arriba","abajo","delante","detrás","cerca","lejos","gira","vuelta","pierdo","sé","pregunto","dicen","nunca","sueltas","manos","palmas","pecho","brazos","estirados","veces","despacio","así"]),
  // ── Numbers World ──
  14: new Set(["uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve","veinte","números"]),
  15: new Set(["diez","veinte","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa","cien","contando","vamos","sin","parar","sube","sigue","bien"]),
  // ── Time World ──
  16: new Set(["los","días","la","semana","lunes","martes","miércoles","jueves","viernes","sábado","domingo","meses","del","año","enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre","las","estaciones","primavera","flores","verás","verano","sol","más","otoño","hojas","caer","invierno","ay","qué","frío","cantamos","español","con","mil","emociones"]),
  17: new Set(["qué","hora","es","mira","el","reloj","otra","vez","si","la","una","digo","así","son","las","dos","tres","cuatro","después","cinco","seis","siete","ocho","nueve","muy","fuerte","cuarto","media","en","punto","falta","menos","dímelo","tú","divertido","aprender"]),
  // ── Feelings & Colors World ──
  18: new Set(["rojo","naranja","amarillo","verde","azul","morado","blanco","negro","gris","colores","manzana","mariposa","sol","hoja","uva","nube","gato","piedra","qué","cool","bonitos","mira","brillan"]),
  19: new Set(["feliz","triste","enojado","cansado","sorprendido","aburrido","contento","nervioso","salto","sonrío","lloro","frunzo","quiero","canto","hago","late","poquito","ceño","sueño","ojos","abiertos","cómo","sientes","dime","ya","tú","qué","más"]),
  20: new Set(["tengo","sed","hambre","frío","calor","sueño","miedo","tos","prisa","beber","comer","poner","abrigo","dormir","salir","descansar","esperar","vamos","cantar","aprender","me","no","tú","qué","tienes","un","quiero"]),
  // ── Food World ──
  21: new Set(["frutas","manzana","frutilla","naranja","papaya","sandía","durazno","banana","melón","piña","pera","guayaba","uva","ciruela","mora","arándano","higo","tamarindo","rojas","roja","naranjas","verdes","verde","amarillas","amarilla","azules","azul","moradas","morada","crujiente","dulce","suave","blando","fuerte","frío","pequeña","grande","raro","especial","rico","deliciosa","ácido","fresco","larga","cantar","comer","siéntete","disfrutar","juega","verás","muchos","colores","come","qué","sabor","desayuno","ayuno","buen","centro","siente","genial"]),
  22: new Set(["verduras","tomate","pimiento","zanahoria","maíz","papa","lechuga","berenjena","cebolla","acelga","rojo","verde","naranja","amarillo","morada","comer","come","crecer","crecerás","cantar","gustar","gusta","bailar","jugoso","dulce","sabroso","crujiente","suave","fresca","bonita","genial","fuerte","feliz"]),
  23: new Set(["desayuno","almuerzo","cena","mañana","tarde","noche","leche","pan","fruta","huevo","sopa","arroz","pollo","ensalada","pasta","pescado","verdura","avena","rico","sano","problema"]),
  24: new Set(["hola","estás","bien","gracias","tú","quiero","pedir","favor","jugo","arroz","mejor","tenedor","cuchillo","olvida","plato","cuchara","sopa","servilleta","ropa","terminar","listo","cenar"]),
  // ── AR World ──
  25: new Set(["hablar","hablan","bailar","bailan","cantar","cantan","estudiar","estudio","estudias","estudia","estudiamos","estudian","jugar","juego","juegas","juega","jugamos","juegan","trabajar","trabajo","trabajas","trabaja","trabajamos","trabajan","nadar","nado","nadas","nada","nadamos","nadan","dibujar","dibujo","dibujas","dibuja","dibujamos","dibujan","ayudar","ayudo","ayudas","ayuda","ayudamos","ayudan","caminar","camino","caminas","camina","caminamos","caminan","escuchar","escucho","escuchas","escucha","escuchamos","escuchan","yo","tú","él","ella","nosotros","ellos","sabiduría","conjugamos","saludan","verbos","entienden"]),
  26: new Set(["me","te","le","nos","les","tú","mi","mis","tu","gusta","gustan","cantar","bailar","comer","correr","decir","disfruta","preguntas","respondes","chocolate","tomate","lechuga","frutas","verduras","ojos","nariz","camisa","pantalones","zapatos","verbo","mundo","fácil","otra","bien","así","se","ahora","también","qué","con","todo","dice","vez"]),
  27: new Set(["yo","tú","él","ella","ellos","ellas","nosotros","nosotras","ustedes","estoy","estás","está","estamos","están","feliz","enfermo","nerviosa","cansados","contentos","aburridos","ocupado","fenomenal","genial","bien","escuela","novela","tren","aquí","allí","describe","preguntas","respondes","lograr","así","dice","cómo","dónde","vez","más","sin","afán","con","verbo"]),
  // ── ER World ──
  28: new Set(["bebo","bebes","bebe","bebemos","beben","como","comes","come","comemos","comen","leo","lees","lee","leemos","leen","aprendo","aprendes","aprende","aprendemos","aprenden","corro","corres","corre","corremos","corren"]),
  29: new Set(["tengo","tienes","tiene","tenemos","tienen","tener","leer","saltar","pensar","ayudar","escuchar","todos","trabajar","también","vamos","tren","repite","día","ritmo","alegría","verbo","melodía"]),
  30: new Set(["vamos","aprender","verbo","ser","soy","eres","es","somos","son","número","uno","cántalo","fuerte","canta","montón","quién","niño","amiga","qué","estudiante","cocinero","elegante","dónde","españa","artistas","mucha","maña","cómo","divertida","perrito","suave","toda","vida","corazón","decir","siempre","cambiar","igual","dudes","vas","brillar"]),
  // ── IR World ──
  31: new Set(["verbos","terminan","así","con","sí","yo","vivo","tú","vives","vive","nosotros","vivimos","ellos","viven","escribo","escribes","escribe","escribimos","escriben","todos","cantar","abro","abres","abre","abrimos","abren","qué","bien","suena","ya","asisto","asistes","asiste","asistimos","asisten","vamos","aprender","decido","decides","decide","decidimos","deciden"]),
  32: new Set(["vamos","aprender","verbo","ir","preguntas","respuestas","repite","conmigo","adónde","voy","yo","parque","vas","tú","baño","va","él","escuela","ella","cuarto","nosotros","cine","ellos","van","mercado","vez","más","todo","está","bien","ustedes"]),
  33: new Set(["hola","amigos","palabras","bonitas","chiste","canción","digo","dices","dice","decimos","dicen","verbo","decir","tú","yo","gracias","él","ella","aquí","nosotros","buenos","días","ellos","alegría","qué","verdad","felicidad","jugar","cantar","todos","fácil","repites","hablar","contar","explicar","nombre","todo","existe","ahora","di","quieras","divertir","juntos"]),
  // ── Quick Past World ──
  34: new Set(["pretérito","usar","uso","pasado","pasaron","terminaron","terminó","acción","acciones","fin","ayer","anoche","vez","repente","hace","día","mes","momento","hablé","comiste","corrió","escribió","bailamos","vivieron","yo","tú","él","ella","nosotros","ellos","ya","fácil","puedes","hacerlo","bien","palabras","recordar","cosas","todavía","continúan","duran","más","así","usa","cantar","cuándo","digo","todo","eso"]),
  35: new Set(["é","aste","ó","amos","aron","vámonos","verbos","pretérito","acciones","hicieron","verbo","hablar","conversar","pasado","conjugar","yo","hablé","mamá","tú","hablaste","papá","él","habló","ella","nosotros","hablamos","todo","pasó","ellos","hablaron","ellas","también","cinco","formas","aprenden","bien","caminar","pie","ayer","caminé","caminaste","ciudad","caminó","tranquilidad","caminamos","rincón","caminaron","callejón","ya","estamos","hablando","cantando","cocinar","preparar","comida","hicimos","así","vida","cociné","arroz","pan","cocinaste","hermana","fran","cocinó","sopa","limón","sazón","cocinamos","emoción","cocinaron","reunión","mirar","observar","vamos","miré","nubes","pasar"]),
  36: new Set(["verbos","pretérito","í","iste","ió","imos","ieron","pasó","comparten","misma","conjugación","comer","masticar","pasado","conjugar","comí","decir","fui","fuiste","fue","fuimos","fueron","tener","hacer","estar","poder","querer","venir","ver"]),
  37: new Set(["vamos","explorar","verbos","pretérito","irregular","escucha","bien","comienzos","verbo","ya","estar","estuv","poder","pud","poner","pus","saber","sup","tener","tuv","venir","vin","querer","quis","hacer","hic","decir","dij","traer","traj","conducir","conduj","ahora","terminaciones","para","los","é","aste","ó","amos","aron","í","iste","ió","imos","ieron"]),
  // ── Long Past World ──
  38: new Set(["vamos","cantar","sobre","cuándo","usar","imperfecto","cuando","era","niño","usaba","pantalón","para","descripciones","esa","razón","hábitos","pasado","sin","decir","final","cosas","repetidas","genial","acción","duraba","importa","fin","como","llovía","mucho","dices","así","edad","tiempo","emociones","también","usa","vas","estar","bien","terminaciones","verbos","jugar","caminar","yo","aba","tú","abas","él","nosotros","ábamos","ellos","aban","otra","vez","ía","ías","íamos","ían","acciones","rutina","complicado","solo","hay","triunfar"]),
  39: new Set(["vamos","cantar","sobre","verbos","irregulares","imperfecto","solamente","hay","tres","qué","fácil","ser","para","hablar","quién","eres","cómo","yo","era","tú","eras","él","nosotros","éramos","ellos","eran","verbo","escapan","ir","decir","dónde","vas","camino","tomas","iba","ibas","ella","íbamos","iban","siempre","clavan","ver","captas","ojos","veía","veías","veíamos","veían","dominan","verso","final","recordar","solo","todo","canción","ya","estás","modo"]),
  40: new Set(["acciones","final","ayer","jugué","divertí","fui","fiesta","terminé","feliz","principio","claras","contar","historia","larga","cuento","apurar","pasaba","describir","hablar","muchas","veces","cómo","eras","tú","usa","imperfecto","acción","tiempo","ya","pasó","recordé","hechos","reales","pasado","terminó","pretérito","puntual","cosas","dos","tiempos"]),
  // ── Future World ──
  41: new Set(["futuro","verbo","terminación","vas","agregar","é","ás","á","emos","án","finales","cualquier","sin","dudar","ar","er","ir","también","quitar","solo","añadir","toma","tal","como","está","final","da","cantar","cantaré","cantarás","cantará","cantaremos","cantarán","comer","comeré","comerás","comerá","comeremos","comerán","vivir","viviré","vivirás","vivirá","viviremos","vivirán","hablar","hablaré","hablarás","hablará","hablaremos","hablarán","escribir","escribiré","escribirás","escribirá","escribiremos","escribirán","yo","tú","él","ella","nosotros","ellos","bien","así","qué"]),
  42: new Set(["futuro","saber","algunos","verbos","van","cambiar","usan","raíz","normal","otra","para","conjugar","tener","tendr","tendré","tendrás","tendrá","tendremos","tendrán","poner","pondr","pondré","pondrás","pondrá","pondremos","pondrán","salir","saldr","saldré","saldrás","saldrá","saldremos","saldrán","venir","vendr","vendré","vendrás","vendrá","vendremos","vendrán","poder","podr","podré","podrás","podrá","podremos","podrán","sabr","sabré","sabrás","sabrá","sabremos","sabrán","querer","querr","querré","querrás","querrá","querremos","querrán","haber","habr","habré","habrás","habrá","habremos","habrán","decir","dir","diré","dirás","dirá","diremos","dirán","hacer","har","haré","harás","hará","haremos","harán","caber","cabr","cabré","cabrás","cabrá","cabremos","cabrán","valer","valdr","valdré","valdrás","valdrá","valdremos","valdrán","recuerda","bien","lección","irregulares","cambian","forma","igual","é","ás","así","feliz"]),
  // ── Conditional World ──
  43: new Set(["condicional","verbo","terminación","finales","añadir","quitar","tomar","dar","ía","ías","íamos","ían","yo","tú","él","ella","nosotros","ellos","hablar","cantar","comer","vivir","agregar","cantaría","cantarías","cantaríamos","cantarían","comería","comerías","comeríamos","comerían","viviría","vivirías","viviríamos","vivirían"]),
  44: new Set(["condicional","futuro","irregulares","raíz","base","terminación","formas","cambia","ía","ías","íamos","ían","tendr","dir","har","saldr","vendr","querr","sabr","pondr","podr","habr","valdr","tener","decir","hacer","salir","venir","querer","saber","poner","poder","haber","valer","tendría","diría","haría","saldría","vendría","querría","sabría","pondría","podría","habría","valdría","practícalos","todos","días"]),
  // ── Pronoun World ──
  45: new Set(["pronombres","personales","reflexivos","frases","expresar","yo","tú","él","ella","nosotros","vosotros","ellos","ellas","me","te","se","nos","despertarse","llamar","ir","prepararse","cepillarse","poner","lavarse","peinarse","dormirse","despierto","llamo","va","preparamos","cepillas","pongo","laváis","peinan","dormir","temprano","teléfono","trabajo","día","dientes","pensar","manos","cabello","repetir","practicar","todos","días"]),
  46: new Set(["dar","mandar","explicar","mostrar","traer","lo","la","los","las","le","les","me","te","nos","se","dicen","enviará","sin","complicar","solo","escuchar","con","ejemplos","vas","triunfar"]),
  // ── Advanced World ──
  47: new Set(["escribe","sonríe","haz","lávate","manos","hazlo","ven","mira","corre","dilo","escucha","campeón","campeona","corras","grites","saltes","fumes","hables","toques","mientas","olvides","bebas","rindas","casa","cuidado","peligroso","salud","primero","siempre","honesto","después","ahora","puedes","mandar","mandatos","comunicar","fuerza","temor","sigue","interés"]),
  48: new Set(["por","para","lo","dicen","se","allí","amor","razón","uso","con","corazón","este","regalo","es","ti","pero","compré","ella","sí","trabajo","ayudar","hago","necesidad","quién","esto","qué","hiciste","mí","viajamos","españa","caminamos","centro","también","soñar","ganar","favor","vida","cambia","salida","memorizas","solo","cantas","hoy","son","parte","oy","canta","frases","repítelas","bien","usas","sin","estrés"]),
  49: new Set(["alegra","aquí","conmigo","feliz","siempre","bueno","emoción","creo","malo","mentiras","digas","espero","quiero","ojalá","vengas","usar","subjuntivo","deseos","dudas","muy","natural","sea","verdad","estés","seas","con"]),
  50: new Set(["onda","padre","órale","manches","guay","chévere","bacán","vale","aguas","frases","vas","encajar","feliz","también","libro","amigo","bien","chido","rollo","ruido","serio","va","creo","ajá","jerga","lugar","hablas","flow","natural","hablar","méxico","españa","chile","perú","eres","tú","bueno","parte","club","sí","ahora","hablo","viviera","cancún","preguntan","aprendiste","fácil","rola","listo"]),
}

export default function DDRGame({ songNumber, songTitle, userName = "", userPhoto = "", totalChallengesSent = 0, challengesWon = 0, dailyStreak = 0, totalVocabBank = 0, bestFlow = 0, initialChallengePhone = "", onBack, onNextSong, onGameEnd, onChallengeSent, activeTheme = "theme-default", activePointer = "pointer-bunny", storeOwned = ["pointer-bunny"], onEquipTheme, onEquipPointer, danceMode = false, onOpenBank, recallBreaks }: DDRGameProps) {
  // Sound effects for interactive coins/carrots
  const playCoinSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.05)
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } catch {}
  }
  const playCarrotSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const bufferSize = ctx.sampleRate * 0.08
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
      const src = ctx.createBufferSource()
      src.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = "bandpass"
      filter.frequency.value = 3000
      filter.Q.value = 1.5
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
      src.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      src.start(ctx.currentTime)
    } catch {}
  }

  const [gameState, setGameState] = useState<"loading" | "setup" | "playing" | "recall_break" | "ended">("loading")
  const hasSeenTutorial = typeof window !== "undefined" && localStorage.getItem("hablabeat-tutorial-done") === "true"
  const [tutorialStep, setTutorialStep] = useState(hasSeenTutorial ? 5 : 0)
  const [tutorialComplete, setTutorialComplete] = useState(hasSeenTutorial)
  const tutorialStepRef = useRef(hasSeenTutorial ? 5 : 0)
  const [timingData, setTimingData] = useState<TimingData | null>(null)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [totalHits, setTotalHits] = useState(0)
  const [speed, setSpeed] = useState<"slower" | "normal">("normal")
  const [showTranslations, setShowTranslations] = useState(true)
  const [encouragement, setEncouragement] = useState<{ text: string; english: string; color: string } | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [challengePhone, setChallengePhone] = useState(initialChallengePhone)
  const [challengeUrl, setChallengeUrl] = useState("")
  const [elapsedTime, setElapsedTime] = useState("0:00")
  const [totalTime, setTotalTime] = useState("0:00")
  const [isPaused, setIsPaused] = useState(false)
  const [showLoadout, setShowLoadout] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const notesRef = useRef<Note[]>([])
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const maxComboRef = useRef(0)
  const totalHitsRef = useRef(0)
  const hitColorIndexRef = useRef(0)
  const animationRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fallingRef = useRef<HTMLDivElement>(null)
  /** Tracks if the Dragon Breath combo-shield has been used this song */
  const comboShieldUsedRef = useRef(false)
  // Recall break tracking
  const recallBreaksFiredRef = useRef<Set<number>>(new Set())
  const [currentBreakIndex, setCurrentBreakIndex] = useState<number>(-1)
  const [recallCoins, setRecallCoins] = useState(0)
  const [recallScores, setRecallScores] = useState<{ label: string; score: number }[]>([])
  // Mobile detection for Rhythm Hive-style single-lane layout
  const [isMobile, setIsMobile] = useState(false)
  const isMobileRef = useRef(false)
  const [padDebug, setPadDebug] = useState("")
  const [padConnected, setPadConnected] = useState(false)
  const [padMapping, setPadMapping] = useState<PadMapping | null>(null)
  const [calibrating, setCalibrating] = useState(false)
  const calibrationSteps: PadDirection[] = ["left", "down", "up", "right"]
  const [calibrationStep, setCalibrationStep] = useState(0)
  const [calibrationData, setCalibrationData] = useState<Partial<PadMapping>>({})

  // Load saved pad mapping on mount
  useEffect(() => {
    setPadMapping(loadPadMapping())
  }, [])

  // Mobile detection — mirrors to ref for rAF access
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)")
    const update = (matches: boolean) => { setIsMobile(matches); isMobileRef.current = matches }
    update(mql.matches)
    const handler = (e: MediaQueryListEvent) => update(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  // Rainbow colors that cycle on each hit
  const RAINBOW_COLORS = [
    "#EF4444", // red
    "#F97316", // orange
    "#EAB308", // yellow
    "#22C55E", // green
    "#3B82F6", // blue
    "#A855F7", // purple
  ]

  // Load timing data
  useEffect(() => {
    fetch(`/timing/song-${songNumber}.json`)
      .then((res) => res.json())
      .then((data: TimingData) => {
        setTimingData(data)
        setGameState("setup")
      })
      .catch((err) => {
        console.error("Failed to load timing data:", err)
      })
  }, [songNumber])

  // Speed multiplier: affects playback rate (pitch preserved via Web Audio or playbackRate)
  const getSpeedRate = useCallback(() => {
    if (speed === "slower") return 0.85  // medium pace
    return 1.0                           // normal / fast
  }, [speed])

  // Create notes from timing data — filters to keywords only when in keywords mode
  const createNotes = useCallback((): Note[] => {
    if (!timingData) return []

    const keywordSet = SONG_KEYWORDS[songNumber] ?? null
    const stripPunct = (s: string) => s.replace(/[^a-záéíóúüñ]/gi, "").toLowerCase()

    // Collect all word notes first (without lane assignment)
    const wordNotes: Omit<Note, "lane">[] = []
    timingData.lyrics.forEach((line, lineIndex) => {
      line.words.forEach((word, wordIndex) => {
        if (keywordSet) {
          const stripped = stripPunct(word.text)
          if (!keywordSet.has(stripped)) return
          if (stripped.length <= 1 && line.words.length > 1) return
        }
        wordNotes.push({
          text: word.text,
          english: translateWord(word.text),
          timestamp: word.timestamp,
          duration: word.duration,
          hit: false,
          missed: false,
          id: `${lineIndex}-${wordIndex}`,
        })
      })
    })

    // Generate rhythmic lane pattern instead of sequential modulo
    const lanePattern = generateLanePattern(wordNotes.length)
    const allNotes: Note[] = wordNotes.map((note, i) => ({
      ...note,
      lane: lanePattern[i],
    }))

    // Fill gaps with groove notes (especially useful in Keywords mode)
    return fillGaps(allNotes)
  }, [timingData, speed, songNumber])

  // Start game — create audio directly in click handler (required for autoplay)
  const startGame = useCallback(() => {
    if (!timingData) return

    // Prevent double-invoke from creating duplicate audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }

    const notes = createNotes()
    notesRef.current = notes
    scoreRef.current = 0
    comboRef.current = 0
    maxComboRef.current = 0
    totalHitsRef.current = 0
    comboShieldUsedRef.current = false
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setTotalHits(0)

    // Create audio immediately in the click handler (user gesture required)
    const audio = new Audio(timingData.audioUrl)
    audio.crossOrigin = "anonymous"
    // Set speed (playbackRate) with pitch preservation
    const rate = getSpeedRate()
    audio.playbackRate = rate
    // preservesPitch keeps the pitch unchanged when speed changes
    ;(audio as any).preservesPitch = true
    ;(audio as any).mozPreservesPitch = true
    ;(audio as any).webkitPreservesPitch = true
    audioRef.current = audio

    audio.addEventListener("ended", () => {
      setGameState("ended")
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    })

    // Start audio but immediately pause for tutorial
    audio.play().then(() => {
      audio.pause()
      audio.currentTime = 0
    }).catch((err) => {
      console.error("Audio play failed:", err)
    })

    // Set game state — tutorial overlay will show on top
    setIsPaused(true)
    setGameState("playing")
  }, [timingData, createNotes, getSpeedRate])

  // Pause/resume toggle
  const togglePause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play()
      setIsPaused(false)
    } else {
      audio.pause()
      setIsPaused(true)
    }
  }, [])

  // Render loop
  useEffect(() => {
    if (gameState !== "playing" || !audioRef.current) return

    const render = () => {
      const audio = audioRef.current
      if (!audio || audio.paused) return

      const currentTime = audio.currentTime
      const container = fallingRef.current
      if (!container) return

      // How long a missed bubble takes to exit off the bottom of the screen
      const MISS_EXIT_TIME = 1.5

      // Calculate effective total time: last bubble exit + 3s fade
      const lastNote = notesRef.current[notesRef.current.length - 1]
      const effectiveEnd = lastNote ? lastNote.timestamp + HIT_WINDOWS.MISS + MISS_EXIT_TIME + 3 : (audio.duration || 0)
      const displayTotal = Math.min(effectiveEnd, audio.duration || effectiveEnd)

      // Update time display
      const mins = Math.floor(currentTime / 60)
      const secs = Math.floor(currentTime % 60)
      setElapsedTime(`${mins}:${secs.toString().padStart(2, "0")}`)
      const tMins = Math.floor(displayTotal / 60)
      const tSecs = Math.floor(displayTotal % 60)
      setTotalTime(`${tMins}:${tSecs.toString().padStart(2, "0")}`)

      // Check recall breaks — pause game when audio reaches a break timestamp
      if (recallBreaks && audio) {
        for (let i = 0; i < recallBreaks.length; i++) {
          if (!recallBreaksFiredRef.current.has(i) && currentTime >= recallBreaks[i].timestamp) {
            recallBreaksFiredRef.current.add(i)
            setCurrentBreakIndex(i)
            audio.pause()
            setGameState("recall_break")
            return // stop render loop — will resume after recall quiz
          }
        }
      }

      container.innerHTML = ""

      // Don't render notes during tutorial — prevents bubbles stacking behind the overlay
      if (tutorialStepRef.current < 5) return

      notesRef.current.forEach((note) => {
        if (!note.hit) {
          const timeUntilHit = note.timestamp - currentTime
          // Show bubble from travel time before hit, until it exits off-screen after miss
          const isVisible = timeUntilHit <= NOTE_TRAVEL_TIME && timeUntilHit >= -(HIT_WINDOWS.MISS + MISS_EXIT_TIME)

          if (isVisible) {
            const progress = 1 - timeUntilHit / NOTE_TRAVEL_TIME
            // For missed bubbles, continue past the hit line
            const yPosition = progress * (HIT_LINE_POSITION * 100)

            if (yPosition >= 0 && yPosition <= 115) {
              // 3D perspective: bubbles start small/angled at top, grow as they approach
              const scale = note.missed
                ? 1.3  // Stay full size when missed
                : 0.45 + progress * 0.85 // 0.45 at top → 1.3 at hit line
              const rotateX = note.missed
                ? 0  // No tilt when missed
                : (1 - progress) * 35 // 35deg tilt at top → 0 at hit line
              const opacity = note.missed
                ? Math.max(0, 1 - (yPosition - HIT_LINE_POSITION * 100) / 20) // Fade out as it exits
                : Math.min(1, 0.4 + progress * 0.6) // fade in slightly

              const laneColor = LANE_HEX[note.lane] || "#ffffff"
              const noteEl = document.createElement("div")
              // Word with colored underline — underline aligns to dashed hit line
              noteEl.style.cssText = `
                position: absolute;
                left: ${note.lane * 25}%;
                width: 25%;
                top: ${yPosition}%;
                transform: translateY(-50%);
                z-index: ${Math.floor(progress * 20) + 10};
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                opacity: ${opacity};
                pointer-events: none;
              `

              const englishLabel = note.english && note.english.toLowerCase() !== note.text.toLowerCase()
                ? `<div style="font-size:clamp(11px,2.5vw,15px);font-weight:700;color:#fde68a;text-shadow:0 1px 4px rgba(0,0,0,0.7);line-height:1;text-align:center;padding:0 4px;margin-bottom:2px">${note.english}</div>`
                : ""
              noteEl.innerHTML = `
                ${englishLabel}
                <div style="font-size:clamp(14px,3.5vw,22px);font-weight:900;color:#ffffff;text-shadow:0 2px 6px rgba(0,0,0,0.6),0 0 12px rgba(0,0,0,0.3);line-height:1.2;text-align:center;padding:0 4px;margin-bottom:4px">${note.text}</div>
                <div style="width:80%;max-width:140px;height:4px;border-radius:2px;background:${laneColor};box-shadow:0 0 8px ${laneColor}80,0 0 16px ${laneColor}40"></div>
              `

              container.appendChild(noteEl)
            }
          }

          // Auto-miss: mark as missed when past the hit window, but keep rendering
          if (!note.missed && currentTime > note.timestamp + HIT_WINDOWS.MISS) {
            note.missed = true
            // Dragon Breath: first miss per song doesn't break combo (once only)
            const mod = getPointer(activePointer).gameplayModifier
            if (mod.comboShield && !comboShieldUsedRef.current) {
              comboShieldUsedRef.current = true
            } else {
              comboRef.current = 0
              setCombo(0)
            }
          }

          // Remove from rendering once fully off screen
          if (currentTime > note.timestamp + HIT_WINDOWS.MISS + MISS_EXIT_TIME) {
            note.hit = true
          }
        }
      })

      // Check if all notes are done — fade out 3 seconds after last bubble exits screen
      const allNotesDone = notesRef.current.every((n) => n.hit)
      const lastNoteCheck = notesRef.current[notesRef.current.length - 1]
      // Last bubble exits screen at: timestamp + MISS window + exit travel time
      const lastBubbleExitTime = lastNoteCheck ? lastNoteCheck.timestamp + HIT_WINDOWS.MISS + MISS_EXIT_TIME : 0
      if (allNotesDone && lastNoteCheck && currentTime > lastBubbleExitTime) {
        // Fade out audio over ~3 seconds then end
        const fadeAudio = audioRef.current
        if (fadeAudio && !fadeAudio.paused) {
          const fadeInterval = setInterval(() => {
            if (fadeAudio.volume > 0.03) {
              fadeAudio.volume = Math.max(0, fadeAudio.volume - 0.025) // ~3s fade (0.025 * 40 steps @ 75ms)
            } else {
              clearInterval(fadeInterval)
              fadeAudio.pause()
              setGameState("ended")
              if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = null
              }
            }
          }, 75)
        }
        return
      }

      animationRef.current = requestAnimationFrame(render)
    }

    // Start on audio play
    const audio = audioRef.current
    const onPlay = () => {
      if (!animationRef.current) render()
    }
    const onPause = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    if (!audio.paused) render()

    return () => {
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [gameState, showTranslations])

  // Shared hit-detection logic for keyboard, touch, and gamepad
  const handleLaneHit = useCallback((lane: number) => {
    showLanePress(lane)

    const audio = audioRef.current
    if (!audio) return
    const currentTime = audio.currentTime

    const mod = getPointer(activePointer).gameplayModifier
    const effectiveMissWindow = HIT_WINDOWS.MISS * mod.hitRadiusMultiplier
    // Only allow hits when the note is at or past the hit zone (no early taps)
    // A small early window (PERFECT size) lets players tap slightly before the exact timestamp
    const earlyWindow = HIT_WINDOWS.PERFECT
    const candidates = notesRef.current.filter(
      (n) => n.lane === lane && !n.hit && !n.missed &&
        (currentTime >= n.timestamp - earlyWindow) &&
        (currentTime <= n.timestamp + effectiveMissWindow)
    )

    if (candidates.length === 0) return

    const closest = candidates.reduce((a, b) =>
      Math.abs(a.timestamp - currentTime) < Math.abs(b.timestamp - currentTime) ? a : b
    )

    const timeDelta = Math.abs(closest.timestamp - currentTime)
    let judgment: string
    let points: number
    let judgmentColor: string
    let isPerfect = false

    if (timeDelta <= HIT_WINDOWS.PERFECT) {
      isPerfect = true
      points = Math.round(mod.coinMultiplier)
      judgmentColor = "text-yellow-300"
    } else if (timeDelta <= HIT_WINDOWS.GOOD) {
      points = 1
      judgmentColor = "text-green-300"
    } else {
      points = 1
      judgmentColor = "text-blue-300"
    }

    // Show English translation if available, otherwise show Spanish direction word
    const LANE_SPANISH = ["¡Izquierda!", "¡Abajo!", "¡Arriba!", "¡Derecha!"]
    const hasEnglish = closest.english && closest.english.toLowerCase() !== closest.text.toLowerCase()
    judgment = hasEnglish ? closest.english : LANE_SPANISH[closest.lane] || closest.text

    closest.hit = true
    scoreRef.current += points
    comboRef.current += 1
    const c = comboRef.current
    if (c % 10 === 0 || (c >= 20 && c % 5 === 0)) triggerStreakPulse(c)
    totalHitsRef.current += 1
    maxComboRef.current = Math.max(maxComboRef.current, comboRef.current)
    setScore(scoreRef.current)
    setCombo(comboRef.current)
    setMaxCombo(maxComboRef.current)
    setTotalHits(totalHitsRef.current)

    showHitEffect(lane, judgment, judgmentColor, isPerfect)
    checkEncouragement(comboRef.current)
  }, [activePointer, showTranslations])

  // Tutorial keyboard/touch input
  const tutorialLanes = [0, 3, 2, 1] // left, right, up, down
  const tutorialLabels = ["← LEFT", "→ RIGHT", "↑ UP", "↓ DOWN"]
  const handleTutorialHit = useCallback((lane: number) => {
    const expectedLane = tutorialLanes[tutorialStepRef.current]
    if (lane !== expectedLane) return
    const nextStep = tutorialStepRef.current + 1
    if (nextStep >= 4) {
      setTutorialStep(4)
      tutorialStepRef.current = 4
      setTutorialComplete(true)
      // Save that user has completed tutorial
      try { localStorage.setItem("hablabeat-tutorial-done", "true") } catch {}
      // After celebration, unpause the song
      setTimeout(() => {
        setTutorialComplete(false)
        setTutorialStep(5) // past 4 = tutorial done
        tutorialStepRef.current = 5
        setIsPaused(false)
        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch(() => {})
        }
      }, 1200)
    } else {
      setTutorialStep(nextStep)
      tutorialStepRef.current = nextStep
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tutorial input is handled within the playing state's keyboard listener below

  // Keyboard input
  useEffect(() => {
    if (gameState !== "playing") return

    const laneMap: Record<string, number> = {
      ArrowLeft: 0,
      ArrowDown: 1,
      ArrowUp: 2,
      ArrowRight: 3,
    }

    const handleKey = (e: KeyboardEvent) => {
      // During tutorial, route to tutorial handler
      if (tutorialStepRef.current < 5) {
        const lane = laneMap[e.key]
        if (lane === undefined) return
        e.preventDefault()
        handleTutorialHit(lane)
        return
      }

      if (e.key === " " || e.key === "Escape") {
        e.preventDefault()
        togglePause()
        return
      }

      const lane = laneMap[e.key]
      if (lane === undefined) return
      e.preventDefault()
      handleLaneHit(lane)
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [gameState, handleLaneHit])

  // Gamepad / dance mat input — always polling so pad is detected immediately
  const padLaneMap: Record<string, number> = { left: 0, down: 1, up: 2, right: 3 }
  useGamepad({
    enabled: true,
    debug: true,
    padMapping,
    onPress: (btn: PadButton) => {
      setPadDebug(`🎮 ${btn.toUpperCase()}`)
      setPadConnected(true)
      setTimeout(() => setPadDebug(""), 800)
      if (calibrating) return // ignore mapped presses during calibration
      if (gameState === "playing" && tutorialStepRef.current < 5) {
        const lane = padLaneMap[btn]
        if (lane !== undefined) handleTutorialHit(lane)
      } else if (gameState === "playing") {
        if (btn === "start") { togglePause(); return }
        const lane = padLaneMap[btn]
        if (lane !== undefined) handleLaneHit(lane)
      } else if (gameState === "paused" && btn === "start") {
        togglePause()
      }
    },
    onRawPress: (inputs) => {
      setPadConnected(true)
      if (!calibrating) return
      // During calibration, record the first raw input for the current step
      if (inputs.length > 0) {
        const direction = calibrationSteps[calibrationStep]
        const newData = { ...calibrationData, [direction]: inputs[0] }
        setCalibrationData(newData)
        if (calibrationStep < calibrationSteps.length - 1) {
          // Move to next step after a brief delay
          setTimeout(() => setCalibrationStep(prev => prev + 1), 400)
        } else {
          // All steps done — save mapping
          const mapping = newData as PadMapping
          savePadMapping(mapping)
          setPadMapping(mapping)
          setTimeout(() => {
            setCalibrating(false)
            setCalibrationStep(0)
            setCalibrationData({})
          }, 500)
        }
      }
    },
    onRawInput: (info) => {
      setPadDebug(info)
      setPadConnected(true)
    },
  })

  // Setup screen pad/keyboard navigation (dance mode)
  const speeds = ["slower", "normal"] as const
  const handleSetupNav = useCallback((btn: PadButton) => {
    if (gameState !== "setup") return
    if (btn === "left") {
      setSpeed(prev => {
        const idx = speeds.indexOf(prev as any)
        return speeds[Math.max(0, idx - 1)]
      })
    } else if (btn === "right") {
      setSpeed(prev => {
        const idx = speeds.indexOf(prev as any)
        return speeds[Math.min(speeds.length - 1, idx + 1)]
      })
    } else if (btn === "start") {
      if (gameState === "setup") { const skip = localStorage.getItem("hablabeat-tutorial-done") === "true"; setTutorialStep(skip ? 5 : 0); tutorialStepRef.current = skip ? 5 : 0; setTutorialComplete(false); startGame() }
    } else if (btn === "select") {
      onBack()
    }
  }, [gameState])

  useKeyboardNav({
    enabled: gameState === "setup",
    onPress: handleSetupNav,
  })

  // Also use gamepad for setup screen
  useGamepad({
    enabled: gameState === "setup",
    onPress: handleSetupNav,
  })

  // Touch input for mobile
  useEffect(() => {
    if (gameState !== "playing") return

    const handleTouch = (e: TouchEvent) => {
      const container = containerRef.current
      if (!container) return

      for (let i = 0; i < e.changedTouches.length; i++) {
        e.preventDefault()

        if (isMobile) {
          // Mobile: tap anywhere hits closest note across ALL lanes
          const audio = audioRef.current
          if (!audio) continue
          const currentTime = audio.currentTime
          const mod = getPointer(activePointer).gameplayModifier
          const effectiveMissWindow = HIT_WINDOWS.MISS * mod.hitRadiusMultiplier
          const earlyWindow = HIT_WINDOWS.PERFECT
          const candidates = notesRef.current.filter(
            (n) => !n.hit && !n.missed &&
              (currentTime >= n.timestamp - earlyWindow) &&
              (currentTime <= n.timestamp + effectiveMissWindow)
          )
          if (candidates.length === 0) continue
          const closest = candidates.reduce((a, b) =>
            Math.abs(a.timestamp - currentTime) < Math.abs(b.timestamp - currentTime) ? a : b
          )
          handleLaneHit(closest.lane)
        } else {
          // Desktop: divide into 4 lane zones
          const rect = container.getBoundingClientRect()
          const touch = e.changedTouches[i]
          const x = touch.clientX - rect.left
          const lane = Math.floor((x / rect.width) * 4)
          if (lane < 0 || lane > 3) continue
          handleLaneHit(lane)
        }
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("touchstart", handleTouch, { passive: false })
      return () => container.removeEventListener("touchstart", handleTouch)
    }
  }, [gameState, handleLaneHit, isMobile])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const showLanePress = (lane: number) => {
    // Subtle lane flash on tap
    const flash = document.querySelector(`[data-ddr-lane="${lane}"] .ddr-flash`) as HTMLElement
    if (flash) {
      flash.style.opacity = "0.15"
      setTimeout(() => {
        flash.style.opacity = "0"
      }, 120)
    }

    // Emoji burst — emojis determined by active pointer selection
    const gameContainer = containerRef.current
    if (gameContainer) {
      const cx = lane * 25 + 12.5
      const pressEmojis: Record<string, string[]> = {
        "pointer-bunny":     ["🥕","🐰","🌿","✨"],
        "pointer-dog":       ["🐶","🦴","✨"],
        "pointer-cat":       ["🐱","🐟","✨"],
        "pointer-hearts":    ["💗","💖","💕","💓","💘"],
        "pointer-rainbow":   ["🌈","❤️","🧡","💛","💚","💙","💜","🤎","🖤","🤍"],
        "pointer-banana":    ["🍌","✨"],
        "pointer-star":      ["⭐","🌟","💫","✨","🍀"],
        "pointer-flower":    ["🌸","🌺","🌻","🌷","🌹","💐","🌼","🏵️"],
        "pointer-space":     ["🪐","🌙","🌕","🌏","☄️","🛸","👽"],
      }
      const emojis = pressEmojis[activePointer] || pressEmojis["pointer-bunny"]
      for (let i = 0; i < 3; i++) {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)]
        const e = document.createElement("div")
        e.className = "absolute pointer-events-none"
        const tx = (Math.random() - 0.5) * 40
        const ty = -(24 + Math.random() * 44)
        const sizePick = [14, 18, 22, 28][Math.floor(Math.random() * 4)]
        const dur = 0.38 + Math.random() * 0.28
        e.style.cssText = `left:calc(${cx}% - ${sizePick/2}px);bottom:18%;font-size:${sizePick}px;line-height:1;--tx:${tx}px;--ty:${ty}px;animation:emojiFloat ${dur}s ease-out forwards;z-index:95;`
        e.textContent = emoji
        gameContainer.appendChild(e)
        setTimeout(() => e.remove(), Math.round(dur * 1000) + 30)
      }
    }
  }

  const triggerStreakPulse = (currentCombo: number) => {
    const gameContainer = containerRef.current
    if (!gameContainer) return
    const cfg = getPointer(activePointer)
    const color = cfg.palette[0] ?? "#ffffff"
    const isHot = currentCombo >= 20
    const duration = currentCombo >= 30 ? 1400 : isHot ? 1100 : 720

    // Full-area color wash — more intense at high combos
    const wash = document.createElement("div")
    wash.className = "absolute inset-0 pointer-events-none rounded-2xl"
    wash.style.cssText = isHot
      ? `background:radial-gradient(circle at center,${color}88 0%,${color}44 40%,rgba(255,80,0,0.15) 70%,transparent 100%);animation:streakPulse ${duration}ms ease-out forwards;z-index:50;`
      : `background:radial-gradient(circle at center,${color}55 0%,${color}22 55%,transparent 100%);animation:streakPulse ${duration}ms ease-out forwards;z-index:50;`
    gameContainer.appendChild(wash)
    setTimeout(() => wash.remove(), duration)

    // Big combo number overlay
    const overlay = document.createElement("div")
    overlay.className = "absolute inset-0 flex items-center justify-center pointer-events-none"
    overlay.style.cssText = "z-index:51;"
    const fontSize = isHot ? "clamp(5rem,15vw,8rem)" : "clamp(4rem,12vw,6.5rem)"
    const numGlow = isHot
      ? `0 0 40px ${color},0 0 80px ${color}aa,0 0 120px rgba(255,80,0,0.5)`
      : `0 0 28px ${color},0 0 56px ${color}88`
    overlay.innerHTML = `<div style="text-align:center;animation:streakPulse ${duration}ms ease-out forwards"><div style="font-size:${fontSize};font-weight:900;color:${color};text-shadow:${numGlow};font-family:'Impact','Arial Black',sans-serif;letter-spacing:-2px;line-height:1">${currentCombo}</div><div style="font-size:${isHot ? "1.3rem" : "1.1rem"};font-weight:900;color:white;opacity:.9;letter-spacing:.3em;text-transform:uppercase;margin-top:-.2rem;font-family:'Impact','Arial Black',sans-serif">🔥 streak 🔥</div></div>`
    gameContainer.appendChild(overlay)
    setTimeout(() => overlay.remove(), duration)

    // Fire particle burst at 20+ combo
    if (isHot) {
      const fireEmojis = ["🔥","🔥","🔥","💥","⚡","✨","🔥","🔥"]
      const count = currentCombo >= 30 ? 8 : 5
      for (let i = 0; i < count; i++) {
        const spark = document.createElement("div")
        spark.className = "absolute pointer-events-none"
        const x = 20 + Math.random() * 60
        const startY = 40 + Math.random() * 20
        const tx = (Math.random() - 0.5) * 120
        const ty = -(40 + Math.random() * 80)
        spark.style.cssText = `left:${x}%;top:${startY}%;font-size:${20 + Math.random() * 16}px;z-index:52;opacity:1;transition:none;`
        spark.textContent = fireEmojis[i % fireEmojis.length]
        spark.animate([
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${tx}px,${ty}px) scale(0.3)`, opacity: 0 },
        ], { duration: 600 + Math.random() * 400, easing: "ease-out", fill: "forwards" })
        gameContainer.appendChild(spark)
        setTimeout(() => spark.remove(), 1100)
      }
    }
  }

  const showHitEffect = (lane: number, judgment: string, color: string, isJustPerfect = false) => {
    const container = containerRef.current
    if (!container) return

    // Rainbow color cycle on each hit
    const rainbowColor = RAINBOW_COLORS[hitColorIndexRef.current % RAINBOW_COLORS.length]
    hitColorIndexRef.current += 1

    // Flash carrot arrow with rainbow color on hit
    const hitArrow = document.querySelector(`[data-ddr-lane="${lane}"] .ddr-arrow`) as HTMLElement
    if (hitArrow) {
      hitArrow.style.filter = `drop-shadow(0 0 12px ${rainbowColor}) drop-shadow(0 0 24px ${rainbowColor})`
      hitArrow.style.transform = "translateY(-14px) scale(1.2)"
      setTimeout(() => {
        hitArrow.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
        hitArrow.style.transform = "translateY(0) scale(1)"
      }, 200)
    }

    // Flash the lane background with the rainbow color
    const laneFlash = document.querySelector(`[data-ddr-lane="${lane}"] .ddr-flash`) as HTMLElement
    if (laneFlash) {
      laneFlash.style.backgroundColor = rainbowColor
      laneFlash.style.opacity = "0.25"
      setTimeout(() => {
        laneFlash.style.opacity = "0"
      }, 200)
    }

    // Find the note text for the coin
    const audio = audioRef.current
    const currentTime = audio ? audio.currentTime : 0
    const hitNote = notesRef.current.find(
      (n) => n.lane === lane && n.hit && Math.abs(n.timestamp - currentTime) <= HIT_WINDOWS.MISS + 0.1
    )
    const noteText = hitNote ? hitNote.text : ""
    const noteEnglish = hitNote ? hitNote.english : ""

    const laneLeft = lane * 25 + 1
    const laneWidth = 23

    // ── POINTER ANIMATIONS: delegated to effect engine ────────────────────
    firePointerEffect(getPointer(activePointer), {
      container,
      lane,
      laneLeft,
      laneWidth,
      rainbowColor,
      isJustPerfect,
    })

    // ── LINE FLASH HIT EFFECT ──────────────────────────────
    {
      const hitLaneColor = LANE_HEX[lane] || "#ffffff"
      // Bright line flash across the lane
      const lineFlash = document.createElement("div")
      lineFlash.className = "absolute pointer-events-none"
      lineFlash.style.cssText = `
        left: ${laneLeft}%; width: ${laneWidth}%; bottom: 14%; height: 6px;
        background: ${hitLaneColor};
        box-shadow: 0 0 20px ${hitLaneColor}, 0 0 40px ${hitLaneColor}80;
        border-radius: 3px;
        animation: linePulse 0.35s ease-out forwards; z-index: 90;
      `
      container.appendChild(lineFlash)
      setTimeout(() => lineFlash.remove(), 350)

      // Spark particles flying from the line
      for (let i = 0; i < 8; i++) {
        const spark = document.createElement("div")
        const size = 2 + Math.random() * 4
        spark.className = "absolute rounded-full pointer-events-none"
        spark.style.cssText = `
          left: ${laneLeft + laneWidth / 2}%; bottom: 15%;
          width: ${size}px; height: ${size}px;
          background: ${hitLaneColor};
          box-shadow: 0 0 6px ${hitLaneColor};
          transition: all ${0.3 + Math.random() * 0.2}s ease-out;
          opacity: 1; z-index: 91;
        `
        container.appendChild(spark)
        const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
        const dist = 20 + Math.random() * 40
        setTimeout(() => {
          spark.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`
          spark.style.opacity = "0"
        }, 10)
        setTimeout(() => spark.remove(), 500)
      }
    }

    // English word burst — centered on screen, pops on top of the last word
    const el = document.createElement("div")
    el.className = `absolute pointer-events-none`
    el.style.cssText = `
      left: 0; right: 0; bottom: 28%; text-align: center;
      display: flex; justify-content: center;
      animation: ddrJudgmentPop 2.5s ease-out forwards; z-index: 100;
    `
    el.innerHTML = `<span style="
      font-size: clamp(1.8rem, 5vw, 3.2rem);
      font-weight: 900;
      color: #ffffff;
      background: linear-gradient(135deg, rgba(59,130,246,0.9), rgba(99,102,241,0.9));
      padding: 6px 18px;
      border-radius: 999px;
      border: 3px solid rgba(255,255,255,0.6);
      box-shadow: 0 0 30px rgba(59,130,246,0.9), 0 0 60px rgba(99,102,241,0.4), 0 4px 12px rgba(0,0,0,0.5);
      text-shadow: 1px 1px 3px rgba(0,0,0,0.6);
      line-height: 1.2;
      white-space: nowrap;
    ">${judgment}</span>`
    container.appendChild(el)
    setTimeout(() => el.remove(), 2500)
  }

  const checkEncouragement = (currentCombo: number) => {
    // Country-specific encouragement phrases based on song number
    const countryEncouragement: Record<string, { text: string; english: string }[]> = {
      "Mexico":             [{text:"¡Órale!",english:"Wow!"},{text:"¡Chido!",english:"Cool!"},{text:"¡Qué padre!",english:"How awesome!"},{text:"¡Eso está de poca!",english:"That's awesome!"},{text:"¡Ánimo!",english:"Keep going!"}],
      "Spain":              [{text:"¡Guay!",english:"Cool!"},{text:"¡Eso está genial!",english:"That's great!"},{text:"¡Muy bien!",english:"Very good!"},{text:"¡Fenomenal!",english:"Phenomenal!"},{text:"¡Ánimo!",english:"Keep going!"}],
      "Argentina":          [{text:"¡Dale!",english:"Go for it!"},{text:"¡Qué copado!",english:"How cool!"},{text:"¡Buenísimo!",english:"Awesome!"},{text:"¡Vamos todavía!",english:"Let's go!"},{text:"¡Eso es, che!",english:"That's it, buddy!"}],
      "Chile":              [{text:"¡Bacán!",english:"Awesome!"},{text:"¡Fome no!",english:"Not boring!"},{text:"¡Vamos po!",english:"Let's go!"},{text:"¡Brígido!",english:"Amazing!"},{text:"¡Bien ahí!",english:"Good job!"}],
      "Colombia":           [{text:"¡Qué chévere!",english:"Cool!"},{text:"¡Excelente!",english:"Excellent!"},{text:"¡Muy bien, parce!",english:"Very good, friend!"},{text:"¡Bacano!",english:"Awesome!"},{text:"¡De una!",english:"Let's do it!"}],
      "Venezuela":          [{text:"¡Chévere!",english:"Cool!"},{text:"¡Arrechísimo!",english:"Super awesome!"},{text:"¡Eso es!",english:"That's it!"},{text:"¡Pura vida!",english:"Full of life!"},{text:"¡Buenísimo!",english:"Great!"}],
      "Peru":               [{text:"¡Bacán!",english:"Awesome!"},{text:"¡Bien ahí!",english:"Good job!"},{text:"¡Súper!",english:"Super!"},{text:"¡Qué chévere!",english:"Cool!"},{text:"¡Así se hace!",english:"That's how it's done!"}],
      "Ecuador":            [{text:"¡Qué bestia!",english:"How amazing!"},{text:"¡Bacán!",english:"Cool!"},{text:"¡Muy bien!",english:"Very good!"},{text:"¡Súper bacán!",english:"Super cool!"},{text:"¡Eso es!",english:"That's it!"}],
      "Bolivia":            [{text:"¡Chévere!",english:"Cool!"},{text:"¡Excelente!",english:"Excellent!"},{text:"¡Bien hecho!",english:"Well done!"},{text:"¡Qué chévere!",english:"How cool!"},{text:"¡Sigue así!",english:"Keep going!"}],
      "Paraguay":           [{text:"¡Genial!",english:"Great!"},{text:"¡Muy bien!",english:"Very good!"},{text:"¡Bacán!",english:"Cool!"},{text:"¡Buenísimo!",english:"Awesome!"},{text:"¡Dale nomás!",english:"Go ahead!"}],
      "Uruguay":            [{text:"¡Ta!",english:"Good!"},{text:"¡Qué bueno!",english:"How good!"},{text:"¡Dale!",english:"Go ahead!"},{text:"¡Vamos todavía!",english:"Let's go!"},{text:"¡Buenísimo!",english:"Awesome!"}],
      "Cuba":               [{text:"¡Qué bolá!",english:"What's up!"},{text:"¡Asere, bien hecho!",english:"Friend, well done!"},{text:"¡Eso es!",english:"That's it!"},{text:"¡De puta madre!",english:"Awesome!"},{text:"¡Dale que va!",english:"Go for it!"}],
      "Dominican Republic": [{text:"¡Jevi!",english:"Cool!"},{text:"¡Bacano!",english:"Awesome!"},{text:"¡Muy bien!",english:"Very good!"},{text:"¡Eso está dura!",english:"That's awesome!"},{text:"¡Dale, sigue!",english:"Keep going!"}],
      "Puerto Rico":        [{text:"¡Nítido!",english:"Perfect!"},{text:"¡Buen trabajo!",english:"Good job!"},{text:"¡Chévere!",english:"Nice!"},{text:"¡Eso es!",english:"That's it!"},{text:"¡Vamos allá!",english:"Let's go!"}],
      "Guatemala":          [{text:"¡Qué buena onda!",english:"How cool!"},{text:"¡Buenísimo!",english:"Awesome!"},{text:"¡Adelante!",english:"Go ahead!"},{text:"¡Muy bien!",english:"Very good!"},{text:"¡Súper!",english:"Super!"}],
      "Honduras":           [{text:"¡Qué chido!",english:"Cool!"},{text:"¡Muy bien!",english:"Very good!"},{text:"¡Sigue así!",english:"Keep it up!"},{text:"¡Bien ahí!",english:"Good job!"},{text:"¡Vamos!",english:"Let's go!"}],
      "El Salvador":        [{text:"¡Chivo!",english:"Awesome!"},{text:"¡Bien hecho!",english:"Well done!"},{text:"¡Dale!",english:"Keep going!"},{text:"¡Excelente!",english:"Excellent!"},{text:"¡Súper!",english:"Super!"}],
      "Nicaragua":          [{text:"¡Bien ahí!",english:"Good job!"},{text:"¡Súper!",english:"Super!"},{text:"¡Eso es!",english:"That's it!"},{text:"¡Excelente!",english:"Excellent!"},{text:"¡Vamos, sigue!",english:"Go, keep going!"}],
      "Costa Rica":         [{text:"¡Pura vida!",english:"Good vibes!"},{text:"¡Buenísimo!",english:"Great!"},{text:"¡Sigue así!",english:"Keep it up!"},{text:"¡De primera!",english:"Top-notch!"},{text:"¡Qué tuanis!",english:"How cool!"}],
      "Panama":             [{text:"¡Tuanis!",english:"Awesome!"},{text:"¡Buen trabajo!",english:"Good job!"},{text:"¡Eso está chévere!",english:"That's great!"},{text:"¡Excelente!",english:"Excellent!"},{text:"¡Ánimo!",english:"Keep going!"}],
    }

    // Map song number to country
    const songCountryMap: Record<number, string> = {
      1: "Mexico", 2: "Mexico", 3: "Mexico",
      4: "Guatemala", 5: "Guatemala",
      6: "El Salvador", 7: "El Salvador",
      8: "Honduras", 9: "Honduras", 10: "Honduras",
      11: "Nicaragua", 12: "Nicaragua", 13: "Nicaragua",
      14: "Costa Rica", 15: "Costa Rica",
      16: "Panama", 17: "Panama",
      18: "Puerto Rico", 19: "Puerto Rico",
      20: "Dominican Republic",
      21: "Cuba", 22: "Cuba", 23: "Cuba",
      24: "Colombia", 25: "Colombia", 26: "Colombia", 27: "Colombia",
      28: "Venezuela", 29: "Venezuela", 30: "Venezuela",
      31: "Ecuador", 32: "Ecuador", 33: "Ecuador",
      34: "Peru", 35: "Peru", 36: "Peru", 37: "Peru",
      38: "Bolivia", 39: "Bolivia", 40: "Bolivia",
      41: "Paraguay", 42: "Paraguay",
      43: "Uruguay", 44: "Uruguay",
      45: "Chile", 46: "Chile",
      47: "Argentina", 48: "Argentina", 49: "Argentina", 50: "Argentina",
    }

    const country = songCountryMap[songNumber] || "Mexico"
    const phrases = countryEncouragement[country] || countryEncouragement["Mexico"]
    const colors = [
      "text-green-300", "text-green-400", "text-cyan-400", "text-blue-400",
      "text-indigo-400", "text-purple-400", "text-violet-400", "text-pink-400",
      "text-rose-400", "text-yellow-300", "text-amber-400", "text-red-400",
      "text-orange-300", "text-yellow-400",
    ]

    const spanishMessages: Record<number, { text: string; english: string; color: string }> = {
      3:  { text: phrases[0].text, english: phrases[0].english, color: colors[0] },
      5:  { text: phrases[1].text, english: phrases[1].english, color: colors[1] },
      8:  { text: phrases[2].text, english: phrases[2].english, color: colors[2] },
      10: { text: phrases[3].text, english: phrases[3].english, color: colors[3] },
      13: { text: phrases[4].text, english: phrases[4].english, color: colors[4] },
      15: { text: phrases[0].text, english: phrases[0].english, color: colors[5] },
      18: { text: phrases[1].text, english: phrases[1].english, color: colors[6] },
      20: { text: phrases[2].text, english: phrases[2].english, color: colors[7] },
      25: { text: phrases[3].text, english: phrases[3].english, color: colors[8] },
      30: { text: phrases[4].text.toUpperCase(), english: phrases[4].english, color: colors[9] },
      35: { text: phrases[0].text.toUpperCase(), english: phrases[0].english, color: colors[10] },
      40: { text: phrases[1].text.toUpperCase(), english: phrases[1].english, color: colors[11] },
      45: { text: phrases[2].text.toUpperCase(), english: phrases[2].english, color: colors[12] },
      50: { text: "¡ERES INCREÍBLE!", english: "You're incredible!", color: colors[13] },
    }

    const messages = spanishMessages
    const rndPhrase = phrases[Math.floor(Math.random() * phrases.length)]
    const overflowMsg = { text: rndPhrase.text.toUpperCase(), english: rndPhrase.english, color: "text-orange-400" }

    const msg = messages[currentCombo] || (currentCombo > 50 && currentCombo % 25 === 0 ? overflowMsg : null)

    if (msg) {
      setEncouragement(msg)
      // Higher combos = stickier encouragement (stays longer on screen)
      const duration = currentCombo >= 30 ? 4000 : currentCombo >= 20 ? 3500 : currentCombo >= 10 ? 3000 : 2500
      setTimeout(() => setEncouragement(null), duration)
    }
  }

  // Fire onGameEnd when game ends; auto-open challenge modal if pre-selected friend
  useEffect(() => {
    if (gameState === "ended") {
      if (onGameEnd) {
        const { grade } = getGrade()
        onGameEnd(songNumber, maxComboRef.current, scoreRef.current, grade)
      }
      if (initialChallengePhone) {
        // Auto-trigger challenge flow so score is built and modal opens
        setTimeout(() => handleChallenge(), 800)
      }
    }
  }, [gameState])

  const resetGame = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    setGameState("setup")
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setTotalHits(0)
    setIsPaused(false)
  }

  // Calculate grade based on percentage of words hit
  const getGrade = () => {
    const total = notesRef.current.length
    if (total === 0) return { grade: "F", color: "text-red-400" }
    const pct = (totalHitsRef.current / total) * 100
    if (pct >= 97) return { grade: "A+", color: "text-yellow-300" }
    if (pct >= 93) return { grade: "A", color: "text-yellow-400" }
    if (pct >= 90) return { grade: "A-", color: "text-yellow-500" }
    if (pct >= 87) return { grade: "B+", color: "text-green-300" }
    if (pct >= 83) return { grade: "B", color: "text-green-400" }
    if (pct >= 80) return { grade: "B-", color: "text-green-500" }
    if (pct >= 77) return { grade: "C+", color: "text-blue-300" }
    if (pct >= 73) return { grade: "C", color: "text-blue-400" }
    if (pct >= 70) return { grade: "C-", color: "text-blue-500" }
    if (pct >= 67) return { grade: "D+", color: "text-orange-300" }
    if (pct >= 63) return { grade: "D", color: "text-orange-400" }
    if (pct >= 60) return { grade: "D-", color: "text-orange-500" }
    return { grade: "F", color: "text-red-400" }
  }

  const totalNotes = (() => {
    if (!timingData) return 0
    const keywordSet = SONG_KEYWORDS[songNumber] ?? null
    if (!keywordSet) return timingData.lyrics.reduce((sum, line) => sum + line.words.length, 0)
    const stripPunct = (s: string) => s.replace(/[^a-záéíóúüñ]/gi, "").toLowerCase()
    return timingData.lyrics.reduce((sum, line) => sum + line.words.filter(w => {
      const stripped = stripPunct(w.text)
      if (!keywordSet.has(stripped)) return false
      if (stripped.length <= 1 && line.words.length > 1) return false
      return true
    }).length, 0)
  })()

  // RECALL BREAK STATE — bunny quiz between song sections
  if (gameState === "recall_break" && recallBreaks && currentBreakIndex >= 0) {
    const brk = recallBreaks[currentBreakIndex]
    return (
      <div className="fixed inset-0 z-[300]">
        <VocabFly
          title={brk.label}
          icon="🐰"
          phase1={{
            words: brk.words,
            speedBase: 0.26,
            speedVariance: 0.10,
            waveInterval: 4200,
            label: brk.label,
            bgGradient: "linear-gradient(180deg,#0a1535 0%,#0c2461 30%,#1e40af 65%,#3b82f6 100%)",
            bubbleBg: "#bfdbfe",
            bubbleText: "#1d4ed8",
            progressGrad: "linear-gradient(90deg,#60a5fa,#3b82f6)",
            badgeColor: "rgba(29,78,216,0.5)",
          }}
          accentColor="linear-gradient(135deg,#1d4ed8,#1e40af)"
          coins={recallCoins}
          onCoinsChange={(delta) => setRecallCoins((c) => c + delta)}
          onClose={() => {
            // Save a 0 score if user skips
            setRecallScores(prev => prev.length <= currentBreakIndex ? [...prev, { label: brk.label, score: 0 }] : prev)
            // Resume the DDR game
            setGameState("playing")
            if (audioRef.current) {
              audioRef.current.play()
            }
          }}
          onGameEnd={(s: number) => {
            // Save recall score for this section
            setRecallScores(prev => [...prev, { label: brk.label, score: s }])
            // Resume the DDR game
            setGameState("playing")
            if (audioRef.current) {
              audioRef.current.play()
            }
          }}
          activePointer={activePointer}
          storeOwned={storeOwned}
          onEquipPointer={onEquipPointer}
        />
      </div>
    )
  }

  // Tutorial is now an overlay within the playing state

  // LOADING STATE
  if (gameState === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🎵</div>
          <p className="text-gray-500">Loading timing data...</p>
        </div>
      </div>
    )
  }

  // SETUP SCREEN
  if (gameState === "setup") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
      }}>
        <style>{`
          @keyframes btnBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
          @keyframes rotateHint { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(90deg); } }
        `}</style>

        {/* Centered modal card */}
        <div className="w-full max-w-sm mx-4 rounded-3xl overflow-hidden" style={{
          background: "linear-gradient(180deg, rgba(30,27,75,0.95), rgba(15,5,32,0.98))",
          border: "1.5px solid rgba(255,255,255,0.15)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }} onClick={e => e.stopPropagation()}>

          {/* Song image header */}
          <div className="relative h-32 overflow-hidden">
            <img src={`/images/backgrounds/song-${songNumber}.jpg`} alt={songTitle}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6)" }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h2 className="text-white font-black text-2xl text-center" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>{songTitle}</h2>
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">
            {/* Speed selection */}
            <div>
              <p className="text-white/60 font-bold text-sm mb-3 text-center">Choose Speed</p>
              <div className="flex gap-2">
                {([["slower", "Slower"], ["normal", "Normal"]] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setSpeed(key)}
                    className="flex-1 py-3 rounded-full font-black text-sm transition-all active:scale-90"
                    style={speed === key ? {
                      background: "linear-gradient(135deg, #4a7cdb, #6366f1)",
                      color: "white",
                      border: "2px solid rgba(255,255,255,0.4)",
                      boxShadow: "0 4px 16px rgba(74,124,219,0.4)",
                    } : {
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.5)",
                      border: "1.5px solid rgba(255,255,255,0.15)",
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-white/30 mt-2">{totalNotes} vocab words</p>
            </div>

            {/* Calibrate pad */}
            {padConnected && (
              <button
                onClick={() => { setCalibrating(true); setCalibrationStep(0); setCalibrationData({}) }}
                className="w-full py-2.5 rounded-full font-bold text-sm transition-all active:scale-95"
                style={{
                  background: padMapping ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)",
                  color: padMapping ? "#4ade80" : "#fbbf24",
                  border: `1.5px solid ${padMapping ? "rgba(34,197,94,0.4)" : "rgba(251,191,36,0.4)"}`,
                }}>
                🎮 {padMapping ? "Pad Calibrated ✓" : "Calibrate Dance Pad"}
              </button>
            )}


            {/* Start button */}
            <button onClick={() => { const skip = localStorage.getItem("hablabeat-tutorial-done") === "true"; setTutorialStep(skip ? 5 : 0); tutorialStepRef.current = skip ? 5 : 0; setTutorialComplete(false); startGame() }}
              className="w-full py-4 rounded-full font-black text-xl text-white transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #4a7cdb, #6366f1)",
                boxShadow: "0 4px 25px rgba(74,124,219,0.5)",
              }}>
              <span style={{ display: "inline-block", animation: "btnBounce 0.7s ease-in-out infinite" }}>▶</span> Start!
            </button>

            {/* Back */}
            <button onClick={onBack}
              className="w-full py-2 text-white/40 text-sm font-bold text-center active:scale-95 transition-all">
              ← Back
            </button>
          </div>
        </div>

        {false && <>
        {[
          { left: "10%", size: 22, duration: "7.5s", delay: "1s",   rotate: 20 },
          { left: "30%", size: 18, duration: "6s",   delay: "3s",   rotate: -15 },
          { left: "55%", size: 20, duration: "8s",   delay: "2s",   rotate: 30 },
          { left: "70%", size: 16, duration: "7s",   delay: "4.5s", rotate: -25 },
          { left: "85%", size: 22, duration: "6.5s", delay: "0.5s", rotate: 10 },
        ].map((c, i) => (
          <div key={`setup-carrot-${i}`} onClick={playCarrotSound} onMouseEnter={playCarrotSound} style={{
            position: "absolute",
            left: c.left,
            top: "-50px",
            fontSize: `${c.size}px`,
            animation: `setupCarrotFall ${c.duration} ${c.delay} ease-in infinite`,
            ["--r" as any]: `${c.rotate}deg`,
            zIndex: 1,
            cursor: "pointer",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          }}>🥕</div>
        ))}

        {/* Iridescent bubble decorations */}
        {bubbles.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: b.size,
              height: b.size,
              top: b.top,
              left: b.left,
              opacity: b.opacity,
              background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 18%, hsl(${b.hue},80%,75%) 40%, hsl(${b.hue + 30},70%,80%) 65%, rgba(255,255,255,0.1) 100%)`,
              border: "1.5px solid rgba(255,255,255,0.6)",
              boxShadow: `inset 0 -4px 8px rgba(255,255,255,0.3), 0 2px 8px rgba(100,200,255,0.2)`,
            }}
          />
        ))}

        <div className="mx-auto w-full flex flex-col gap-3 relative z-10">

          {/* Header bar — full width on desktop */}
          {(() => {
            const songDescriptions: Record<number, string> = {
              1:  "The Spanish alphabet letters",
              2:  "The special letters in Spanish",
              3:  "Spanish vowel sounds",
              4:  "Body parts and face vocab",
              5:  "Clothing words in Spanish",
              6:  "Family members in Spanish",
              7:  "Jobs and careers vocab",
              8:  "Vowels with a unicorn twist",
              9:  "Pets and animals vocab",
              10: "Animal habitats and homes",
              11: "Rooms in your house",
              12: "Where is it? location words",
              13: "Giving and following directions",
              14: "Numbers one through twenty",
              15: "Counting by tens to one hundred",
              16: "Days, months, and seasons",
              17: "Telling time in Spanish",
              18: "Colors in Spanish",
              19: "Feelings and emotions",
              20: "Hunger and thirst expressions",
              21: "Fruit names in Spanish",
              22: "Vegetable names in Spanish",
              23: "Breakfast, lunch, and dinner",
              24: "Ordering and asking for things",
              25: "AR verbs conjugation",
              26: "Gustar — to like something",
              27: "Estar — to be (temporary)",
              28: "ER verbs conjugation",
              29: "Tener — to have",
              30: "Ser — to be (permanent)",
              31: "IR verbs conjugation",
              32: "IR — to go places",
              33: "Decir — to say or tell",
              34: "When to use preterite tense",
              35: "AR verbs in the past",
              36: "ER and IR verbs in the past",
              37: "Irregular past tense verbs",
              38: "Imperfect tense for the past",
              39: "Irregular imperfect verbs",
              40: "Imperfect vs preterite tense",
              41: "Future tense in Spanish",
              42: "Irregular future tense verbs",
              43: "Conditional — would do something",
              44: "Irregular conditional verbs",
              45: "Personal and reflexive pronouns",
              46: "Direct and indirect object pronouns",
              47: "Commands and instructions",
              48: "Por vs para — tricky prepositions",
              49: "Subjunctive mood basics",
              50: "Fun phrases and expressions",
            }
            const desc = songDescriptions[songNumber] ?? "Vocabulary and grammar"
            return (
              <div className="w-full" style={{ background: "#4a7cdb" }}>
                <div className="flex items-center gap-2 px-4 py-2">
                  <button
                    onClick={onBack}
                    className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm active:scale-90 transition-all flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff" }}
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <h1 className="font-black text-base text-white leading-tight">{songTitle}</h1>
                  <span className="text-xs font-semibold text-white/70">·</span>
                  <p className="text-xs font-semibold text-white/70 truncate">{desc}</p>
                </div>
              </div>
            )
          })()}

          {/* Content area — constrained width */}
          <div className={`mx-auto w-full px-4 flex flex-col gap-3 ${danceMode ? "max-w-2xl pb-4" : "max-w-md pt-2 pb-12"}`}>

          {/* Mission card — frosted glass */}
          <div className="rounded-3xl px-5 py-4 shadow-lg" style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px)",
            border: "1.5px solid rgba(255,255,255,0.85)"
          }}>
            <p className="font-black mb-2 text-base" style={{ color: "#4a7cdb" }}>🎯 Your Mission:</p>
            <p className="text-base leading-relaxed font-medium" style={{ color: "#18181b" }}>Hit the words with your arrows to collect coins for your vocab bank!</p>
          </div>

          {/* Speed card — frosted glass with pill buttons matching home style */}
          <div className="rounded-3xl px-5 py-5 shadow-lg" style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px)",
            border: "1.5px solid rgba(255,255,255,0.85)"
          }}>
            <p className="font-black text-gray-800 mb-3">Speed</p>
            <style>{`
              @keyframes btnBounce {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-3px); }
              }
            `}</style>
            <div className="flex gap-2">
              <button
                onClick={() => setSpeed("slower")}
                className="flex-1 py-3.5 px-5 rounded-full font-black text-sm transition-all active:scale-90 flex items-center justify-center gap-1.5 whitespace-nowrap"
                style={speed === "slower" ? {
                  background: "#dbe6f8",
                  color: "#4a7cdb",
                  boxShadow: "0 2px 8px rgba(74,124,219,0.2)",
                  border: "2px solid #4a7cdb",
                } : { background: "#f0f4ff", color: "#4a7cdb", border: "1.5px solid #bdd0ef", boxShadow: "0 1px 2px rgba(74,124,219,0.08)" }}
              >
                Slower
              </button>
              <button
                onClick={() => setSpeed("normal")}
                className="flex-1 py-3.5 px-5 rounded-full font-black text-sm transition-all active:scale-90 flex items-center justify-center gap-1.5 whitespace-nowrap"
                style={speed === "normal" ? {
                  background: "#dbe6f8",
                  color: "#4a7cdb",
                  boxShadow: "0 2px 8px rgba(74,124,219,0.2)",
                  border: "2px solid #4a7cdb",
                } : { background: "#f0f4ff", color: "#4a7cdb", border: "1.5px solid #bdd0ef", boxShadow: "0 1px 2px rgba(74,124,219,0.08)" }}
              >
                Normal
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-3">{totalNotes} vocab words</p>
          </div>

          {/* Calibrate Pad button — only show when pad connected */}
          {padConnected && (
            <button
              onClick={() => {
                setCalibrating(true)
                setCalibrationStep(0)
                setCalibrationData({})
              }}
              className="w-full py-3 rounded-full font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{
                background: padMapping ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)",
                color: padMapping ? "#16a34a" : "#d97706",
                border: `1.5px solid ${padMapping ? "#22c55e" : "#fbbf24"}`,
              }}
            >
              🎮 {padMapping ? "Pad Calibrated ✓ — Recalibrate" : "Calibrate Dance Pad"}
            </button>
          )}

          {/* Start button — teal→green gradient with glow + outer ring */}
          <div className="rounded-full p-[3px] shadow-2xl mt-1" style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1))",
            boxShadow: "0 0 0 3px rgba(255,255,255,0.35), 0 8px 32px rgba(74,124,219,0.4)"
          }}>
            <button
              onClick={() => { const skip = localStorage.getItem("hablabeat-tutorial-done") === "true"; setTutorialStep(skip ? 5 : 0); tutorialStepRef.current = skip ? 5 : 0; setTutorialComplete(false); startGame() }}
              className="w-full py-5 rounded-full font-black text-2xl text-white transition-all active:scale-95 flex items-center justify-center gap-3"
              style={{
                background: "linear-gradient(135deg, #5b9be6, #4a7cdb, #3d6bc4)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)"
              }}
            >
              <span style={{ display: "inline-block", animation: "btnBounce 0.7s ease-in-out infinite" }}>▶</span> Start!
            </button>
          </div>
          </div>
          </div>

        </>}

        {/* Calibration overlay */}
        {calibrating && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)" }}>
            <div className="text-center p-8 rounded-3xl max-w-sm mx-4" style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              border: "2px solid rgba(255,255,255,0.2)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}>
              <h2 className="text-2xl font-black text-white mb-2">🎮 Calibrate Pad</h2>
              <p className="text-white/60 text-sm mb-6">Step on each arrow when prompted</p>

              {/* Arrow display grid */}
              <div className="relative w-48 h-48 mx-auto mb-6">
                {/* Up */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-all duration-300" style={{
                  background: calibrationSteps[calibrationStep] === "up" ? "rgba(59,130,246,0.3)" : calibrationData.up ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
                  border: calibrationSteps[calibrationStep] === "up" ? "3px solid #3b82f6" : calibrationData.up ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.1)",
                  transform: calibrationSteps[calibrationStep] === "up" ? "translateX(-50%) scale(1.15)" : "translateX(-50%) scale(1)",
                  boxShadow: calibrationSteps[calibrationStep] === "up" ? "0 0 20px rgba(59,130,246,0.4)" : "none",
                }}>
                  {calibrationData.up ? "✅" : "⬆️"}
                </div>
                {/* Down */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-all duration-300" style={{
                  background: calibrationSteps[calibrationStep] === "down" ? "rgba(59,130,246,0.3)" : calibrationData.down ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
                  border: calibrationSteps[calibrationStep] === "down" ? "3px solid #3b82f6" : calibrationData.down ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.1)",
                  transform: calibrationSteps[calibrationStep] === "down" ? "translateX(-50%) scale(1.15)" : "translateX(-50%) scale(1)",
                  boxShadow: calibrationSteps[calibrationStep] === "down" ? "0 0 20px rgba(59,130,246,0.4)" : "none",
                }}>
                  {calibrationData.down ? "✅" : "⬇️"}
                </div>
                {/* Left */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-all duration-300" style={{
                  background: calibrationSteps[calibrationStep] === "left" ? "rgba(59,130,246,0.3)" : calibrationData.left ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
                  border: calibrationSteps[calibrationStep] === "left" ? "3px solid #3b82f6" : calibrationData.left ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.1)",
                  transform: calibrationSteps[calibrationStep] === "left" ? "translateY(-50%) scale(1.15)" : "translateY(-50%) scale(1)",
                  boxShadow: calibrationSteps[calibrationStep] === "left" ? "0 0 20px rgba(59,130,246,0.4)" : "none",
                }}>
                  {calibrationData.left ? "✅" : "⬅️"}
                </div>
                {/* Right */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-all duration-300" style={{
                  background: calibrationSteps[calibrationStep] === "right" ? "rgba(59,130,246,0.3)" : calibrationData.right ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
                  border: calibrationSteps[calibrationStep] === "right" ? "3px solid #3b82f6" : calibrationData.right ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.1)",
                  transform: calibrationSteps[calibrationStep] === "right" ? "translateY(-50%) scale(1.15)" : "translateY(-50%) scale(1)",
                  boxShadow: calibrationSteps[calibrationStep] === "right" ? "0 0 20px rgba(59,130,246,0.4)" : "none",
                }}>
                  {calibrationData.right ? "✅" : "➡️"}
                </div>
              </div>

              <p className="text-xl font-black text-blue-400 mb-4" style={{ animation: "playPulse 1.2s ease-in-out infinite" }}>
                Step on {calibrationSteps[calibrationStep]?.toUpperCase()} arrow!
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setCalibrating(false)
                    setCalibrationStep(0)
                    setCalibrationData({})
                  }}
                  className="flex-1 py-2.5 rounded-full font-bold text-sm text-white/60"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  Cancel
                </button>
                {padMapping && (
                  <button
                    onClick={() => {
                      clearPadMapping()
                      setPadMapping(null)
                      setCalibrating(false)
                      setCalibrationStep(0)
                      setCalibrationData({})
                    }}
                    className="flex-1 py-2.5 rounded-full font-bold text-sm text-red-400"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
                  >
                    Reset to Default
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Generate a URL-safe challenge link and open the send modal
  const handleChallenge = () => {
    const { grade } = getGrade()
    // Use URL-safe base64 (replace +/= so the URL never breaks)
    const payload: Record<string, unknown> = {
      s: songNumber,
      t: songTitle,
      sc: scoreRef.current,
      g: grade,
      fc: maxComboRef.current,
    }
    if (userName) payload.n = userName
    if (userPhoto) payload.p = userPhoto
    if (totalVocabBank) payload.vb = totalVocabBank
    if (bestFlow) payload.bf = bestFlow
    if (totalChallengesSent) payload.cs = totalChallengesSent + 1
    if (challengesWon) payload.cw = challengesWon
    if (dailyStreak) payload.str = dailyStreak
    const raw = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
    const url = `${window.location.origin}/challenge/${raw}`
    setChallengeUrl(url)
    // Open SMS directly — user picks who to text on their phone
    const senderName = userName || "Someone"
    const message = encodeURIComponent(`🥕 ${senderName} challenges you to beat their score on HablaBeat! Can you top it?\n\n${url}`)
    window.location.href = `sms:?&body=${message}`
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 3000)
    onChallengeSent?.()
  }

  // END SCREEN
  if (gameState === "ended") {
    const { grade, color: gradeColor } = getGrade()
    return (
      <div className="fixed inset-0 text-gray-800 flex items-center justify-center overflow-hidden" style={{
        background: "linear-gradient(160deg, #e8f0fe 0%, #dbe6f8 20%, #c9d9f2 40%, #b8cded 60%, #a7c1e8 80%, #96b5e3 100%)",
        zIndex: 50,
      }}>
        {/* Falling gold coins — interactive, matching setup page */}
        <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          {[
            { left: "3%",  size: 30, duration: "6s",   delay: "0s",   rotate: 15 },
            { left: "12%", size: 22, duration: "7.5s", delay: "1.5s", rotate: -20 },
            { left: "22%", size: 26, duration: "5.5s", delay: "0.5s", rotate: 35 },
            { left: "33%", size: 18, duration: "8s",   delay: "2.5s", rotate: -10 },
            { left: "43%", size: 28, duration: "6.5s", delay: "0.8s", rotate: 25 },
            { left: "55%", size: 20, duration: "7s",   delay: "1.8s", rotate: -30 },
            { left: "65%", size: 24, duration: "5.8s", delay: "3s",   rotate: 40 },
            { left: "76%", size: 32, duration: "6.2s", delay: "0.3s", rotate: -15 },
            { left: "86%", size: 20, duration: "9s",   delay: "4s",   rotate: 20 },
            { left: "94%", size: 26, duration: "7s",   delay: "2s",   rotate: -25 },
            { left: "8%",  size: 16, duration: "8.5s", delay: "3.5s", rotate: 30 },
            { left: "48%", size: 22, duration: "6.8s", delay: "1s",   rotate: -35 },
          ].map((c, i) => (
            <div key={`end-coin-${i}`} onClick={playCoinSound} onMouseEnter={playCoinSound} style={{
              position: "absolute",
              left: c.left,
              top: "-60px",
              width: `${c.size}px`,
              height: `${c.size}px`,
              borderRadius: "50%",
              background: "conic-gradient(from 160deg,#D97706,#FBBF24 30%,#FDE68A 50%,#FBBF24 70%,#D97706)",
              border: `${c.size > 30 ? 2 : 1.5}px solid #92400E`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15), inset 0 -2px 4px rgba(120,53,0,0.4), inset 1px 1px 4px rgba(254,243,199,0.5)",
              animation: `endCoinFall ${c.duration} ${c.delay} ease-in infinite`,
              ["--r" as any]: `${c.rotate}deg`,
              cursor: "pointer",
            }}>
              <div style={{ position: "absolute", top: "15%", left: "20%", width: "30%", height: "18%", background: "radial-gradient(ellipse,rgba(255,255,255,0.55),rgba(255,255,255,0) 70%)", borderRadius: "50%", transform: "rotate(-15deg)" }} />
            </div>
          ))}

          {/* Falling carrots — interactive */}
          {[
            { left: "7%",  size: 20, duration: "7.5s", delay: "1s",   rotate: 20 },
            { left: "28%", size: 16, duration: "6s",   delay: "3s",   rotate: -15 },
            { left: "50%", size: 18, duration: "8s",   delay: "2s",   rotate: 30 },
            { left: "68%", size: 14, duration: "7s",   delay: "4.5s", rotate: -25 },
            { left: "82%", size: 20, duration: "6.5s", delay: "0.5s", rotate: 10 },
            { left: "38%", size: 16, duration: "7.2s", delay: "3.8s", rotate: -20 },
            { left: "90%", size: 18, duration: "8.5s", delay: "1.5s", rotate: 35 },
          ].map((c, i) => (
            <div key={`end-carrot-${i}`} onClick={playCarrotSound} onMouseEnter={playCarrotSound} style={{
              position: "absolute",
              left: c.left,
              top: "-50px",
              fontSize: `${c.size}px`,
              animation: `endCarrotFall ${c.duration} ${c.delay} ease-in infinite`,
              ["--r" as any]: `${c.rotate}deg`,
              cursor: "pointer",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
            }}>🥕</div>
          ))}
        </div>

        {/* Rainbow ribbon header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 pointer-events-none" style={{ background: "linear-gradient(90deg, #fbbf24, #4a7cdb, #3b82f6, #06b6d4, #34d399)" }} />

        <div className="max-w-md mx-auto px-4 py-2 text-center relative z-10 flex flex-col items-center w-full overflow-hidden" style={{ maxHeight: "100dvh" }}>

          {/* Song title pill */}
          <div className="mb-2 px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(74,124,219,0.25)", color: "#4a7cdb" }}>
            {songTitle}
          </div>

          {/* Trophy centered */}
          <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 mx-auto mb-1" style={{ animation: "bunnyBounce 2s ease-in-out infinite" }}>
            <Image
              src="/images/trophy.png"
              alt="Trophy"
              width={224}
              height={224}
              className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(234,179,8,0.6)]"
            />
            {/* Grade overlaid inside the trophy cup */}
            <div className="absolute top-[18%] left-1/2 -translate-x-1/2 flex items-center justify-center">
              <span className="text-4xl md:text-5xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" style={{ color: "#1a1a1a", textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}>
                {grade}
              </span>
            </div>
            {/* WINNER text on the plaque */}
            <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2">
              <span className="text-sm md:text-base font-black text-yellow-900 tracking-wider uppercase" style={{ textShadow: "0 1px 1px rgba(255,255,255,0.3)" }}>
                WINNER
              </span>
            </div>
          </div>

          {/* Encouraging message for F grade */}
          {grade === "F" && (
            <p className="text-center text-sm font-black mb-1" style={{ color: "#4a7cdb" }}>You'll get there! 💪</p>
          )}

          {/* Stats row - frosted glass cards */}
          <div className="flex gap-2 w-full mb-2">
            <div className="flex-1 rounded-2xl px-3 py-2" style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(74,124,219,0.2)" }}>
              <div className="flex flex-col items-center gap-0">
                <span className="text-lg">🔥</span>
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Flow</span>
                <span className="font-black text-gray-800 text-xl">{maxCombo}</span>
              </div>
            </div>
            <div className="flex-1 rounded-2xl px-3 py-2" style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(74,124,219,0.2)" }}>
              <div className="flex flex-col items-center gap-0">
                <span className="text-lg">💰</span>
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Bank</span>
                <span className="font-black text-gray-800 text-xl">{score}</span>
              </div>
            </div>
          </div>

          {/* Recall Test Scores */}
          {recallScores.length > 0 && (
            <div className="w-full mb-4 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(74,124,219,0.2)" }}>
              <div className="flex items-center gap-2 mb-2 justify-center">
                <span className="text-lg">🐰</span>
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Recall Test</span>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                {recallScores.map((rs, i) => (
                  <div key={i} className="flex flex-col items-center rounded-xl px-3 py-2" style={{ background: "rgba(74,124,219,0.08)", minWidth: 80 }}>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{rs.label}</span>
                    <span className="font-black text-gray-800 text-xl">{rs.score}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200/50 flex justify-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Total</span>
                <span className="font-black text-gray-800">{recallScores.reduce((sum, rs) => sum + rs.score, 0)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2 w-full mb-2">
            {/* Play Again */}
            <button
              onClick={resetGame}
              className="w-full py-3 rounded-full font-black text-base text-white transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "#4a7cdb", boxShadow: "0 4px 14px rgba(74,124,219,0.35)" }}
            >
              <span style={{ display: "inline-block", animation: "btnBounce 0.7s ease-in-out infinite" }}>🥕</span> Play Again!
            </button>

            {/* Challenge a Friend */}
            <button
              onClick={handleChallenge}
              className="w-full py-3 rounded-full font-black text-base text-white transition-all active:scale-95 flex items-center justify-center gap-2"
              style={linkCopied
                ? { background: "#16a34a", boxShadow: "0 4px 14px rgba(22,163,74,0.35)" }
                : { background: "#4a7cdb", boxShadow: "0 4px 14px rgba(74,124,219,0.35)" }
              }
            >
              <span style={{ display: "inline-block", animation: "btnBounce 0.9s ease-in-out infinite 0.3s" }}>{linkCopied ? "✅" : "⚔️"}</span>
              {linkCopied ? "Link Copied!" : "Challenge a Friend"}
            </button>
            <p className="text-center text-xs font-bold -mt-1" style={{ color: "#d97706" }}>Win and earn 2x points!</p>

            {/* Back / Next Song row */}
            <div className="flex gap-2 w-full">
              <button
                onClick={onBack}
                className="flex-1 py-3 rounded-full font-bold text-gray-600 text-sm transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(74,124,219,0.25)" }}
              >
                ← Songs
              </button>
              {onNextSong && (
                <button
                  onClick={onNextSong}
                  className="flex-1 py-3 rounded-full font-black text-white text-sm transition-all active:scale-95"
                  style={{ background: "#4a7cdb", boxShadow: "0 4px 14px rgba(74,124,219,0.35)" }}
                >
                  Next Song →
                </button>
              )}
            </div>
          </div>

          {/* Super Bunny below buttons */}
          <div className="relative flex flex-col items-center">
            <div className="relative w-14 h-14 md:w-20 md:h-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/super-bunny-heart.gif"
                alt="HablaBeat Bunny"
                className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(74,124,219,0.35)]"
              />
            </div>
            <p className="text-gray-400 text-xs italic mt-1">
              {showTranslations ? "Blue Bunny celebrates your victory!" : "¡Conejito Azul celebra tu victoria!"}
            </p>
          </div>
        </div>

        {/* End screen animations */}
        <style jsx>{`
          @keyframes endCoinFall {
            0% { transform: translateY(30vh) scale(0.8); opacity: 0; }
            10% { opacity: 0; }
            15% { opacity: 0.85; transform: translateY(40vh) scale(1); }
            60% { opacity: 0.8; transform: translateY(70vh) scale(1.02); }
            90% { opacity: 0.5; }
            100% { transform: translateY(115vh) scale(0.95); opacity: 0; }
          }
          @keyframes endCarrotFall {
            0% { transform: translateY(25vh) rotate(var(--r)) scale(0.8); opacity: 0; }
            10% { opacity: 0; }
            15% { opacity: 0.85; transform: translateY(35vh) rotate(var(--r)) scale(1); }
            60% { opacity: 0.8; transform: translateY(65vh) rotate(calc(var(--r) + 180deg)) scale(1); }
            90% { opacity: 0.5; }
            100% { transform: translateY(115vh) rotate(calc(var(--r) + 360deg)) scale(0.9); opacity: 0; }
          }
          @keyframes bunnyBounce {
            0%, 100% { transform: translateY(0) scale(1); }
            25% { transform: translateY(-12px) scale(1.03); }
            50% { transform: translateY(0) scale(1); }
            75% { transform: translateY(-8px) scale(1.02); }
          }
          @keyframes btnBounce {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
          }
        `}</style>
      </div>
    )
  }

  // PLAYING STATE

  // Theme backgrounds
  const THEME_BG: Record<string, string> = {
    "theme-default":  `url(/images/backgrounds/song-${songNumber}.jpg) center/cover no-repeat fixed`,
    "theme-galaxy":   "linear-gradient(135deg, #0f0520 0%, #1e1b4b 50%, #312e81 100%)",
    "theme-cyber":    "linear-gradient(135deg, #0a0a1a 0%, #001a33 50%, #003355 100%)",
    "theme-sunset":   "linear-gradient(135deg, #ff6b35 0%, #f7c59f 40%, #ffe0cc 100%)",
    "theme-aurora":   "linear-gradient(135deg, #001a00 0%, #004d1a 30%, #002244 60%, #1a0033 100%)",
    "theme-shadow":   "linear-gradient(135deg, #0a0000 0%, #1a0000 40%, #2d0a0a 100%)",
    "theme-cloud":    "linear-gradient(135deg, #c9e8ff 0%, #e8f4ff 40%, #fff3e8 100%)",
    "theme-gold":     "linear-gradient(135deg, #1a1200 0%, #4a3800 40%, #c9a227 100%)",
    "theme-anime":    "linear-gradient(135deg, #ffe0f0 0%, #e0d4ff 50%, #c8e8ff 100%)",
  }

  // Pointer arrow SVGs — driven by registry (getPointer falls back to carrot)
  const activePointerConfig = getPointer(activePointer)
  const activeSvgs = activePointerConfig.svgs
  const gameBg = THEME_BG[activeTheme] ?? THEME_BG["theme-default"]

  return (
    <div className="h-[100dvh] text-white relative" style={{ background: gameBg, backgroundColor: "#1a0a2e" }}>
      {/* Gamepad debug overlay — moved to top bar next to gear button on desktop */}
      {/* Simple pause indicator (no loadout) */}
      {isPaused && !showLoadout && tutorialStep >= 5 && (
        <div className="absolute inset-0 z-[998] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={togglePause}>
          <div className="text-center" onClick={e => e.stopPropagation()}>
            <div className="text-6xl mb-3">⏸️</div>
            <p className="text-white text-2xl font-black">Paused</p>
            <p className="text-white/60 mt-1 text-sm mb-4">Tap outside to resume</p>
          </div>
        </div>
      )}

      {/* Loadout overlay — shown when gear button tapped */}
      {showLoadout && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }} onClick={() => { setShowLoadout(false); togglePause() }}>
          <div
            className="w-full max-w-md flex flex-col rounded-3xl overflow-hidden mx-4"
            style={{
              background: "linear-gradient(180deg, #1a0d2e 0%, #0f0520 100%)",
              border: "1.5px solid rgba(168,85,247,0.35)",
              boxShadow: "0 0 60px rgba(168,85,247,0.25), 0 8px 40px rgba(0,0,0,0.7)",
              maxHeight: "80dvh",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <p className="text-white text-xl font-black">⚙️ Arrows</p>
              <button
                onClick={() => { setShowLoadout(false); togglePause() }}
                className="px-4 py-2 rounded-full font-black text-white text-sm active:scale-90 transition-all"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 14px rgba(34,197,94,0.4)" }}
              >▶ Resume</button>
            </div>

            {/* Items grid */}
            <div className="px-4 pb-6">
              <div className="grid grid-cols-3 gap-2">
                {GAME_CATALOG.filter(i => i.category === "pointer").map((item) => {
                  const isActive = activePointer === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onEquipPointer?.(item.id) }}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all active:scale-95"
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, rgba(168,85,247,0.45), rgba(99,102,241,0.45))"
                          : "rgba(255,255,255,0.08)",
                        border: isActive ? "2px solid rgba(168,85,247,0.9)" : "1.5px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      <span style={{ fontSize: "28px" }}>{item.emoji}</span>
                      <span className="text-white text-[11px] font-bold text-center leading-tight">{item.name}</span>
                      {isActive && <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(134,239,172,0.25)", color: "#86efac" }}>✓ Active</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Encouragement overlay - centered on screen for maximum impact */}
      {encouragement && (
        <div className="absolute inset-0 flex flex-col items-center pointer-events-none z-40" style={{ paddingTop: "3%" }}>
          {/* English translation above */}
          <div
            className="text-white/70 text-lg md:text-2xl lg:text-3xl font-bold"
            style={{
              textShadow: "2px 2px 4px rgba(0,0,0,0.9)",
              animation: "streakBannerIn 0.4s ease-out",
              fontFamily: "'Impact','Arial Black',sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            {encouragement.english}
          </div>
          {/* Spanish phrase */}
          <div
            className={`${encouragement.color} text-5xl md:text-7xl lg:text-8xl font-black px-8 py-2`}
            style={{
              textShadow: "3px 3px 6px rgba(0,0,0,0.9), 0 0 30px currentColor, 0 0 60px currentColor",
              animation: "streakBannerIn 0.5s ease-out, streakGlow 1.5s ease-in-out 0.5s infinite, streakShake 0.6s ease-in-out 0.5s",
              letterSpacing: "0.02em",
              fontFamily: "'Impact','Arial Black',sans-serif",
            }}
          >
            {encouragement.text}
          </div>
          {/* Combo number below the text */}
          <div style={{ animation: "streakBannerIn 0.6s ease-out 0.15s both", marginTop: "4px" }}>
            <div className="text-white/80 text-xl md:text-2xl font-black text-center" style={{ letterSpacing: "0.2em", fontFamily: "'Impact','Arial Black',sans-serif" }}>
              🔥 {combo} COMBO 🔥
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg md:max-w-none mx-auto h-full flex flex-col">
        {/* Top bar: back arrow + country + loadout button */}
        <div className="flex items-center justify-between p-1 px-2 flex-shrink-0">
          <button onClick={onBack} className="text-white bg-black/40 rounded-full p-1.5 active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* Country name */}
          <div className="px-3 py-1 rounded-full text-xs font-bold text-white/70" style={{ background: "rgba(0,0,0,0.4)" }}>
            {({1:"Mexico",2:"Mexico",3:"Mexico",4:"Guatemala",5:"Guatemala",6:"El Salvador",7:"El Salvador",8:"Honduras",9:"Honduras",10:"Honduras",11:"Nicaragua",12:"Nicaragua",13:"Nicaragua",14:"Costa Rica",15:"Costa Rica",16:"Panama",17:"Panama",18:"Puerto Rico",19:"Puerto Rico",20:"Dominican Republic",21:"Cuba",22:"Cuba",23:"Cuba",24:"Colombia",25:"Colombia",26:"Colombia",27:"Colombia",28:"Venezuela",29:"Venezuela",30:"Venezuela",31:"Ecuador",32:"Ecuador",33:"Ecuador",34:"Peru",35:"Peru",36:"Peru",37:"Peru",38:"Bolivia",39:"Bolivia",40:"Bolivia",41:"Paraguay",42:"Paraguay",43:"Uruguay",44:"Uruguay",45:"Chile",46:"Chile",47:"Argentina",48:"Argentina",49:"Argentina",50:"Argentina"} as Record<number,string>)[songNumber] ?? "Latin America"}
          </div>

          <div className="flex items-center gap-2">
            {/* Gamepad status — desktop only */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs" style={{
              background: "rgba(0,0,0,0.7)",
              color: padDebug ? "#4ade80" : (padConnected ? "#4ade80" : "#f87171"),
              border: `1.5px solid ${padDebug ? "#4ade80" : (padConnected ? "#4ade80" : "#f87171")}`,
              whiteSpace: "nowrap",
            }}>
              {padDebug || (padConnected ? "🎮 PAD" : "🎮 NO PAD")}
            </div>
            {/* Gear button — tap to open loadout panel */}
            <button
              onClick={() => { setShowLoadout(true); if (!isPaused) togglePause() }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-white text-sm active:scale-90 transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(168,85,247,0.85), rgba(99,102,241,0.85))",
                border: "1.5px solid rgba(255,255,255,0.4)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 12px rgba(168,85,247,0.5)",
              }}
            >
              <span style={{ fontSize: "16px" }}>{GAME_CATALOG.find(i => i.id === activePointer)?.emoji ?? "🥕"}</span>
              <span style={{ fontSize: "13px" }}>⚙️</span>
            </button>
          </div>
        </div>

        {/* Game Area - lanes extend to edges (no rounded border, no top/bottom lines) */}
        <div
          ref={containerRef}
          className="relative overflow-hidden flex-1"
          style={{ perspective: "800px" }}
        >
          {/* Lanes - extend full height, no top/bottom borders */}
          <div className="absolute inset-0 flex">
            {[0, 1, 2, 3].map((lane) => (
              <div key={lane} className="flex-1 relative" data-ddr-lane={lane}>
                <div className="ddr-flash absolute inset-0 opacity-0 transition-opacity duration-300" style={{ backgroundColor: LANE_HEX[lane] }} />
                <div className="ddr-hit-zone absolute left-1/2 -translate-x-1/2 transition-all duration-150" style={{ bottom: "1%", width: "min(95%, 280px)", aspectRatio: "1", border: "none", outline: "none", background: "none" }} />
                {/* Target arrow — bold triangle with glow */}
                <div className="ddr-arrow absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-100" style={{ bottom: "2%", width: "min(70%, 90px)", aspectRatio: "1" }}>
                  <svg viewBox="0 0 48 48" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <filter id={`glow-${lane}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.6)" />
                        <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={LANE_HEX[lane]} floodOpacity="0.4" />
                      </filter>
                    </defs>
                    <g transform={`rotate(${[270, 180, 0, 90][lane]}, 24, 24)`} filter={`url(#glow-${lane})`}>
                      <polygon points="24,8 40,32 8,32" fill={LANE_HEX[lane]} strokeLinejoin="round" />
                    </g>
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Fire edge glow at high combos */}
          {combo >= 10 && (
            <div className="absolute inset-0 pointer-events-none z-[4]" style={{
              boxShadow: combo >= 30
                ? "inset 0 0 80px rgba(255,50,0,0.35), inset 0 0 160px rgba(255,100,0,0.15)"
                : combo >= 20
                ? "inset 0 0 60px rgba(255,80,0,0.25), inset 0 0 120px rgba(255,120,0,0.10)"
                : "inset 0 0 40px rgba(255,120,30,0.18), inset 0 0 80px rgba(255,150,50,0.08)",
              transition: "box-shadow 0.5s ease",
              animation: combo >= 20 ? "fireEdgePulse 1.2s ease-in-out infinite" : "none",
            }} />
          )}

          {/* Side fire emitters at 15+ combo */}
          {combo >= 15 && (
            <>
              <div className="absolute left-0 bottom-0 w-8 pointer-events-none z-[4]" style={{
                height: combo >= 30 ? "60%" : combo >= 20 ? "40%" : "25%",
                background: "linear-gradient(to top, rgba(255,80,0,0.4), rgba(255,150,0,0.15), transparent)",
                animation: "fireFlicker 0.6s ease-in-out infinite alternate",
                transition: "height 0.5s ease",
              }} />
              <div className="absolute right-0 bottom-0 w-8 pointer-events-none z-[4]" style={{
                height: combo >= 30 ? "60%" : combo >= 20 ? "40%" : "25%",
                background: "linear-gradient(to top, rgba(255,80,0,0.4), rgba(255,150,0,0.15), transparent)",
                animation: "fireFlicker 0.6s ease-in-out 0.3s infinite alternate",
                transition: "height 0.5s ease",
              }} />
            </>
          )}

          {/* Dashed tap line — behind arrows at their vertical center */}
          <div
            className="absolute left-0 right-0 pointer-events-none z-[1]"
            style={{
              bottom: "calc(2% + 45px)",
              height: "2px",
              background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 12px, transparent 12px, transparent 22px)",
              boxShadow: "0 0 6px rgba(255,255,255,0.25)",
            }}
          />

          {/* Flow counter centered behind bubbles — intensifies with combo */}
          {combo >= 2 && (() => {
            const tier = combo >= 30 ? 4 : combo >= 20 ? 3 : combo >= 10 ? 2 : combo >= 5 ? 1 : 0
            const numColor = [
              "rgba(255,255,255,0.40)",  // 2-4: calm white
              "rgba(255,200,100,0.55)",  // 5-9: warm amber
              "rgba(255,140,50,0.70)",   // 10-19: hot orange
              "rgba(255,80,30,0.85)",    // 20-29: fire red-orange
              "rgba(255,50,50,0.95)",    // 30+: blazing red
            ][tier]
            const labelColor = [
              "rgba(255,255,255,0.45)",
              "rgba(255,200,100,0.60)",
              "rgba(255,140,50,0.75)",
              "rgba(255,80,30,0.85)",
              "rgba(255,50,50,0.95)",
            ][tier]
            const glow = [
              "0 0 60px rgba(255,255,255,0.25), 0 4px 8px rgba(0,0,0,0.5)",
              "0 0 60px rgba(255,180,50,0.35), 0 4px 8px rgba(0,0,0,0.5)",
              "0 0 80px rgba(255,120,20,0.50), 0 0 30px rgba(255,80,0,0.3), 0 4px 8px rgba(0,0,0,0.5)",
              "0 0 100px rgba(255,60,10,0.60), 0 0 50px rgba(255,40,0,0.4), 0 4px 8px rgba(0,0,0,0.5)",
              "0 0 120px rgba(255,30,0,0.70), 0 0 60px rgba(255,0,0,0.5), 0 0 30px rgba(255,200,0,0.3), 0 4px 8px rgba(0,0,0,0.5)",
            ][tier]
            const scaleVal = [1, 1.02, 1.06, 1.1, 1.15][tier]
            const fireLabel = tier >= 2 ? "🔥 flow 🔥" : "flow"
            return (
              <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-[5]" style={{ paddingTop: "8%" }}>
                <div className="text-center" style={{
                  transform: `scale(${scaleVal})`,
                  transition: "transform 0.4s ease",
                  animation: tier >= 3 ? "flowPulse 0.8s ease-in-out infinite" : "none",
                }}>
                  <div className="text-8xl md:text-9xl font-black" style={{
                    color: numColor,
                    textShadow: glow,
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    letterSpacing: "-2px",
                    transition: "color 0.4s ease, text-shadow 0.4s ease",
                  }}>
                    {combo}
                  </div>
                  <div className="text-2xl md:text-3xl font-black -mt-3 tracking-[0.3em] uppercase" style={{
                    color: labelColor,
                    textShadow: `0 0 30px ${labelColor}, 0 2px 4px rgba(0,0,0,0.5)`,
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    transition: "color 0.4s ease",
                  }}>
                    {fireLabel}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Falling notes rendered here */}
          <div ref={fallingRef} className="absolute inset-0 pointer-events-none" style={{ transformStyle: "preserve-3d" }} />

          {/* Tutorial overlay — shown at start before song plays */}
          {tutorialStep < 5 && (() => {
            const TUT_COLORS = ["#22c55e", "#ef4444", "#facc15", "#a855f7"]
            const TUT_WORDS = ["LEFT", "RIGHT", "UP", "DOWN"]
            const TUT_SPANISH = ["Izquierda", "Derecha", "Arriba", "Abajo"]
            const currentLane = tutorialStep < 4 ? tutorialLanes[tutorialStep] : -1
            const currentLabel = tutorialStep < 4 ? tutorialLabels[tutorialStep] : ""
            return (
              <div className="absolute inset-0 z-[50]"
                onTouchStart={(e) => {
                  if (tutorialStep >= 4) return
                  const x = e.touches[0].clientX
                  const y = e.touches[0].clientY
                  const w = window.innerWidth
                  const h = window.innerHeight
                  // Only accept taps in the bottom hit zone (bottom 20% of screen)
                  if (y < h * 0.80) return
                  const lane = x < w * 0.25 ? 0 : x < w * 0.5 ? 1 : x < w * 0.75 ? 2 : 3
                  handleTutorialHit(lane)
                }}
              >
                {tutorialComplete ? (
                  <div className="absolute inset-0 flex items-center justify-center z-[60]">
                    <div className="flex flex-col items-center gap-4 animate-bounce">
                      <div className="text-5xl md:text-7xl font-black text-white" style={{ textShadow: "0 0 40px rgba(251,191,36,0.8), 0 0 80px rgba(251,191,36,0.4)" }}>
                        ¡Bien Hecho!
                      </div>
                      <div className="text-2xl">🎉🐰🎉</div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Instruction text — top center with background pill */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center z-[60] px-6 py-4 rounded-2xl" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", maxWidth: "90vw" }}>
                      <p className="text-white text-lg md:text-xl font-black mb-1" style={{ textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>
                        🎯 Let&apos;s practice!
                      </p>
                      <p className="text-white/80 text-sm md:text-base font-semibold mb-3">
                        Press the matching arrow key when it reaches the bottom line.<br />
                        <span className="text-white/60 text-xs">(or tap the correct lane on mobile)</span>
                      </p>
                      <p className="text-xl md:text-2xl font-black" style={{ color: TUT_COLORS[currentLane] || "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                        Press {currentLabel}
                      </p>
                    </div>

                    {/* Highlighted hit zone rectangle — shows user where to aim */}
                    <div className="absolute left-0 right-0 z-[52] pointer-events-none" style={{
                      bottom: 0,
                      height: "15%",
                      border: "2px solid rgba(255,255,255,0.6)",
                      borderBottom: "none",
                      borderRadius: "12px 12px 0 0",
                      background: "rgba(255,255,255,0.08)",
                      animation: "tutorialZonePulse 1.5s ease-in-out infinite",
                    }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full px-3 py-1 rounded-t-lg text-xs font-bold text-white/80" style={{ background: "rgba(0,0,0,0.5)" }}>
                        ▼ Hit here ▼
                      </div>
                    </div>

                    {/* Falling tutorial bubble — falls into the actual hit zone */}
                    {currentLane >= 0 && (
                      <div key={`tut-arrow-${tutorialStep}`} className="absolute pointer-events-none" style={{
                        left: `${currentLane * 25}%`,
                        width: "25%",
                        top: "5%",
                        opacity: 0,
                        animation: "tutorialNoteFall 1.8s ease-in infinite",
                        zIndex: 55,
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
                          <div style={{ fontSize: "clamp(11px,2.5vw,15px)", fontWeight: 700, color: "#fde68a", textShadow: "0 1px 4px rgba(0,0,0,0.7)", lineHeight: 1, textAlign: "center", marginBottom: "2px" }}>
                            {TUT_WORDS[currentLane]}
                          </div>
                          <div style={{ fontSize: "clamp(16px,4vw,26px)", fontWeight: 900, color: "#ffffff", textShadow: "0 2px 6px rgba(0,0,0,0.6),0 0 12px rgba(0,0,0,0.3)", lineHeight: 1.2, textAlign: "center", marginBottom: "4px" }}>
                            {TUT_SPANISH[currentLane]}
                          </div>
                          <div style={{ width: "80%", maxWidth: "140px", height: "4px", borderRadius: "2px", background: TUT_COLORS[currentLane], boxShadow: `0 0 8px ${TUT_COLORS[currentLane]}80, 0 0 16px ${TUT_COLORS[currentLane]}40` }} />
                        </div>
                      </div>
                    )}

                    {/* Progress dots — above the hit zone */}
                    <div className="absolute flex gap-3 z-[60]" style={{ bottom: "17%", left: "50%", transform: "translateX(-50%)" }}>
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="w-3 h-3 rounded-full transition-all" style={{
                          background: i < tutorialStep ? "#22c55e" : i === tutorialStep ? TUT_COLORS[tutorialLanes[i]] : "rgba(255,255,255,0.2)",
                          boxShadow: i === tutorialStep ? `0 0 10px ${TUT_COLORS[tutorialLanes[i]]}` : "none",
                        }} />
                      ))}
                    </div>
                  </>
                )}

                <style>{`
                  @keyframes tutorialNoteFall {
                    0% { top: 5%; opacity: 0; transform: translateY(-50%) scale(0.45) perspective(800px) rotateX(35deg); }
                    15% { opacity: 0.6; }
                    50% { opacity: 1; transform: translateY(-50%) scale(0.9) perspective(800px) rotateX(15deg); }
                    85% { opacity: 1; transform: translateY(-50%) scale(1.2) perspective(800px) rotateX(3deg); }
                    92% { top: 86%; opacity: 1; transform: translateY(-50%) scale(1.3) perspective(800px) rotateX(0deg); }
                    100% { top: 86%; opacity: 0; transform: translateY(-50%) scale(1.5) perspective(800px) rotateX(0deg); }
                  }
                  @keyframes tutorialZonePulse {
                    0%, 100% { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); }
                    50% { border-color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.12); }
                  }
                `}</style>
              </div>
            )
          })()}
        </div>

        {/* Bottom bar: Bank, Pause, Time, Best - fatter with larger icons */}
        <div className="flex justify-between items-center bg-black/70 px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-yellow-300 text-xl md:text-2xl">{score}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={togglePause} className="bg-white/10 rounded-full p-2 active:scale-90 transition-all">
              {isPaused ? <Play className="h-5 w-5 text-white" /> : <Pause className="h-5 w-5 text-white" />}
            </button>
            <div className="text-base text-white/70 font-mono">
              <span className="text-white font-bold text-lg">{elapsedTime}</span> / {totalTime}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-orange-300 text-xl md:text-2xl">{maxCombo}</span>
          </div>
        </div>
      </div>

      {/* DDR-specific animations */}
      <style jsx global>{`
        @keyframes beamPulse {
          0%, 100% { opacity: 0.7; box-shadow: 0 0 12px rgba(168,85,247,0.6), 0 0 30px rgba(99,102,241,0.3); }
          50% { opacity: 1; box-shadow: 0 0 20px rgba(168,85,247,0.8), 0 0 50px rgba(99,102,241,0.4), 0 0 80px rgba(168,85,247,0.2); }
        }
        @keyframes ddrJudgmentPop {
          0% { transform: scale(0) translateY(0); opacity: 0; }
          8% { transform: scale(1.8) translateY(0); opacity: 1; }
          18% { transform: scale(1.1) translateY(0); opacity: 1; }
          65% { transform: scale(1.1) translateY(-25px); opacity: 1; }
          80% { transform: scale(1.05) translateY(-35px); opacity: 0.9; }
          100% { transform: scale(0.9) translateY(-55px); opacity: 0; }
        }
        @keyframes ddrEncouragementBounce {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bubbleFloat {
          0%, 100% { transform: translateY(-50%) scale(1); }
          50% { transform: translateY(-50%) scale(1.04); }
        }
        @keyframes linePulse {
          0% { transform: scaleX(1); opacity: 1; }
          50% { transform: scaleX(1.3); opacity: 0.7; }
          100% { transform: scaleX(1.6); opacity: 0; }
        }
        @keyframes coinDrop {
          0% { transform: translateY(0) scale(1.2); opacity: 1; }
          30% { transform: translateY(20px) scale(1); opacity: 1; }
          100% { transform: translateY(80px) scale(0.6) rotate(15deg); opacity: 0; }
        }
        @keyframes flowPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes fireEdgePulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes fireFlicker {
          0% { opacity: 0.5; transform: scaleY(1) scaleX(0.9); }
          100% { opacity: 0.9; transform: scaleY(1.08) scaleX(1.1); }
        }
        @keyframes loadoutModalIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes streakBannerIn {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(2deg); }
          70% { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes streakGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(251,191,36,0.8), 0 0 40px rgba(251,191,36,0.4); }
          50% { text-shadow: 0 0 30px rgba(251,191,36,1), 0 0 60px rgba(251,191,36,0.6), 0 0 90px rgba(234,179,8,0.3); }
        }
        @keyframes streakShake {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-3px) rotate(-1deg); }
          20% { transform: translateX(3px) rotate(1deg); }
          30% { transform: translateX(-3px) rotate(-1deg); }
          40% { transform: translateX(3px) rotate(1deg); }
          50% { transform: translateX(0); }
        }
        ${POINTER_KEYFRAMES}
      `}</style>
    </div>
  )
}
