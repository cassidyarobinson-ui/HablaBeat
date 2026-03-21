"use client"

import { useState } from "react"

// ── World nodes positioned as % of container ──
// Laid out to match a map of the Americas
const MAP_NODES: {
  sectionId: string
  label: string
  country: string
  icon: string
  x: number // % from left
  y: number // % from top
  category: "nouns" | "verbs"
  verbLetter?: string
  verbStyle?: { bg: string; color: string }
}[] = [
  // Nouns — North, Central America & Caribbean
  { sectionId: "alphabet-vowels", label: "Alphabet", country: "Mexico", icon: "📚", x: 18, y: 6, category: "nouns" },
  { sectionId: "foods", label: "Food", country: "Cuba", icon: "🍎", x: 36, y: 8, category: "nouns" },
  { sectionId: "colors-feelings", label: "Feelings", country: "Caribbean", icon: "🌈", x: 50, y: 12, category: "nouns" },
  { sectionId: "body-world", label: "Body", country: "Guatemala", icon: "🧍", x: 20, y: 18, category: "nouns" },
  { sectionId: "pets-syllables", label: "Pet", country: "Honduras", icon: "🐕", x: 32, y: 17, category: "nouns" },
  { sectionId: "roles-world", label: "Roles", country: "El Salvador", icon: "👨‍👩‍👧", x: 22, y: 27, category: "nouns" },
  { sectionId: "places", label: "Travel", country: "Nicaragua", icon: "🏠", x: 34, y: 26, category: "nouns" },
  { sectionId: "numbers", label: "Numbers", country: "Costa Rica", icon: "🔢", x: 27, y: 35, category: "nouns" },
  { sectionId: "numbers-time", label: "Time", country: "Panama", icon: "🕐", x: 38, y: 37, category: "nouns" },
  // Verbs — South America
  { sectionId: "ar-verbs", label: "AR Verbs", country: "Colombia", icon: "", x: 42, y: 43, category: "verbs", verbLetter: "A", verbStyle: { bg: "linear-gradient(135deg,#1e1b4b,#312e81)", color: "#fbbf24" } },
  { sectionId: "er-verbs", label: "ER Verbs", country: "Venezuela", icon: "", x: 55, y: 40, category: "verbs", verbLetter: "E", verbStyle: { bg: "linear-gradient(135deg,#164e63,#0e7490)", color: "#6ee7b7" } },
  { sectionId: "ir-verbs", label: "IR Verbs", country: "Ecuador", icon: "", x: 35, y: 50, category: "verbs", verbLetter: "I", verbStyle: { bg: "linear-gradient(135deg,#4a1942,#831843)", color: "#f9a8d4" } },
  { sectionId: "preterite", label: "Quick Past", country: "Peru", icon: "⏪", x: 38, y: 58, category: "verbs" },
  { sectionId: "imperfecto", label: "Long Past", country: "Bolivia", icon: "🔄", x: 48, y: 64, category: "verbs" },
  { sectionId: "futuro", label: "Future", country: "Paraguay", icon: "⏩", x: 55, y: 72, category: "verbs" },
  { sectionId: "conditional", label: "Conditional", country: "Uruguay", icon: "🤔", x: 57, y: 82, category: "verbs" },
  { sectionId: "pronouns", label: "Pronoun", country: "Chile", icon: "👥", x: 40, y: 84, category: "verbs" },
  { sectionId: "advanced", label: "Advanced", country: "Argentina", icon: "🎓", x: 50, y: 91, category: "verbs" },
]

interface AmericasMapProps {
  onSelectSection: (sectionId: string, originX: string, originY: string) => void
  isSectionBadgeUnlocked: (section: { id: string }) => boolean
}

export default function AmericasMap({ onSelectSection, isSectionBadgeUnlocked }: AmericasMapProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: "linear-gradient(170deg, #e8ecf2 0%, #dfe5ef 30%, #d8dfe9 60%, #e2e7f0 100%)",
      }}
    >
      {/* Faint continent shapes as CSS blobs */}
      {/* North America */}
      <div className="absolute" style={{
        left: "5%", top: "-5%", width: "40%", height: "50%",
        background: "radial-gradient(ellipse at 60% 70%, rgba(200,210,225,0.7) 0%, transparent 70%)",
        borderRadius: "40% 60% 50% 50%",
      }} />
      {/* Central America */}
      <div className="absolute" style={{
        left: "15%", top: "25%", width: "25%", height: "30%",
        background: "radial-gradient(ellipse at 50% 40%, rgba(200,210,225,0.5) 0%, transparent 65%)",
        borderRadius: "30% 50% 40% 60%",
      }} />
      {/* South America */}
      <div className="absolute" style={{
        left: "25%", top: "40%", width: "35%", height: "60%",
        background: "radial-gradient(ellipse at 45% 35%, rgba(195,205,220,0.6) 0%, transparent 65%)",
        borderRadius: "50% 60% 40% 35%",
      }} />

      {/* Trail line SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
        <polyline
          points={MAP_NODES.map(n => `${n.x}%,${n.y}%`).join(" ")}
          fill="none"
          stroke="rgba(100, 140, 220, 0.2)"
          strokeWidth="2"
          strokeDasharray="8 6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Markers */}
      {MAP_NODES.map((node) => {
        const isHovered = hoveredNode === node.sectionId
        const isUnlocked = isSectionBadgeUnlocked({ id: node.sectionId })
        const isVerb = node.category === "verbs"

        return (
          <div
            key={node.sectionId}
            className="absolute flex flex-col items-center gap-0.5"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: `translate(-50%, -50%) ${isHovered ? "scale(1.2)" : "scale(1)"}`,
              transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s",
              filter: isHovered ? "drop-shadow(0 0 16px rgba(74,124,219,0.5))" : "none",
              zIndex: isHovered ? 100 : 10,
              cursor: "pointer",
            }}
            onMouseEnter={() => setHoveredNode(node.sectionId)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => onSelectSection(node.sectionId, `${node.x}%`, `${node.y}%`)}
          >
            {/* Circle */}
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 42, height: 42, borderRadius: "50%",
                background: isVerb
                  ? "linear-gradient(180deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)"
                  : "linear-gradient(180deg, #5b9be6 0%, #4a7cdb 50%, #3d6bc4 100%)",
                border: "3px solid rgba(255,255,255,0.9)",
                boxShadow: isHovered
                  ? "0 4px 20px rgba(74,124,219,0.4), 0 0 0 2px rgba(74,124,219,0.2)"
                  : "0 3px 10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)",
                position: "relative",
              }}
            >
              {node.verbLetter ? (
                <span style={{ fontSize: 18, fontWeight: 900, color: node.verbStyle?.color }}>
                  {node.verbLetter}
                </span>
              ) : (
                <span style={{ fontSize: 20, lineHeight: 1 }}>{node.icon}</span>
              )}
              {isUnlocked && (
                <div style={{
                  position: "absolute", top: -2, right: -2,
                  width: 12, height: 12, background: "#22c55e",
                  borderRadius: "50%", border: "2px solid white",
                }} />
              )}
            </div>

            {/* Label */}
            <div style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(6px)",
              borderRadius: 6, padding: "2px 7px",
              fontSize: 10, fontWeight: 700, color: "#1e293b",
              whiteSpace: "nowrap", textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.06)",
              lineHeight: 1.3,
            }}>
              {node.label}
              <br />
              <span style={{ fontWeight: 500, fontSize: 8, color: "#94a3b8" }}>
                {node.country}
              </span>
            </div>
          </div>
        )
      })}

      {/* NOUNS / VERBS labels */}
      <div className="absolute pointer-events-none" style={{ left: 16, top: 10, zIndex: 20 }}>
        <div className="flex items-center gap-2 mb-0.5">
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4a7cdb" }} />
          <span className="font-black text-xs tracking-wider" style={{ color: "#4a7cdb" }}>NOUNS</span>
        </div>
        <span className="text-[9px] font-medium ml-4" style={{ color: "#94a3b8" }}>North &amp; Central America</span>
      </div>
      <div className="absolute pointer-events-none" style={{ left: 16, bottom: 14, zIndex: 20 }}>
        <div className="flex items-center gap-2 mb-0.5">
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }} />
          <span className="font-black text-xs tracking-wider" style={{ color: "#7c3aed" }}>VERBS</span>
        </div>
        <span className="text-[9px] font-medium ml-4" style={{ color: "#94a3b8" }}>South America</span>
      </div>
    </div>
  )
}
