"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, Pause, Play, SkipBack, SkipForward } from "lucide-react"

// ─────────────────────────────────────────────
// Country data — palette + flag colors + Pexels query pool per song
// ─────────────────────────────────────────────
type CountryData = { country: string; flag: string; flagColors: string[]; palette: string[]; pexelsQueries: string[] }

const SONG_COUNTRY: Record<number, CountryData> = {
  // ── Mexico — Alphabet World 🇲🇽 green/white/red ──────────────────────────────
  1: { country: "Mexico", flag: "🇲🇽", flagColors: ["#006847","#FFFFFF","#CE1126"], palette: ["#00CED1","#FF1493","#FF8C00"], pexelsQueries: [
    // Dance
    "ballet folklorico mexico spinning skirts","jarabe tapatio hat dance mexico","mexico cumbia mariachi dance","mexico folklorico colorful performance",
    // Landscape
    "copper canyon mexico chihuahua","cenote yucatan underwater turquoise","yucatan beach mexico turquoise water","mexico aztec pyramid teotihuacan sunrise",
    // Dress
    "charro suit mexico horseback","oaxaca indigenous woman traditional dress","mexico folklorico colorful costume dress","mexico traditional huipil embroidered blouse",
    // Food
    "tacos al pastor mexico street food","mole sauce mexico traditional","tamales mexico food culture","chiles en nogada mexico dish",
    // Animals
    "axolotl mexico underwater salamander","jaguar mexico wildlife jungle","monarch butterfly migration mexico","mexican wolf wildlife nature",
  ]},
  2: { country: "Mexico", flag: "🇲🇽", flagColors: ["#006847","#FFFFFF","#CE1126"], palette: ["#00CED1","#FF1493","#FF8C00"], pexelsQueries: [
    "ballet folklorico mexico spinning skirts","jarabe tapatio hat dance mexico","mexico cumbia mariachi dance","mexico folklorico colorful performance",
    "copper canyon mexico chihuahua","cenote yucatan underwater turquoise","yucatan beach mexico turquoise water","mexico aztec pyramid teotihuacan sunrise",
    "charro suit mexico horseback","oaxaca indigenous woman traditional dress","mexico folklorico colorful costume dress","mexico traditional huipil embroidered blouse",
    "tacos al pastor mexico street food","mole sauce mexico traditional","tamales mexico food culture","chiles en nogada mexico dish",
    "axolotl mexico underwater salamander","jaguar mexico wildlife jungle","monarch butterfly migration mexico","mexican wolf wildlife nature",
  ]},
  3: { country: "Mexico", flag: "🇲🇽", flagColors: ["#006847","#FFFFFF","#CE1126"], palette: ["#00CED1","#FF1493","#FF8C00"], pexelsQueries: [
    "ballet folklorico mexico spinning skirts","jarabe tapatio hat dance mexico","mexico cumbia mariachi dance","mexico folklorico colorful performance",
    "copper canyon mexico chihuahua","cenote yucatan underwater turquoise","yucatan beach mexico turquoise water","mexico aztec pyramid teotihuacan sunrise",
    "charro suit mexico horseback","oaxaca indigenous woman traditional dress","mexico folklorico colorful costume dress","mexico traditional huipil embroidered blouse",
    "tacos al pastor mexico street food","mole sauce mexico traditional","tamales mexico food culture","chiles en nogada mexico dish",
    "axolotl mexico underwater salamander","jaguar mexico wildlife jungle","monarch butterfly migration mexico","mexican wolf wildlife nature",
  ]},
  // ── Guatemala — You World 🇬🇹 blue/white/blue ────────────────────────────────
  4: { country: "Guatemala", flag: "🇬🇹", flagColors: ["#4997D0","#FFFFFF","#4997D0"], palette: ["#FF00FF","#00FFFF","#FFD700"], pexelsQueries: [
    "marimba dance guatemala traditional","mayan dance guatemala ceremony","guatemala traditional dance colorful","guatemala indigenous dance ritual",
    "lake atitlan guatemala volcano","pacaya volcano guatemala eruption","guatemala rainforest jungle green","tikal pyramid jungle guatemala",
    "huipil blouse guatemala indigenous woman","corte skirt guatemala traditional","mayan ceremonial outfit guatemala","guatemala colorful textile traditional dress",
    "pepian stew guatemala food","kak'ik turkey soup guatemala","guatemala tamales traditional food","rellenitos guatemala dessert plantain",
    "quetzal bird guatemala colorful","jaguar guatemala wildlife","howler monkey guatemala jungle","guatemala tropical bird wildlife",
  ]},
  5: { country: "Guatemala", flag: "🇬🇹", flagColors: ["#4997D0","#FFFFFF","#4997D0"], palette: ["#FF00FF","#00FFFF","#FFD700"], pexelsQueries: [
    "marimba dance guatemala traditional","mayan dance guatemala ceremony","guatemala traditional dance colorful","guatemala indigenous dance ritual",
    "lake atitlan guatemala volcano","pacaya volcano guatemala eruption","guatemala rainforest jungle green","tikal pyramid jungle guatemala",
    "huipil blouse guatemala indigenous woman","corte skirt guatemala traditional","mayan ceremonial outfit guatemala","guatemala colorful textile traditional dress",
    "pepian stew guatemala food","kak'ik turkey soup guatemala","guatemala tamales traditional food","rellenitos guatemala dessert plantain",
    "quetzal bird guatemala colorful","jaguar guatemala wildlife","howler monkey guatemala jungle","guatemala tropical bird wildlife",
  ]},
  6: { country: "Guatemala", flag: "🇬🇹", flagColors: ["#4997D0","#FFFFFF","#4997D0"], palette: ["#FF00FF","#00FFFF","#FFD700"], pexelsQueries: [
    "marimba dance guatemala traditional","mayan dance guatemala ceremony","guatemala traditional dance colorful","guatemala indigenous dance ritual",
    "lake atitlan guatemala volcano","pacaya volcano guatemala eruption","guatemala rainforest jungle green","tikal pyramid jungle guatemala",
    "huipil blouse guatemala indigenous woman","corte skirt guatemala traditional","mayan ceremonial outfit guatemala","guatemala colorful textile traditional dress",
    "pepian stew guatemala food","kak'ik turkey soup guatemala","guatemala tamales traditional food","rellenitos guatemala dessert plantain",
    "quetzal bird guatemala colorful","jaguar guatemala wildlife","howler monkey guatemala jungle","guatemala tropical bird wildlife",
  ]},
  7: { country: "Guatemala", flag: "🇬🇹", flagColors: ["#4997D0","#FFFFFF","#4997D0"], palette: ["#FF00FF","#00FFFF","#FFD700"], pexelsQueries: [
    "marimba dance guatemala traditional","mayan dance guatemala ceremony","guatemala traditional dance colorful","guatemala indigenous dance ritual",
    "lake atitlan guatemala volcano","pacaya volcano guatemala eruption","guatemala rainforest jungle green","tikal pyramid jungle guatemala",
    "huipil blouse guatemala indigenous woman","corte skirt guatemala traditional","mayan ceremonial outfit guatemala","guatemala colorful textile traditional dress",
    "pepian stew guatemala food","kak'ik turkey soup guatemala","guatemala tamales traditional food","rellenitos guatemala dessert plantain",
    "quetzal bird guatemala colorful","jaguar guatemala wildlife","howler monkey guatemala jungle","guatemala tropical bird wildlife",
  ]},
  // ── El Salvador & Honduras — Pet World ───────────────────────────────────────
  8: { country: "El Salvador", flag: "🇸🇻", flagColors: ["#0F47AF","#FFFFFF","#0F47AF"], palette: ["#228B22","#FF6347","#1E90FF"], pexelsQueries: [
    "xuc dance el salvador folk","el salvador traditional folk dance","el salvador carnival parade costume","el salvador independence cultural dance",
    "el imposible national park el salvador","el salvador volcano landscape","el salvador lake coatepeque","el salvador pacific coast beach",
    "el salvador traditional folk costume blouse","el salvador colorful festival dress","el salvador indigenous craft textile","el salvador folkloric costume colorful",
    "pupusas el salvador street food","yuca frita el salvador food","el salvador tamales food","el salvador traditional cuisine",
    "baird tapir central america wildlife","toucan central america bird","howler monkey central america jungle","el salvador tropical wildlife nature",
  ]},
  9: { country: "Honduras", flag: "🇭🇳", flagColors: ["#0073CF","#FFFFFF","#0073CF"], palette: ["#228B22","#FF6347","#1E90FF"], pexelsQueries: [
    "punta dance garifuna honduras","garifuna dance drumming honduras","honduras traditional festival dance","honduras folkloric dance costume",
    "bay islands honduras caribbean","pico bonito national park honduras","honduras caribbean coast beach","honduras coral reef underwater",
    "garifuna attire honduras traditional","lenca indigenous clothing honduras","honduras festival traditional costume","honduras folkloric dress colorful",
    "baleadas honduras street food","sopa de caracol honduras seafood","honduras tamales food culture","honduras traditional food cuisine",
    "scarlet macaw honduras bird","jaguar honduras wildlife","manatee central america water","honduras tropical wildlife nature",
  ]},
  10: { country: "El Salvador", flag: "🇸🇻", flagColors: ["#0F47AF","#FFFFFF","#0F47AF"], palette: ["#228B22","#FF6347","#1E90FF"], pexelsQueries: [
    "xuc dance el salvador folk","el salvador traditional folk dance","el salvador carnival parade costume","el salvador independence cultural dance",
    "el imposible national park el salvador","el salvador volcano landscape","el salvador lake coatepeque","el salvador pacific coast beach",
    "el salvador traditional folk costume blouse","el salvador colorful festival dress","el salvador indigenous craft textile","el salvador folkloric costume colorful",
    "pupusas el salvador street food","yuca frita el salvador food","el salvador tamales food","el salvador traditional cuisine",
    "baird tapir central america wildlife","toucan central america bird","howler monkey central america jungle","el salvador tropical wildlife nature",
  ]},
  // ── Nicaragua — Travel World 🇳🇮 blue/white/blue ─────────────────────────────
  11: { country: "Nicaragua", flag: "🇳🇮", flagColors: ["#3D6CC0","#FFFFFF","#3D6CC0"], palette: ["#FF4500","#00CED1","#FF8C00"], pexelsQueries: [
    "palo de mayo nicaragua dance","nicaragua traditional folk dance","nicaragua marimba music dance","nicaragua carnival costume parade",
    "masaya volcano nicaragua crater","corn islands nicaragua caribbean","lake nicaragua ometepe island","nicaragua pacific coast beach",
    "nicaragua indigenous folk dress traditional","nicaragua colonial era folk costume","nicaragua traditional festival dress","nicaragua folkloric costume colorful",
    "nacatamales nicaragua food","vigoron nicaragua street food","gallo pinto nicaragua rice beans","nicaragua traditional cuisine food",
    "howler monkey nicaragua jungle","sea turtle nicaragua pacific","ocelot central america wildlife","nicaragua tropical bird wildlife",
  ]},
  12: { country: "Nicaragua", flag: "🇳🇮", flagColors: ["#3D6CC0","#FFFFFF","#3D6CC0"], palette: ["#FF4500","#00CED1","#FF8C00"], pexelsQueries: [
    "palo de mayo nicaragua dance","nicaragua traditional folk dance","nicaragua marimba music dance","nicaragua carnival costume parade",
    "masaya volcano nicaragua crater","corn islands nicaragua caribbean","lake nicaragua ometepe island","nicaragua pacific coast beach",
    "nicaragua indigenous folk dress traditional","nicaragua colonial era folk costume","nicaragua traditional festival dress","nicaragua folkloric costume colorful",
    "nacatamales nicaragua food","vigoron nicaragua street food","gallo pinto nicaragua rice beans","nicaragua traditional cuisine food",
    "howler monkey nicaragua jungle","sea turtle nicaragua pacific","ocelot central america wildlife","nicaragua tropical bird wildlife",
  ]},
  13: { country: "Nicaragua", flag: "🇳🇮", flagColors: ["#3D6CC0","#FFFFFF","#3D6CC0"], palette: ["#FF4500","#00CED1","#FF8C00"], pexelsQueries: [
    "palo de mayo nicaragua dance","nicaragua traditional folk dance","nicaragua marimba music dance","nicaragua carnival costume parade",
    "masaya volcano nicaragua crater","corn islands nicaragua caribbean","lake nicaragua ometepe island","nicaragua pacific coast beach",
    "nicaragua indigenous folk dress traditional","nicaragua colonial era folk costume","nicaragua traditional festival dress","nicaragua folkloric costume colorful",
    "nacatamales nicaragua food","vigoron nicaragua street food","gallo pinto nicaragua rice beans","nicaragua traditional cuisine food",
    "howler monkey nicaragua jungle","sea turtle nicaragua pacific","ocelot central america wildlife","nicaragua tropical bird wildlife",
  ]},
  // ── Costa Rica — Time World 🇨🇷 blue/white/red/white/blue ────────────────────
  14: { country: "Costa Rica", flag: "🇨🇷", flagColors: ["#002B7F","#FFFFFF","#CE1126"], palette: ["#00FF7F","#32CD32","#008080"], pexelsQueries: [
    "punto guanacasteco costa rica dance","costa rica traditional folk dance","costa rica carnival parade dance","costa rica folkloric costume dance",
    "arenal volcano costa rica","monteverde cloud forest costa rica","costa rica beach pacific sunset","costa rica waterfall jungle tropical",
    "guanacaste dress costa rica traditional","pollera costa rica folk costume","costa rica folkloric dance dress","costa rica traditional festival costume",
    "gallo pinto costa rica breakfast","casado costa rica food plate","arroz con leche costa rica dessert","costa rica typical food culture",
    "sloth costa rica jungle","toucan costa rica rainforest","scarlet macaw costa rica bird","jaguar costa rica wildlife",
  ]},
  15: { country: "Costa Rica", flag: "🇨🇷", flagColors: ["#002B7F","#FFFFFF","#CE1126"], palette: ["#00FF7F","#32CD32","#008080"], pexelsQueries: [
    "punto guanacasteco costa rica dance","costa rica traditional folk dance","costa rica carnival parade dance","costa rica folkloric costume dance",
    "arenal volcano costa rica","monteverde cloud forest costa rica","costa rica beach pacific sunset","costa rica waterfall jungle tropical",
    "guanacaste dress costa rica traditional","pollera costa rica folk costume","costa rica folkloric dance dress","costa rica traditional festival costume",
    "gallo pinto costa rica breakfast","casado costa rica food plate","arroz con leche costa rica dessert","costa rica typical food culture",
    "sloth costa rica jungle","toucan costa rica rainforest","scarlet macaw costa rica bird","jaguar costa rica wildlife",
  ]},
  16: { country: "Costa Rica", flag: "🇨🇷", flagColors: ["#002B7F","#FFFFFF","#CE1126"], palette: ["#00FF7F","#32CD32","#008080"], pexelsQueries: [
    "punto guanacasteco costa rica dance","costa rica traditional folk dance","costa rica carnival parade dance","costa rica folkloric costume dance",
    "arenal volcano costa rica","monteverde cloud forest costa rica","costa rica beach pacific sunset","costa rica waterfall jungle tropical",
    "guanacaste dress costa rica traditional","pollera costa rica folk costume","costa rica folkloric dance dress","costa rica traditional festival costume",
    "gallo pinto costa rica breakfast","casado costa rica food plate","arroz con leche costa rica dessert","costa rica typical food culture",
    "sloth costa rica jungle","toucan costa rica rainforest","scarlet macaw costa rica bird","jaguar costa rica wildlife",
  ]},
  17: { country: "Costa Rica", flag: "🇨🇷", flagColors: ["#002B7F","#FFFFFF","#CE1126"], palette: ["#00FF7F","#32CD32","#008080"], pexelsQueries: [
    "punto guanacasteco costa rica dance","costa rica traditional folk dance","costa rica carnival parade dance","costa rica folkloric costume dance",
    "arenal volcano costa rica","monteverde cloud forest costa rica","costa rica beach pacific sunset","costa rica waterfall jungle tropical",
    "guanacaste dress costa rica traditional","pollera costa rica folk costume","costa rica folkloric dance dress","costa rica traditional festival costume",
    "gallo pinto costa rica breakfast","casado costa rica food plate","arroz con leche costa rica dessert","costa rica typical food culture",
    "sloth costa rica jungle","toucan costa rica rainforest","scarlet macaw costa rica bird","jaguar costa rica wildlife",
  ]},
  // ── Panama — Feelings Color World 🇵🇦 red/white/blue ─────────────────────────
  18: { country: "Panama", flag: "🇵🇦", flagColors: ["#CC0001","#FFFFFF","#003580"], palette: ["#FFD700","#DC143C","#1E90FF"], pexelsQueries: [
    "tamborito dance panama traditional","congo dance panama afro","panama folkloric festival dance costume","panama carnival parade dancers",
    "bocas del toro panama caribbean","darien rainforest panama jungle","san blas islands panama guna","panama canal tropical landscape",
    "pollera dress panama national costume","mola shirt guna indigenous panama","panama carnival costume elaborate","panama folkloric traditional costume",
    "sancocho panama soup traditional","arroz con pollo panama food","ceviche panama seafood","panama traditional food cuisine",
    "harpy eagle panama bird","capuchin monkey panama jungle","sloth panama wildlife","panama tropical wildlife nature",
  ]},
  19: { country: "Panama", flag: "🇵🇦", flagColors: ["#CC0001","#FFFFFF","#003580"], palette: ["#FFD700","#DC143C","#1E90FF"], pexelsQueries: [
    "tamborito dance panama traditional","congo dance panama afro","panama folkloric festival dance costume","panama carnival parade dancers",
    "bocas del toro panama caribbean","darien rainforest panama jungle","san blas islands panama guna","panama canal tropical landscape",
    "pollera dress panama national costume","mola shirt guna indigenous panama","panama carnival costume elaborate","panama folkloric traditional costume",
    "sancocho panama soup traditional","arroz con pollo panama food","ceviche panama seafood","panama traditional food cuisine",
    "harpy eagle panama bird","capuchin monkey panama jungle","sloth panama wildlife","panama tropical wildlife nature",
  ]},
  20: { country: "Panama", flag: "🇵🇦", flagColors: ["#CC0001","#FFFFFF","#003580"], palette: ["#FFD700","#DC143C","#1E90FF"], pexelsQueries: [
    "tamborito dance panama traditional","congo dance panama afro","panama folkloric festival dance costume","panama carnival parade dancers",
    "bocas del toro panama caribbean","darien rainforest panama jungle","san blas islands panama guna","panama canal tropical landscape",
    "pollera dress panama national costume","mola shirt guna indigenous panama","panama carnival costume elaborate","panama folkloric traditional costume",
    "sancocho panama soup traditional","arroz con pollo panama food","ceviche panama seafood","panama traditional food cuisine",
    "harpy eagle panama bird","capuchin monkey panama jungle","sloth panama wildlife","panama tropical wildlife nature",
  ]},
  // ── Caribbean — Food World ────────────────────────────────────────────────────
  21: { country: "Cuba", flag: "🇨🇺", flagColors: ["#002A8F","#FFFFFF","#CF142B"], palette: ["#FFD700","#CC0000","#1E90FF"], pexelsQueries: [
    "salsa dance cuba havana","rumba dance cuba afrocuban","cuba son cubano music dance","cuba carnival santiago dance",
    "vinales valley cuba tobacco","varadero beach cuba turquoise","sierra maestra cuba mountains","havana malecon cuba seafront",
    "guayabera shirt cuba traditional","cuba folkloric dance outfit","cuba carnival costume colorful","cuba rumba dance dress",
    "ropa vieja cuba traditional dish","tostones cuba fried plantain","moros y cristianos cuba rice beans","cuba street food culture",
    "cuban crocodile wildlife","bee hummingbird cuba smallest bird","cuban hutia rodent wildlife","cuba tropical bird wildlife",
  ]},
  22: { country: "Dominican Republic", flag: "🇩🇴", flagColors: ["#002D62","#FFFFFF","#CF142B"], palette: ["#1E90FF","#CC0000","#FFD700"], pexelsQueries: [
    "merengue dance dominican republic","bachata dance dominican republic","dominican republic carnival parade costume","dominican republic folk dance festival",
    "punta cana beach dominican republic","samana peninsula dominican republic","dominican republic mountains scenery","dominican republic waterfall nature",
    "dominican republic folk festival costume","dominican republic carnaval attire colorful","dominican republic traditional dress","dominican republic carnival mask costume",
    "mangu dominican republic breakfast","sancocho dominican republic stew","mofongo dominican republic food","dominican republic traditional food culture",
    "hispaniolan solenodon wildlife","dominican republic parrot bird","iguana dominican republic wildlife","dominican republic tropical nature",
  ]},
  23: { country: "Puerto Rico", flag: "🇵🇷", flagColors: ["#EF3340","#FFFFFF","#0A3161"], palette: ["#CC0000","#1E90FF","#FFD700"], pexelsQueries: [
    "salsa dance puerto rico","bomba plena dance puerto rico","puerto rico carnival parade costume","puerto rico folk dance festival",
    "el yunque rainforest puerto rico","bioluminescent bay puerto rico","puerto rico beach caribbean","old san juan colorful puerto rico",
    "bomba dress puerto rico traditional","puerto rico folkloric costume","puerto rico carnival costume colorful","puerto rico festival traditional attire",
    "mofongo puerto rico plantain food","pasteles puerto rico food","arroz con gandules puerto rico","puerto rico street food culture",
    "coqui frog puerto rico","manatee puerto rico sea","iguana puerto rico wildlife","puerto rico tropical bird nature",
  ]},
  // ── Colombia — AR World 🇨🇴 yellow/blue/red ──────────────────────────────────
  24: { country: "Colombia", flag: "🇨🇴", flagColors: ["#FCD116","#003087","#CE1126"], palette: ["#1E90FF","#FFD700","#CC0000"], pexelsQueries: [
    "cumbia dance colombia skirts","vallenato music colombia dance","colombia feria cali salsa dance","colombia carnaval barranquilla parade dance",
    "amazon rainforest colombia river","cocora valley colombia wax palms","colombia andes mountains landscape","cartagena colombia colorful walled city",
    "pollera dress colombia traditional","sombrero vueltiao hat colombia","colombia folkloric costume festival","colombia wayuu mochila bag traditional",
    "arepas colombia street food","bandeja paisa colombia dish","empanadas colombia food","colombia sancocho traditional food",
    "andean condor colombia bird","jaguar colombia amazon","pink river dolphin amazon colombia","colombia tropical wildlife nature",
  ]},
  25: { country: "Colombia", flag: "🇨🇴", flagColors: ["#FCD116","#003087","#CE1126"], palette: ["#1E90FF","#FFD700","#CC0000"], pexelsQueries: [
    "cumbia dance colombia skirts","vallenato music colombia dance","colombia feria cali salsa dance","colombia carnaval barranquilla parade dance",
    "amazon rainforest colombia river","cocora valley colombia wax palms","colombia andes mountains landscape","cartagena colombia colorful walled city",
    "pollera dress colombia traditional","sombrero vueltiao hat colombia","colombia folkloric costume festival","colombia wayuu mochila bag traditional",
    "arepas colombia street food","bandeja paisa colombia dish","empanadas colombia food","colombia sancocho traditional food",
    "andean condor colombia bird","jaguar colombia amazon","pink river dolphin amazon colombia","colombia tropical wildlife nature",
  ]},
  26: { country: "Colombia", flag: "🇨🇴", flagColors: ["#FCD116","#003087","#CE1126"], palette: ["#1E90FF","#FFD700","#CC0000"], pexelsQueries: [
    "cumbia dance colombia skirts","vallenato music colombia dance","colombia feria cali salsa dance","colombia carnaval barranquilla parade dance",
    "amazon rainforest colombia river","cocora valley colombia wax palms","colombia andes mountains landscape","cartagena colombia colorful walled city",
    "pollera dress colombia traditional","sombrero vueltiao hat colombia","colombia folkloric costume festival","colombia wayuu mochila bag traditional",
    "arepas colombia street food","bandeja paisa colombia dish","empanadas colombia food","colombia sancocho traditional food",
    "andean condor colombia bird","jaguar colombia amazon","pink river dolphin amazon colombia","colombia tropical wildlife nature",
  ]},
  27: { country: "Colombia", flag: "🇨🇴", flagColors: ["#FCD116","#003087","#CE1126"], palette: ["#1E90FF","#FFD700","#CC0000"], pexelsQueries: [
    "cumbia dance colombia skirts","vallenato music colombia dance","colombia feria cali salsa dance","colombia carnaval barranquilla parade dance",
    "amazon rainforest colombia river","cocora valley colombia wax palms","colombia andes mountains landscape","cartagena colombia colorful walled city",
    "pollera dress colombia traditional","sombrero vueltiao hat colombia","colombia folkloric costume festival","colombia wayuu mochila bag traditional",
    "arepas colombia street food","bandeja paisa colombia dish","empanadas colombia food","colombia sancocho traditional food",
    "andean condor colombia bird","jaguar colombia amazon","pink river dolphin amazon colombia","colombia tropical wildlife nature",
  ]},
  // ── Venezuela — ER World 🇻🇪 yellow/blue/red ─────────────────────────────────
  28: { country: "Venezuela", flag: "🇻🇪", flagColors: ["#CF142B","#00247D","#FCD116"], palette: ["#DAA520","#228B22","#CC0000"], pexelsQueries: [
    "joropo dance venezuela harp","llanero venezuela folk dance","venezuela traditional festival dance","venezuela gaita music dance",
    "angel falls venezuela aerial","los roques venezuela caribbean","venezuela andes mountains","canaima tepui venezuela tabletop",
    "llanero attire venezuela traditional","venezuela festival dress colorful","venezuela folk costume traditional","venezuela carnival costume colorful",
    "arepa venezuela street food","pabellon criollo venezuela dish","venezuela empanadas food","venezuela hallaca tamale food",
    "orinoco crocodile venezuela wildlife","jaguar venezuela jungle","capybara venezuela wetland","venezuela tropical bird nature",
  ]},
  29: { country: "Venezuela", flag: "🇻🇪", flagColors: ["#CF142B","#00247D","#FCD116"], palette: ["#DAA520","#228B22","#CC0000"], pexelsQueries: [
    "joropo dance venezuela harp","llanero venezuela folk dance","venezuela traditional festival dance","venezuela gaita music dance",
    "angel falls venezuela aerial","los roques venezuela caribbean","venezuela andes mountains","canaima tepui venezuela tabletop",
    "llanero attire venezuela traditional","venezuela festival dress colorful","venezuela folk costume traditional","venezuela carnival costume colorful",
    "arepa venezuela street food","pabellon criollo venezuela dish","venezuela empanadas food","venezuela hallaca tamale food",
    "orinoco crocodile venezuela wildlife","jaguar venezuela jungle","capybara venezuela wetland","venezuela tropical bird nature",
  ]},
  30: { country: "Venezuela", flag: "🇻🇪", flagColors: ["#CF142B","#00247D","#FCD116"], palette: ["#DAA520","#228B22","#CC0000"], pexelsQueries: [
    "joropo dance venezuela harp","llanero venezuela folk dance","venezuela traditional festival dance","venezuela gaita music dance",
    "angel falls venezuela aerial","los roques venezuela caribbean","venezuela andes mountains","canaima tepui venezuela tabletop",
    "llanero attire venezuela traditional","venezuela festival dress colorful","venezuela folk costume traditional","venezuela carnival costume colorful",
    "arepa venezuela street food","pabellon criollo venezuela dish","venezuela empanadas food","venezuela hallaca tamale food",
    "orinoco crocodile venezuela wildlife","jaguar venezuela jungle","capybara venezuela wetland","venezuela tropical bird nature",
  ]},
  // ── Ecuador — IR World 🇪🇨 yellow/blue/red ───────────────────────────────────
  31: { country: "Ecuador", flag: "🇪🇨", flagColors: ["#FFD100","#003DA5","#FF0000"], palette: ["#000080","#DC143C","#FFD700"], pexelsQueries: [
    "sanjuanito dance ecuador andean","ecuador inti raymi festival dance","ecuador traditional folk dance","ecuador carnival dance costume",
    "galapagos islands ecuador wildlife","ecuador andes mountains landscape","ecuador amazon basin jungle","ecuador quito colonial architecture",
    "otavalo indigenous attire ecuador","ecuador embroidered poncho traditional","ecuador folkloric costume festival","ecuador traditional festival dress",
    "ceviche ecuador seafood","llapingachos ecuador potato cakes","hornado roast pork ecuador","ecuador traditional food cuisine",
    "galapagos tortoise wildlife","andean condor ecuador bird","marine iguana galapagos","blue footed booby galapagos",
  ]},
  32: { country: "Ecuador", flag: "🇪🇨", flagColors: ["#FFD100","#003DA5","#FF0000"], palette: ["#000080","#DC143C","#FFD700"], pexelsQueries: [
    "sanjuanito dance ecuador andean","ecuador inti raymi festival dance","ecuador traditional folk dance","ecuador carnival dance costume",
    "galapagos islands ecuador wildlife","ecuador andes mountains landscape","ecuador amazon basin jungle","ecuador quito colonial architecture",
    "otavalo indigenous attire ecuador","ecuador embroidered poncho traditional","ecuador folkloric costume festival","ecuador traditional festival dress",
    "ceviche ecuador seafood","llapingachos ecuador potato cakes","hornado roast pork ecuador","ecuador traditional food cuisine",
    "galapagos tortoise wildlife","andean condor ecuador bird","marine iguana galapagos","blue footed booby galapagos",
  ]},
  33: { country: "Ecuador", flag: "🇪🇨", flagColors: ["#FFD100","#003DA5","#FF0000"], palette: ["#000080","#DC143C","#FFD700"], pexelsQueries: [
    "sanjuanito dance ecuador andean","ecuador inti raymi festival dance","ecuador traditional folk dance","ecuador carnival dance costume",
    "galapagos islands ecuador wildlife","ecuador andes mountains landscape","ecuador amazon basin jungle","ecuador quito colonial architecture",
    "otavalo indigenous attire ecuador","ecuador embroidered poncho traditional","ecuador folkloric costume festival","ecuador traditional festival dress",
    "ceviche ecuador seafood","llapingachos ecuador potato cakes","hornado roast pork ecuador","ecuador traditional food cuisine",
    "galapagos tortoise wildlife","andean condor ecuador bird","marine iguana galapagos","blue footed booby galapagos",
  ]},
  // ── Peru — Quick Past World 🇵🇪 red/white/red ────────────────────────────────
  34: { country: "Peru", flag: "🇵🇪", flagColors: ["#D91023","#FFFFFF","#D91023"], palette: ["#FF1493","#CC0000","#FFD700"], pexelsQueries: [
    "marinera dance peru coastal couple","huayno dance peru andean","peru inti raymi festival dance","peru diablada puno dance costume",
    "machu picchu peru sunrise mist","colca canyon peru condor flight","sacred valley peru inca terraces","rainbow mountain peru vinicunca",
    "andean poncho peru traditional","peru traditional skirt colorful","chullo hat peru andean","peru inca ceremony costume",
    "ceviche peru seafood lime","lomo saltado peru stir fry","anticuchos peru street food","peru traditional food culture",
    "llama peru machu picchu","alpaca peru andean highland","vicuna peru highland wildlife","andean condor peru colca",
  ]},
  35: { country: "Peru", flag: "🇵🇪", flagColors: ["#D91023","#FFFFFF","#D91023"], palette: ["#FF1493","#CC0000","#FFD700"], pexelsQueries: [
    "marinera dance peru coastal couple","huayno dance peru andean","peru inti raymi festival dance","peru diablada puno dance costume",
    "machu picchu peru sunrise mist","colca canyon peru condor flight","sacred valley peru inca terraces","rainbow mountain peru vinicunca",
    "andean poncho peru traditional","peru traditional skirt colorful","chullo hat peru andean","peru inca ceremony costume",
    "ceviche peru seafood lime","lomo saltado peru stir fry","anticuchos peru street food","peru traditional food culture",
    "llama peru machu picchu","alpaca peru andean highland","vicuna peru highland wildlife","andean condor peru colca",
  ]},
  36: { country: "Peru", flag: "🇵🇪", flagColors: ["#D91023","#FFFFFF","#D91023"], palette: ["#FF1493","#CC0000","#FFD700"], pexelsQueries: [
    "marinera dance peru coastal couple","huayno dance peru andean","peru inti raymi festival dance","peru diablada puno dance costume",
    "machu picchu peru sunrise mist","colca canyon peru condor flight","sacred valley peru inca terraces","rainbow mountain peru vinicunca",
    "andean poncho peru traditional","peru traditional skirt colorful","chullo hat peru andean","peru inca ceremony costume",
    "ceviche peru seafood lime","lomo saltado peru stir fry","anticuchos peru street food","peru traditional food culture",
    "llama peru machu picchu","alpaca peru andean highland","vicuna peru highland wildlife","andean condor peru colca",
  ]},
  37: { country: "Peru", flag: "🇵🇪", flagColors: ["#D91023","#FFFFFF","#D91023"], palette: ["#FF1493","#CC0000","#FFD700"], pexelsQueries: [
    "marinera dance peru coastal couple","huayno dance peru andean","peru inti raymi festival dance","peru diablada puno dance costume",
    "machu picchu peru sunrise mist","colca canyon peru condor flight","sacred valley peru inca terraces","rainbow mountain peru vinicunca",
    "andean poncho peru traditional","peru traditional skirt colorful","chullo hat peru andean","peru inca ceremony costume",
    "ceviche peru seafood lime","lomo saltado peru stir fry","anticuchos peru street food","peru traditional food culture",
    "llama peru machu picchu","alpaca peru andean highland","vicuna peru highland wildlife","andean condor peru colca",
  ]},
  // ── Bolivia — Long Past World 🇧🇴 red/yellow/green ───────────────────────────
  38: { country: "Bolivia", flag: "🇧🇴", flagColors: ["#D52B1E","#F9E300","#007A33"], palette: ["#FF4500","#00CC00","#8B4513"], pexelsQueries: [
    "caporales dance bolivia costume","diablada dance bolivia oruro carnival","bolivia oruro carnival parade","morenada dance bolivia costume",
    "salar de uyuni bolivia salt flat","lake titicaca bolivia sunset","bolivia andes mountains landscape","bolivia altiplano dramatic landscape",
    "cholita skirt bolivia traditional","bolivia andean poncho traditional","cholita bowler hat bolivia","bolivia carnival costume elaborate",
    "salteñas bolivia pastry food","pique a lo macho bolivia dish","quinoa bolivia food culture","bolivia traditional food cuisine",
    "llama bolivia salt flat","vicuna bolivia highland wildlife","andean condor bolivia bird","flamingo salar uyuni bolivia pink",
  ]},
  39: { country: "Bolivia", flag: "🇧🇴", flagColors: ["#D52B1E","#F9E300","#007A33"], palette: ["#FF4500","#00CC00","#8B4513"], pexelsQueries: [
    "caporales dance bolivia costume","diablada dance bolivia oruro carnival","bolivia oruro carnival parade","morenada dance bolivia costume",
    "salar de uyuni bolivia salt flat","lake titicaca bolivia sunset","bolivia andes mountains landscape","bolivia altiplano dramatic landscape",
    "cholita skirt bolivia traditional","bolivia andean poncho traditional","cholita bowler hat bolivia","bolivia carnival costume elaborate",
    "salteñas bolivia pastry food","pique a lo macho bolivia dish","quinoa bolivia food culture","bolivia traditional food cuisine",
    "llama bolivia salt flat","vicuna bolivia highland wildlife","andean condor bolivia bird","flamingo salar uyuni bolivia pink",
  ]},
  40: { country: "Bolivia", flag: "🇧🇴", flagColors: ["#D52B1E","#F9E300","#007A33"], palette: ["#FF4500","#00CC00","#8B4513"], pexelsQueries: [
    "caporales dance bolivia costume","diablada dance bolivia oruro carnival","bolivia oruro carnival parade","morenada dance bolivia costume",
    "salar de uyuni bolivia salt flat","lake titicaca bolivia sunset","bolivia andes mountains landscape","bolivia altiplano dramatic landscape",
    "cholita skirt bolivia traditional","bolivia andean poncho traditional","cholita bowler hat bolivia","bolivia carnival costume elaborate",
    "salteñas bolivia pastry food","pique a lo macho bolivia dish","quinoa bolivia food culture","bolivia traditional food cuisine",
    "llama bolivia salt flat","vicuna bolivia highland wildlife","andean condor bolivia bird","flamingo salar uyuni bolivia pink",
  ]},
  // ── Paraguay — Future World 🇵🇾 red/white/blue ───────────────────────────────
  41: { country: "Paraguay", flag: "🇵🇾", flagColors: ["#D52B1E","#FFFFFF","#0038A8"], palette: ["#FFFFFF","#CC0000","#1E90FF"], pexelsQueries: [
    "paraguayan polka dance traditional","guarania music paraguay dance","paraguay folk dance festival","paraguay traditional music performance",
    "chaco region paraguay nature landscape","iguazu falls paraguay argentina","pantanal paraguay wetland nature","paraguay river landscape nature",
    "guarani indigenous clothing paraguay","paraguay traditional folk attire","paraguay nanduti lace craft colorful","paraguay festival traditional costume",
    "sopa paraguaya cornbread food","chipa paraguay bread food","mbeju paraguay cassava food","paraguay traditional food cuisine",
    "tapir paraguay wildlife","capybara paraguay wetland","jaguar paraguay chaco wildlife","toucan paraguay jungle bird",
  ]},
  42: { country: "Paraguay", flag: "🇵🇾", flagColors: ["#D52B1E","#FFFFFF","#0038A8"], palette: ["#FFFFFF","#CC0000","#1E90FF"], pexelsQueries: [
    "paraguayan polka dance traditional","guarania music paraguay dance","paraguay folk dance festival","paraguay traditional music performance",
    "chaco region paraguay nature landscape","iguazu falls paraguay argentina","pantanal paraguay wetland nature","paraguay river landscape nature",
    "guarani indigenous clothing paraguay","paraguay traditional folk attire","paraguay nanduti lace craft colorful","paraguay festival traditional costume",
    "sopa paraguaya cornbread food","chipa paraguay bread food","mbeju paraguay cassava food","paraguay traditional food cuisine",
    "tapir paraguay wildlife","capybara paraguay wetland","jaguar paraguay chaco wildlife","toucan paraguay jungle bird",
  ]},
  // ── Uruguay — Conditional World 🇺🇾 white/blue stripes ───────────────────────
  43: { country: "Uruguay", flag: "🇺🇾", flagColors: ["#FFFFFF","#0038A8","#FFFFFF"], palette: ["#20B2AA","#FF8C00","#FFD700"], pexelsQueries: [
    "candombe drumming uruguay carnival","llamadas parade uruguay montevideo","uruguay murga carnival performance","uruguay folkloric dance traditional",
    "punta del este beach uruguay","uruguay pampas grassland landscape","uruguay wetland nature birds","colonia del sacramento uruguay historic",
    "gaucho attire uruguay traditional","uruguay folkloric dress carnival","uruguay candombe carnival costume","uruguay traditional festival dress",
    "chivito sandwich uruguay food","asado barbecue uruguay","empanadas uruguay food","uruguay traditional food culture",
    "capybara uruguay wetland","southern lapwing bird uruguay","pampas deer uruguay wildlife","uruguay coastal wildlife nature",
  ]},
  44: { country: "Uruguay", flag: "🇺🇾", flagColors: ["#FFFFFF","#0038A8","#FFFFFF"], palette: ["#20B2AA","#FF8C00","#FFD700"], pexelsQueries: [
    "candombe drumming uruguay carnival","llamadas parade uruguay montevideo","uruguay murga carnival performance","uruguay folkloric dance traditional",
    "punta del este beach uruguay","uruguay pampas grassland landscape","uruguay wetland nature birds","colonia del sacramento uruguay historic",
    "gaucho attire uruguay traditional","uruguay folkloric dress carnival","uruguay candombe carnival costume","uruguay traditional festival dress",
    "chivito sandwich uruguay food","asado barbecue uruguay","empanadas uruguay food","uruguay traditional food culture",
    "capybara uruguay wetland","southern lapwing bird uruguay","pampas deer uruguay wildlife","uruguay coastal wildlife nature",
  ]},
  // ── Chile — Pronoun World 🇨🇱 red/white/blue ─────────────────────────────────
  45: { country: "Chile", flag: "🇨🇱", flagColors: ["#D52B1E","#FFFFFF","#0039A6"], palette: ["#1E90FF","#DC143C","#FFFFFF"], pexelsQueries: [
    "cueca dance chile national couple","mapuche dance chile traditional","chile fiestas patrias celebration","huaso rodeo chile traditional",
    "atacama desert chile dramatic landscape","torres del paine chile patagonia","chile andes mountains snow","chile easter island moai statues",
    "huaso attire chile traditional","mapuche traditional clothing chile","chile folkloric costume cueca","chile traditional festival dress",
    "empanadas chile food baked","pastel de choclo chile dish","cazuela chile stew food","chile traditional food culture",
    "guanaco chile patagonia wildlife","condor chile andes soaring","puma chile patagonia wildlife","humboldt penguin chile coast",
  ]},
  46: { country: "Chile", flag: "🇨🇱", flagColors: ["#D52B1E","#FFFFFF","#0039A6"], palette: ["#1E90FF","#DC143C","#FFFFFF"], pexelsQueries: [
    "cueca dance chile national couple","mapuche dance chile traditional","chile fiestas patrias celebration","huaso rodeo chile traditional",
    "atacama desert chile dramatic landscape","torres del paine chile patagonia","chile andes mountains snow","chile easter island moai statues",
    "huaso attire chile traditional","mapuche traditional clothing chile","chile folkloric costume cueca","chile traditional festival dress",
    "empanadas chile food baked","pastel de choclo chile dish","cazuela chile stew food","chile traditional food culture",
    "guanaco chile patagonia wildlife","condor chile andes soaring","puma chile patagonia wildlife","humboldt penguin chile coast",
  ]},
  // ── Argentina — Advanced World 🇦🇷 light blue/white ──────────────────────────
  47: { country: "Argentina", flag: "🇦🇷", flagColors: ["#74ACDF","#FFFFFF","#74ACDF"], palette: ["#74ACDF","#FFFFFF","#FFD700"], pexelsQueries: [
    "tango dance argentina buenos aires","chacarera dance argentina folk","argentina gaucho malambo dance","argentina folklore festival dance cosquin",
    "patagonia glacier argentina perito moreno","iguazu falls argentina aerial","argentina pampas grassland landscape","mendoza argentina vineyard mountains",
    "gaucho attire argentina traditional","argentina folkloric dress festival","tango dress argentina couple","argentina carnival costume colorful",
    "asado argentina barbecue traditional","empanadas argentina food","milanesa argentina food breaded","dulce de leche argentina dessert",
    "rhea argentina pampas bird","puma argentina patagonia wildlife","jaguar argentina wildlife","magellanic penguin argentina coast",
  ]},
  48: { country: "Argentina", flag: "🇦🇷", flagColors: ["#74ACDF","#FFFFFF","#74ACDF"], palette: ["#74ACDF","#FFFFFF","#FFD700"], pexelsQueries: [
    "tango dance argentina buenos aires","chacarera dance argentina folk","argentina gaucho malambo dance","argentina folklore festival dance cosquin",
    "patagonia glacier argentina perito moreno","iguazu falls argentina aerial","argentina pampas grassland landscape","mendoza argentina vineyard mountains",
    "gaucho attire argentina traditional","argentina folkloric dress festival","tango dress argentina couple","argentina carnival costume colorful",
    "asado argentina barbecue traditional","empanadas argentina food","milanesa argentina food breaded","dulce de leche argentina dessert",
    "rhea argentina pampas bird","puma argentina patagonia wildlife","jaguar argentina wildlife","magellanic penguin argentina coast",
  ]},
  49: { country: "Argentina", flag: "🇦🇷", flagColors: ["#74ACDF","#FFFFFF","#74ACDF"], palette: ["#74ACDF","#FFFFFF","#FFD700"], pexelsQueries: [
    "tango dance argentina buenos aires","chacarera dance argentina folk","argentina gaucho malambo dance","argentina folklore festival dance cosquin",
    "patagonia glacier argentina perito moreno","iguazu falls argentina aerial","argentina pampas grassland landscape","mendoza argentina vineyard mountains",
    "gaucho attire argentina traditional","argentina folkloric dress festival","tango dress argentina couple","argentina carnival costume colorful",
    "asado argentina barbecue traditional","empanadas argentina food","milanesa argentina food breaded","dulce de leche argentina dessert",
    "rhea argentina pampas bird","puma argentina patagonia wildlife","jaguar argentina wildlife","magellanic penguin argentina coast",
  ]},
  50: { country: "Argentina", flag: "🇦🇷", flagColors: ["#74ACDF","#FFFFFF","#74ACDF"], palette: ["#74ACDF","#FFFFFF","#FFD700"], pexelsQueries: [
    "tango dance argentina buenos aires","chacarera dance argentina folk","argentina gaucho malambo dance","argentina folklore festival dance cosquin",
    "patagonia glacier argentina perito moreno","iguazu falls argentina aerial","argentina pampas grassland landscape","mendoza argentina vineyard mountains",
    "gaucho attire argentina traditional","argentina folkloric dress festival","tango dress argentina couple","argentina carnival costume colorful",
    "asado argentina barbecue traditional","empanadas argentina food","milanesa argentina food breaded","dulce de leche argentina dessert",
    "rhea argentina pampas bird","puma argentina patagonia wildlife","jaguar argentina wildlife","magellanic penguin argentina coast",
  ]},
}

const FALLBACK: CountryData = { country: "Latin America", flag: "🌎", flagColors: ["#FF0000","#FFFFFF","#228B22"], palette: ["#FF00FF","#00FFFF","#FFD700"], pexelsQueries: ["latin america colorful festival dance","latin america carnival parade","latin america traditional culture","latin america indigenous ceremony"] }

function getCountry(n: number): CountryData { return SONG_COUNTRY[n] ?? FALLBACK }
function pickQuery(c: CountryData): string { return c.pexelsQueries[Math.floor(Math.random() * c.pexelsQueries.length)] }

const PEXELS_KEY = "QRejvnDTjk8yS9g9TWg3PNP3xQVpHJMuWimILfdpOUVYqnFygj58czF1"

// ─────────────────────────────────────────────
// Per-lyric-line video queries for songs with visual vocab
// LYRIC_VIDEO_QUERIES[songNumber][lineId] → Pexels search query
// Lines NOT listed inherit the previous listed line's video (no random swaps)
// ─────────────────────────────────────────────
const LYRIC_VIDEO_QUERIES: Record<number, Record<number, string>> = {

  // ── Song 4: Las partes del cuerpo y cara ──────────────────────────────
  4: {
    0:  "children dancing happy",                        // intro "Vamos a tocar..."
    1:  "person touching head hair neck",                // cabeza, pelo, cuello, garganta
    2:  "person shoulders arms stretching",              // hombros, brazos
    3:  "hands fingers wrists close up",                 // codos, dedos, muñecas, manos
    4:  "person back belly torso",                       // espalda, barriga
    5:  "person legs knees feet walking",                // pierna, rodilla, pies
    6:  "person touching face smiling",                  // intro cara
    7:  "person eyes nose lips teeth smile",             // ojos, nariz, labios, dientes
    8:  "person ear mouth face",                         // oreja, boca
    9:  "person tongue forehead face",                   // lengua, frente
    10: "children dancing celebration",                  // baila baila baila
    11: "children dancing celebration",
    // repeat
    12: "children dancing happy",
    13: "person touching head hair neck",
    14: "person shoulders arms stretching",
    15: "hands fingers wrists close up",
    16: "person back belly torso",
    17: "person legs knees feet walking",
    18: "person touching face smiling",
    19: "person eyes nose lips teeth smile",
    20: "person ear mouth face",
    21: "person tongue forehead face",
    22: "children dancing celebration",
  },

  // ── Song 5: Ropa Linda ────────────────────────────────────────────────
  5: {
    0:  "shirt pants clothing fashion",                  // camisa, pantalón
    1:  "shoes belt accessories",                        // zapatos, cinturón
    2:  "hat gloves socks winter clothing",              // gorra, guantes, calcetín
    3:  "colorful clothes children fashion",             // ropa linda para mí
    4:  "skirt sweater jacket fashion",                  // falda, suéter, chaqueta
    5:  "fashion model stylish outfit",                  // me visto como una estrella
    6:  "scarf winter cold fashion",                     // bufanda para el frío
    7:  "suit formal wear men",                          // traje para el tío
    8:  "dress pajama boots fashion",                    // vestido, pijama, botas
    9:  "sandals summer shoes feet",                     // sandalias
    10: "clothes folded colorful wardrobe",              // ropa en español
    11: "child learning happy school",                   // cada día aprenderé
    // repeat
    12: "shirt pants clothing fashion",
    13: "shoes belt accessories",
    14: "hat gloves socks winter clothing",
    15: "colorful clothes children fashion",
    16: "skirt sweater jacket fashion",
    17: "fashion model stylish outfit",
    18: "scarf winter cold fashion",
    19: "suit formal wear men",
    20: "dress pajama boots fashion",
    21: "sandals summer shoes feet",
    22: "clothes folded colorful wardrobe",
    23: "child learning happy school",
  },

  // ── Song 6: Mi Familia ────────────────────────────────────────────────
  6: {
    0:  "happy family waving hello",                     // hola hola
    1:  "family singing together",                       // vamos a cantar
    2:  "family portrait group",                         // los de mi familia
    3:  "father mother parents smiling",                 // papá y mamá
    4:  "brother sister siblings children",              // hermano, hermana
    5:  "uncle aunt family adults",                      // tío, tía
    6:  "grandmother family portrait",                   // abuela sana
    7:  "grandfather senior man happy",                  // abuelo contento
    8:  "cousins children playing",                      // primo y prima
    9:  "nephew niece children family",                  // sobrino, sobrina
    10: "family pet dog cat walking",                    // mascota que camina
    11: "happy family together outdoors",                // mi familia es lo mejor
    // repeat
    12: "happy family waving hello",
    13: "family singing together",
    14: "family portrait group",
    15: "father mother parents smiling",
    16: "brother sister siblings children",
    17: "uncle aunt family adults",
    18: "grandmother family portrait",
    19: "grandfather senior man happy",
    20: "cousins children playing",
    21: "nephew niece children family",
    22: "family pet dog cat walking",
    23: "happy family together outdoors",
  },

  // ── Song 7: Los Trabajos ──────────────────────────────────────────────
  7: {
    0:  "career jobs future dreams",                     // qué quieres ser
    1:  "career jobs future dreams",
    2:  "doctor firefighter baker profession",           // doctor, bombero, panadero
    3:  "teacher pilot carpenter profession",            // maestra, piloto, carpintero
    4:  "singer chef gardener profession",               // cantante, chef, jardinero
    5:  "dentist artist engineer profession",            // dentista, artista, ingeniero
    6:  "police officer farmer painter",                 // policía, granjero, pintor
    7:  "actor nurse writer profession",                 // actor, enfermera, escritor
    8:  "veterinarian driver vehicle",                   // veterinario, conductor
    9:  "architect translator office",                   // arquitecto, traductor
    10: "many careers options future",                   // tantas cosas
    11: "student learning studying",                     // solo tienes que aprender
    12: "joy happiness success work",                    // con alegría y amor
    13: "choose profession graduation",                  // elige tu profesión
    // repeat
    14: "career jobs future dreams",
    15: "career jobs future dreams",
    16: "doctor firefighter baker profession",
    17: "teacher pilot carpenter profession",
    18: "singer chef gardener profession",
    19: "dentist artist engineer profession",
    20: "police officer farmer painter",
    21: "actor nurse writer profession",
    22: "veterinarian driver vehicle",
    23: "architect translator office",
    24: "many careers options future",
    25: "student learning studying",
    26: "joy happiness success work",
    27: "choose profession graduation",
  },

  // ── Song 18: Colores ──────────────────────────────────────────────────
  18: {
    0:  "red color abstract background",             // Rojo, naranja, amarillo, verde, azul
    1:  "purple color abstract background",          // Morado, blanco, negro, gris
    2:  "red color abstract background",             // repeat chorus
    3:  "purple color abstract background",
    4:  "red apple fruit close up",                  // La manzana roja, mariposa naranja
    5:  "bright yellow sun sky",                     // El sol amarillo, la hoja verde
    6:  "blue sky clouds bright",                    // El cielo azul, la uva morada
    7:  "white clouds sky clean",                    // La nube blanca, el gato negro
    8:  "gray stone pebbles texture",                // Y la piedra gris
    9:  "red apple fruit close up",                  // repeat verse
    10: "bright yellow sun sky",
    11: "blue sky clouds bright",
    12: "white clouds sky clean",
    13: "gray stone pebbles texture",
    14: "rainbow colorful arc sky",                  // Mira el arco iris
    15: "rainbow colorful arc sky",                  // Brillan en el cielo
    16: "red color abstract background",             // final chorus
    17: "purple color abstract background",
  },

  // ── Song 8: AEIOU Pet World ───────────────────────────────────────────
  8: {
    // AEIOU intro
    0: "araña spider web close up",
    1: "elephant africa wildlife",
    2: "iguana lizard reptile",
    3: "bear oso wildlife nature",
    4: "unicorn fantasy magical horse",
    5: "unicorn fantasy magical rainbow horse",  // ¡A–E–I–O–U Unicornio chorus
    // Alphabet section
    6: "búho owl bird wildlife",
    8: "conejo rabbit cute bunny",
    10: "chivo goat farm animal",
    12: "delfín dolphin ocean jump",
    14: "flamingo bird pink flock",
    16: "gato cat cute kitten",
    18: "hipopotamo hippo water wildlife",
    20: "jirafa giraffe africa tall",
    22: "koala bear australia eucalyptus",
    24: "león lion africa mane roar",
    26: "mono monkey jungle primate",
    28: "nutria otter river water",
    30: "ñandú rhea bird argentina",
    32: "penguin colony swimming waddle",
    34: "resplendent quetzal green red bird rainforest",
    36: "rinoceronte rhino africa wildlife",
    38: "serpiente snake reptile",
    40: "tigre tiger wildlife stripes",
    42: "vaca cow farm dairy",
    44: "wombat australia marsupial",
    46: "xoloitzcuintle hairless dog mexico",
    48: "yak tibet highland animal",
    50: "zorro fox wildlife red",
    // AEIOU repeat
    52: "araña spider web close up",
    53: "elephant africa wildlife",
    54: "iguana lizard reptile",
    55: "bear oso wildlife nature",
    56: "unicorn fantasy magical horse",
    57: "unicorn fantasy magical rainbow horse",  // ¡A–E–I–O–U Unicornio chorus repeat
  },
}

// Songs that use lyric-driven video (no generic country rotation)
const LYRIC_VIDEO_SONGS = new Set(Object.keys(LYRIC_VIDEO_QUERIES).map(Number))

// ─────────────────────────────────────────────
// English translations per song → line ID
// Shown above the active Spanish lyric line
// ─────────────────────────────────────────────
const LYRIC_TRANSLATIONS: Record<number, Record<number, string>> = {
  1: { 0:"A B C D E F G", 1:"H I J K L M N", 2:"Ñ O P Q R S T", 3:"U V W X Y Z", 4:"The Alphabet!", 5:"Sing along with me!", 6:"A B C D E F G", 7:"H I J K L M N", 8:"Ñ O P Q R S T", 9:"U V W X Y Z", 10:"The Alphabet!", 11:"Sing along with me!" },
  2: { 0:"Ñ, CH, RR, LL", 1:"Special letters in Spanish!", 2:"Ñ like piñata", 3:"CH like chocolate", 4:"RR rolls your tongue", 5:"LL like llama", 6:"Ñ, CH, RR, LL", 7:"Special letters in Spanish!", 8:"Ñ like piñata", 9:"CH like chocolate", 10:"RR rolls your tongue", 11:"LL like llama" },
  3: { 0:"A E I O U, sing!", 1:"A E I O U again!", 2:"Open your mouth wide!", 3:"These are the vowels!", 4:"A E I O U, sing!", 5:"A E I O U again!", 6:"Open your mouth wide!", 7:"These are the vowels!" },
  4: {
    0:  "Let's touch the body parts,",
    1:  "Touch your head and hair, your neck and throat,",
    2:  "Shoulders and arms,",
    3:  "Elbows, fingers, wrists and hands,",
    4:  "The back, the belly,",
    5:  "The leg, knee and feet,",
    6:  "Let's touch the parts of the face,",
    7:  "Eyes, nose, lips and teeth,",
    8:  "The ear, the mouth,",
    9:  "The tongue and the forehead,",
    10: "And now let's dance, dance, dance, dance!",
    11: "And now let's dance, dance, dance, dance!",
    12: "Let's touch the body parts,",
    13: "Touch your head and hair, your neck and throat,",
    14: "Shoulders and arms,",
    15: "Elbows, fingers, wrists and hands,",
    16: "The back, the belly,",
    17: "The leg, knee and feet,",
    18: "Let's touch the parts of the face,",
    19: "Eyes, nose, lips and teeth,",
    20: "The ear, the mouth,",
    21: "The tongue and the forehead,",
    22: "And now let's dance, dance, dance, dance!",
  },
  5: {
    0:  "Shirt, pants,",
    1:  "shoes and belt.",
    2:  "Hat, gloves, sock,",
    3:  "beautiful clothes for me.",
    4:  "Skirt, sweater, jacket,",
    5:  "I dress like a star.",
    6:  "Scarf for the cold,",
    7:  "suit for the uncle.",
    8:  "Dress, pajamas and boots,",
    9:  "sandals for the others.",
    10: "I'll say clothes in Spanish,",
    11: "Every day I'll learn!",
    12: "Shirt, pants,",
    13: "shoes and belt.",
    14: "Hat, gloves, sock,",
    15: "beautiful clothes for me.",
    16: "Skirt, sweater, jacket,",
    17: "I dress like a star.",
    18: "Scarf for the cold,",
    19: "suit for the uncle.",
    20: "Dress, pajamas and boots,",
    21: "sandals for the others.",
    22: "I'll say clothes in Spanish,",
    23: "Every day I'll learn!",
  },
  6: {
    0:  "Hello, hello!",
    1:  "Let's sing,",
    2:  "I'm going to name my family members.",
    3:  "Dad and mom,",
    4:  "Brother, sister,",
    5:  "Uncle, aunt,",
    6:  "And the healthy grandma.",
    7:  "Happy grandpa,",
    8:  "Male cousin and female cousin,",
    9:  "Nephew, niece,",
    10: "Pet that walks.",
    11: "My family is the best for me!",
    12: "Hello, hello!",
    13: "Let's sing,",
    14: "I'm going to name my family members.",
    15: "Dad and mom,",
    16: "Brother, sister,",
    17: "Uncle, aunt,",
    18: "And the healthy grandma.",
    19: "Happy grandpa,",
    20: "Male cousin and female cousin,",
    21: "Nephew, niece,",
    22: "Pet that walks.",
    23: "My family is the best for me!",
  },
  7: {
    0:  "What Do You Want to Be?",
    1:  "What Do You Want to Be?",
    2:  "Doctor, firefighter, baker,",
    3:  "teacher, pilot, carpenter,",
    4:  "singer, chef, gardener,",
    5:  "dentist, artist, engineer.",
    6:  "Police officer, farmer, painter,",
    7:  "actor, nurse, writer,",
    8:  "veterinarian, driver,",
    9:  "architect, translator.",
    10: "So many things you can be!",
    11: "You just have to learn.",
    12: "With joy and with love,",
    13: "Choose your profession!",
    14: "What Do You Want to Be?",
    15: "What Do You Want to Be?",
    16: "Doctor, firefighter, baker,",
    17: "teacher, pilot, carpenter,",
    18: "singer, chef, gardener,",
    19: "dentist, artist, engineer.",
    20: "Police officer, farmer, painter,",
    21: "actor, nurse, writer,",
    22: "veterinarian, driver,",
    23: "architect, translator.",
    24: "So many things you can be!",
    25: "You just have to learn.",
    26: "With joy and with love,",
    27: "Choose your profession!",
  },
  8: {
    0:"A Spider,", 1:"E Elephant,", 2:"I Iguana,", 3:"O Big Bear,", 4:"U Unicorn U Unicorn,", 5:"A-E-I-O-U Unicorn!",
    6:"B Owl, B Owl,", 7:"Ba be bi bo bu owl", 8:"C Rabbit, C Rabbit,", 9:"Ca ce ci co cu rabbit",
    10:"Ch Goat, Ch Goat,", 11:"Cha che chi cho chu goat", 12:"D Dolphin, D Dolphin,", 13:"Da de di do du dolphin",
    14:"F Flamingo, F Flamingo,", 15:"Fa fe fi fo fu flamingo", 16:"G Cat, G Cat,", 17:"Ga gue gui go gu cat",
    18:"H Hippo, H Hippo,", 19:"Ha he hi ho hu hippo", 20:"J Giraffe, J Giraffe,", 21:"Ja je ji jo ju giraffe",
    22:"K Koala, K Koala,", 23:"Ka ke ki ko ku koala", 24:"L Lion, L Lion,", 25:"La le li lo lu lion",
    26:"M Monkey, M Monkey,", 27:"Ma me mi mo mu monkey", 28:"N Otter, N Otter,", 29:"Na ne ni no nu otter",
    30:"Ñ Rhea, Ñ Rhea,", 31:"Ña ñe ñi ño ñu rhea", 32:"P Penguin, P Penguin,", 33:"Pa pe pi po pu penguin",
    34:"Q Quetzal, Q Quetzal,", 35:"Que qui qué quo quoo quetzal", 36:"R Rhino, R Rhino,", 37:"Ra re ri ro ru rhino",
    38:"S Snake, S Snake,", 39:"Sa se si so su snake", 40:"T Tiger, T Tiger,", 41:"Ta te ti to tu tiger",
    42:"V Cow, V Cow,", 43:"Va ve vi vo vu cow", 44:"W Wombat, W Wombat,", 45:"Wa we wi wo wu wombat",
    46:"X Xoloitzcuintle, X Xolo,", 47:"Xa xe xi xo xu xolo", 48:"Y Yak, Y Yak,", 49:"Ya ye yi yo yu yak",
    50:"Z Fox, Z Fox,", 51:"Za ze zi zo zu fox",
    52:"A Spider,", 53:"E Elephant,", 54:"I Iguana,", 55:"O Big Bear,", 56:"U Unicorn U Unicorn,", 57:"A-E-I-O-U Unicorn!",
  },
  9:  { 0:"My Pets", 1:"I have a dog,", 2:"I have a cat,", 3:"I have a fish,", 4:"I have a bird,", 5:"I have a rabbit,", 6:"My pets!", 7:"I love my pets!", 8:"My Pets", 9:"I have a dog,", 10:"I have a cat,", 11:"I have a fish,", 12:"I have a bird,", 13:"I have a rabbit,", 14:"My pets!", 15:"I love my pets!" },
  10: { 0:"Animal Habitats", 1:"The lion lives in the savanna,", 2:"The fish lives in the ocean,", 3:"The bear lives in the forest,", 4:"The camel lives in the desert,", 5:"The penguin lives in Antarctica,", 6:"Animal habitats!", 7:"Animal Habitats", 8:"The lion lives in the savanna,", 9:"The fish lives in the ocean,", 10:"The bear lives in the forest,", 11:"The camel lives in the desert,", 12:"The penguin lives in Antarctica,", 13:"Animal habitats!" },
  11: { 0:"In My House", 1:"The kitchen,", 2:"the bedroom,", 3:"the living room,", 4:"the bathroom,", 5:"the dining room.", 6:"In my house!", 7:"In My House", 8:"The kitchen,", 9:"the bedroom,", 10:"the living room,", 11:"the bathroom,", 12:"the dining room.", 13:"In my house!" },
  12: { 0:"Where Is It?", 1:"The book is on the table,", 2:"The pencil is in the box,", 3:"The ball is under the chair,", 4:"The cat is next to the door,", 5:"Where is it?", 6:"Where Is It?", 7:"The book is on the table,", 8:"The pencil is in the box,", 9:"The ball is under the chair,", 10:"The cat is next to the door,", 11:"Where is it?" },
  13: { 0:"The Directions", 1:"Go straight ahead,", 2:"Turn left,", 3:"Turn right,", 4:"Stop here!", 5:"The directions!", 6:"The Directions", 7:"Go straight ahead,", 8:"Turn left,", 9:"Turn right,", 10:"Stop here!", 11:"The directions!" },
  14: { 0:"One to Twenty", 1:"One, two, three,", 2:"four, five, six,", 3:"seven, eight, nine,", 4:"ten, eleven, twelve,", 5:"thirteen, fourteen, fifteen,", 6:"sixteen, seventeen, eighteen,", 7:"nineteen, twenty!", 8:"One to Twenty", 9:"One, two, three,", 10:"four, five, six,", 11:"seven, eight, nine,", 12:"ten, eleven, twelve,", 13:"thirteen, fourteen, fifteen,", 14:"sixteen, seventeen, eighteen,", 15:"nineteen, twenty!" },
  15: { 0:"Ten to One Hundred", 1:"Ten, twenty, thirty,", 2:"forty, fifty, sixty,", 3:"seventy, eighty, ninety,", 4:"one hundred!", 5:"Ten to One Hundred", 6:"Ten, twenty, thirty,", 7:"forty, fifty, sixty,", 8:"seventy, eighty, ninety,", 9:"one hundred!" },
  16: { 0:"Days, Months and Seasons", 1:"Monday, Tuesday, Wednesday,", 2:"Thursday, Friday,", 3:"Saturday and Sunday.", 4:"January, February, March,", 5:"April, May, June,", 6:"July, August, September,", 7:"October, November, December.", 8:"Spring, Summer, Fall, Winter!", 9:"Days, Months and Seasons", 10:"Monday, Tuesday, Wednesday,", 11:"Thursday, Friday,", 12:"Saturday and Sunday.", 13:"January, February, March,", 14:"April, May, June,", 15:"July, August, September,", 16:"October, November, December.", 17:"Spring, Summer, Fall, Winter!" },
  17: { 0:"What time is it?", 1:"It is one o'clock,", 2:"It is two o'clock,", 3:"It is three o'clock,", 4:"It is four o'clock,", 5:"It is five o'clock,", 6:"What time is it?", 7:"What time is it?", 8:"It is one o'clock,", 9:"It is two o'clock,", 10:"It is three o'clock,", 11:"It is four o'clock,", 12:"It is five o'clock,", 13:"What time is it?" },
  18: {
    0:  "Red, orange, yellow, green, blue,",
    1:  "Purple, white, black, gray, how cool!",
    2:  "Red, orange, yellow, green, blue,",
    3:  "Purple, white, black, gray, how cool!",
    4:  "The red apple, the orange butterfly,",
    5:  "The yellow sun, the green leaf,",
    6:  "The blue sky, the purple grape,",
    7:  "The white cloud, the black cat,",
    8:  "And the gray stone — What pretty colors!",
    9:  "The red apple, the orange butterfly,",
    10: "The yellow sun, the green leaf,",
    11: "The blue sky, the purple grape,",
    12: "The white cloud, the black cat,",
    13: "And the gray stone — What pretty colors!",
    14: "Look at the rainbow, all the colors,",
    15: "They shine in the sky, all in colors.",
    16: "Red, orange, yellow, green and blue,",
    17: "Purple, white, black, gray, how cool!",
  },
  19: { 0:"I Am Happy", 1:"I am happy,", 2:"I am sad,", 3:"I am angry,", 4:"I am scared,", 5:"I am surprised!", 6:"How do you feel?", 7:"I Am Happy", 8:"I am happy,", 9:"I am sad,", 10:"I am angry,", 11:"I am scared,", 12:"I am surprised!", 13:"How do you feel?" },
  20: { 0:"I Am Thirsty", 1:"I am thirsty,", 2:"I am hungry,", 3:"I am tired,", 4:"I am sick,", 5:"I am sleepy!", 6:"How are you feeling?", 7:"I Am Thirsty", 8:"I am thirsty,", 9:"I am hungry,", 10:"I am tired,", 11:"I am sick,", 12:"I am sleepy!", 13:"How are you feeling?" },
  21: { 0:"The Fruits", 1:"Apple, banana, orange,", 2:"strawberry, grape, mango,", 3:"pineapple, watermelon, pear,", 4:"peach, cherry, lemon.", 5:"Delicious fruits!", 6:"The Fruits", 7:"Apple, banana, orange,", 8:"strawberry, grape, mango,", 9:"pineapple, watermelon, pear,", 10:"peach, cherry, lemon.", 11:"Delicious fruits!" },
  22: { 0:"The Vegetables", 1:"Carrot, tomato, potato,", 2:"broccoli, onion, spinach,", 3:"corn, cucumber, pepper,", 4:"lettuce, peas, garlic.", 5:"Healthy vegetables!", 6:"The Vegetables", 7:"Carrot, tomato, potato,", 8:"broccoli, onion, spinach,", 9:"corn, cucumber, pepper,", 10:"lettuce, peas, garlic.", 11:"Healthy vegetables!" },
  23: { 0:"Breakfast, Lunch, Dinner", 1:"For breakfast I eat...", 2:"eggs and toast!", 3:"For lunch I eat...", 4:"rice and beans!", 5:"For dinner I eat...", 6:"soup and bread!", 7:"Breakfast, Lunch, Dinner", 8:"For breakfast I eat...", 9:"eggs and toast!", 10:"For lunch I eat...", 11:"rice and beans!", 12:"For dinner I eat...", 13:"soup and bread!" },
  24: { 0:"I Want to Order", 1:"I would like...", 2:"a glass of water, please.", 3:"I would like...", 4:"a coffee, please.", 5:"How much does it cost?", 6:"I Want to Order", 7:"I would like...", 8:"a glass of water, please.", 9:"I would like...", 10:"a coffee, please.", 11:"How much does it cost?" },
}

// Convenience alias for legacy song-8 references
const SONG8_ANIMAL_QUERIES = LYRIC_VIDEO_QUERIES[8]

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface SingModeViewProps {
  song: { id: string; title: string; number: number; youtubeId?: string; sectionTitle?: string }
  lyricLines: { id: number; words: { id: number; text: string; timestamp: number; duration: number }[] }[]
  audioUrl?: string
  onBack: () => void
  onNext?: () => void
  onPrev?: () => void
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
// ── Format seconds as m:ss ──
function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export default function SingModeView({
  song, lyricLines, audioUrl,
  onBack, onNext, onPrev,
}: SingModeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const bgVideoRef = useRef<HTMLVideoElement | null>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const [bgLoaded, setBgLoaded] = useState(false)
  const [bgImageLoaded, setBgImageLoaded] = useState(false)
  const [activeLyricId, setActiveLyricId] = useState<number>(-1)
  const [activeWordId, setActiveWordId] = useState<number>(-1)
  const [elapsedSecs, setElapsedSecs] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)  // direct audio playback — same as DDR game
  const progressBarRef = useRef<HTMLDivElement>(null)
  // Cache for song-8 animal videos: lineId → {vid, img} so each animal only fetches once
  const animalCacheRef = useRef<Record<number, { vid: HTMLVideoElement | null; img: HTMLImageElement | null }>>({})
  const lastAnimalLineRef = useRef<number>(-1)

  // Total song duration derived from the last lyric word's end time
  const totalDuration = useMemo(() => {
    let max = 0
    for (const line of lyricLines) {
      for (const w of line.words) {
        max = Math.max(max, w.timestamp + w.duration)
      }
    }
    return max
  }, [lyricLines])

  const country = getCountry(song.number)
  const { palette, flag, flagColors, country: countryName } = country
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSwapRef = useRef<number>(0)

  // ── Load a new video+photo from a random query for this country ──
  const loadMedia = useRef((c: CountryData) => {
    const query = pickQuery(c)

    // Still photo — instant display
    fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`, {
      headers: { Authorization: PEXELS_KEY }
    }).then(r => r.json()).then(data => {
      const photos: any[] = data?.photos ?? []
      if (!photos.length) return
      const pick = photos[Math.floor(Math.random() * Math.min(photos.length, 5))]
      const src = pick?.src?.large2x ?? pick?.src?.large ?? pick?.src?.original
      if (!src) return
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => { bgImageRef.current = img; setBgImageLoaded(true) }
      img.src = src
    }).catch(() => {})

    // Video — animated background
    const vid = document.createElement("video")
    vid.muted = true; vid.loop = true; vid.playsInline = true; vid.crossOrigin = "anonymous"
    bgVideoRef.current = vid
    setBgLoaded(false)

    fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=10`, {
      headers: { Authorization: PEXELS_KEY }
    }).then(r => r.json()).then(data => {
      const videos: any[] = data?.videos ?? []
      if (!videos.length) return
      const pick = videos[Math.floor(Math.random() * Math.min(videos.length, 5))]
      const files: any[] = pick.video_files ?? []
      const mp4 = files.filter(f => f.file_type === "video/mp4").sort((a, b) => a.height - b.height).find(f => f.height <= 720)
      if (mp4?.link) {
        vid.src = mp4.link
        vid.play().then(() => setBgLoaded(true)).catch(() => {})
      }
    }).catch(() => {})
  })

  // ── Schedule rotating video swap every 5–10s ──
  const scheduleSwap = useRef((c: CountryData) => {
    if (swapTimerRef.current) clearTimeout(swapTimerRef.current)
    const delay = 5000 + Math.random() * 5000 // 5–10 seconds
    swapTimerRef.current = setTimeout(() => {
      loadMedia.current(c)
      scheduleSwap.current(c)
    }, delay)
  })

  // ── Init media + rotation on song change ──
  useEffect(() => {
    setBgLoaded(false)
    setBgImageLoaded(false)
    bgImageRef.current = null
    lastSwapRef.current = Date.now()
    // Clear animal cache on song change
    animalCacheRef.current = {}
    lastAnimalLineRef.current = -1
    // Lyric-video songs: vocab visuals drive the background exclusively — no generic country rotation
    if (!LYRIC_VIDEO_SONGS.has(song.number)) {
      loadMedia.current(country)
      scheduleSwap.current(country)
    } else {
      // Preload first-line video immediately so background shows from song start
      const songQueries = LYRIC_VIDEO_QUERIES[song.number]
      const firstLineId = Math.min(...Object.keys(songQueries).map(Number))
      const firstQuery = songQueries[firstLineId]
      lastAnimalLineRef.current = firstLineId

      // Still photo fallback
      fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(firstQuery)}&per_page=10&orientation=landscape`, {
        headers: { Authorization: PEXELS_KEY }
      }).then(r => r.json()).then(data => {
        const photos: any[] = data?.photos ?? []
        if (!photos.length) return
        const pick = photos[Math.floor(Math.random() * Math.min(photos.length, 5))]
        const src = pick?.src?.large2x ?? pick?.src?.large ?? pick?.src?.original
        if (!src) return
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          animalCacheRef.current[firstLineId] = { ...animalCacheRef.current[firstLineId], img }
          bgImageRef.current = img
          setBgImageLoaded(true)
        }
        img.src = src
      }).catch(() => {})

      // Video
      const vid = document.createElement("video")
      vid.muted = true; vid.loop = true; vid.playsInline = true; vid.crossOrigin = "anonymous"
      animalCacheRef.current[firstLineId] = { vid: null, img: null }
      fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(firstQuery)}&per_page=10`, {
        headers: { Authorization: PEXELS_KEY }
      }).then(r => r.json()).then(data => {
        const videos: any[] = data?.videos ?? []
        if (!videos.length) return
        const pick = videos[Math.floor(Math.random() * Math.min(videos.length, 5))]
        const files: any[] = pick.video_files ?? []
        const mp4 = files.filter((f: any) => f.file_type === "video/mp4").sort((a: any, b: any) => a.height - b.height).find((f: any) => f.height <= 720)
        if (!mp4?.link) return
        vid.src = mp4.link
        animalCacheRef.current[firstLineId] = { ...animalCacheRef.current[firstLineId], vid }
        vid.play().then(() => {
          const prev = bgVideoRef.current
          if (prev && prev !== vid) { prev.pause(); prev.src = "" }
          bgVideoRef.current = vid
          setBgLoaded(true)
        }).catch(() => {})
      }).catch(() => {})
    }
    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current)
      const vid = bgVideoRef.current
      if (vid) { vid.pause(); vid.src = "" }
      bgImageRef.current = null
    }
  }, [song.number])

  // ── Lyric-video songs: swap background when lyric line changes ──
  useEffect(() => {
    if (!LYRIC_VIDEO_SONGS.has(song.number)) return
    const songQueries = LYRIC_VIDEO_QUERIES[song.number]
    // Walk backwards from activeLyricId to find nearest line with a query entry
    let animalLineId = -1
    for (let id = activeLyricId; id >= 0; id--) {
      if (songQueries[id] !== undefined) { animalLineId = id; break }
    }
    if (animalLineId < 0 || animalLineId === lastAnimalLineRef.current) return
    lastAnimalLineRef.current = animalLineId

    const query = songQueries[animalLineId]

    // If cached, swap immediately
    const cached = animalCacheRef.current[animalLineId]
    if (cached) {
      if (cached.vid) {
        const prev = bgVideoRef.current
        if (prev) { prev.pause(); prev.src = "" }
        bgVideoRef.current = cached.vid
        cached.vid.currentTime = 0
        cached.vid.play().then(() => setBgLoaded(true)).catch(() => {})
        setBgLoaded(true)
      }
      if (cached.img) { bgImageRef.current = cached.img; setBgImageLoaded(true) }
      return
    }

    // Not cached — fetch, cache, then swap
    animalCacheRef.current[animalLineId] = { vid: null, img: null }

    // Still photo fallback
    fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`, {
      headers: { Authorization: PEXELS_KEY }
    }).then(r => r.json()).then(data => {
      const photos: any[] = data?.photos ?? []
      if (!photos.length) return
      const pick = photos[Math.floor(Math.random() * Math.min(photos.length, 5))]
      const src = pick?.src?.large2x ?? pick?.src?.large ?? pick?.src?.original
      if (!src) return
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        animalCacheRef.current[animalLineId] = { ...animalCacheRef.current[animalLineId], img }
        // Only apply if still on this animal
        if (lastAnimalLineRef.current === animalLineId) { bgImageRef.current = img; setBgImageLoaded(true) }
      }
      img.src = src
    }).catch(() => {})

    // Video
    const vid = document.createElement("video")
    vid.muted = true; vid.loop = true; vid.playsInline = true; vid.crossOrigin = "anonymous"
    fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=10`, {
      headers: { Authorization: PEXELS_KEY }
    }).then(r => r.json()).then(data => {
      const videos: any[] = data?.videos ?? []
      if (!videos.length) return
      const pick = videos[Math.floor(Math.random() * Math.min(videos.length, 5))]
      const files: any[] = pick.video_files ?? []
      const mp4 = files.filter((f: any) => f.file_type === "video/mp4").sort((a: any, b: any) => a.height - b.height).find((f: any) => f.height <= 720)
      if (!mp4?.link) return
      vid.src = mp4.link
      animalCacheRef.current[animalLineId] = { ...animalCacheRef.current[animalLineId], vid }
      vid.play().then(() => {
        if (lastAnimalLineRef.current === animalLineId) {
          const prev = bgVideoRef.current
          if (prev && prev !== vid) { prev.pause(); prev.src = "" }
          bgVideoRef.current = vid
          setBgLoaded(true)
        }
      }).catch(() => {})
    }).catch(() => {})
  }, [activeLyricId, song.number])

  // ── Load and play audio directly from audioUrl — identical to DDR game ──
  // Timestamps in the JSON were generated from this exact WAV file, so currentTime
  // matches the lyrics perfectly with zero offset calculation needed.
  useEffect(() => {
    setElapsedSecs(0)
    setActiveWordId(-1)
    setActiveLyricId(-1)
    if (!audioUrl) { audioRef.current = null; return }
    const audio = new Audio(audioUrl)
    audio.preload = "auto"
    audioRef.current = audio
    // Auto-advance to next song when audio ends
    audio.addEventListener("ended", () => { if (onNext) setTimeout(onNext, 800) })
    // Try to play immediately, then retry on canplay in case buffering is needed
    audio.play().catch(() => {
      // Browser may have blocked autoplay — retry when buffered
      audio.addEventListener("canplay", () => { audio.play().catch(() => {}) }, { once: true })
    })
    return () => {
      audio.pause()
      audio.src = ""
      audioRef.current = null
    }
  }, [audioUrl, song.number, onNext])

  // ── Word-level + Line-level karaoke sync — reads audio.currentTime directly (same as DDR game) ──
  useEffect(() => {
    if (lyricLines.length === 0) { setActiveWordId(-1); setActiveLyricId(-1); return }
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    wordTimerRef.current = setInterval(() => {
      const elapsed = audioRef.current?.currentTime ?? 0
      setElapsedSecs(elapsed)
      let foundWord = -1
      let foundLine = -1
      for (const line of lyricLines) {
        const firstWord = line.words[0]
        const lastWord = line.words[line.words.length - 1]
        // Line is active if we're between its first word start and last word end (+ small buffer)
        if (firstWord && lastWord &&
            elapsed >= firstWord.timestamp &&
            elapsed < lastWord.timestamp + lastWord.duration + 0.3) {
          foundLine = line.id
        }
        for (const word of line.words) {
          if (elapsed >= word.timestamp && elapsed < word.timestamp + word.duration) {
            foundWord = word.id
          }
        }
      }
      setActiveWordId(foundWord)
      setActiveLyricId(foundLine)
    }, 40) // 40ms — same as DDR game
    return () => { if (wordTimerRef.current) clearInterval(wordTimerRef.current) }
  }, [lyricLines, song.number])

  // ── Canvas draw loop ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener("resize", resize)

    let lastBeat = 0
    let beatFlash = 0

    const draw = () => {
      animRef.current = requestAnimationFrame(draw)
      const W = canvas.width, H = canvas.height
      // Simple time-based beat flash for visual interest (no mic needed)
      const now = Date.now()
      const beat = Math.sin(now / 500) // ~120bpm pulse
      if (beat > 0.95 && now - lastBeat > 400) {
        lastBeat = now; beatFlash = 0.5
        // Occasionally swap video on beat — skip for lyric-video songs (vocab visuals only)
        if (!LYRIC_VIDEO_SONGS.has(song.number) && now - lastSwapRef.current > 5000) {
          lastSwapRef.current = now
          if (swapTimerRef.current) clearTimeout(swapTimerRef.current)
          loadMedia.current(country)
          scheduleSwap.current(country)
        }
      }
      beatFlash = Math.max(0, beatFlash - 0.04)

      // ── 1. Draw background image (instant fallback) or video ──
      const vid = bgVideoRef.current
      const img = bgImageRef.current
      const hasVideo = bgLoaded && vid && vid.readyState >= 2
      const hasImage = bgImageLoaded && img

      if (hasVideo || hasImage) {
        // Beat zoom punch
        const zoom = 1 + beatFlash * 0.03
        const offX = (W * (zoom - 1)) / 2
        const offY = (H * (zoom - 1)) / 2

        // Lyric-video songs use contain-fit so animals/colors are never cropped on mobile.
        // Generic country songs use cover-fit to fill the full background.
        const useContain = LYRIC_VIDEO_SONGS.has(song.number)

        if (hasVideo) {
          const vw = vid!.videoWidth || W
          const vh = vid!.videoHeight || H
          const vscale = useContain ? Math.min(W / vw, H / vh) : Math.max(W / vw, H / vh)
          const vdw = vw * vscale * zoom
          const vdh = vh * vscale * zoom
          if (useContain) {
            // Dark letterbox behind the video so edges aren't just black canvas
            ctx.fillStyle = "rgba(0,0,0,0.85)"
            ctx.fillRect(0, 0, W, H)
          }
          ctx.drawImage(vid!, (W - vdw) / 2, (H - vdh) / 2, vdw, vdh)
        } else if (hasImage) {
          const iw = img!.naturalWidth, ih = img!.naturalHeight
          const scale = useContain ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih)
          const dw = iw * scale * zoom, dh = ih * scale * zoom
          if (useContain) {
            ctx.fillStyle = "rgba(0,0,0,0.85)"
            ctx.fillRect(0, 0, W, H)
          }
          ctx.drawImage(img!, (W - dw) / 2, (H - dh) / 2, dw, dh)
        }

        // Light overlay for text legibility
        ctx.fillStyle = "rgba(0,0,0,0.18)"
        ctx.fillRect(0, 0, W, H)

        // Beat flash in flag primary color
        if (beatFlash > 0) {
          ctx.fillStyle = `${flagColors[0]}${Math.floor(beatFlash * 30).toString(16).padStart(2,'0')}`
          ctx.fillRect(0, 0, W, H)
        }

        ctx.shadowBlur = 0; ctx.globalAlpha = 1

      } else {
        // No media yet — solid dark background in palette color
        ctx.fillStyle = `${palette[2]}33`
        ctx.fillRect(0, 0, W, H)
      }

      // ── Bottom gradient for lyric readability ──
      const grad = ctx.createLinearGradient(0, H * 0.55, 0, H)
      grad.addColorStop(0, "rgba(0,0,0,0)")
      grad.addColorStop(1, "rgba(0,0,0,0.65)")
      ctx.fillStyle = grad
      ctx.fillRect(0, H * 0.55, W, H * 0.45)
    }
    draw()
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [palette, bgLoaded, bgImageLoaded, song.number])

  // ── Seek: click anywhere on progress bar to jump to that position ──
  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || totalDuration <= 0 || !progressBarRef.current) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = fraction * totalDuration
    setElapsedSecs(fraction * totalDuration)
  }

  // ── Toggle play/pause ──
  function togglePause() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => {})
      bgVideoRef.current?.play().catch(() => {})
      setIsPlaying(true)
    } else {
      audio.pause()
      bgVideoRef.current?.pause()
      setIsPlaying(false)
    }
  }

  // ── Spacebar to pause/play ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault()
        togglePause()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  // Active lyric lines
  const activeLine = lyricLines.find(l => l.id === activeLyricId)
  const prevLine = lyricLines.find(l => l.id === activeLyricId - 1)
  const nextLine = lyricLines.find(l => l.id === activeLyricId + 1)

  // Helper: render a line word-by-word with karaoke highlighting
  function renderLine(
    line: { id: number; words: { id: number; text: string; timestamp: number; duration: number }[] },
    isActive: boolean
  ) {
    return (
      <span className="inline-flex flex-wrap justify-center gap-x-1.5 gap-y-0.5">
        {line.words.map((w, i) => {
          const isLit = isActive && w.id === activeWordId
          const isPast = isActive && activeWordId > w.id
          return (
            <span
              key={w.id}
              style={{
                color: isLit ? palette[0] : isPast ? "rgba(255,255,255,0.55)" : "#fff",
                textShadow: isLit
                  ? `0 0 12px ${palette[0]}, 0 0 28px ${palette[1]}, 0 0 50px ${palette[0]}`
                  : "none",
                fontWeight: isLit ? 900 : isActive ? 700 : 500,
                transform: isLit ? "scale(1.15)" : "scale(1)",
                display: "inline-block",
                transition: "color 0.08s, transform 0.08s",
              }}
            >
              {w.text}
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ touchAction: "none" }} onClick={togglePause}>
      {/* Full-screen canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />

      {/* Audio is played directly from the WAV audioUrl — same as DDR game, perfect timestamp sync */}

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-safe pt-4 pb-2"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }}
        onClick={e => e.stopPropagation()}>
        <button
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-black/40 text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{song.title}</p>
          <p className="text-white/60 text-xs truncate">{song.sectionTitle}</p>
        </div>
        {/* Country badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-bold"
          style={{ background: `${palette[0]}55`, border: `1px solid ${palette[0]}` }}>
          <span className="text-base">{flag}</span>
          <span>{countryName}</span>
        </div>
      </div>

      {/* ── Spacer pushes lyrics + controls to bottom ── */}
      <div className="flex-1" />

      {/* ── Lyrics near bottom ── */}
      <div className="relative z-10 px-6 pb-2 flex flex-col items-center gap-1">
        {/* English translation above active Spanish line */}
        {activeLine && LYRIC_TRANSLATIONS[song.number]?.[activeLine.id] && (
          <p className="text-center text-sm leading-snug font-medium" style={{ color: "rgba(255,255,180,0.85)", letterSpacing: "0.01em" }}>
            {LYRIC_TRANSLATIONS[song.number][activeLine.id]}
          </p>
        )}
        {activeLine && (
          <p className="text-center text-2xl leading-tight font-bold" style={{ letterSpacing: "0.01em" }}>
            {renderLine(activeLine, true)}
          </p>
        )}
        {/* Next line preview below */}
        {nextLine && (
          <p className="text-center text-sm leading-snug mt-1" style={{ opacity: 0.4 }}>
            {renderLine(nextLine, false)}
          </p>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div className="relative z-10 px-4 pb-safe pb-6 pt-2"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)" }}
        onClick={e => e.stopPropagation()}>

        {/* Progress bar — click to seek */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-white/60 text-xs tabular-nums w-8 text-right">{formatTime(elapsedSecs)}</span>
          {/* Outer wrapper: larger invisible hit area for easier tapping */}
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="flex-1 cursor-pointer flex items-center"
            style={{ padding: "8px 0", margin: "-8px 0" }}
          >
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: totalDuration > 0 ? `${Math.min(100, (elapsedSecs / totalDuration) * 100)}%` : "0%",
                  background: flagColors[1] === "#FFFFFF"
                    // Flag has white middle — use hard stops so white stripe is visible
                    ? `linear-gradient(90deg, ${flagColors[0]} 0%, ${flagColors[0]} 33%, ${flagColors[1]} 33%, ${flagColors[1]} 66%, ${flagColors[2]} 66%, ${flagColors[2]} 100%)`
                    : `linear-gradient(90deg, ${flagColors[0]} 0%, ${flagColors[1]} 50%, ${flagColors[2]} 100%)`,
                  transition: "width 0.1s linear",
                }}
              />
            </div>
          </div>
          <span className="text-white/60 text-xs tabular-nums w-8">{formatTime(totalDuration)}</span>
        </div>

        {/* Skip prev / play-pause / skip next row */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!onPrev}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white disabled:opacity-30"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          {/* Play / Pause button */}
          <button
            onClick={togglePause}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 text-white"
          >
            {isPlaying
              ? <Pause className="h-6 w-6" />
              : <Play className="h-6 w-6 translate-x-0.5" />
            }
          </button>

          <button
            onClick={onNext}
            disabled={!onNext}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white disabled:opacity-30"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
