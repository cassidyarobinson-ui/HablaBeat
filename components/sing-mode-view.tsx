"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, Mic, MicOff, SkipBack, SkipForward } from "lucide-react"

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
// Props
// ─────────────────────────────────────────────
interface SingModeViewProps {
  song: { id: string; title: string; number: number; youtubeId?: string; sectionTitle?: string }
  lyricLines: { id: number; words: { id: number; text: string; timestamp: number; duration: number }[] }[]
  activeLyricId: number
  isMicActive: boolean
  singLevel: number
  singScore: number
  onStartMic: () => void
  onStopMic: () => void
  onBack: () => void
  onNext?: () => void
  onPrev?: () => void
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function SingModeView({
  song, lyricLines, activeLyricId,
  isMicActive, singLevel, singScore,
  onStartMic, onStopMic, onBack, onNext, onPrev,
}: SingModeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const bgVideoRef = useRef<HTMLVideoElement | null>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const [bgLoaded, setBgLoaded] = useState(false)
  const [bgImageLoaded, setBgImageLoaded] = useState(false)
  const [activeWordId, setActiveWordId] = useState<number>(-1)
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now() / 1000)
  const ytCurrentTimeRef = useRef<number>(0) // actual YouTube playback position

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
    loadMedia.current(country)
    scheduleSwap.current(country)
    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current)
      const vid = bgVideoRef.current
      if (vid) { vid.pause(); vid.src = "" }
      bgImageRef.current = null
    }
  }, [song.number])

  // ── Grab analyser from Web Audio if mic is active ──
  useEffect(() => {
    // The analyser is created in the parent (page.tsx); we can't easily access it here.
    // So we create our own mic stream just for the visualizer canvas.
    if (!isMicActive) { analyserRef.current = null; return }
    let ctx: AudioContext | null = null
    let stream: MediaStream | null = null
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(s => {
      stream = s
      ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(s)
      const an = ctx.createAnalyser()
      an.fftSize = 256
      an.smoothingTimeConstant = 0.75
      src.connect(an)
      analyserRef.current = an
    }).catch(() => {})
    return () => {
      analyserRef.current = null
      stream?.getTracks().forEach(t => t.stop())
      ctx?.close()
    }
  }, [isMicActive])

  // ── YouTube postMessage listener: captures currentTime + ended state ──
  // enablejsapi=1 on the iframe lets us receive time updates and state changes.
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data
        // currentTime updates arrive as infoDelivery with currentTime field
        if (data?.event === "infoDelivery") {
          if (typeof data?.info?.currentTime === "number") {
            ytCurrentTimeRef.current = data.info.currentTime
          }
          // playerState 0 = ENDED — auto-advance to next song
          if (data?.info?.playerState === 0 && onNext) {
            setTimeout(() => { onNext() }, 1500)
          }
        }
      } catch {}
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onNext, song.youtubeId])

  // ── Word-level karaoke sync — uses actual YouTube currentTime ──
  useEffect(() => {
    if (lyricLines.length === 0) { setActiveWordId(-1); return }
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    wordTimerRef.current = setInterval(() => {
      const elapsed = ytCurrentTimeRef.current
      let found = -1
      for (const line of lyricLines) {
        for (const word of line.words) {
          if (elapsed >= word.timestamp && elapsed < word.timestamp + word.duration) {
            found = word.id
          }
        }
      }
      setActiveWordId(found)
    }, 40) // 40ms for smooth word-level tracking
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

    const freqData = new Uint8Array(128)
    let lastBeat = 0
    let beatFlash = 0

    const draw = () => {
      animRef.current = requestAnimationFrame(draw)
      const W = canvas.width, H = canvas.height
      const t = Date.now() / 1000
      const an = analyserRef.current
      if (an) an.getByteFrequencyData(freqData)
      else freqData.fill(0)
      const energy = freqData.reduce((a, b) => a + b, 0) / freqData.length

      // Bass energy (low frequencies 0-10)
      const bassE = freqData.slice(0, 10).reduce((a, b) => a + b, 0) / 10
      // Mid energy
      const midE = freqData.slice(10, 50).reduce((a, b) => a + b, 0) / 40
      // Beat detection — sharp bass spike
      const now = Date.now()
      if (bassE > 140 && now - lastBeat > 250) {
        lastBeat = now; beatFlash = 1.0
        // On a strong beat, swap video early if 5s+ since last swap
        if (bassE > 180 && now - lastSwapRef.current > 5000) {
          lastSwapRef.current = now
          if (swapTimerRef.current) clearTimeout(swapTimerRef.current)
          loadMedia.current(country)
          scheduleSwap.current(country)
        }
      }
      beatFlash = Math.max(0, beatFlash - 0.07)

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
          // Playback speed reacts to energy
          const targetRate = 1 + (energy / 255) * 0.8
          if (Math.abs(vid!.playbackRate - targetRate) > 0.1) vid!.playbackRate = targetRate
          ctx.drawImage(vid!, -offX, -offY, W * zoom, H * zoom)
        } else if (hasImage) {
          // Draw image cover-fit
          const iw = img!.naturalWidth, ih = img!.naturalHeight
          const scale = Math.max(W / iw, H / ih)
          const dw = iw * scale, dh = ih * scale
          ctx.drawImage(img!, -offX + (W - dw) / 2, -offY + (H - dh) / 2, dw * zoom, dh * zoom)
        }

        // Very light overlay — just enough for text legibility, keep colors vivid
        const baseAlpha = 0.18
        const energyLift = (energy / 255) * 0.08 // gets even lighter on high energy
        ctx.fillStyle = `rgba(0,0,0,${Math.max(0.08, baseAlpha - energyLift)})`
        ctx.fillRect(0, 0, W, H)

        // Beat flash in flag primary color
        if (beatFlash > 0) {
          ctx.fillStyle = `${flagColors[0]}${Math.floor(beatFlash * 30).toString(16).padStart(2,'0')}`
          ctx.fillRect(0, 0, W, H)
        }

        // ── Edge frequency beams — flag colors cycling ──
        const barCount = 12
        for (let i = 0; i < barCount; i++) {
          const fv = freqData[Math.floor((i / barCount) * 60) + 4] || 0
          const bh = (fv / 255) * H * 0.22 + beatFlash * H * 0.04
          const col = flagColors[i % flagColors.length]
          ctx.globalAlpha = 0.55 + (fv / 255) * 0.45
          ctx.shadowColor = col; ctx.shadowBlur = 8 + (fv / 255) * 12
          ctx.fillStyle = col
          // Left beams
          ctx.fillRect(0, H * (i / barCount), bh, H / barCount - 1)
          // Right beams
          ctx.fillRect(W - bh, H * (i / barCount), bh, H / barCount - 1)
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

      {/* Hidden YouTube iframe — audio only (keeps playing in background) */}
      {song.youtubeId && (
        <iframe
          key={song.youtubeId}
          id="yt-audio-iframe"
          src={`https://www.youtube-nocookie.com/embed/${song.youtubeId}?autoplay=1&rel=0&modestbranding=1&controls=0&playsinline=1&enablejsapi=1`}
          className="absolute opacity-0 pointer-events-none"
          style={{ width: 1, height: 1, bottom: 0, left: 0 }}
          allow="autoplay; encrypted-media"
        />
      )}

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

        {/* Volume meter */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${singLevel}%`,
                background: singLevel > 60
                  ? "linear-gradient(90deg,#22c55e,#eab308,#ef4444)"
                  : singLevel > 25
                  ? "linear-gradient(90deg,#22c55e,#eab308)"
                  : "#22c55e",
              }}
            />
          </div>
          <span className="text-yellow-400 font-bold text-sm whitespace-nowrap">⭐ {singScore}</span>
        </div>

        {/* Skip + Mic row */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!onPrev}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white disabled:opacity-30"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          {isMicActive ? (
            <button
              onClick={onStopMic}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white text-sm"
              style={{ background: palette[0], boxShadow: `0 0 20px ${palette[0]}` }}
            >
              <MicOff className="h-4 w-4" /> Mute
            </button>
          ) : (
            <button
              onClick={onStartMic}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white text-sm bg-white/20 border border-white/30"
            >
              <Mic className="h-4 w-4" /> Sing!
            </button>
          )}

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
