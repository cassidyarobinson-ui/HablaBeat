"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, SkipBack, SkipForward } from "lucide-react"

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
// Song 8 (AEIOU Pet World) — per-lyric-line animal video queries
// Maps first lyric line ID of each animal couplet → Pexels search query
// ─────────────────────────────────────────────
const SONG8_ANIMAL_QUERIES: Record<number, string> = {
  // AEIOU intro (lines 0–5) and repeat (lines 52–57)
  0: "araña spider web close up",
  1: "elephant africa wildlife",
  2: "iguana lizard reptile",
  3: "bear oso wildlife nature",
  4: "unicorn fantasy magical horse",
  5: "araña spider web close up", // AEIOU chorus — reuse spider
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
  32: "pingüino penguin antarctic",
  34: "quetzal bird colorful Guatemala",
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
  57: "araña spider web close up",
}

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
    // Song 8: animals exclusively drive the background — skip generic media entirely
    if (song.number !== 8) {
      loadMedia.current(country)
      scheduleSwap.current(country)
    }
    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current)
      const vid = bgVideoRef.current
      if (vid) { vid.pause(); vid.src = "" }
      bgImageRef.current = null
    }
  }, [song.number])

  // ── Song 8: swap background to animal video when lyric line changes ──
  useEffect(() => {
    if (song.number !== 8) return
    // Find which animal line we're on — each animal has an entry in SONG8_ANIMAL_QUERIES,
    // and the "syllable" lines (odd lines like 7,9,11…) inherit the previous animal's video.
    // Walk backwards from activeLyricId to find the nearest animal-query line.
    let animalLineId = -1
    for (let id = activeLyricId; id >= 0; id--) {
      if (SONG8_ANIMAL_QUERIES[id] !== undefined) { animalLineId = id; break }
    }
    if (animalLineId < 0 || animalLineId === lastAnimalLineRef.current) return
    lastAnimalLineRef.current = animalLineId

    const query = SONG8_ANIMAL_QUERIES[animalLineId]

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
        // Occasionally swap video on beat
        if (now - lastSwapRef.current > 5000) {
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

        if (hasVideo) {
          // Cover-fit: preserve aspect ratio, no distortion when window is resized
          const vw = vid!.videoWidth || W
          const vh = vid!.videoHeight || H
          const vscale = Math.max(W / vw, H / vh)
          const vdw = vw * vscale * zoom
          const vdh = vh * vscale * zoom
          ctx.drawImage(vid!, -offX + (W - vdw) / 2, -offY + (H - vdh) / 2, vdw, vdh)
        } else if (hasImage) {
          // Draw image cover-fit
          const iw = img!.naturalWidth, ih = img!.naturalHeight
          const scale = Math.max(W / iw, H / ih)
          const dw = iw * scale, dh = ih * scale
          ctx.drawImage(img!, -offX + (W - dw) / 2, -offY + (H - dh) / 2, dw * zoom, dh * zoom)
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
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ touchAction: "none" }}>
      {/* Full-screen canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />

      {/* Audio is played directly from the WAV audioUrl — same as DDR game, perfect timestamp sync */}

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-safe pt-4 pb-2"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }}>
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
      <div className="relative z-10 px-6 pb-2 flex flex-col items-center gap-2">
        {prevLine && (
          <p className="text-center text-sm leading-snug" style={{ opacity: 0.45 }}>
            {renderLine(prevLine, false)}
          </p>
        )}
        {activeLine && (
          <p className="text-center text-2xl leading-tight font-bold" style={{ letterSpacing: "0.01em" }}>
            {renderLine(activeLine, true)}
          </p>
        )}
        {nextLine && (
          <p className="text-center text-sm leading-snug" style={{ opacity: 0.45 }}>
            {renderLine(nextLine, false)}
          </p>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div className="relative z-10 px-4 pb-safe pb-6 pt-2"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)" }}>

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
                  background: `linear-gradient(90deg, ${palette[0]}, ${palette[1]})`,
                  transition: "width 0.1s linear",
                }}
              />
            </div>
          </div>
          <span className="text-white/60 text-xs tabular-nums w-8">{formatTime(totalDuration)}</span>
        </div>

        {/* Skip prev/next row */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!onPrev}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white disabled:opacity-30"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          {/* Spacer keeps skip buttons at the edges */}
          <div className="flex-1" />

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
