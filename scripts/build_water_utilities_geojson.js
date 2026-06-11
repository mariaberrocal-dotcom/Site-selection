#!/usr/bin/env node

const fs = require("fs");

const SITES_GEOJSON_PATH = "data/sites.geojson";
const OUTPUT_UTILITIES_GEOJSON_PATH = "data/water_utilities.geojson";
const OUTPUT_SOURCES_GEOJSON_PATH = "data/water_utility_sources.geojson";
const OUTPUT_LINKS_GEOJSON_PATH = "data/water_utility_links.geojson";

const UTILITY_CATALOG = {
  "aawsa-addis-ababa": {
    name: "Addis Ababa Water and Sewerage Authority",
    serviceArea: "Addis Ababa, Ethiopia",
    country: "Ethiopia",
    state: "Addis Ababa",
    confidence: "medium",
    sources: [
      source("Legedadi Reservoir", "surface", "reservoir", 38.93, 9.12),
      source("Gefersa Reservoir", "surface", "reservoir", 38.58, 9.06),
      source("Akaki wellfield", "groundwater", "wellfield", 38.77, 8.87)
    ]
  },
  "ahmedabad-municipal-corporation": {
    name: "Ahmedabad Municipal Corporation Water Supply",
    serviceArea: "Ahmedabad, Gujarat",
    country: "India",
    state: "Gujarat",
    confidence: "high",
    sources: [
      source("Narmada Canal", "surface", "canal", 72.5, 23.1),
      source("Sabarmati River", "surface", "river", 72.58, 23.03),
      source("Ahmedabad municipal wells", "groundwater", "wellfield", 72.54, 23.02)
    ]
  },
  "albertville-utilities-board": {
    name: "Albertville Utilities Board",
    serviceArea: "Albertville, Alabama",
    country: "United States",
    state: "Alabama",
    confidence: "medium",
    sources: [
      source("Albertville municipal wells", "groundwater", "wellfield", -86.21, 34.28),
      source("Big Spring Creek area", "surface", "creek", -86.23, 34.29)
    ]
  },
  "ndlambe-water-services": {
    name: "Ndlambe Local Municipality Water Services",
    serviceArea: "Alexandria, Eastern Cape",
    country: "South Africa",
    state: "Eastern Cape",
    confidence: "medium",
    sources: [
      source("Bushmans River", "surface", "river", 26.63, -33.48),
      source("Alexandria groundwater wells", "groundwater", "wellfield", 26.41, -33.73)
    ]
  },
  "sabesp-sao-paulo": {
    name: "SABESP",
    serviceArea: "Sao Paulo metropolitan and interior service areas",
    country: "Brazil",
    state: "Sao Paulo",
    confidence: "high",
    sources: [
      source("Alto Tiete System", "surface", "reservoir system", -46.25, -23.55),
      source("Cantareira System", "surface", "reservoir system", -46.66, -23.34),
      source("Tietê River corridor", "surface", "river", -46.83, -23.4)
    ]
  },
  "epas-neuquen": {
    name: "EPAS Neuquen",
    serviceArea: "Neuquen Province",
    country: "Argentina",
    state: "Neuquen",
    confidence: "high",
    sources: [
      source("Neuquen River", "surface", "river", -68.8, -38.55),
      source("Limay River", "surface", "river", -68.06, -38.95),
      source("Neuquen alluvial aquifer", "groundwater", "aquifer", -68.77, -38.95)
    ]
  },
  "sadm-monterrey": {
    name: "Servicios de Agua y Drenaje de Monterrey",
    serviceArea: "Monterrey metropolitan area",
    country: "Mexico",
    state: "Nuevo Leon",
    confidence: "high",
    sources: [
      source("La Boca Reservoir", "surface", "reservoir", -100.08, 25.43),
      source("Cerro Prieto Reservoir", "surface", "reservoir", -99.56, 24.92),
      source("Monterrey wellfields", "groundwater", "wellfield", -100.31, 25.68)
    ]
  },
  "zaragoza-water": {
    name: "Ayuntamiento de Zaragoza Water Supply",
    serviceArea: "Zaragoza, Aragon",
    country: "Spain",
    state: "Aragon",
    confidence: "medium",
    sources: [
      source("Ebro River", "surface", "river", -0.88, 41.65),
      source("Canal Imperial de Aragon", "surface", "canal", -0.87, 41.63),
      source("Yesa Reservoir system", "surface", "reservoir", -1.08, 42.63)
    ]
  },
  "onee-azrou": {
    name: "ONEE - Branche Eau",
    serviceArea: "Azrou, Fes-Meknes",
    country: "Morocco",
    state: "Fes-Meknes",
    confidence: "medium",
    sources: [
      source("Tigrigra springs", "groundwater", "spring", -5.22, 33.48),
      source("Azrou groundwater wells", "groundwater", "wellfield", -5.35, 33.44)
    ]
  },
  "thames-water-london": {
    name: "Thames Water",
    serviceArea: "London",
    country: "United Kingdom",
    state: "England",
    confidence: "high",
    sources: [
      source("River Thames", "surface", "river", -0.46, 51.48),
      source("River Lee", "surface", "river", -0.02, 51.68),
      source("London chalk aquifer", "groundwater", "aquifer", -0.12, 51.5)
    ]
  },
  "cosanpa-belem": {
    name: "COSANPA",
    serviceArea: "Belem, Para",
    country: "Brazil",
    state: "Para",
    confidence: "high",
    sources: [
      source("Bolonha Lake", "surface", "lake", -48.43, -1.43),
      source("Agua Preta Lake", "surface", "lake", -48.43, -1.4),
      source("Guama River", "surface", "river", -48.45, -1.48)
    ]
  },
  "bwssb-bengaluru": {
    name: "Bangalore Water Supply and Sewerage Board",
    serviceArea: "Bengaluru",
    country: "India",
    state: "Karnataka",
    confidence: "high",
    sources: [
      source("Cauvery River at TK Halli", "surface", "river intake", 77.25, 12.32),
      source("Thippagondanahalli Reservoir", "surface", "reservoir", 77.35, 13.03),
      source("Bengaluru urban aquifer", "groundwater", "aquifer", 77.6, 12.97)
    ]
  },
  "onee-berkane": {
    name: "ONEE - Branche Eau",
    serviceArea: "Berkane and Moulouya area",
    country: "Morocco",
    state: "L'Oriental",
    confidence: "medium",
    sources: [
      source("Moulouya River", "surface", "river", -2.75, 34.67),
      source("Triffa aquifer", "groundwater", "aquifer", -2.31, 34.92)
    ]
  },
  "city-of-blakely-water": {
    name: "City of Blakely Water Department",
    serviceArea: "Blakely, Georgia",
    country: "United States",
    state: "Georgia",
    confidence: "medium",
    sources: [
      source("Blakely municipal wells", "groundwater", "wellfield", -84.93, 31.38),
      source("Spring Creek", "surface", "creek", -85.02, 31.24)
    ]
  },
  "uisce-eireann-meath": {
    name: "Uisce Eireann",
    serviceArea: "County Meath / Boyne Valley",
    country: "Ireland",
    state: "Meath",
    confidence: "high",
    sources: [
      source("River Boyne", "surface", "river", -6.55, 53.7),
      source("Meath groundwater abstraction", "groundwater", "wellfield", -6.65, 53.65)
    ]
  },
  "calumet-city-water": {
    name: "Calumet City Water Department",
    serviceArea: "Calumet City, Illinois",
    country: "United States",
    state: "Illinois",
    confidence: "medium",
    sources: [
      source("Lake Michigan", "surface", "lake intake", -87.54, 41.72)
    ]
  },
  "can-tho-wassco": {
    name: "Can Tho Water Supply and Sewerage JSC",
    serviceArea: "Can Tho",
    country: "Vietnam",
    state: "Can Tho",
    confidence: "medium",
    sources: [
      source("Hau River", "surface", "river", 105.78, 10.05),
      source("Can Tho groundwater wells", "groundwater", "wellfield", 105.75, 10.04)
    ]
  },
  "suez-loir-et-cher": {
    name: "SUEZ Eau France",
    serviceArea: "Loir-et-Cher / Chambord area",
    country: "France",
    state: "Centre-Val de Loire",
    confidence: "low",
    sources: [
      source("Loire River", "surface", "river", 1.44, 47.59),
      source("Chambord groundwater abstraction", "groundwater", "wellfield", 1.5, 47.62)
    ]
  },
  "water-corporation-western-australia": {
    name: "Water Corporation",
    serviceArea: "Western Australia",
    country: "Australia",
    state: "Western Australia",
    confidence: "high",
    sources: [
      source("Gnangara groundwater system", "groundwater", "aquifer", 115.86, -31.75),
      source("South Dandalup Dam", "surface", "reservoir", 116.02, -32.56),
      source("Yarragadee aquifer", "groundwater", "aquifer", 115.8, -32.2)
    ]
  },
  "chennai-metrowater": {
    name: "Chennai Metropolitan Water Supply and Sewerage Board",
    serviceArea: "Chennai",
    country: "India",
    state: "Tamil Nadu",
    confidence: "high",
    sources: [
      source("Chembarambakkam Lake", "surface", "lake", 80.05, 13.0),
      source("Poondi Reservoir", "surface", "reservoir", 79.93, 13.24),
      source("Veeranam Lake", "surface", "lake", 79.52, 11.23)
    ]
  },
  "chester-water-authority": {
    name: "Chester Water Authority",
    serviceArea: "Chester County / Delaware County, Pennsylvania",
    country: "United States",
    state: "Pennsylvania",
    confidence: "medium",
    sources: [
      source("Octoraro Reservoir", "surface", "reservoir", -76.04, 39.78),
      source("Susquehanna River", "surface", "river", -76.16, 39.8)
    ]
  },
  "jmas-chihuahua": {
    name: "JMAS Chihuahua",
    serviceArea: "Chihuahua, Chihuahua",
    country: "Mexico",
    state: "Chihuahua",
    confidence: "high",
    sources: [
      source("Sacramento aquifer", "groundwater", "aquifer", -106.05, 28.75),
      source("Chuviscar River basin", "surface", "river", -106.1, 28.63)
    ]
  },
  "arc-compiegne-water": {
    name: "Agglomeration de la Region de Compiegne Water Service",
    serviceArea: "Compiegne",
    country: "France",
    state: "Hauts-de-France",
    confidence: "medium",
    sources: [
      source("Oise River", "surface", "river", 2.83, 49.42),
      source("Oise alluvial aquifer", "groundwater", "aquifer", 2.84, 49.43)
    ]
  },
  "twad-cuddalore": {
    name: "TWAD Board / Cuddalore Municipality",
    serviceArea: "Cuddalore, Tamil Nadu",
    country: "India",
    state: "Tamil Nadu",
    confidence: "medium",
    sources: [
      source("Veeranam Lake", "surface", "lake", 79.52, 11.23),
      source("Kedilam River", "surface", "river", 79.75, 11.75),
      source("Cuddalore groundwater wells", "groundwater", "wellfield", 79.74, 11.64)
    ]
  },
  "cap-holding-milan": {
    name: "Gruppo CAP",
    serviceArea: "Milan metropolitan area",
    country: "Italy",
    state: "Lombardy",
    confidence: "high",
    sources: [
      source("Milan plain aquifer", "groundwater", "aquifer", 9.05, 45.44),
      source("Ticino groundwater recharge area", "groundwater", "aquifer", 8.95, 45.45)
    ]
  },
  "city-of-delaware-ohio": {
    name: "City of Delaware Public Utilities",
    serviceArea: "Delaware, Ohio",
    country: "United States",
    state: "Ohio",
    confidence: "high",
    sources: [
      source("Olentangy River", "surface", "river", -83.07, 40.3),
      source("Alum Creek Reservoir", "surface", "reservoir", -82.96, 40.18),
      source("Delaware municipal wells", "groundwater", "wellfield", -83.1, 40.29)
    ]
  },
  "osse-san-juan": {
    name: "Obras Sanitarias Sociedad del Estado San Juan",
    serviceArea: "San Juan Province",
    country: "Argentina",
    state: "San Juan",
    confidence: "high",
    sources: [
      source("San Juan River", "surface", "river", -68.7, -31.53),
      source("Ullum Dam", "surface", "reservoir", -68.67, -31.52),
      source("San Juan alluvial aquifer", "groundwater", "aquifer", -68.53, -31.55)
    ]
  },
  "aysa-buenos-aires": {
    name: "Agua y Saneamientos Argentinos (AySA)",
    serviceArea: "Buenos Aires metropolitan area",
    country: "Argentina",
    state: "Buenos Aires",
    confidence: "high",
    sources: [
      source("Rio de la Plata intake", "surface", "river estuary", -58.31, -34.52),
      source("Puelche aquifer", "groundwater", "aquifer", -58.58, -34.6),
      source("Parana de las Palmas intake corridor", "surface", "river", -58.88, -34.37)
    ]
  },
  "goodyear-water-services": {
    name: "City of Goodyear Water Services",
    serviceArea: "Goodyear, Arizona",
    country: "United States",
    state: "Arizona",
    confidence: "medium",
    sources: [
      source("Central Arizona Project canal", "surface", "canal", -112.42, 33.45),
      source("Goodyear groundwater wells", "groundwater", "wellfield", -112.43, 33.41)
    ]
  },
  "simapag-guanajuato": {
    name: "SIMAPAG",
    serviceArea: "Guanajuato, Guanajuato",
    country: "Mexico",
    state: "Guanajuato",
    confidence: "medium",
    sources: [
      source("Guanajuato aquifer", "groundwater", "aquifer", -101.25, 21.02),
      source("La Purisima Reservoir", "surface", "reservoir", -101.14, 20.97)
    ]
  },
  "aguas-do-rio-guandu": {
    name: "Aguas do Rio / CEDAE Guandu System",
    serviceArea: "Rio de Janeiro Guandu system",
    country: "Brazil",
    state: "Rio de Janeiro",
    confidence: "high",
    sources: [
      source("Guandu River", "surface", "river", -43.72, -22.79),
      source("Ribeirao das Lajes Reservoir", "surface", "reservoir", -43.89, -22.68)
    ]
  },
  "empagua-guatemala": {
    name: "EMPAGUA",
    serviceArea: "Guatemala City",
    country: "Guatemala",
    state: "Guatemala",
    confidence: "high",
    sources: [
      source("Xaya-Pixcaya aqueduct", "surface", "aqueduct", -90.74, 14.74),
      source("Las Vacas River", "surface", "river", -90.49, 14.68),
      source("Guatemala City groundwater wells", "groundwater", "wellfield", -90.52, 14.62)
    ]
  },
  "hammond-water-works": {
    name: "Hammond Water Works Department",
    serviceArea: "Hammond, Indiana",
    country: "United States",
    state: "Indiana",
    confidence: "high",
    sources: [
      source("Lake Michigan", "surface", "lake intake", -87.48, 41.7)
    ]
  },
  "iski-istanbul": {
    name: "ISKI",
    serviceArea: "Istanbul",
    country: "Turkiye",
    state: "Istanbul",
    confidence: "high",
    sources: [
      source("Terkos Lake", "surface", "lake", 28.6, 41.31),
      source("Omerli Reservoir", "surface", "reservoir", 29.34, 41.02),
      source("Melen River system", "surface", "river", 30.92, 41.1)
    ]
  },
  "phed-rajasthan-jaipur": {
    name: "PHED Rajasthan",
    serviceArea: "Jaipur",
    country: "India",
    state: "Rajasthan",
    confidence: "high",
    sources: [
      source("Bisalpur Dam", "surface", "reservoir", 75.45, 25.92),
      source("Jaipur groundwater wells", "groundwater", "wellfield", 75.79, 26.91)
    ]
  },
  "jhelum-municipal-water": {
    name: "Jhelum Municipal Corporation Water Supply",
    serviceArea: "Jhelum, Punjab",
    country: "Pakistan",
    state: "Punjab",
    confidence: "low",
    sources: [
      source("Jhelum River", "surface", "river", 73.73, 32.95),
      source("Jhelum groundwater wells", "groundwater", "wellfield", 73.7, 32.97)
    ]
  },
  "regideso-lualaba": {
    name: "REGIDESO",
    serviceArea: "Lualaba Province",
    country: "Democratic Republic of the Congo",
    state: "Lualaba",
    confidence: "medium",
    sources: [
      source("Luilu River", "surface", "river", 25.43, -10.75),
      source("Lualaba River", "surface", "river", 25.47, -10.69),
      source("Lualaba groundwater wells", "groundwater", "wellfield", 25.6, -10.77)
    ]
  },
  "sundays-river-valley-municipality": {
    name: "Sundays River Valley Municipality Water Services",
    serviceArea: "Kirkwood, Eastern Cape",
    country: "South Africa",
    state: "Eastern Cape",
    confidence: "medium",
    sources: [
      source("Sundays River", "surface", "river", 25.59, -33.39),
      source("Darlington Dam", "surface", "reservoir", 25.16, -33.2),
      source("Kirkwood groundwater wells", "groundwater", "wellfield", 25.28, -33.39)
    ]
  },
  "hcww-aswan": {
    name: "Holding Company for Water and Wastewater - Aswan",
    serviceArea: "Lake Nasser / Aswan area",
    country: "Egypt",
    state: "New Valley",
    confidence: "medium",
    sources: [
      source("Lake Nasser", "surface", "lake", 31.32, 22.65),
      source("Nile River", "surface", "river", 32.89, 24.09)
    ]
  },
  "epsel-lambayeque": {
    name: "EPSEL S.A.",
    serviceArea: "Lambayeque",
    country: "Peru",
    state: "Lambayeque",
    confidence: "high",
    sources: [
      source("Chancay-Lambayeque River", "surface", "river", -79.84, -6.76),
      source("Tinajones Reservoir", "surface", "reservoir", -79.48, -6.64),
      source("Lambayeque groundwater wells", "groundwater", "wellfield", -79.88, -6.33)
    ]
  },
  "latur-municipal-water": {
    name: "Latur Municipal Corporation Water Supply",
    serviceArea: "Latur, Maharashtra",
    country: "India",
    state: "Maharashtra",
    confidence: "medium",
    sources: [
      source("Manjara Dam", "surface", "reservoir", 76.43, 18.7),
      source("Latur groundwater wells", "groundwater", "wellfield", 76.56, 18.4)
    ]
  },
  "opdapas-lerma": {
    name: "OPDAPAS Lerma",
    serviceArea: "Lerma, State of Mexico",
    country: "Mexico",
    state: "State of Mexico",
    confidence: "medium",
    sources: [
      source("Lerma aquifer", "groundwater", "aquifer", -99.52, 19.29),
      source("Lerma River", "surface", "river", -99.49, 19.3)
    ]
  },
  "swde-wallonia": {
    name: "SWDE",
    serviceArea: "Wallonia",
    country: "Belgium",
    state: "Wallonia",
    confidence: "high",
    sources: [
      source("Walloon groundwater abstractions", "groundwater", "wellfield", 3.84, 50.72),
      source("Dendre River", "surface", "river", 3.82, 50.72)
    ]
  },
  "sat-tucuman": {
    name: "Sociedad Aguas del Tucuman",
    serviceArea: "Tucuman",
    country: "Argentina",
    state: "Tucuman",
    confidence: "high",
    sources: [
      source("Sali River", "surface", "river", -65.2, -26.85),
      source("Aconquija foothill groundwater", "groundwater", "aquifer", -65.36, -26.9)
    ]
  },
  "canal-isabel-ii": {
    name: "Canal de Isabel II",
    serviceArea: "Community of Madrid",
    country: "Spain",
    state: "Community of Madrid",
    confidence: "high",
    sources: [
      source("Lozoya River reservoirs", "surface", "reservoir system", -3.59, 40.92),
      source("El Atazar Reservoir", "surface", "reservoir", -3.47, 40.9),
      source("Madrid aquifer", "groundwater", "aquifer", -3.7, 40.42)
    ]
  },
  "eau-de-marseille": {
    name: "Societe Eau de Marseille Metropole",
    serviceArea: "Marseille",
    country: "France",
    state: "Provence-Alpes-Cote d'Azur",
    confidence: "high",
    sources: [
      source("Canal de Marseille", "surface", "canal", 5.4, 43.3),
      source("Durance River", "surface", "river", 5.5, 43.7),
      source("Verdon River system", "surface", "river", 6.15, 43.75)
    ]
  },
  "epm-medellin": {
    name: "Empresas Publicas de Medellin",
    serviceArea: "Medellin metropolitan area",
    country: "Colombia",
    state: "Antioquia",
    confidence: "high",
    sources: [
      source("Rio Grande II Reservoir", "surface", "reservoir", -75.5, 6.47),
      source("La Fe Reservoir", "surface", "reservoir", -75.55, 6.1),
      source("Piedras Blancas Reservoir", "surface", "reservoir", -75.49, 6.28)
    ]
  },
  "berliner-wasserbetriebe": {
    name: "Berliner Wasserbetriebe",
    serviceArea: "Berlin",
    country: "Germany",
    state: "Berlin",
    confidence: "high",
    sources: [
      source("Spree-Havel bank-filtered groundwater", "groundwater", "aquifer", 13.3, 52.45),
      source("Lake Tegel", "surface", "lake", 13.25, 52.58),
      source("Muggelsee", "surface", "lake", 13.65, 52.43)
    ]
  },
  "village-of-minooka-water": {
    name: "Village of Minooka Water Department",
    serviceArea: "Minooka, Illinois",
    country: "United States",
    state: "Illinois",
    confidence: "medium",
    sources: [
      source("Minooka deep wells", "groundwater", "wellfield", -88.26, 41.46),
      source("Aux Sable Creek", "surface", "creek", -88.27, 41.47)
    ]
  },
  "saneago-goias": {
    name: "Saneago",
    serviceArea: "Goias",
    country: "Brazil",
    state: "Goias",
    confidence: "high",
    sources: [
      source("Cana Brava Reservoir", "surface", "reservoir", -48.17, -13.45),
      source("Serra da Mesa Reservoir", "surface", "reservoir", -48.3, -14.0),
      source("Goias groundwater wells", "groundwater", "wellfield", -48.5, -13.5)
    ]
  },
  "pwa-samut-sakhon": {
    name: "Provincial Waterworks Authority - Samut Sakhon",
    serviceArea: "Samut Sakhon",
    country: "Thailand",
    state: "Samut Sakhon",
    confidence: "medium",
    sources: [
      source("Tha Chin River", "surface", "river", 100.27, 13.55),
      source("Mae Klong transfer corridor", "surface", "river transfer", 99.94, 13.42)
    ]
  },
  "noida-authority-water": {
    name: "Noida Authority Water Supply",
    serviceArea: "Noida",
    country: "India",
    state: "Uttar Pradesh",
    confidence: "high",
    sources: [
      source("Upper Ganga Canal", "surface", "canal", 77.55, 28.6),
      source("Noida groundwater wells", "groundwater", "wellfield", 77.36, 28.62)
    ]
  },
  "mcdowell-county-water": {
    name: "McDowell County Water System",
    serviceArea: "North Cove, North Carolina",
    country: "United States",
    state: "North Carolina",
    confidence: "low",
    sources: [
      source("Catawba River", "surface", "river", -82.01, 35.7),
      source("Lake James", "surface", "reservoir", -81.96, 35.74),
      source("North Cove groundwater wells", "groundwater", "wellfield", -82.0, 35.85)
    ]
  },
  "severn-trent-water": {
    name: "Severn Trent Water",
    serviceArea: "Nottinghamshire",
    country: "United Kingdom",
    state: "England",
    confidence: "high",
    sources: [
      source("Derwent Valley reservoirs", "surface", "reservoir system", -1.67, 53.1),
      source("River Derwent", "surface", "river", -1.48, 52.92),
      source("Sherwood Sandstone aquifer", "groundwater", "aquifer", -1.16, 53.32)
    ]
  },
  "pidpa-oevel": {
    name: "Pidpa",
    serviceArea: "Antwerp Campine / Oevel",
    country: "Belgium",
    state: "Flanders",
    confidence: "high",
    sources: [
      source("Antwerp Campine groundwater", "groundwater", "aquifer", 4.92, 51.14),
      source("Albert Canal", "surface", "canal", 4.82, 51.22)
    ]
  },
  "belgrade-waterworks": {
    name: "Belgrade Waterworks and Sewerage",
    serviceArea: "Belgrade",
    country: "Serbia",
    state: "Belgrade",
    confidence: "high",
    sources: [
      source("Sava River alluvial wells", "groundwater", "riverbank filtration", 20.4, 44.8),
      source("Danube River", "surface", "river", 20.47, 44.85)
    ]
  },
  "ose-paysandu": {
    name: "OSE",
    serviceArea: "Paysandu",
    country: "Uruguay",
    state: "Paysandu",
    confidence: "high",
    sources: [
      source("Uruguay River", "surface", "river", -58.07, -32.31),
      source("Paysandu groundwater wells", "groundwater", "wellfield", -58.08, -32.28)
    ]
  },
  "wannon-water-portland": {
    name: "Wannon Water",
    serviceArea: "Portland, Victoria",
    country: "Australia",
    state: "Victoria",
    confidence: "high",
    sources: [
      source("Dilwyn aquifer", "groundwater", "aquifer", 141.6, -38.35),
      source("Surry River", "surface", "river", 141.61, -38.32)
    ]
  },
  "dmae-porto-alegre": {
    name: "DMAE Porto Alegre",
    serviceArea: "Porto Alegre",
    country: "Brazil",
    state: "Rio Grande do Sul",
    confidence: "high",
    sources: [
      source("Guaiba Lake", "surface", "lake", -51.25, -30.05),
      source("Jacui Delta", "surface", "river delta", -51.25, -29.95)
    ]
  },
  "empuerto-puerto-tejada": {
    name: "Empresa de Servicios Publicos de Puerto Tejada",
    serviceArea: "Puerto Tejada, Cauca",
    country: "Colombia",
    state: "Cauca",
    confidence: "medium",
    sources: [
      source("Rio Palo", "surface", "river", -76.45, 3.25),
      source("Puerto Tejada groundwater wells", "groundwater", "wellfield", -76.42, 3.21)
    ]
  },
  "pune-municipal-corporation": {
    name: "Pune Municipal Corporation Water Supply",
    serviceArea: "Pune",
    country: "India",
    state: "Maharashtra",
    confidence: "high",
    sources: [
      source("Khadakwasla Dam", "surface", "reservoir", 73.77, 18.44),
      source("Mutha River", "surface", "river", 73.85, 18.52),
      source("Bhama Askhed Dam", "surface", "reservoir", 73.8, 18.86)
    ]
  },
  "cea-queretaro": {
    name: "CEA Queretaro",
    serviceArea: "Queretaro",
    country: "Mexico",
    state: "Queretaro",
    confidence: "high",
    sources: [
      source("Zimapan Dam / Acueducto II", "surface", "reservoir", -99.5, 20.65),
      source("Queretaro aquifer", "groundwater", "aquifer", -100.4, 20.6)
    ]
  },
  "qujing-water-supply": {
    name: "Qujing Water Supply Company",
    serviceArea: "Qujing, Yunnan",
    country: "China",
    state: "Yunnan",
    confidence: "medium",
    sources: [
      source("Xiaoxiang Reservoir", "surface", "reservoir", 103.75, 25.5),
      source("Nanpan River", "surface", "river", 103.8, 25.48),
      source("Qujing groundwater wells", "groundwater", "wellfield", 103.84, 25.71)
    ]
  },
  "pwa-rayong": {
    name: "Provincial Waterworks Authority - Rayong",
    serviceArea: "Rayong",
    country: "Thailand",
    state: "Rayong",
    confidence: "high",
    sources: [
      source("Nong Pla Lai Reservoir", "surface", "reservoir", 101.15, 12.91),
      source("Prasae Reservoir", "surface", "reservoir", 101.65, 12.85),
      source("Dok Krai Reservoir", "surface", "reservoir", 101.2, 12.9)
    ]
  },
  "fauquier-water": {
    name: "Fauquier County Water and Sanitation Authority",
    serviceArea: "Remington, Virginia",
    country: "United States",
    state: "Virginia",
    confidence: "medium",
    sources: [
      source("Remington groundwater wells", "groundwater", "wellfield", -77.78, 38.53),
      source("Rappahannock River", "surface", "river", -77.8, 38.55)
    ]
  },
  "clcjawa-round-lake": {
    name: "Central Lake County Joint Action Water Agency",
    serviceArea: "Round Lake, Illinois",
    country: "United States",
    state: "Illinois",
    confidence: "high",
    sources: [
      source("Lake Michigan", "surface", "lake intake", -87.83, 42.35),
      source("Central Lake County transmission system", "surface", "treated water system", -88.13, 42.34)
    ]
  },
  "uttarakhand-jal-sansthan-rudrapur": {
    name: "Uttarakhand Jal Sansthan",
    serviceArea: "Rudrapur, Uttarakhand",
    country: "India",
    state: "Uttarakhand",
    confidence: "medium",
    sources: [
      source("Rudrapur groundwater wells", "groundwater", "wellfield", 79.42, 29.01),
      source("Kosi-Ganga canal system", "surface", "canal", 79.45, 29.05)
    ]
  },
  "sacramento-utilities": {
    name: "City of Sacramento Department of Utilities",
    serviceArea: "Sacramento, California",
    country: "United States",
    state: "California",
    confidence: "high",
    sources: [
      source("Sacramento River", "surface", "river", -121.5, 38.58),
      source("American River", "surface", "river", -121.43, 38.59),
      source("Sacramento groundwater wells", "groundwater", "wellfield", -121.4, 38.48)
    ]
  },
  "sharkia-water-company": {
    name: "Sharkia Water and Wastewater Company",
    serviceArea: "Al Sharqia",
    country: "Egypt",
    state: "Al Sharqia",
    confidence: "medium",
    sources: [
      source("Ismailia Canal", "surface", "canal", 31.8, 30.6),
      source("Nile branch canals", "surface", "canal", 31.63, 30.73),
      source("Sharqia groundwater wells", "groundwater", "wellfield", 31.92, 30.67)
    ]
  },
  "aguas-de-saltillo": {
    name: "Aguas de Saltillo",
    serviceArea: "Saltillo, Coahuila",
    country: "Mexico",
    state: "Coahuila",
    confidence: "high",
    sources: [
      source("Saltillo aquifer", "groundwater", "aquifer", -101.02, 25.42),
      source("San Lorenzo Canyon recharge area", "surface", "watershed", -100.98, 25.35)
    ]
  },
  "san-diego-public-utilities": {
    name: "City of San Diego Public Utilities Department",
    serviceArea: "San Diego, California",
    country: "United States",
    state: "California",
    confidence: "high",
    sources: [
      source("San Vicente Reservoir", "surface", "reservoir", -116.93, 32.92),
      source("Colorado River Aqueduct imported supply", "surface", "aqueduct", -114.73, 32.72),
      source("State Water Project imported supply", "surface", "aqueduct", -117.5, 34.2)
    ]
  },
  "pwa-saraburi": {
    name: "Provincial Waterworks Authority - Saraburi",
    serviceArea: "Saraburi",
    country: "Thailand",
    state: "Saraburi",
    confidence: "medium",
    sources: [
      source("Pa Sak Jolasid Dam", "surface", "reservoir", 101.08, 14.87),
      source("Pa Sak River", "surface", "river", 100.91, 14.53),
      source("Saraburi groundwater wells", "groundwater", "wellfield", 100.9, 14.39)
    ]
  },
  "dhaka-wasa": {
    name: "Dhaka WASA",
    serviceArea: "Dhaka / Savar",
    country: "Bangladesh",
    state: "Dhaka",
    confidence: "medium",
    sources: [
      source("Dhaka deep tube wells", "groundwater", "wellfield", 90.4, 23.8),
      source("Padma-Jashaldia intake", "surface", "river intake", 90.36, 23.45),
      source("Sitalakhya River", "surface", "river", 90.5, 23.68)
    ]
  },
  "shanghai-chengtou-water": {
    name: "Shanghai Chengtou Water Group",
    serviceArea: "Shanghai",
    country: "China",
    state: "Shanghai",
    confidence: "high",
    sources: [
      source("Qingcaosha Reservoir", "surface", "reservoir", 121.63, 31.49),
      source("Huangpu River", "surface", "river", 121.49, 31.22),
      source("Chenhang Reservoir", "surface", "reservoir", 121.42, 31.38)
    ]
  },
  "ibaraki-prefectural-water": {
    name: "Ibaraki Prefectural Public Enterprise Bureau",
    serviceArea: "Shimotsuma, Ibaraki",
    country: "Japan",
    state: "Ibaraki",
    confidence: "medium",
    sources: [
      source("Kinu River", "surface", "river", 139.99, 36.14),
      source("Lake Kasumigaura", "surface", "lake", 140.41, 36.05),
      source("Shimotsuma groundwater wells", "groundwater", "wellfield", 140.0, 36.15)
    ]
  },
  "onee-souss-massa": {
    name: "ONEE - Branche Eau",
    serviceArea: "Souss-Massa",
    country: "Morocco",
    state: "Souss-Massa",
    confidence: "medium",
    sources: [
      source("Souss-Massa aquifer", "groundwater", "aquifer", -9.35, 30.14),
      source("Abdelmoumen Dam", "surface", "reservoir", -9.18, 30.63),
      source("Aoulouz Dam", "surface", "reservoir", -8.2, 30.66)
    ]
  },
  "truckee-meadows-water-authority": {
    name: "Truckee Meadows Water Authority",
    serviceArea: "Sparks / Reno, Nevada",
    country: "United States",
    state: "Nevada",
    confidence: "high",
    sources: [
      source("Truckee River", "surface", "river", -119.81, 39.53),
      source("Truckee Meadows groundwater wells", "groundwater", "wellfield", -119.75, 39.56),
      source("Lake Tahoe outlet", "surface", "lake outlet", -120.16, 39.17)
    ]
  },
  "winston-salem-forsyth-utilities": {
    name: "Winston-Salem/Forsyth County Utilities",
    serviceArea: "Tobaccoville, North Carolina",
    country: "United States",
    state: "North Carolina",
    confidence: "medium",
    sources: [
      source("Yadkin River", "surface", "river", -80.38, 36.1),
      source("Salem Lake", "surface", "reservoir", -80.19, 36.08),
      source("Forsyth County groundwater wells", "groundwater", "wellfield", -80.36, 36.25)
    ]
  }
};

const SITE_ASSIGNMENTS = {
  Addis: "aawsa-addis-ababa",
  Ahmedabad: "ahmedabad-municipal-corporation",
  Albertville: "albertville-utilities-board",
  Alexandria: "ndlambe-water-services",
  "Alto Tiete": "sabesp-sao-paulo",
  "Alto Tietê": "sabesp-sao-paulo",
  "Añelo": "epas-neuquen",
  Apodaca: "sadm-monterrey",
  Aragon: "zaragoza-water",
  Azrou: "onee-azrou",
  Battersea: "thames-water-london",
  "Belém": "cosanpa-belem",
  Bengaluru: "bwssb-bengaluru",
  Berkane: "onee-berkane",
  "Blakely, GA": "city-of-blakely-water",
  Boyne: "uisce-eireann-meath",
  Cajamar: "sabesp-sao-paulo",
  "Calumet City, IL USA": "calumet-city-water",
  CanTho: "can-tho-wassco",
  Chambord: "suez-loir-et-cher",
  Chandala: "water-corporation-western-australia",
  Chennai: "chennai-metrowater",
  Chester: "chester-water-authority",
  Chihuahua: "jmas-chihuahua",
  Compiegne: "arc-compiegne-water",
  "Cuddalore, India": "twad-cuddalore",
  Cusago: "cap-holding-milan",
  Delaware: "city-of-delaware-ohio",
  "El Pachón": "osse-san-juan",
  "El Talar": "aysa-buenos-aires",
  Goodyear: "goodyear-water-services",
  Guanajuato: "simapag-guanajuato",
  Guandu: "aguas-do-rio-guandu",
  Guatemala: "empagua-guatemala",
  Hammond: "hammond-water-works",
  Hudson: "aysa-buenos-aires",
  Huntly: "water-corporation-western-australia",
  Istanbul: "iski-istanbul",
  Jaipur: "phed-rajasthan-jaipur",
  Jhelum: "jhelum-municipal-water",
  Kamoto: "regideso-lualaba",
  Kirkwood: "sundays-river-valley-municipality",
  "Lake Nasser": "hcww-aswan",
  Lambayeque: "epsel-lambayeque",
  Latur: "latur-municipal-water",
  Lerma: "opdapas-lerma",
  "Lessiness Belgium": "swde-wallonia",
  "Lessiness, BE": "swde-wallonia",
  Lules: "sat-tucuman",
  "Madrid - Malasaña": "canal-isabel-ii",
  "Marseille, France": "eau-de-marseille",
  "Medellín": "epm-medellin",
  "Milk Chocolate": "berliner-wasserbetriebe",
  Minooka: "village-of-minooka-water",
  MSV: "saneago-goias",
  Mutanda: "regideso-lualaba",
  "Neuquén river": "epas-neuquen",
  "New Samustakorn": "pwa-samut-sakhon",
  Noida: "noida-authority-water",
  "NorthCove, NC": "mcdowell-county-water",
  "NorthCove, NC - USA": "mcdowell-county-water",
  Nottingham: "severn-trent-water",
  Oevel: "pidpa-oevel",
  "Padinska Skela": "belgrade-waterworks",
  Palermo: "aysa-buenos-aires",
  "Paysandú": "ose-paysandu",
  "PCJ-Itararé": "sabesp-sao-paulo",
  Portland: "wannon-water-portland",
  "Porto Alegre": "dmae-porto-alegre",
  "Puerto Tejada": "empuerto-puerto-tejada",
  Pune: "pune-municipal-corporation",
  "Querétaro": "cea-queretaro",
  Qujing: "qujing-water-supply",
  Rayong: "pwa-rayong",
  "Remington Virginia": "fauquier-water",
  "Round Lake, IL - US": "clcjawa-round-lake",
  Rudrapur: "uttarakhand-jal-sansthan-rudrapur",
  Sacramento: "sacramento-utilities",
  Salheya: "sharkia-water-company",
  Saltillo: "aguas-de-saltillo",
  "San Diego": "san-diego-public-utilities",
  "San Juan": "osse-san-juan",
  Saraburi: "pwa-saraburi",
  Savar: "dhaka-wasa",
  Shanghai: "shanghai-chengtou-water",
  Shimotsuma: "ibaraki-prefectural-water",
  Souss: "onee-souss-massa",
  "Sparks, Nevada": "truckee-meadows-water-authority",
  Tobaccoville: "winston-salem-forsyth-utilities",
  "Worksop Factory": "severn-trent-water"
};

function source(name, sourceType, sourceKind, lon, lat) {
  return {
    name,
    sourceType,
    sourceKind,
    coordinates: [lon, lat]
  };
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function averageCoordinates(points) {
  const valid = points.filter((point) => Array.isArray(point) && point.length >= 2);
  if (!valid.length) return null;
  const totals = valid.reduce(
    (acc, point) => {
      acc.lon += Number(point[0]);
      acc.lat += Number(point[1]);
      return acc;
    },
    { lon: 0, lat: 0 }
  );
  return [totals.lon / valid.length, totals.lat / valid.length];
}

function distanceMeters(lon1, lat1, lon2, lat2) {
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const dPhi = (lat2 - lat1) * rad;
  const dLambda = (lon2 - lon1) * rad;
  const a =
    Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

function offsetLonLat(lon, lat, meters, angleRad) {
  const metersPerDegLat = 111320;
  const metersPerDegLon = Math.max(20000, 111320 * Math.cos((lat * Math.PI) / 180));
  const dLon = (Math.cos(angleRad) * meters) / metersPerDegLon;
  const dLat = (Math.sin(angleRad) * meters) / metersPerDegLat;
  return [lon + dLon, lat + dLat];
}

function nearestDistanceToSites(coordinates, siteCoordinates) {
  if (!coordinates || !siteCoordinates.length) return Infinity;
  return Math.min(
    ...siteCoordinates.map((siteCoords) =>
      distanceMeters(coordinates[0], coordinates[1], siteCoords[0], siteCoords[1])
    )
  );
}

function displayCoordinatesForUtility(utilityId, utility, siteCoordinates) {
  const sourceCoordinates = utility.sources.map((item) => item.coordinates);
  const sourceCentroid = averageCoordinates(sourceCoordinates);
  const siteCentroid = averageCoordinates(siteCoordinates);
  let displayCoordinates = sourceCentroid || siteCentroid;

  if (!displayCoordinates) return null;

  const minDistanceMeters = nearestDistanceToSites(displayCoordinates, siteCoordinates);
  if (minDistanceMeters >= 2500) return displayCoordinates;

  const hash = Array.from(utilityId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const angle = (hash % 360) * (Math.PI / 180);
  return offsetLonLat(displayCoordinates[0], displayCoordinates[1], 3000, angle);
}

function buildSourceSummary(utility) {
  return utility.sources.map((item, index) => ({
    id: `${utility.id}-source-${index + 1}`,
    name: item.name,
    sourceType: item.sourceType,
    sourceKind: item.sourceKind,
    longitude: item.coordinates[0],
    latitude: item.coordinates[1]
  }));
}

function main() {
  const sitesGeojson = JSON.parse(fs.readFileSync(SITES_GEOJSON_PATH, "utf8"));
  const sites = sitesGeojson.features || [];
  const assignmentByNormalizedName = new Map(
    Object.entries(SITE_ASSIGNMENTS).map(([name, utilityId]) => [normalizeText(name), utilityId])
  );

  const assignedSitesByUtility = new Map();
  const unmatched = [];

  for (const site of sites) {
    const props = site.properties || {};
    const utilityId = assignmentByNormalizedName.get(normalizeText(props.name));
    const utility = UTILITY_CATALOG[utilityId];

    if (!utility) {
      unmatched.push(props.name || props.id || "Unknown site");
      continue;
    }

    const utilityWithId = { id: utilityId, ...utility };
    const sources = buildSourceSummary(utilityWithId);
    const list = assignedSitesByUtility.get(utilityId) || [];
    list.push(site);
    assignedSitesByUtility.set(utilityId, list);

    props.waterUtilityId = utilityId;
    props.waterUtilityName = utility.name;
    props.waterUtilityServiceArea = utility.serviceArea;
    props.waterUtilityCountry = utility.country;
    props.waterUtilityState = utility.state;
    props.waterUtilityAssignmentMethod = "curated_location_rule";
    props.waterUtilityAssignmentConfidence = utility.confidence || "medium";
    props.waterUtilitySourceCount = sources.length;
    props.waterUtilitySourcesJson = JSON.stringify(sources);
  }

  if (unmatched.length) {
    throw new Error(`Missing water utility assignments for ${unmatched.length} site(s): ${unmatched.join(", ")}`);
  }

  const utilityFeatures = [];
  const sourceFeatures = [];
  const linkFeatures = [];

  for (const [utilityId, utilitySites] of assignedSitesByUtility) {
    const catalogEntry = UTILITY_CATALOG[utilityId];
    const utility = { id: utilityId, ...catalogEntry };
    const siteCoords = utilitySites
      .map((site) => site.geometry?.coordinates)
      .filter((coords) => Array.isArray(coords) && coords.length >= 2);
    const utilityCoordinates = displayCoordinatesForUtility(utilityId, utility, siteCoords);
    const sourceSummary = buildSourceSummary(utility);
    const serviceSites = utilitySites
      .map((site) => site.properties?.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    utilityFeatures.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: utilityCoordinates },
      properties: {
        id: utilityId,
        name: utility.name,
        serviceArea: utility.serviceArea,
        country: utility.country,
        state: utility.state,
        assignmentConfidence: utility.confidence || "medium",
        iconId: "water-utility",
        sourceCount: sourceSummary.length,
        sourcesJson: JSON.stringify(sourceSummary),
        serviceSiteCount: serviceSites.length,
        serviceSites: serviceSites.join(", ")
      }
    });

    sourceSummary.forEach((item, index) => {
      sourceFeatures.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [item.longitude, item.latitude] },
        properties: {
          id: item.id,
          utilityId,
          utilityName: utility.name,
          name: item.name,
          sourceType: item.sourceType,
          sourceKind: item.sourceKind,
          iconId: "water-utility",
          sourceIndex: index + 1
        }
      });
    });

    utilitySites.forEach((site) => {
      const siteCoords = site.geometry?.coordinates;
      if (!Array.isArray(siteCoords) || siteCoords.length < 2) return;
      linkFeatures.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [siteCoords, utilityCoordinates] },
        properties: {
          utilityId,
          utilityName: utility.name,
          linkedSiteId: site.properties?.id || null,
          linkedSiteName: site.properties?.name || null
        }
      });
    });
  }

  const byUtilityName = (a, b) => String(a.properties.name).localeCompare(String(b.properties.name));
  const bySourceName = (a, b) =>
    String(a.properties.utilityName).localeCompare(String(b.properties.utilityName)) ||
    String(a.properties.name).localeCompare(String(b.properties.name));

  utilityFeatures.sort(byUtilityName);
  sourceFeatures.sort(bySourceName);

  fs.writeFileSync(SITES_GEOJSON_PATH, JSON.stringify(sitesGeojson));
  fs.writeFileSync(
    OUTPUT_UTILITIES_GEOJSON_PATH,
    JSON.stringify({ type: "FeatureCollection", features: utilityFeatures })
  );
  fs.writeFileSync(
    OUTPUT_SOURCES_GEOJSON_PATH,
    JSON.stringify({ type: "FeatureCollection", features: sourceFeatures })
  );
  fs.writeFileSync(
    OUTPUT_LINKS_GEOJSON_PATH,
    JSON.stringify({ type: "FeatureCollection", features: linkFeatures })
  );

  console.log(
    `Wrote water utilities: utilities=${utilityFeatures.length}, sources=${sourceFeatures.length}, links=${linkFeatures.length}, assignedSites=${sites.length}`
  );
}

main();
