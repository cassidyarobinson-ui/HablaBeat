"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

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
  const [activeRegion, setActiveRegion] = useState<"nouns" | "verbs">("nouns")

  const flyTo = (region: "nouns" | "verbs") => {
    const map = mapRef.current
    if (!map) return
    setActiveRegion(region)
    const r = REGIONS[region]
    map.flyTo({ center: r.center, zoom: r.zoom, duration: 1200, essential: true })
  }

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
      // Add markers once map is ready
      MAP_NODES.forEach((node) => {
        const isVerb = node.category === "verbs"
        const isUnlocked = isSectionBadgeUnlocked({ id: node.sectionId })

        // Create marker element (outer el must not have transform overridden — MapLibre uses it for positioning)
        const el = document.createElement("div")
        el.style.cssText = `cursor: pointer;`

        // Inner wrapper for hover effects (safe to transform)
        const inner = document.createElement("div")
        inner.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s;
        `

        // Circle with icon
        const circle = document.createElement("div")
        circle.style.cssText = `
          width: 44px;
          height: 44px;
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
        `

        if (node.verbLetter) {
          circle.innerHTML = `<span style="font-size:18px;font-weight:900;color:${node.verbStyle?.color}">${node.verbLetter}</span>`
        } else {
          circle.innerHTML = `<span style="font-size:20px;line-height:1">${node.icon}</span>`
        }

        // Unlock badge
        if (isUnlocked) {
          const badge = document.createElement("div")
          badge.style.cssText = `
            position: absolute; top: -2px; right: -2px;
            width: 12px; height: 12px; background: #22c55e;
            border-radius: 50%; border: 2px solid white;
          `
          circle.appendChild(badge)
        }

        // Label
        const label = document.createElement("div")
        label.style.cssText = `
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(6px);
          border-radius: 6px;
          padding: 2px 7px;
          font-size: 10px;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
          text-align: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.06);
          font-family: system-ui, -apple-system, sans-serif;
        `
        label.textContent = node.label

        // Country subtitle
        const country = document.createElement("div")
        country.style.cssText = `
          font-size: 8px;
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

        // Hover effects on inner wrapper (not el — MapLibre controls el's transform)
        el.addEventListener("mouseenter", () => {
          inner.style.transform = "scale(1.2)"
          inner.style.filter = "drop-shadow(0 0 16px rgba(74,124,219,0.5))"
          el.style.zIndex = "100"
        })
        el.addEventListener("mouseleave", () => {
          inner.style.transform = "scale(1)"
          inner.style.filter = "none"
          el.style.zIndex = "10"
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

        new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([node.lng, node.lat])
          .addTo(map)
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
