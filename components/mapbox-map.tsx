"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useGamepad, type PadButton } from "@/hooks/use-gamepad"

// ── World nodes with real geographic coordinates ──
const MAP_NODES: {
  sectionId: string
  label: string
  country: string
  icon: string
  lat: number
  lng: number
  category: "nouns" | "verbs"
  verbLetter?: string
  verbStyle?: { bg: string; color: string }
}[] = [
  // Nouns — North, Central America & Caribbean
  { sectionId: "alphabet-vowels", label: "Alphabet", country: "Mexico", icon: "📚", lat: 23.6, lng: -102.5, category: "nouns" },
  { sectionId: "foods", label: "Food", country: "Cuba", icon: "🍎", lat: 22.0, lng: -79.5, category: "nouns" },
  { sectionId: "colors-feelings", label: "Feelings", country: "Caribbean", icon: "🌈", lat: 18.7, lng: -70.2, category: "nouns" },
  { sectionId: "body-world", label: "Body", country: "Guatemala", icon: "🧍", lat: 15.5, lng: -90.3, category: "nouns" },
  { sectionId: "pets-syllables", label: "Pet", country: "Honduras", icon: "🐕", lat: 14.8, lng: -87.2, category: "nouns" },
  { sectionId: "roles-world", label: "Roles", country: "El Salvador", icon: "👨‍👩‍👧", lat: 13.7, lng: -89.2, category: "nouns" },
  { sectionId: "places", label: "Travel", country: "Nicaragua", icon: "🏠", lat: 12.8, lng: -85.2, category: "nouns" },
  { sectionId: "numbers", label: "Numbers", country: "Costa Rica", icon: "🔢", lat: 10.0, lng: -84.1, category: "nouns" },
  { sectionId: "numbers-time", label: "Time", country: "Panama", icon: "🕐", lat: 8.5, lng: -80.0, category: "nouns" },
  // Verbs — South America
  { sectionId: "ar-verbs", label: "AR Verbs", country: "Colombia", icon: "", lat: 4.6, lng: -74.1, category: "verbs", verbLetter: "A", verbStyle: { bg: "linear-gradient(135deg,#1e1b4b,#312e81)", color: "#fbbf24" } },
  { sectionId: "er-verbs", label: "ER Verbs", country: "Venezuela", icon: "", lat: 5.5, lng: -66.9, category: "verbs", verbLetter: "E", verbStyle: { bg: "linear-gradient(135deg,#164e63,#0e7490)", color: "#6ee7b7" } },
  { sectionId: "ir-verbs", label: "IR Verbs", country: "Ecuador", icon: "", lat: -1.8, lng: -78.2, category: "verbs", verbLetter: "I", verbStyle: { bg: "linear-gradient(135deg,#4a1942,#831843)", color: "#f9a8d4" } },
  { sectionId: "preterite", label: "Quick Past", country: "Peru", icon: "⏪", lat: -12.0, lng: -77.0, category: "verbs" },
  { sectionId: "imperfecto", label: "Long Past", country: "Bolivia", icon: "🔄", lat: -16.5, lng: -68.2, category: "verbs" },
  { sectionId: "futuro", label: "Future", country: "Paraguay", icon: "⏩", lat: -23.4, lng: -58.4, category: "verbs" },
  { sectionId: "conditional", label: "Conditional", country: "Uruguay", icon: "🤔", lat: -34.9, lng: -56.2, category: "verbs" },
  { sectionId: "pronouns", label: "Pronoun", country: "Chile", icon: "👥", lat: -33.4, lng: -70.7, category: "verbs" },
  { sectionId: "advanced", label: "Advanced", country: "Argentina", icon: "🎓", lat: -38.0, lng: -63.6, category: "verbs" },
]

const NOUN_NODES = MAP_NODES.filter(n => n.category === "nouns")
const VERB_NODES = MAP_NODES.filter(n => n.category === "verbs")

interface MapboxMapProps {
  onSelectSection: (sectionId: string, originX: string, originY: string) => void
  isSectionBadgeUnlocked: (section: { id: string }) => boolean
}

// Region presets
const REGIONS = {
  nouns: { center: [-85, 16] as [number, number], zoom: 3.5, label: "🌎 NOUNS", subtitle: "North & Central America" },
  verbs: { center: [-65, -18] as [number, number], zoom: 3.2, label: "🌍 VERBS", subtitle: "South America" },
}

export default function MapboxMap({ onSelectSection, isSectionBadgeUnlocked }: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{ marker: maplibregl.Marker; inner: HTMLDivElement; circle: HTMLDivElement; category: "nouns" | "verbs"; sectionId: string }[]>([])
  const [activeRegion, setActiveRegion] = useState<"nouns" | "verbs">("nouns")
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const activeRegionRef = useRef<"nouns" | "verbs">("nouns")
  const selectedIndexRef = useRef<number>(-1)

  // Keep refs in sync
  activeRegionRef.current = activeRegion
  selectedIndexRef.current = selectedIndex

  const getActiveNodes = useCallback(() => {
    return activeRegionRef.current === "nouns" ? NOUN_NODES : VERB_NODES
  }, [])

  // Highlight selected marker, un-highlight others
  const highlightMarker = useCallback((index: number) => {
    const nodes = getActiveNodes()
    markersRef.current.forEach(({ inner, circle, category, sectionId }) => {
      if (category !== activeRegionRef.current) return
      const nodeIdx = nodes.findIndex(n => n.sectionId === sectionId)
      if (nodeIdx === index) {
        inner.style.transform = "scale(1.5)"
        inner.style.filter = "drop-shadow(0 0 20px rgba(74,124,219,0.6))"
        circle.style.border = "4px solid #fbbf24"
        circle.style.boxShadow = "0 0 24px rgba(251,191,36,0.5), 0 4px 12px rgba(0,0,0,0.2)"
        inner.parentElement!.style.zIndex = "100"
      } else {
        inner.style.transform = "scale(1)"
        inner.style.filter = "none"
        circle.style.border = "3px solid rgba(255,255,255,0.9)"
        circle.style.boxShadow = "0 3px 10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)"
        inner.parentElement!.style.zIndex = "10"
      }
    })
  }, [getActiveNodes])

  const showMarkersForRegion = useCallback((region: "nouns" | "verbs") => {
    markersRef.current.forEach(({ marker, category }) => {
      const el = marker.getElement()
      if (category === region) {
        el.style.display = "block"
        el.style.opacity = "1"
        el.style.pointerEvents = "auto"
      } else {
        el.style.display = "none"
        el.style.opacity = "0"
        el.style.pointerEvents = "none"
      }
    })
  }, [])

  const flyTo = useCallback((region: "nouns" | "verbs") => {
    const map = mapRef.current
    if (!map) return
    setActiveRegion(region)
    activeRegionRef.current = region
    setSelectedIndex(-1)
    selectedIndexRef.current = -1
    showMarkersForRegion(region)
    // Reset all highlights
    markersRef.current.forEach(({ inner, circle }) => {
      inner.style.transform = "scale(1)"
      inner.style.filter = "none"
      circle.style.border = "3px solid rgba(255,255,255,0.9)"
      circle.style.boxShadow = "0 3px 10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)"
      inner.parentElement!.style.zIndex = "10"
    })
    const r = REGIONS[region]
    map.flyTo({ center: r.center, zoom: r.zoom, duration: 1200, essential: true })
  }, [showMarkersForRegion])

  // Dance pad navigation
  const handlePadPress = useCallback((btn: PadButton) => {
    const nodes = getActiveNodes()
    const count = nodes.length

    if (btn === "left") {
      const newIdx = selectedIndexRef.current <= 0 ? count - 1 : selectedIndexRef.current - 1
      setSelectedIndex(newIdx)
      selectedIndexRef.current = newIdx
      highlightMarker(newIdx)
      // Pan map to the selected node
      const node = nodes[newIdx]
      mapRef.current?.flyTo({ center: [node.lng, node.lat], duration: 600, essential: true })
    } else if (btn === "right") {
      const newIdx = selectedIndexRef.current >= count - 1 ? 0 : selectedIndexRef.current + 1
      setSelectedIndex(newIdx)
      selectedIndexRef.current = newIdx
      highlightMarker(newIdx)
      const node = nodes[newIdx]
      mapRef.current?.flyTo({ center: [node.lng, node.lat], duration: 600, essential: true })
    } else if (btn === "up" || btn === "down") {
      // Up/Down toggles between Nouns and Verbs
      const newRegion = activeRegionRef.current === "nouns" ? "verbs" : "nouns"
      flyTo(newRegion)
    } else if (btn === "start") {
      // Select the current marker
      if (selectedIndexRef.current >= 0) {
        const nodes = getActiveNodes()
        const node = nodes[selectedIndexRef.current]
        if (node) {
          const map = mapRef.current
          const point = map?.project([node.lng, node.lat])
          const rect = containerRef.current?.getBoundingClientRect()
          if (point && rect) {
            const pctX = ((point.x / rect.width) * 100).toFixed(1) + "%"
            const pctY = ((point.y / rect.height) * 100).toFixed(1) + "%"
            onSelectSection(node.sectionId, pctX, pctY)
          } else {
            onSelectSection(node.sectionId, "50%", "50%")
          }
        }
      }
    }
  }, [getActiveNodes, highlightMarker, flyTo, onSelectSection])

  useGamepad({ onPress: handlePadPress, enabled: true })

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [-85, 16],
      zoom: 3.5,
      minZoom: 1.5,
      maxZoom: 8,
      pitchWithRotate: false,
      dragRotate: false,
      touchZoomRotate: true,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")

    mapRef.current = map

    map.on("load", () => {
      MAP_NODES.forEach((node) => {
        const isVerb = node.category === "verbs"
        const isUnlocked = isSectionBadgeUnlocked({ id: node.sectionId })

        const el = document.createElement("div")
        el.style.cssText = `cursor: pointer;`

        const inner = document.createElement("div")
        inner.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.25s, box-shadow 0.25s;
        `

        const circle = document.createElement("div")
        circle.style.cssText = `
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${
            isVerb
              ? "linear-gradient(180deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)"
              : "linear-gradient(180deg, #5b9be6 0%, #4a7cdb 50%, #3d6bc4 100%)"
          };
          border: 3px solid rgba(255,255,255,0.9);
          box-shadow: 0 3px 10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04);
          position: relative;
          transition: border 0.2s, box-shadow 0.2s;
        `

        if (node.verbLetter) {
          circle.innerHTML = `<span style="font-size:20px;font-weight:900;color:${node.verbStyle?.color}">${node.verbLetter}</span>`
        } else {
          circle.innerHTML = `<span style="font-size:22px;line-height:1">${node.icon}</span>`
        }

        if (isUnlocked) {
          const badge = document.createElement("div")
          badge.style.cssText = `
            position: absolute; top: -2px; right: -2px;
            width: 12px; height: 12px; background: #22c55e;
            border-radius: 50%; border: 2px solid white;
          `
          circle.appendChild(badge)
        }

        const label = document.createElement("div")
        label.style.cssText = `
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(6px);
          border-radius: 6px;
          padding: 3px 10px;
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
          text-align: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.06);
          font-family: system-ui, -apple-system, sans-serif;
        `
        label.textContent = node.label

        const country = document.createElement("div")
        country.style.cssText = `
          font-size: 9px;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
        `
        country.textContent = node.country

        inner.appendChild(circle)
        inner.appendChild(label)
        inner.appendChild(country)
        el.appendChild(inner)

        // Hover effects — bigger scale
        el.addEventListener("mouseenter", () => {
          inner.style.transform = "scale(1.4)"
          inner.style.filter = "drop-shadow(0 0 20px rgba(74,124,219,0.6))"
          circle.style.border = "4px solid #fbbf24"
          circle.style.boxShadow = "0 0 24px rgba(251,191,36,0.5), 0 4px 12px rgba(0,0,0,0.2)"
          el.style.zIndex = "100"
        })
        el.addEventListener("mouseleave", () => {
          // Only reset if not the pad-selected marker
          const nodes = activeRegionRef.current === "nouns" ? NOUN_NODES : VERB_NODES
          const nodeIdx = nodes.findIndex(n => n.sectionId === node.sectionId)
          if (nodeIdx !== selectedIndexRef.current) {
            inner.style.transform = "scale(1)"
            inner.style.filter = "none"
            circle.style.border = "3px solid rgba(255,255,255,0.9)"
            circle.style.boxShadow = "0 3px 10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)"
            el.style.zIndex = "10"
          }
        })

        // Click handler
        el.addEventListener("click", () => {
          const point = map.project([node.lng, node.lat])
          const rect = containerRef.current?.getBoundingClientRect()
          if (rect) {
            const pctX = ((point.x / rect.width) * 100).toFixed(1) + "%"
            const pctY = ((point.y / rect.height) * 100).toFixed(1) + "%"
            onSelectSection(node.sectionId, pctX, pctY)
          } else {
            onSelectSection(node.sectionId, "50%", "50%")
          }
        })

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([node.lng, node.lat])
          .addTo(map)

        markersRef.current.push({ marker, inner, circle, category: node.category, sectionId: node.sectionId })

        if (isVerb) {
          el.style.display = "none"
          el.style.opacity = "0"
          el.style.pointerEvents = "none"
        }
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative w-full h-full" style={{ minHeight: 400 }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Selected marker name overlay */}
      {selectedIndex >= 0 && (
        <div style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          background: activeRegion === "nouns"
            ? "linear-gradient(135deg, #3b82f6, #2563eb)"
            : "linear-gradient(135deg, #7c3aed, #6d28d9)",
          color: "white",
          padding: "10px 24px",
          borderRadius: 16,
          fontSize: 16,
          fontWeight: 800,
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          zIndex: 10,
          textAlign: "center",
          lineHeight: 1.3,
        }}>
          <div>{(activeRegion === "nouns" ? NOUN_NODES : VERB_NODES)[selectedIndex]?.icon} {(activeRegion === "nouns" ? NOUN_NODES : VERB_NODES)[selectedIndex]?.label}</div>
          <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.8 }}>{(activeRegion === "nouns" ? NOUN_NODES : VERB_NODES)[selectedIndex]?.country}</div>
        </div>
      )}

      {/* Region toggle buttons */}
      <div style={{
        position: "absolute",
        bottom: 70,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 8,
        zIndex: 10,
      }}>
        {(["nouns", "verbs"] as const).map((region) => {
          const r = REGIONS[region]
          const isActive = activeRegion === region
          return (
            <button
              key={region}
              onClick={() => flyTo(region)}
              style={{
                padding: "8px 20px",
                borderRadius: 24,
                border: isActive ? "2px solid white" : "2px solid rgba(255,255,255,0.5)",
                background: isActive
                  ? (region === "nouns"
                    ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                    : "linear-gradient(135deg, #7c3aed, #6d28d9)")
                  : "rgba(255,255,255,0.85)",
                color: isActive ? "white" : "#374151",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: isActive
                  ? "0 4px 14px rgba(0,0,0,0.25)"
                  : "0 2px 8px rgba(0,0,0,0.12)",
                backdropFilter: "blur(8px)",
                transition: "all 0.2s ease",
                fontFamily: "system-ui, -apple-system, sans-serif",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                lineHeight: 1.2,
              }}
            >
              <span>{r.label}</span>
              <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.8 }}>{r.subtitle}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
