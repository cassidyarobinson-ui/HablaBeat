"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

// ── Country coordinates (lat, lng) ──
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
  { sectionId: "body-world", label: "Body", country: "Guatemala", icon: "🧍", lat: 14.6, lng: -90.5, category: "nouns" },
  { sectionId: "roles-world", label: "Roles", country: "El Salvador", icon: "👨‍👩‍👧", lat: 13.7, lng: -89.2, category: "nouns" },
  { sectionId: "pets-syllables", label: "Pet", country: "Honduras", icon: "🐕", lat: 14.8, lng: -87.2, category: "nouns" },
  { sectionId: "places", label: "Travel", country: "Nicaragua", icon: "🏠", lat: 12.8, lng: -85.4, category: "nouns" },
  { sectionId: "numbers", label: "Numbers", country: "Costa Rica", icon: "🔢", lat: 10.0, lng: -84.0, category: "nouns" },
  { sectionId: "numbers-time", label: "Time", country: "Panama", icon: "🕐", lat: 8.5, lng: -80.0, category: "nouns" },
  { sectionId: "colors-feelings", label: "Feelings Color", country: "Puerto Rico / DR", icon: "🌈", lat: 18.2, lng: -66.5, category: "nouns" },
  { sectionId: "foods", label: "Food", country: "Cuba", icon: "🍎", lat: 22.0, lng: -79.5, category: "nouns" },
  // Verbs — South America
  { sectionId: "ar-verbs", label: "AR", country: "Colombia", icon: "", lat: 4.5, lng: -74.0, category: "verbs", verbLetter: "A", verbStyle: { bg: "linear-gradient(135deg,#1e1b4b,#312e81)", color: "#fbbf24" } },
  { sectionId: "er-verbs", label: "ER", country: "Venezuela", icon: "", lat: 8.0, lng: -66.0, category: "verbs", verbLetter: "E", verbStyle: { bg: "linear-gradient(135deg,#164e63,#0e7490)", color: "#6ee7b7" } },
  { sectionId: "ir-verbs", label: "IR", country: "Ecuador", icon: "", lat: -1.5, lng: -78.0, category: "verbs", verbLetter: "I", verbStyle: { bg: "linear-gradient(135deg,#4a1942,#831843)", color: "#f9a8d4" } },
  { sectionId: "preterite", label: "Quick Past", country: "Peru", icon: "⏪", lat: -10.0, lng: -76.0, category: "verbs" },
  { sectionId: "imperfecto", label: "Long Past", country: "Bolivia", icon: "🔄", lat: -17.0, lng: -65.0, category: "verbs" },
  { sectionId: "futuro", label: "Future", country: "Paraguay", icon: "⏩", lat: -23.0, lng: -58.0, category: "verbs" },
  { sectionId: "conditional", label: "Conditional", country: "Uruguay", icon: "🤔", lat: -33.0, lng: -56.0, category: "verbs" },
  { sectionId: "pronouns", label: "Pronoun", country: "Chile", icon: "👥", lat: -33.5, lng: -71.0, category: "verbs" },
  { sectionId: "advanced", label: "Advanced", country: "Argentina", icon: "🎓", lat: -35.0, lng: -64.0, category: "verbs" },
]

// Trail order
const TRAIL_ORDER = MAP_NODES.map(n => n.sectionId)

interface AmericasMapProps {
  onSelectSection: (sectionId: string, originX: string, originY: string) => void
  isSectionBadgeUnlocked: (section: { id: string }) => boolean
}

export default function AmericasMap({ onSelectSection, isSectionBadgeUnlocked }: AmericasMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Create marker DOM element
  const createMarkerEl = useCallback((node: typeof MAP_NODES[0]) => {
    const wrapper = document.createElement("div")
    wrapper.className = "map-node-wrapper"
    wrapper.style.cssText = `
      width: 80px; height: 80px; cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s;
      position: relative;
    `

    const circle = document.createElement("div")
    circle.style.cssText = `
      width: 100%; height: 100%; border-radius: 50%;
      background: linear-gradient(180deg, #5b9be6 0%, #4a7cdb 50%, #3d6bc4 100%);
      border: 3px solid rgba(255,255,255,0.7);
      box-shadow: 0 4px 16px rgba(74,124,219,0.4), 0 2px 4px rgba(0,0,0,0.1);
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    `

    // Icon
    const iconSpan = document.createElement("span")
    iconSpan.style.cssText = `font-size: 36px; line-height: 1; position: absolute; z-index: 1;`
    if (node.verbLetter && node.verbStyle) {
      iconSpan.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;font-weight:900;border-radius:12px;width:42px;height:42px;background:${node.verbStyle.bg};color:${node.verbStyle.color};font-size:28px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${node.verbLetter}</span>`
    } else {
      iconSpan.textContent = node.icon
    }
    circle.appendChild(iconSpan)

    // Curved text SVG (title on top, country on bottom)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("viewBox", "0 0 100 100")
    svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;"
    const topArc = `M 12 52 A 38 38 0 0 1 88 52`
    const botArc = `M 12 55 A 38 38 0 0 0 88 55`

    svg.innerHTML = `
      <defs>
        <path id="top-${node.sectionId}" d="${topArc}"/>
        <path id="bot-${node.sectionId}" d="${botArc}"/>
        <filter id="ol-${node.sectionId}" x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="0.8" result="expanded"/>
          <feFlood flood-color="#000" result="color"/>
          <feComposite in="color" in2="expanded" operator="in" result="outline"/>
          <feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <text fill="white" font-size="11" font-weight="900" text-anchor="middle" filter="url(#ol-${node.sectionId})">
        <textPath href="#top-${node.sectionId}" startOffset="50%">${node.label}</textPath>
      </text>
      <text fill="white" font-size="10" font-weight="900" text-anchor="middle" filter="url(#ol-${node.sectionId})">
        <textPath href="#bot-${node.sectionId}" startOffset="50%">${node.country}</textPath>
      </text>
    `
    circle.appendChild(svg)

    // Badge
    if (isSectionBadgeUnlocked({ id: node.sectionId })) {
      const badge = document.createElement("div")
      badge.style.cssText = `position:absolute;top:2px;right:2px;width:12px;height:12px;background:#3b82f6;border-radius:50%;border:2px solid white;z-index:3;`
      circle.appendChild(badge)
    }

    wrapper.appendChild(circle)

    // Hover effects
    wrapper.addEventListener("mouseenter", () => {
      wrapper.style.transform = "scale(1.15)"
      wrapper.style.filter = "drop-shadow(0 0 12px rgba(74,124,219,0.6))"
      wrapper.style.zIndex = "100"
      setHoveredNode(node.sectionId)
    })
    wrapper.addEventListener("mouseleave", () => {
      wrapper.style.transform = "scale(1)"
      wrapper.style.filter = "none"
      wrapper.style.zIndex = "1"
      setHoveredNode(null)
    })

    // Click
    wrapper.addEventListener("click", (e) => {
      const rect = wrapper.getBoundingClientRect()
      const cx = ((rect.left + rect.width / 2) / window.innerWidth * 100).toFixed(1) + "%"
      const cy = ((rect.top + rect.height / 2) / window.innerHeight * 100).toFixed(1) + "%"

      // Fly to country
      mapRef.current?.flyTo({
        center: [node.lng, node.lat],
        zoom: 5,
        duration: 800,
      })

      // Short delay then open section
      setTimeout(() => {
        onSelectSection(node.sectionId, cx, cy)
      }, 300)
    })

    return wrapper
  }, [onSelectSection, isSectionBadgeUnlocked])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: "HablaBeat Light",
        sources: {
          "carto-light": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          },
          "carto-labels": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "carto-light-layer",
            type: "raster",
            source: "carto-light",
            minzoom: 0,
            maxzoom: 20,
            paint: {
              "raster-saturation": -0.6,
              "raster-contrast": -0.1,
              "raster-brightness-min": 0.1,
            },
          },
          {
            id: "carto-labels-layer",
            type: "raster",
            source: "carto-labels",
            minzoom: 0,
            maxzoom: 20,
            paint: {
              "raster-opacity": 0.4,
            },
          },
        ],
      },
      center: [-72, -5],
      zoom: 2.8,
      minZoom: 2,
      maxZoom: 8,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")

    map.on("load", () => {
      mapRef.current = map
      setMapReady(true)

      // Add trail line
      const trailCoords = MAP_NODES.map(n => [n.lng, n.lat] as [number, number])
      map.addSource("trail", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: trailCoords,
          },
        },
      })
      map.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        paint: {
          "line-color": "rgba(74, 124, 219, 0.35)",
          "line-width": 2.5,
          "line-dasharray": [4, 3],
        },
      })

      // Add markers
      MAP_NODES.forEach((node) => {
        const el = createMarkerEl(node)
        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([node.lng, node.lat])
          .addTo(map)
        markersRef.current.push(marker)
      })
    })

    return () => {
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [createMarkerEl])

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Section labels overlaid on map */}
      <div className="absolute pointer-events-none z-20" style={{ left: 20, top: 16 }}>
        <span className="font-black text-lg tracking-wider" style={{ color: "#4a7cdb", textShadow: "0 1px 6px rgba(255,255,255,0.9)" }}>NOUNS</span>
        <br />
        <span className="text-xs font-semibold" style={{ color: "#6b7280", textShadow: "0 1px 4px rgba(255,255,255,0.8)" }}>North, Central America &amp; Caribbean</span>
      </div>
      <div className="absolute pointer-events-none z-20" style={{ left: 20, bottom: 60 }}>
        <span className="font-black text-lg tracking-wider" style={{ color: "#4a7cdb", textShadow: "0 1px 6px rgba(255,255,255,0.9)" }}>VERBS</span>
        <br />
        <span className="text-xs font-semibold" style={{ color: "#6b7280", textShadow: "0 1px 4px rgba(255,255,255,0.8)" }}>South America</span>
      </div>

      {/* Tooltip for hovered node */}
      {hoveredNode && (() => {
        const node = MAP_NODES.find(n => n.sectionId === hoveredNode)
        if (!node) return null
        return (
          <div className="absolute top-4 right-16 z-30 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-blue-100"
            style={{ pointerEvents: "none" }}>
            <div className="font-bold text-sm text-gray-800">{node.label}</div>
            <div className="text-xs text-gray-500">{node.country}</div>
          </div>
        )
      })()}
    </div>
  )
}
