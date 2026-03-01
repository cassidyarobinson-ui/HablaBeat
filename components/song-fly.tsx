"use client"
// SongFly — Per-song fly game launcher
// Looks up the song number in SONG_FLY_DATA and routes to AlphabetFly or VocabFly

import { SONG_FLY_DATA } from "@/lib/song-fly-data"
import VocabFly from "./vocab-fly"
import AlphabetFly from "./alphabet-fly"

interface Props {
  songNumber: number
  coins: number
  onCoinsChange: (delta: number) => void
  onClose: () => void
  onGameEnd?: (score: number) => void
  onChallenge?: (score: number) => void
}

export default function SongFly({ songNumber, coins, onCoinsChange, onClose, onGameEnd, onChallenge }: Props) {
  const data = SONG_FLY_DATA[songNumber]
  if (!data) return null

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
    />
  )
}
