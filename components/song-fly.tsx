"use client"
// SongFly — Per-song fly game launcher
// Looks up the song number in SONG_FLY_DATA and routes to AlphabetFly or VocabFly

import { SONG_FLY_DATA } from "@/lib/song-fly-data"
import { getCountryBgQuery } from "@/lib/country-bg-queries"
import VocabFly from "./vocab-fly"
import AlphabetFly from "./alphabet-fly"

// Maps song number to country for background-video lookup. Mirrors
// SONG_COUNTRY_MAP in app/page.tsx.
const SONG_TO_COUNTRY: Record<number, string> = {
  1: "Mexico", 2: "Mexico", 3: "Mexico",
  4: "Guatemala", 5: "Guatemala",
  6: "El Salvador", 7: "El Salvador",
  8: "Honduras", 9: "Honduras", 10: "Honduras",
  11: "Nicaragua", 12: "Nicaragua", 13: "Nicaragua",
  14: "Costa Rica", 15: "Costa Rica",
  16: "Panama", 17: "Panama",
  18: "Puerto Rico", 19: "Puerto Rico", 20: "Dominican Republic",
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

interface Props {
  songNumber: number
  coins: number
  onCoinsChange: (delta: number) => void
  onClose: () => void
  onGameEnd?: (score: number) => void
  onChallenge?: (score: number) => void
  activePointer?: string
  storeOwned?: string[]
  onEquipPointer?: (id: string) => void
}

export default function SongFly({ songNumber, coins, onCoinsChange, onClose, onGameEnd, onChallenge, activePointer, storeOwned, onEquipPointer }: Props) {
  const data = SONG_FLY_DATA[songNumber]
  if (!data) return null

  const country = SONG_TO_COUNTRY[songNumber]
  const bgVideoQuery = country ? getCountryBgQuery(country) : undefined

  if (data.isAlphabet) {
    return (
      <AlphabetFly
        sectionTitle={data.title}
        coins={coins}
        onCoinsChange={onCoinsChange}
        onClose={onClose}
        songFilter={data.alphabetFilter}
        onGameEnd={onGameEnd}
        onChallenge={onChallenge}
        activePointer={activePointer}
        storeOwned={storeOwned}
        onEquipPointer={onEquipPointer}
      />
    )
  }

  return (
    <VocabFly
      title={data.title}
      icon={data.icon}
      phase1={data.phaseConfig}
      accentColor={data.accentColor}
      coins={coins}
      onCoinsChange={onCoinsChange}
      onClose={onClose}
      speechEnabled={false}
      onGameEnd={onGameEnd}
      onChallenge={onChallenge}
      activePointer={activePointer}
      storeOwned={storeOwned}
      onEquipPointer={onEquipPointer}
      bgVideoQuery={bgVideoQuery}
    />
  )
}
