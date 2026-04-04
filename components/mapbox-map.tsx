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
  bgColor?: string
}[] = [
  // Nouns — ordered by song number (1→24), positioned for mobile readability
  { sectionId: "alphabet-vowels", label: "Alphabet", country: "Mexico", icon: "✏️", lat: 22.0, lng: -96.0, category: "nouns", bgColor: "#a020b0" },
  { sectionId: "body-world", label: "Body", country: "Guatemala", icon: "🖐️", lat: 17.0, lng: -93.0, category: "nouns", bgColor: "#2090f0" },
  { sectionId: "roles-world", label: "Roles", country: "El Salvador", icon: "👨‍🌾", lat: 13.5, lng: -90.5, category: "nouns", bgColor: "#50b050" },
  { sectionId: "pets-syllables", label: "Pet", country: "Honduras", icon: "🐕", lat: 15.8, lng: -84.0, category: "nouns", bgColor: "#f06090" },
  { sectionId: "places", label: "Travel", country: "Nicaragua", icon: "🌴", lat: 12.5, lng: -86.0, category: "nouns", bgColor: "#e03030" },
  { sectionId: "numbers", label: "Numbers", country: "Costa Rica", icon: "🎲", lat: 9.5, lng: -82.0, category: "nouns", bgColor: "#8020a0" },
  { sectionId: "numbers-time", label: "Time", country: "Panama", icon: "🕐", lat: 8.0, lng: -77.0, category: "nouns", bgColor: "#1060c0" },
  { sectionId: "foods", label: "Food", country: "Cuba", icon: "🌮", lat: 22.0, lng: -79.5, category: "nouns", bgColor: "#40a040" },
  { sectionId: "colors", label: "Colors", country: "Dominican Republic", icon: "🌈", lat: 19.5, lng: -72.5, category: "nouns", bgColor: "#f09000" },
  { sectionId: "feelings", label: "Feelings", country: "Puerto Rico", icon: "💖", lat: 18.5, lng: -66.5, category: "nouns", bgColor: "#00c0d0" },
  // Verbs — South America, spread for mobile readability
  { sectionId: "ar-verbs", label: "AR Verbs", country: "Colombia", icon: "", lat: 5.0, lng: -73.0, category: "verbs", verbLetter: "A", verbStyle: { bg: "linear-gradient(135deg,#1e1b4b,#312e81)", color: "#fbbf24" }, bgColor: "#f0d030" },
  { sectionId: "er-verbs", label: "ER Verbs", country: "Venezuela", icon: "", lat: 6.5, lng: -65.0, category: "verbs", verbLetter: "E", verbStyle: { bg: "linear-gradient(135deg,#164e63,#0e7490)", color: "#6ee7b7" }, bgColor: "#309040" },
  { sectionId: "ir-verbs", label: "IR Verbs", country: "Ecuador", icon: "", lat: -1.0, lng: -78.0, category: "verbs", verbLetter: "I", verbStyle: { bg: "linear-gradient(135deg,#4a1942,#831843)", color: "#f9a8d4" }, bgColor: "#c01060" },
  { sectionId: "preterite", label: "Quick Past", country: "Peru", icon: "⏪", lat: -10.0, lng: -76.0, category: "verbs", bgColor: "#f07000" },
  { sectionId: "imperfecto", label: "Long Past", country: "Bolivia", icon: "🔄", lat: -17.0, lng: -65.0, category: "verbs", bgColor: "#2090f0" },
  { sectionId: "futuro", label: "Future", country: "Paraguay", icon: "⏩", lat: -23.0, lng: -57.0, category: "verbs", bgColor: "#7020a0" },
  { sectionId: "conditional", label: "Conditional", country: "Uruguay", icon: "🤔", lat: -33.0, lng: -55.0, category: "verbs", bgColor: "#202080" },
  { sectionId: "pronouns", label: "Pronoun", country: "Chile", icon: "👥", lat: -30.0, lng: -71.0, category: "verbs", bgColor: "#00c0d0" },
  { sectionId: "advanced", label: "Advanced", country: "Argentina", icon: "🎓", lat: -37.0, lng: -63.0, category: "verbs", bgColor: "#f02060" },
]

const NOUN_NODES = MAP_NODES.filter(n => n.category === "nouns")
const VERB_NODES = MAP_NODES.filter(n => n.category === "verbs")

interface MapboxMapProps {
  onSelectSection: (sectionId: string, originX: string, originY: string) => void
  isSectionBadgeUnlocked: (section: { id: string }) => boolean
  openSectionId?: string
  onHoverSound?: () => void
  flyToSectionId?: string // when set, map flies to this section's country
}

// Compute bounding box from marker nodes
function computeBounds(nodes: typeof MAP_NODES): [[number, number], [number, number]] {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const n of nodes) {
    if (n.lng < minLng) minLng = n.lng
    if (n.lng > maxLng) maxLng = n.lng
    if (n.lat < minLat) minLat = n.lat
    if (n.lat > maxLat) maxLat = n.lat
  }
  return [[minLng, minLat], [maxLng, maxLat]]
}

// Region labels (no hardcoded center/zoom)
const REGION_LABELS = {
  nouns: { label: "🌎 NOUNS", subtitle: "North & Central America" },
  verbs: { label: "🌍 VERBS", subtitle: "South America" },
}

// Padding for fitBounds — accounts for header, side panels, NOUNS/VERBS buttons
function getBoundsPadding() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768
  return isMobile
    ? { top: 50, right: 50, bottom: 100, left: 50 }
    : { top: 160, right: 200, bottom: 30, left: 40 }
}

// REGIONS object for labels and the fitToRegion helper
const REGIONS: Record<"nouns" | "verbs", { label: string; subtitle: string }> = REGION_LABELS

export default function MapboxMap({ onSelectSection, isSectionBadgeUnlocked, openSectionId, onHoverSound, flyToSectionId }: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{ marker: maplibregl.Marker; inner: HTMLDivElement; circle: HTMLDivElement; category: "nouns" | "verbs"; sectionId: string }[]>([])
  const [activeRegion, setActiveRegion] = useState<"nouns" | "verbs">("nouns")
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const activeRegionRef = useRef<"nouns" | "verbs">("nouns")
  const selectedIndexRef = useRef<number>(-1)
  const onSelectSectionRef = useRef(onSelectSection)
  const onHoverSoundRef = useRef(onHoverSound)
  onSelectSectionRef.current = onSelectSection
  onHoverSoundRef.current = onHoverSound

  // Fit map to show all markers for a given region
  const fitToRegion = useCallback((region: "nouns" | "verbs", options?: { duration?: number; animate?: boolean }) => {
    const map = mapRef.current
    if (!map) return
    const nodes = region === "nouns" ? NOUN_NODES : VERB_NODES
    const bounds = computeBounds(nodes)
    const padding = getBoundsPadding()
    map.fitBounds(bounds as [[number, number], [number, number]], {
      padding,
      duration: options?.duration ?? 1200,
      animate: options?.animate ?? true,
      maxZoom: 6,
    })
  }, [])

  // Zoom into country, then open the overlay
  const zoomAndOpen = useCallback((node: typeof MAP_NODES[number]) => {
    const map = mapRef.current
    if (!map) {
      onSelectSectionRef.current(node.sectionId, "50%", "50%")
      return
    }
    map.flyTo({ center: [node.lng, node.lat], zoom: 6, duration: 800, essential: true })
    setTimeout(() => {
      const point = map.project([node.lng, node.lat])
      const rect = containerRef.current?.getBoundingClientRect()
      if (point && rect) {
        const pctX = ((point.x / rect.width) * 100).toFixed(1) + "%"
        const pctY = ((point.y / rect.height) * 100).toFixed(1) + "%"
        onSelectSectionRef.current(node.sectionId, pctX, pctY)
      } else {
        onSelectSectionRef.current(node.sectionId, "50%", "50%")
      }
    }, 850)
  }, [])

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
        inner.style.transform = "scale(2.2)"
        inner.style.filter = "drop-shadow(0 0 30px rgba(74,124,219,0.8))"
        circle.style.border = "5px solid #fbbf24"
        circle.style.boxShadow = "0 0 40px rgba(251,191,36,0.6), 0 8px 24px rgba(0,0,0,0.3)"
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
    fitToRegion(region, { duration: 1200 })
  }, [showMarkersForRegion, fitToRegion])

  // Dance pad navigation
  // Navigate through ALL nodes in order (nouns then verbs), auto-switching region
  const navigateToGlobalIndex = useCallback((globalIdx: number) => {
    const total = MAP_NODES.length
    const idx = ((globalIdx % total) + total) % total // wrap around
    const node = MAP_NODES[idx]
    const targetRegion = node.category === "nouns" ? "nouns" : "verbs"

    // Switch region if needed
    if (activeRegionRef.current !== targetRegion) {
      setActiveRegion(targetRegion)
      activeRegionRef.current = targetRegion
      showMarkersForRegion(targetRegion)
      fitToRegion(targetRegion, { duration: 800 })
      // After region switch animation, highlight and pan to the node
      setTimeout(() => {
        const regionNodes = targetRegion === "nouns" ? NOUN_NODES : VERB_NODES
        const localIdx = regionNodes.findIndex(n => n.sectionId === node.sectionId)
        setSelectedIndex(localIdx)
        selectedIndexRef.current = localIdx
        highlightMarker(localIdx)
        mapRef.current?.flyTo({ center: [node.lng, node.lat], duration: 600, essential: true })
      }, 850)
    } else {
      const regionNodes = targetRegion === "nouns" ? NOUN_NODES : VERB_NODES
      const localIdx = regionNodes.findIndex(n => n.sectionId === node.sectionId)
      setSelectedIndex(localIdx)
      selectedIndexRef.current = localIdx
      highlightMarker(localIdx)
      mapRef.current?.flyTo({ center: [node.lng, node.lat], duration: 600, essential: true })
    }
  }, [highlightMarker, showMarkersForRegion])

  // Get current global index from active region + selectedIndex
  const getGlobalIndex = useCallback(() => {
    if (selectedIndexRef.current < 0) return -1
    const regionNodes = activeRegionRef.current === "nouns" ? NOUN_NODES : VERB_NODES
    const node = regionNodes[selectedIndexRef.current]
    if (!node) return -1
    return MAP_NODES.findIndex(n => n.sectionId === node.sectionId)
  }, [])

  const handlePadPress = useCallback((btn: PadButton) => {
    if (btn === "left") {
      const globalIdx = getGlobalIndex()
      navigateToGlobalIndex(globalIdx <= 0 ? MAP_NODES.length - 1 : globalIdx - 1)
    } else if (btn === "right") {
      const globalIdx = getGlobalIndex()
      navigateToGlobalIndex(globalIdx < 0 ? 0 : globalIdx + 1)
    } else if (btn === "up" || btn === "down") {
      // Up/Down toggles between Nouns and Verbs
      const newRegion = activeRegionRef.current === "nouns" ? "verbs" : "nouns"
      flyTo(newRegion)
    } else if (btn === "start" || btn === "select") {
      // Select the current marker — zoom in then open
      if (selectedIndexRef.current >= 0) {
        const nodes = getActiveNodes()
        const node = nodes[selectedIndexRef.current]
        if (node) zoomAndOpen(node)
      }
    }
  }, [getActiveNodes, getGlobalIndex, navigateToGlobalIndex, flyTo, zoomAndOpen])

  useGamepad({ onPress: handlePadPress, enabled: !openSectionId })

  // Keyboard arrow support for map navigation
  useEffect(() => {
    if (openSectionId) return // Don't handle when overlay is open
    const handler = (e: KeyboardEvent) => {
      let btn: PadButton | null = null
      if (e.key === "ArrowLeft") btn = "left"
      else if (e.key === "ArrowRight") btn = "right"
      else if (e.key === "ArrowUp") btn = "up"
      else if (e.key === "ArrowDown") btn = "down"
      else if (e.key === "Enter" || e.key === " ") btn = "start"
      else if (e.key === "Escape" || e.key === "Backspace") btn = "select"
      if (!btn) return
      e.preventDefault()
      handlePadPress(btn)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [openSectionId, handlePadPress])

  // When overlay opens, disable map interaction and hide markers; restore on close
  const prevOpenRef = useRef(openSectionId)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (openSectionId) {
      // Disable all map interaction
      map.dragPan.disable()
      map.scrollZoom.disable()
      map.touchZoomRotate.disable()
      map.doubleClickZoom.disable()
      map.keyboard.disable()
      // Hide all markers
      markersRef.current.forEach(({ marker }) => {
        const el = marker.getElement()
        el.style.pointerEvents = "none"
        el.style.opacity = "0"
        el.style.transition = "opacity 0.3s"
      })
    } else {
      // Re-enable map interaction
      map.dragPan.enable()
      map.scrollZoom.enable()
      map.touchZoomRotate.enable()
      map.doubleClickZoom.enable()
      map.keyboard.enable()
      // Fly back to region view and restore markers
      if (prevOpenRef.current) {
        fitToRegion(activeRegionRef.current, { duration: 800 })
      }
      // Restore markers for active region
      showMarkersForRegion(activeRegionRef.current)
    }
    prevOpenRef.current = openSectionId
  }, [openSectionId, showMarkersForRegion])

  // Fly map to a section's country when navigating between worlds inside the overlay
  useEffect(() => {
    if (!flyToSectionId || !mapRef.current) return
    const node = MAP_NODES.find(n => n.sectionId === flyToSectionId)
    if (node) {
      mapRef.current.flyTo({ center: [node.lng, node.lat], zoom: 6, duration: 800, essential: true })
    }
  }, [flyToSectionId])

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
      center: [-79, 12] as [number, number], // temporary — fitBounds called on load
      zoom: 3,
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
      // Inject bunny animation styles once
      if (!document.getElementById("bunny-map-styles")) {
        const style = document.createElement("style")
        style.id = "bunny-map-styles"
        style.textContent = `
          @keyframes bunnyDrop {
            0%   { opacity: 0; transform: translateX(-50%) translate(-40px, -60px) scaleX(-1) scale(0.6); }
            30%  { opacity: 1; transform: translateX(-50%) translate(-12px, -20px) scaleX(-1) scale(0.9); }
            50%  { opacity: 1; transform: translateX(-50%) translate(0px, 4px) scaleX(-1) scale(1.05); }
            65%  { transform: translateX(-50%) translate(0px, -8px) scaleX(-1) scale(1); }
            80%  { transform: translateX(-50%) translate(0px, 2px) scaleX(-1) scale(1.02); }
            90%  { transform: translateX(-50%) translate(0px, -2px) scaleX(-1) scale(1); }
            100% { opacity: 1; transform: translateX(-50%) translate(0px, 0px) scaleX(-1) scale(1); }
          }
          .bunny-drop { animation: bunnyDrop 0.55s cubic-bezier(0.22,0.68,0.36,1) forwards; }
        `
        document.head.appendChild(style)
      }

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
        const isMob = window.innerWidth < 768
        const circleSize = isMob ? 40 : 56
        circle.style.cssText = `
          width: ${circleSize}px;
          height: ${circleSize}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 3px solid ${node.bgColor || "#7B1FA2"};
          box-shadow: 0 3px 10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04);
          transition: border 0.25s ease, box-shadow 0.25s ease;
          position: relative;
          transition: border 0.2s, box-shadow 0.2s;
        `

        if (node.verbLetter) {
          circle.innerHTML = `<span style="font-size:${isMob ? 18 : 24}px;font-weight:900;color:${node.verbStyle?.color}">${node.verbLetter}</span>`
        } else {
          circle.innerHTML = `<span style="font-size:${isMob ? 20 : 26}px;line-height:1">${node.icon}</span>`
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
          background: white;
          backdrop-filter: blur(6px);
          border-radius: 6px;
          padding: ${isMob ? "2px 6px" : "3px 10px"};
          font-size: ${isMob ? 11 : 14}px;
          font-weight: 900;
          color: #1e293b;
          white-space: nowrap;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          border: 2.5px solid ${node.bgColor || "#7B1FA2"};
          font-family: system-ui, -apple-system, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        `
        label.textContent = node.label

        const country = document.createElement("div")
        country.style.cssText = `
          font-size: ${isMob ? 9 : 11}px;
          font-weight: 700;
          color: #64748b;
          white-space: nowrap;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
          background: white;
          backdrop-filter: blur(4px);
          border-radius: 4px;
          padding: 1px 6px;
          border: 1.5px solid ${node.bgColor || "#7B1FA2"};
        `
        country.textContent = node.country

        if (isMob) {
          // Mobile: compact text button, no icon circle
          label.style.cssText = `
            background: white;
            color: #1e293b;
            border-radius: 12px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 900;
            white-space: nowrap;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 2px solid ${node.bgColor || "#7B1FA2"};
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.1;
          `
          label.innerHTML = `<span style="text-transform:uppercase;letter-spacing:0.08em">${node.label}</span><br><span style="font-size:9px;font-weight:700;color:#64748b">${node.country}</span>`
          inner.appendChild(label)
        } else {
          inner.appendChild(circle)
          inner.appendChild(label)
          inner.appendChild(country)
        }
        // Bunny that drops in on hover
        const bunny = document.createElement("img")
        bunny.src = "/images/super-bunny-heart.gif"
        bunny.alt = ""
        const bunnySize = isMob ? 30 : 44
        bunny.style.cssText = `
          width: ${bunnySize}px;
          height: ${bunnySize}px;
          object-fit: contain;
          position: absolute;
          top: ${isMob ? "-24px" : "-36px"};
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          pointer-events: none;
          z-index: 20;
        `
        inner.style.position = "relative"
        inner.appendChild(bunny)

        el.appendChild(inner)

        // Hover effects — bigger scale + pop sound + golden borders + bunny drop
        el.addEventListener("mouseenter", () => {
          inner.style.transform = "scale(1.6)"
          inner.style.filter = "drop-shadow(0 0 24px rgba(251,191,36,0.5))"
          circle.style.border = "4px solid #fbbf24"
          circle.style.boxShadow = "0 0 28px rgba(251,191,36,0.6), 0 6px 16px rgba(0,0,0,0.25)"
          label.style.border = "2px solid #fbbf24"
          label.style.boxShadow = "0 0 12px rgba(251,191,36,0.4), 0 2px 8px rgba(0,0,0,0.15)"
          country.style.border = "1px solid #fbbf24"
          // Trigger bunny drop animation
          bunny.classList.remove("bunny-drop")
          void bunny.offsetWidth
          bunny.classList.add("bunny-drop")
          el.style.zIndex = "100"
          onHoverSoundRef.current?.()
        })
        el.addEventListener("touchstart", () => {
          // Same hover effects as desktop
          inner.style.transform = "scale(1.6)"
          inner.style.filter = "drop-shadow(0 0 24px rgba(251,191,36,0.5))"
          circle.style.border = "4px solid #fbbf24"
          circle.style.boxShadow = "0 0 28px rgba(251,191,36,0.6), 0 6px 16px rgba(0,0,0,0.25)"
          label.style.border = "2px solid #fbbf24"
          label.style.boxShadow = "0 0 12px rgba(251,191,36,0.4), 0 2px 8px rgba(0,0,0,0.15)"
          country.style.border = "1px solid #fbbf24"
          el.style.zIndex = "100"
          // Bunny hop animation
          bunny.style.opacity = ""
          bunny.classList.remove("bunny-drop")
          void bunny.offsetWidth
          bunny.classList.add("bunny-drop")
          // Reset after delay
          setTimeout(() => {
            bunny.classList.remove("bunny-drop")
            bunny.style.opacity = "0"
            inner.style.transform = "scale(1)"
            inner.style.filter = "none"
            circle.style.border = `3px solid ${node.bgColor || "#7B1FA2"}`
            circle.style.boxShadow = "0 3px 10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)"
            label.style.border = `2.5px solid ${node.bgColor || "#7B1FA2"}`
            label.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"
            country.style.border = `1.5px solid ${node.bgColor || "#7B1FA2"}`
            el.style.zIndex = "10"
          }, 1500)
          onHoverSoundRef.current?.()
        }, { passive: true })
        el.addEventListener("mouseleave", () => {
          // Only reset if not the pad-selected marker
          const nodes = activeRegionRef.current === "nouns" ? NOUN_NODES : VERB_NODES
          const nodeIdx = nodes.findIndex(n => n.sectionId === node.sectionId)
          if (nodeIdx !== selectedIndexRef.current) {
            inner.style.transform = "scale(1)"
            inner.style.filter = "none"
            circle.style.border = `3px solid ${node.bgColor || "#7B1FA2"}`
            circle.style.boxShadow = "0 3px 10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)"
            label.style.border = `2.5px solid ${node.bgColor || "#7B1FA2"}`
            label.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"
            country.style.border = `1.5px solid ${node.bgColor || "#7B1FA2"}`
            bunny.style.opacity = "0"
            bunny.classList.remove("bunny-drop")
            el.style.zIndex = "10"
          }
        })

        // Click handler — zoom into country then open overlay
        el.addEventListener("click", () => {
          zoomAndOpen(node)
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

      // Initial fit to nouns region bounds
      const nounBounds = computeBounds(NOUN_NODES)
      map.fitBounds(nounBounds as [[number, number], [number, number]], {
        padding: getBoundsPadding(),
        duration: 0,
        animate: false,
        maxZoom: 6,
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
          background: "white",
          color: "#1e293b",
          padding: "10px 24px",
          borderRadius: 16,
          fontSize: 16,
          fontWeight: 900,
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          zIndex: 10,
          textAlign: "center",
          lineHeight: 1.3,
          border: `3px solid ${activeRegion === "nouns" ? "#2090f0" : "#7020a0"}`,
          textTransform: "uppercase" as const,
          letterSpacing: "0.08em",
        }}>
          <div>{(activeRegion === "nouns" ? NOUN_NODES : VERB_NODES)[selectedIndex]?.icon} {(activeRegion === "nouns" ? NOUN_NODES : VERB_NODES)[selectedIndex]?.label}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>{(activeRegion === "nouns" ? NOUN_NODES : VERB_NODES)[selectedIndex]?.country}</div>
        </div>
      )}

      {/* Region toggle buttons — bottom-right on mobile, top-left on desktop */}
      <div style={{
        position: "absolute",
        ...(window.innerWidth < 768
          ? { bottom: 30, right: 12 }
          : { bottom: 40, right: 16 }),
        display: "flex",
        flexDirection: "column",
        gap: 6,
        zIndex: 10,
      }}>
        {(["nouns", "verbs"] as const).map((region) => {
          const r = REGIONS[region]
          const isActive = activeRegion === region
          return (
            <button
              key={region}
              onClick={() => flyTo(region)}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.transform = "scale(1.15)"
                el.style.border = `3px solid #fbbf24`
                el.style.boxShadow = "0 0 20px rgba(251,191,36,0.5), 0 6px 16px rgba(0,0,0,0.2)"
                el.style.zIndex = "100"
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.transform = "scale(1)"
                el.style.border = isActive
                  ? `3px solid ${region === "nouns" ? "#2090f0" : "#7020a0"}`
                  : `2px solid ${region === "nouns" ? "#2090f0" : "#7020a0"}`
                el.style.boxShadow = isActive ? "0 4px 14px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.1)"
                el.style.zIndex = "10"
              }}
              style={{
                padding: window.innerWidth < 768 ? "6px 10px" : "6px 14px",
                borderRadius: 12,
                border: isActive
                  ? `3px solid ${region === "nouns" ? "#2090f0" : "#7020a0"}`
                  : `2px solid ${region === "nouns" ? "#2090f0" : "#7020a0"}`,
                background: "white",
                color: "#1e293b",
                fontWeight: 900,
                fontSize: window.innerWidth < 768 ? 12 : 13,
                cursor: "pointer",
                boxShadow: isActive
                  ? "0 4px 14px rgba(0,0,0,0.15)"
                  : "0 2px 8px rgba(0,0,0,0.1)",
                transition: "all 0.2s ease",
                fontFamily: "system-ui, -apple-system, sans-serif",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                lineHeight: 1.1,
                opacity: isActive ? 1 : 0.7,
                textTransform: "uppercase" as const,
                letterSpacing: "0.08em",
              }}
            >
              <span>{r.label}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "none" as const }}>{r.subtitle}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
