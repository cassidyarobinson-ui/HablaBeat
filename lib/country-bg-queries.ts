// Pexels search queries for country-themed background videos in fly games.
// Tuned to favor famous landmarks and culturally-iconic scenery so the bunny
// feels like it's flying through that country's most recognizable places.

const COUNTRY_BG_QUERIES: Record<string, string> = {
  "Mexico":             "mexico chichen itza pyramid teotihuacan ruins",
  "Guatemala":          "guatemala antigua colonial city tikal mayan ruins",
  "El Salvador":        "el salvador volcano izalco church colonial",
  "Honduras":           "honduras copan ruins roatan caribbean reef",
  "Nicaragua":          "nicaragua granada colonial city volcano lake",
  "Costa Rica":         "costa rica arenal volcano rainforest waterfall",
  "Panama":             "panama canal old town casco viejo skyline",
  "Puerto Rico":        "puerto rico old san juan castillo san felipe",
  "Dominican Republic": "dominican republic colonial zone santo domingo beach",
  "Cuba":               "cuba havana vintage cars colorful colonial",
  "Colombia":           "colombia cartagena old town colorful streets",
  "Venezuela":          "venezuela angel falls waterfall salto angel",
  "Ecuador":            "ecuador quito old town andes galapagos",
  "Peru":               "peru machu picchu inca ruins sunrise andes",
  "Bolivia":            "bolivia salar de uyuni salt flat la paz",
  "Paraguay":           "paraguay asuncion colonial church traditional",
  "Uruguay":            "uruguay montevideo coast colonia colonial",
  "Chile":              "chile torres del paine patagonia valparaiso colorful",
  "Argentina":          "argentina patagonia perito moreno glacier la boca buenos aires",
}

export function getCountryBgQuery(country: string): string | undefined {
  return COUNTRY_BG_QUERIES[country]
}
