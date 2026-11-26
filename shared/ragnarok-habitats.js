// Authored ecological encounter domains. Source geography is curated explicitly by ID;
// legacy six-biome combat tags never silently choose a monster's natural habitat.
import {RAGNAROK_VOXEL_REFERENCES,monsterVisualReference} from './monster-visual-references.js';
import {RAGNAROK_EXPANSION} from './ragnarok-expansion.js';
import {RAGNAROK_MVPS} from './ragnarok-mvp-catalog.js';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
export const RO_HABITATS=freeze([
 {key:'biolab',name:'Laboratório de Somatologia',scene:'geffen'},
 {key:'meadow',name:'Campo Verdejante',scene:'grove'},
 {key:'forest',name:'Floresta',scene:'grove'},
 {key:'cave',name:'Caverna',scene:'payon'},
 {key:'firecave',name:'Caverna de Fogo',scene:'forge'},
 {key:'icecave',name:'Caverna de Gelo',scene:'glacier'},
 {key:'desert',name:'Deserto',scene:'sands'},
 {key:'coast',name:'Costa e Cavernas Inundadas',scene:'coast'},
 {key:'ruins',name:'Ruínas',scene:'crypt'},
 {key:'haunted',name:'Terras Assombradas',scene:'crypt'},
 {key:'arcane',name:'Santuário Arcano',scene:'geffen'}
]);
export const RO_HABITAT_SOURCES=freeze({spawns:'https://github.com/rathena/rathena/tree/master/npc/pre-re/mobs',tower:'https://github.com/rathena/rathena/blob/master/npc/instances/EndlessTower.txt',database:'https://github.com/rathena/rathena/blob/master/db/re/mob_db.yml',policy:'Curated source geography plus explicit project ecological overrides; not a claim to reproduce every official spawn map.'});
export const RO_HABITAT_BY_KEY=freeze(Object.fromEntries(RO_HABITATS.map(h=>[h.key,h])));
const CURATED={
 "1647":{habitats:["biolab"],ecologyRule:"biolab-transcendent",provenance:"Lighthalzen Laboratory 3: Assassin Cross Eremes MVP"},
 "1002": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "fields-gelatinous",
  "provenance": "Prontera/Geffen fields: terrestrial gelatinous creatures"
 },
 "1090": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "fields-gelatinous",
  "provenance": "Prontera/Geffen fields: terrestrial gelatinous creatures"
 },
 "1096": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "fields-gelatinous",
  "provenance": "Prontera/Geffen fields: terrestrial gelatinous creatures"
 },
 "1582": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "fields-gelatinous",
  "provenance": "Prontera/Geffen fields: terrestrial gelatinous creatures"
 },
 "1004": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-insects-birds",
  "provenance": "Prontera grassland insects, songbirds and larvae"
 },
 "1007": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-insects-birds",
  "provenance": "Prontera grassland insects, songbirds and larvae"
 },
 "1008": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-insects-birds",
  "provenance": "Prontera grassland insects, songbirds and larvae"
 },
 "1011": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-insects-birds",
  "provenance": "Prontera grassland insects, songbirds and larvae"
 },
 "1018": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-insects-birds",
  "provenance": "Prontera grassland insects, songbirds and larvae"
 },
 "1042": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-insects-birds",
  "provenance": "Prontera grassland insects, songbirds and larvae"
 },
 "1052": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-insects-birds",
  "provenance": "Prontera grassland insects, songbirds and larvae"
 },
 "1088": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-insects-birds",
  "provenance": "Prontera grassland insects, songbirds and larvae"
 },
 "1091": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-insects-birds",
  "provenance": "Prontera grassland insects, songbirds and larvae"
 },
 "1114": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-insects-birds",
  "provenance": "Prontera grassland insects, songbirds and larvae"
 },
 "1174": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-insects-birds",
  "provenance": "Prontera grassland insects, songbirds and larvae"
 },
 "1009": {
  "habitats": [
   "meadow",
   "desert"
  ],
  "ecologyRule": "dry-field-birds",
  "provenance": "Sograt/Juno open grassland and dry plains"
 },
 "1019": {
  "habitats": [
   "meadow",
   "desert"
  ],
  "ecologyRule": "dry-field-birds",
  "provenance": "Sograt/Juno open grassland and dry plains"
 },
 "1049": {
  "habitats": [
   "meadow",
   "desert"
  ],
  "ecologyRule": "dry-field-birds",
  "provenance": "Sograt/Juno open grassland and dry plains"
 },
 "1369": {
  "habitats": [
   "meadow",
   "desert"
  ],
  "ecologyRule": "dry-field-birds",
  "provenance": "Sograt/Juno open grassland and dry plains"
 },
 "1063": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-rabbits",
  "provenance": "Prontera/Payon field rabbits and grassland animals"
 },
 "1516": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "meadow-rabbits",
  "provenance": "Prontera/Payon field rabbits and grassland animals"
 },
 "1014": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "forest-spore",
  "provenance": "User override: Spore only inhabits forest"
 },
 "1031": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "cave-poporing",
  "provenance": "User override: Poporing only inhabits cave"
 },
 "1175": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "cave-tarou",
  "provenance": "User override: Tarou only inhabits cave"
 },
 "1010": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1020": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1033": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1118": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1162": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1277": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1368": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1378": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1410": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1413": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1493": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1495": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1497": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1500": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-plants",
  "provenance": "Payon/Umbala forests: rooted plants, sentient trees and woodland fungi"
 },
 "1013": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1025": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1056": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1057": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1059": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1060": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1103": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1104": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1128": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1139": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1166": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1167": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1180": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1259": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1261": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1303": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1306": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1417": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1498": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1499": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "woodland-fauna",
  "provenance": "Payon/Geffen/Gonryun forest fauna and tribal creatures"
 },
 "1023": {
  "habitats": [
   "forest",
   "ruins"
  ],
  "ecologyRule": "woodland-orcs",
  "provenance": "Geffen Orc Village and ruined tribal fortifications"
 },
 "1087": {
  "habitats": [
   "forest",
   "ruins"
  ],
  "ecologyRule": "woodland-orcs",
  "provenance": "Geffen Orc Village and ruined tribal fortifications"
 },
 "1189": {
  "habitats": [
   "forest",
   "ruins"
  ],
  "ecologyRule": "woodland-orcs",
  "provenance": "Geffen Orc Village and ruined tribal fortifications"
 },
 "1190": {
  "habitats": [
   "forest",
   "ruins"
  ],
  "ecologyRule": "woodland-orcs",
  "provenance": "Geffen Orc Village and ruined tribal fortifications"
 },
 "1213": {
  "habitats": [
   "forest",
   "ruins"
  ],
  "ecologyRule": "woodland-orcs",
  "provenance": "Geffen Orc Village and ruined tribal fortifications"
 },
 "1273": {
  "habitats": [
   "forest",
   "ruins"
  ],
  "ecologyRule": "woodland-orcs",
  "provenance": "Geffen Orc Village and ruined tribal fortifications"
 },
 "1686": {
  "habitats": [
   "forest",
   "ruins"
  ],
  "ecologyRule": "woodland-orcs",
  "provenance": "Geffen Orc Village and ruined tribal fortifications"
 },
 "1122": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "woodland-goblins",
  "provenance": "Geffen goblin/kobold camps and tribal caves"
 },
 "1123": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "woodland-goblins",
  "provenance": "Geffen goblin/kobold camps and tribal caves"
 },
 "1124": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "woodland-goblins",
  "provenance": "Geffen goblin/kobold camps and tribal caves"
 },
 "1125": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "woodland-goblins",
  "provenance": "Geffen goblin/kobold camps and tribal caves"
 },
 "1126": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "woodland-goblins",
  "provenance": "Geffen goblin/kobold camps and tribal caves"
 },
 "1133": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "woodland-goblins",
  "provenance": "Geffen goblin/kobold camps and tribal caves"
 },
 "1134": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "woodland-goblins",
  "provenance": "Geffen goblin/kobold camps and tribal caves"
 },
 "1135": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "woodland-goblins",
  "provenance": "Geffen goblin/kobold camps and tribal caves"
 },
 "1258": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "woodland-goblins",
  "provenance": "Geffen goblin/kobold camps and tribal caves"
 },
 "1282": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "woodland-goblins",
  "provenance": "Geffen goblin/kobold camps and tribal caves"
 },
 "1296": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "woodland-goblins",
  "provenance": "Geffen goblin/kobold camps and tribal caves"
 },
 "1299": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "woodland-goblins",
  "provenance": "Geffen goblin/kobold camps and tribal caves"
 },
 "1372": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "upland-fields",
  "provenance": "Juno uplands, open forest margins and hill wildlife"
 },
 "1376": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "upland-fields",
  "provenance": "Juno uplands, open forest margins and hill wildlife"
 },
 "1627": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "upland-fields",
  "provenance": "Juno uplands, open forest margins and hill wildlife"
 },
 "1629": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "upland-fields",
  "provenance": "Juno uplands, open forest margins and hill wildlife"
 },
 "1680": {
  "habitats": [
   "meadow",
   "forest"
  ],
  "ecologyRule": "upland-fields",
  "provenance": "Juno uplands, open forest margins and hill wildlife"
 },
 "1001": {
  "habitats": [
   "desert"
  ],
  "ecologyRule": "arid-fields",
  "provenance": "Sograt/Veins/Rachel arid field ecology"
 },
 "1030": {
  "habitats": [
   "desert"
  ],
  "ecologyRule": "arid-fields",
  "provenance": "Sograt/Veins/Rachel arid field ecology"
 },
 "1037": {
  "habitats": [
   "desert"
  ],
  "ecologyRule": "arid-fields",
  "provenance": "Sograt/Veins/Rachel arid field ecology"
 },
 "1055": {
  "habitats": [
   "desert"
  ],
  "ecologyRule": "arid-fields",
  "provenance": "Sograt/Veins/Rachel arid field ecology"
 },
 "1106": {
  "habitats": [
   "desert"
  ],
  "ecologyRule": "arid-fields",
  "provenance": "Sograt/Veins/Rachel arid field ecology"
 },
 "1107": {
  "habitats": [
   "desert"
  ],
  "ecologyRule": "arid-fields",
  "provenance": "Sograt/Veins/Rachel arid field ecology"
 },
 "1127": {
  "habitats": [
   "desert"
  ],
  "ecologyRule": "arid-fields",
  "provenance": "Sograt/Veins/Rachel arid field ecology"
 },
 "1159": {
  "habitats": [
   "desert"
  ],
  "ecologyRule": "arid-fields",
  "provenance": "Sograt/Veins/Rachel arid field ecology"
 },
 "1165": {
  "habitats": [
   "desert"
  ],
  "ecologyRule": "arid-fields",
  "provenance": "Sograt/Veins/Rachel arid field ecology"
 },
 "1386": {
  "habitats": [
   "desert"
  ],
  "ecologyRule": "arid-fields",
  "provenance": "Sograt/Veins/Rachel arid field ecology"
 },
 "1783": {
  "habitats": [
   "desert"
  ],
  "ecologyRule": "arid-fields",
  "provenance": "Sograt/Veins/Rachel arid field ecology"
 },
 "1784": {
  "habitats": [
   "desert"
  ],
  "ecologyRule": "arid-fields",
  "provenance": "Sograt/Veins/Rachel arid field ecology"
 },
 "1780": {
  "habitats": [
   "forest",
   "desert"
  ],
  "ecologyRule": "arid-carnivorous-plants",
  "provenance": "Rachel/Veins pitcher-plant fields at the dry forest edge"
 },
 "1781": {
  "habitats": [
   "forest",
   "desert"
  ],
  "ecologyRule": "arid-carnivorous-plants",
  "provenance": "Rachel/Veins pitcher-plant fields at the dry forest edge"
 },
 "1785": {
  "habitats": [
   "forest",
   "desert"
  ],
  "ecologyRule": "arid-giant-predators",
  "provenance": "Rachel wilderness: Atroce roams wooded and dry field margins"
 },
 "1095": {
  "habitats": [
   "cave",
   "desert"
  ],
  "ecologyRule": "anthell",
  "provenance": "Ant Hell and adjacent Morroc sands: ant colony ecology"
 },
 "1097": {
  "habitats": [
   "cave",
   "desert"
  ],
  "ecologyRule": "anthell",
  "provenance": "Ant Hell and adjacent Morroc sands: ant colony ecology"
 },
 "1105": {
  "habitats": [
   "cave",
   "desert"
  ],
  "ecologyRule": "anthell",
  "provenance": "Ant Hell and adjacent Morroc sands: ant colony ecology"
 },
 "1147": {
  "habitats": [
   "cave",
   "desert"
  ],
  "ecologyRule": "anthell",
  "provenance": "Ant Hell and adjacent Morroc sands: ant colony ecology"
 },
 "1160": {
  "habitats": [
   "cave",
   "desert"
  ],
  "ecologyRule": "anthell",
  "provenance": "Ant Hell and adjacent Morroc sands: ant colony ecology"
 },
 "1176": {
  "habitats": [
   "cave",
   "desert"
  ],
  "ecologyRule": "anthell",
  "provenance": "Ant Hell and adjacent Morroc sands: ant colony ecology"
 },
 "1040": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "rock-cavern",
  "provenance": "Comodo/Einbech and subterranean guild caves: mineral, stone and underground wildlife"
 },
 "1194": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "rock-cavern",
  "provenance": "Comodo/Einbech and subterranean guild caves: mineral, stone and underground wildlife"
 },
 "1212": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "rock-cavern",
  "provenance": "Comodo/Einbech and subterranean guild caves: mineral, stone and underground wildlife"
 },
 "1256": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "rock-cavern",
  "provenance": "Comodo/Einbech and subterranean guild caves: mineral, stone and underground wildlife"
 },
 "1278": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "rock-cavern",
  "provenance": "Comodo/Einbech and subterranean guild caves: mineral, stone and underground wildlife"
 },
 "1387": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "rock-cavern",
  "provenance": "Comodo/Einbech and subterranean guild caves: mineral, stone and underground wildlife"
 },
 "1614": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "rock-cavern",
  "provenance": "Comodo/Einbech and subterranean guild caves: mineral, stone and underground wildlife"
 },
 "1615": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "rock-cavern",
  "provenance": "Comodo/Einbech and subterranean guild caves: mineral, stone and underground wildlife"
 },
 "1616": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "rock-cavern",
  "provenance": "Comodo/Einbech and subterranean guild caves: mineral, stone and underground wildlife"
 },
 "1618": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "rock-cavern",
  "provenance": "Comodo/Einbech and subterranean guild caves: mineral, stone and underground wildlife"
 },
 "1619": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "rock-cavern",
  "provenance": "Comodo/Einbech and subterranean guild caves: mineral, stone and underground wildlife"
 },
 "1622": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "rock-cavern",
  "provenance": "Comodo/Einbech and subterranean guild caves: mineral, stone and underground wildlife"
 },
 "1005": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "sewer-insects",
  "provenance": "Prontera culverts and subterranean scavenger colonies"
 },
 "1048": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "sewer-insects",
  "provenance": "Prontera culverts and subterranean scavenger colonies"
 },
 "1051": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "sewer-insects",
  "provenance": "Prontera culverts and subterranean scavenger colonies"
 },
 "1053": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "sewer-insects",
  "provenance": "Prontera culverts and subterranean scavenger colonies"
 },
 "1054": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "sewer-insects",
  "provenance": "Prontera culverts and subterranean scavenger colonies"
 },
 "1086": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "sewer-insects",
  "provenance": "Prontera culverts and subterranean scavenger colonies"
 },
 "1099": {
  "habitats": [
   "cave",
   "forest"
  ],
  "ecologyRule": "spider-cavern",
  "provenance": "Mjolnir/Payon cavern mouths and forest spider habitats"
 },
 "1100": {
  "habitats": [
   "cave",
   "forest"
  ],
  "ecologyRule": "spider-cavern",
  "provenance": "Mjolnir/Payon cavern mouths and forest spider habitats"
 },
 "1035": {
  "habitats": [
   "cave",
   "haunted"
  ],
  "ecologyRule": "dark-cave-insects",
  "provenance": "Geffen caves and ruin basements: parasitic insects and bats"
 },
 "1077": {
  "habitats": [
   "cave",
   "haunted"
  ],
  "ecologyRule": "dark-cave-insects",
  "provenance": "Geffen caves and ruin basements: parasitic insects and bats"
 },
 "1111": {
  "habitats": [
   "cave",
   "haunted"
  ],
  "ecologyRule": "dark-cave-insects",
  "provenance": "Geffen caves and ruin basements: parasitic insects and bats"
 },
 "1209": {
  "habitats": [
   "cave",
   "haunted"
  ],
  "ecologyRule": "dark-cave-insects",
  "provenance": "Geffen caves and ruin basements: parasitic insects and bats"
 },
 "1293": {
  "habitats": [
   "cave",
   "haunted"
  ],
  "ecologyRule": "dark-cave-insects",
  "provenance": "Geffen caves and ruin basements: parasitic insects and bats"
 },
 "1294": {
  "habitats": [
   "cave",
   "haunted"
  ],
  "ecologyRule": "dark-cave-insects",
  "provenance": "Geffen caves and ruin basements: parasitic insects and bats"
 },
 "1300": {
  "habitats": [
   "cave",
   "haunted"
  ],
  "ecologyRule": "dark-cave-insects",
  "provenance": "Geffen caves and ruin basements: parasitic insects and bats"
 },
 "1305": {
  "habitats": [
   "cave",
   "haunted"
  ],
  "ecologyRule": "dark-cave-insects",
  "provenance": "Geffen caves and ruin basements: parasitic insects and bats"
 },
 "1613": {
  "habitats": [
   "cave",
   "meadow"
  ],
  "ecologyRule": "mine-field-metaling",
  "provenance": "Einbroch ore fields and mine passages"
 },
 "1309": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-nogg",
  "provenance": "Nogg/Magma Dungeon: lava golems, fire beasts and dragons"
 },
 "1366": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-nogg",
  "provenance": "Nogg/Magma Dungeon: lava golems, fire beasts and dragons"
 },
 "1379": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-nogg",
  "provenance": "Nogg/Magma Dungeon: lava golems, fire beasts and dragons"
 },
 "1381": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-nogg",
  "provenance": "Nogg/Magma Dungeon: lava golems, fire beasts and dragons"
 },
 "1382": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-nogg",
  "provenance": "Nogg/Magma Dungeon: lava golems, fire beasts and dragons"
 },
 "1383": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-nogg",
  "provenance": "Nogg/Magma Dungeon: lava golems, fire beasts and dragons"
 },
 "1384": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-nogg",
  "provenance": "Nogg/Magma Dungeon: lava golems, fire beasts and dragons"
 },
 "1385": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-nogg",
  "provenance": "Nogg/Magma Dungeon: lava golems, fire beasts and dragons"
 },
 "1831": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-thor",
  "provenance": "Thor volcanic caves: explicit Imp fire-cave ecology"
 },
 "1832": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-thor",
  "provenance": "Thor volcanic caves: explicit Imp fire-cave ecology"
 },
 "1833": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-thor",
  "provenance": "Thor volcanic caves: explicit Imp fire-cave ecology"
 },
 "1836": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-thor",
  "provenance": "Thor volcanic caves: explicit Imp fire-cave ecology"
 },
 "1837": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-thor",
  "provenance": "Thor volcanic caves: explicit Imp fire-cave ecology"
 },
 "1838": {
  "habitats": [
   "firecave"
  ],
  "ecologyRule": "volcanic-thor",
  "provenance": "Thor volcanic caves: explicit Imp fire-cave ecology"
 },
 "1775": {
  "habitats": [
   "icecave"
  ],
  "ecologyRule": "frost-cavern",
  "provenance": "Rachel Ice Cave: glacial spirits, crystals and ice giants"
 },
 "1776": {
  "habitats": [
   "icecave"
  ],
  "ecologyRule": "frost-cavern",
  "provenance": "Rachel Ice Cave: glacial spirits, crystals and ice giants"
 },
 "1777": {
  "habitats": [
   "icecave"
  ],
  "ecologyRule": "frost-cavern",
  "provenance": "Rachel Ice Cave: glacial spirits, crystals and ice giants"
 },
 "1778": {
  "habitats": [
   "icecave"
  ],
  "ecologyRule": "frost-cavern",
  "provenance": "Rachel Ice Cave: glacial spirits, crystals and ice giants"
 },
 "1788": {
  "habitats": [
   "icecave"
  ],
  "ecologyRule": "frost-cavern",
  "provenance": "Rachel Ice Cave: glacial spirits, crystals and ice giants"
 },
 "1789": {
  "habitats": [
   "icecave"
  ],
  "ecologyRule": "frost-cavern",
  "provenance": "Rachel Ice Cave: glacial spirits, crystals and ice giants"
 },
 "1242": {
  "habitats": [
   "icecave"
  ],
  "ecologyRule": "winter-lutie",
  "provenance": "Lutie winter forest and cold mountain fauna"
 },
 "1243": {
  "habitats": [
   "icecave"
  ],
  "ecologyRule": "winter-lutie",
  "provenance": "Lutie winter forest and cold mountain fauna"
 },
 "1252": {
  "habitats": [
   "icecave"
  ],
  "ecologyRule": "winter-lutie",
  "provenance": "Lutie winter forest and cold mountain fauna"
 },
 "1515": {
  "habitats": [
   "icecave"
  ],
  "ecologyRule": "winter-lutie",
  "provenance": "Lutie winter forest and cold mountain fauna"
 },
 "1248": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "enchanted-toy-factory",
  "provenance": "Lutie Toy Factory enchanted machines, dolls and toys; magical factory ecology, not ice physiology"
 },
 "1249": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "enchanted-toy-factory",
  "provenance": "Lutie Toy Factory enchanted machines, dolls and toys; magical factory ecology, not ice physiology"
 },
 "1250": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "enchanted-toy-factory",
  "provenance": "Lutie Toy Factory enchanted machines, dolls and toys; magical factory ecology, not ice physiology"
 },
 "1251": {
  "habitats": [
   "icecave",
   "arcane"
  ],
  "ecologyRule": "winter-storm-sentinel",
  "provenance": "Stormy Knight: winter sentinel with glacial storm attacks; ice physiology, distinct from ordinary Toy Factory toys"
 },
 "1265": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "enchanted-toy-factory",
  "provenance": "Lutie Toy Factory enchanted machines, dolls and toys; magical factory ecology, not ice physiology"
 },
 "1044": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1064": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1065": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1066": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1067": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1068": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1069": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1070": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1073": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1074": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1108": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1141": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1144": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1158": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1161": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1255": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1264": {
  "habitats": [
   "coast"
  ],
  "ecologyRule": "marine-izlude",
  "provenance": "Izlude/Byalan tidal coast and flooded underwater caverns"
 },
 "1071": {
  "habitats": [
   "coast",
   "ruins"
  ],
  "ecologyRule": "shipwreck-undead",
  "provenance": "Alberta Sunken Ship: waterlogged shipwreck undead"
 },
 "1112": {
  "habitats": [
   "coast",
   "ruins"
  ],
  "ecologyRule": "shipwreck-undead",
  "provenance": "Alberta Sunken Ship: waterlogged shipwreck undead"
 },
 "1271": {
  "habitats": [
   "coast",
   "forest"
  ],
  "ecologyRule": "wetland-reptiles",
  "provenance": "Comodo/Umbala marshes and tropical waterside vegetation"
 },
 "1687": {
  "habitats": [
   "coast",
   "forest"
  ],
  "ecologyRule": "wetland-reptiles",
  "provenance": "Comodo/Umbala marshes and tropical waterside vegetation"
 },
 "1206": {
  "habitats": [
   "coast",
   "ruins"
  ],
  "ecologyRule": "sewer-ruins",
  "provenance": "Glast Heim flooded culverts: sewer life needs wet terrain"
 },
 "1216": {
  "habitats": [
   "coast",
   "ruins"
  ],
  "ecologyRule": "sewer-ruins",
  "provenance": "Glast Heim flooded culverts: sewer life needs wet terrain"
 },
 "1312": {
  "habitats": [
   "coast",
   "cave"
  ],
  "ecologyRule": "turtle-island",
  "provenance": "Turtle Island coastal caverns and armoured native turtles"
 },
 "1314": {
  "habitats": [
   "coast",
   "cave"
  ],
  "ecologyRule": "turtle-island",
  "provenance": "Turtle Island coastal caverns and armoured native turtles"
 },
 "1315": {
  "habitats": [
   "coast",
   "cave"
  ],
  "ecologyRule": "turtle-island",
  "provenance": "Turtle Island coastal caverns and armoured native turtles"
 },
 "1316": {
  "habitats": [
   "coast",
   "cave"
  ],
  "ecologyRule": "turtle-island",
  "provenance": "Turtle Island coastal caverns and armoured native turtles"
 },
 "1318": {
  "habitats": [
   "firecave",
   "coast"
  ],
  "ecologyRule": "elemental-turtle-fire",
  "provenance": "Turtle Island fire turtle; authored elemental fire-cavern habitat compatibility"
 },
 "1319": {
  "habitats": [
   "icecave",
   "coast"
  ],
  "ecologyRule": "elemental-turtle-ice",
  "provenance": "Turtle Island ice turtle; authored elemental ice-cavern habitat compatibility"
 },
 "1029": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1032": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1038": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1041": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1098": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1140": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1146": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1149": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1154": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1157": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1164": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1178": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1297": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1301": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1310": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1511": {
  "habitats": [
   "ruins",
   "desert"
  ],
  "ecologyRule": "pyramid-tombs",
  "provenance": "Morroc Pyramid/Sphinx tomb ecology: desert ruins, not every fire-element creature is volcanic"
 },
 "1015": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1016": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1028": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1036": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1076": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1117": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1132": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1163": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1192": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1196": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1197": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1200": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1201": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1202": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1203": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1204": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1205": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1208": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1219": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1253": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1257": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1268": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1272": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1275": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1276": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1291": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1298": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1302": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "castle-undead",
  "provenance": "Glast Heim church, prison and knight barracks"
 },
 "1152": {
  "habitats": [
   "cave",
   "ruins"
  ],
  "ecologyRule": "orc-dungeon",
  "provenance": "Geffen Orc Dungeon undead and mine-adjacent skeletons"
 },
 "1153": {
  "habitats": [
   "cave",
   "ruins"
  ],
  "ecologyRule": "orc-dungeon",
  "provenance": "Geffen Orc Dungeon undead and mine-adjacent skeletons"
 },
 "1169": {
  "habitats": [
   "cave",
   "ruins"
  ],
  "ecologyRule": "orc-dungeon",
  "provenance": "Geffen Orc Dungeon undead and mine-adjacent skeletons"
 },
 "1207": {
  "habitats": [
   "ruins",
   "cave"
  ],
  "ecologyRule": "ruin-swamp-sting",
  "provenance": "Glast Heim underground muddy tunnels and hand-shaped sediment"
 },
 "1102": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1131": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1191": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1193": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1195": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1199": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1211": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1267": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1269": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1270": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1295": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1320": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1377": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "clocktower",
  "provenance": "Al De Baran Clock Tower animated books, clocks and magical inhabitants"
 },
 "1046": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1061": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1109": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1120": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1130": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1143": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1179": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1186": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1260": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1263": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1292": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1370": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1374": {
  "habitats": [
   "haunted",
   "arcane"
  ],
  "ecologyRule": "geffen-haunting",
  "provenance": "Geffen Dungeon magical hauntings and demonic occupants"
 },
 "1039": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "labyrinth-baphomet",
  "provenance": "Geffen/Prontera Labyrinth Forest demons and their patriarch"
 },
 "1101": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "labyrinth-baphomet",
  "provenance": "Geffen/Prontera Labyrinth Forest demons and their patriarch"
 },
 "1026": {
  "habitats": [
   "haunted",
   "cave"
  ],
  "ecologyRule": "payon-hauntings",
  "provenance": "Payon burial caves and wandering Korean spirits"
 },
 "1110": {
  "habitats": [
   "haunted",
   "cave"
  ],
  "ecologyRule": "payon-hauntings",
  "provenance": "Payon burial caves and wandering Korean spirits"
 },
 "1129": {
  "habitats": [
   "haunted",
   "cave"
  ],
  "ecologyRule": "payon-hauntings",
  "provenance": "Payon burial caves and wandering Korean spirits"
 },
 "1150": {
  "habitats": [
   "haunted",
   "cave"
  ],
  "ecologyRule": "payon-hauntings",
  "provenance": "Payon burial caves and wandering Korean spirits"
 },
 "1170": {
  "habitats": [
   "haunted",
   "cave"
  ],
  "ecologyRule": "payon-hauntings",
  "provenance": "Payon burial caves and wandering Korean spirits"
 },
 "1188": {
  "habitats": [
   "haunted",
   "cave"
  ],
  "ecologyRule": "payon-hauntings",
  "provenance": "Payon burial caves and wandering Korean spirits"
 },
 "1307": {
  "habitats": [
   "haunted",
   "cave"
  ],
  "ecologyRule": "payon-hauntings",
  "provenance": "Payon burial caves and wandering Korean spirits"
 },
 "1375": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "amatsu-tombs",
  "provenance": "Amatsu Tatami Maze and underground shrine spirits"
 },
 "1400": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "amatsu-tombs",
  "provenance": "Amatsu Tatami Maze and underground shrine spirits"
 },
 "1401": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "amatsu-tombs",
  "provenance": "Amatsu Tatami Maze and underground shrine spirits"
 },
 "1403": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "amatsu-tombs",
  "provenance": "Amatsu Tatami Maze and underground shrine spirits"
 },
 "1404": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "amatsu-tombs",
  "provenance": "Amatsu Tatami Maze and underground shrine spirits"
 },
 "1405": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "amatsu-tombs",
  "provenance": "Amatsu Tatami Maze and underground shrine spirits"
 },
 "1492": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "amatsu-tombs",
  "provenance": "Amatsu Tatami Maze and underground shrine spirits"
 },
 "1408": {
  "habitats": [
   "forest",
   "arcane"
  ],
  "ecologyRule": "gonryun-woodland",
  "provenance": "Gonryun sacred mountain forests and enchanted groves"
 },
 "1412": {
  "habitats": [
   "forest",
   "arcane"
  ],
  "ecologyRule": "gonryun-woodland",
  "provenance": "Gonryun sacred mountain forests and enchanted groves"
 },
 "1416": {
  "habitats": [
   "forest",
   "arcane"
  ],
  "ecologyRule": "gonryun-woodland",
  "provenance": "Gonryun sacred mountain forests and enchanted groves"
 },
 "1418": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "gonryun-serpent-king",
  "provenance": "Gonryun shrine: ritual serpent lord, not a generic desert snake"
 },
 "1512": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "luoyang-tombs",
  "provenance": "Luoyang royal tombs and their spectral guardians"
 },
 "1513": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "luoyang-tombs",
  "provenance": "Luoyang royal tombs and their spectral guardians"
 },
 "1517": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "luoyang-tombs",
  "provenance": "Luoyang royal tombs and their spectral guardians"
 },
 "1519": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "luoyang-tombs",
  "provenance": "Luoyang royal tombs and their spectral guardians"
 },
 "1630": {
  "habitats": [
   "ruins",
   "haunted"
  ],
  "ecologyRule": "luoyang-tombs",
  "provenance": "Luoyang royal tombs and their spectral guardians"
 },
 "1514": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "luoyang-cave-dragon",
  "provenance": "Luoyang underground caverns: Zhu Po Long water dragon"
 },
 "1503": {
  "habitats": [
   "haunted"
  ],
  "ecologyRule": "niflheim",
  "provenance": "Niflheim dead forest, foggy village and cursed graveyard"
 },
 "1504": {
  "habitats": [
   "haunted"
  ],
  "ecologyRule": "niflheim",
  "provenance": "Niflheim dead forest, foggy village and cursed graveyard"
 },
 "1505": {
  "habitats": [
   "haunted"
  ],
  "ecologyRule": "niflheim",
  "provenance": "Niflheim dead forest, foggy village and cursed graveyard"
 },
 "1506": {
  "habitats": [
   "haunted"
  ],
  "ecologyRule": "niflheim",
  "provenance": "Niflheim dead forest, foggy village and cursed graveyard"
 },
 "1507": {
  "habitats": [
   "haunted"
  ],
  "ecologyRule": "niflheim",
  "provenance": "Niflheim dead forest, foggy village and cursed graveyard"
 },
 "1508": {
  "habitats": [
   "haunted"
  ],
  "ecologyRule": "niflheim",
  "provenance": "Niflheim dead forest, foggy village and cursed graveyard"
 },
 "1509": {
  "habitats": [
   "haunted"
  ],
  "ecologyRule": "niflheim",
  "provenance": "Niflheim dead forest, foggy village and cursed graveyard"
 },
 "1510": {
  "habitats": [
   "haunted"
  ],
  "ecologyRule": "niflheim",
  "provenance": "Niflheim dead forest, foggy village and cursed graveyard"
 },
 "1587": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "ayothaya",
  "provenance": "Ayothaya cursed temple and its spectral dancers"
 },
 "1668": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "juperos-constructs",
  "provenance": "Juperos/Kiel research ruins: magical/mechanical constructs"
 },
 "1670": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "juperos-constructs",
  "provenance": "Juperos/Kiel research ruins: magical/mechanical constructs"
 },
 "1671": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "juperos-constructs",
  "provenance": "Juperos/Kiel research ruins: magical/mechanical constructs"
 },
 "1672": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "juperos-constructs",
  "provenance": "Juperos/Kiel research ruins: magical/mechanical constructs"
 },
 "1673": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "juperos-constructs",
  "provenance": "Juperos/Kiel research ruins: magical/mechanical constructs"
 },
 "1676": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "juperos-constructs",
  "provenance": "Juperos/Kiel research ruins: magical/mechanical constructs"
 },
 "1677": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "juperos-constructs",
  "provenance": "Juperos/Kiel research ruins: magical/mechanical constructs"
 },
 "1678": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "juperos-constructs",
  "provenance": "Juperos/Kiel research ruins: magical/mechanical constructs"
 },
 "1679": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "juperos-constructs",
  "provenance": "Juperos/Kiel research ruins: magical/mechanical constructs"
 },
 "1736": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "juperos-constructs",
  "provenance": "Juperos/Kiel research ruins: magical/mechanical constructs"
 },
 "1737": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "juperos-constructs",
  "provenance": "Juperos/Kiel research ruins: magical/mechanical constructs"
 },
 "1634": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1635": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1636": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1637": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1638": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1639": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1652": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1653": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1654": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1655": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1656": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1657": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1658": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1682": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "biolab",
  "provenance": "Lighthalzen BioLab experimental humanoids and laboratory scavengers"
 },
 "1371": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "thanatos",
  "provenance": "Thanatos Tower angelic sentinels, sorrows and enchanted books"
 },
 "1633": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "thanatos",
  "provenance": "Thanatos Tower angelic sentinels, sorrows and enchanted books"
 },
 "1698": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "thanatos",
  "provenance": "Thanatos Tower angelic sentinels, sorrows and enchanted books"
 },
 "1699": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "thanatos",
  "provenance": "Thanatos Tower angelic sentinels, sorrows and enchanted books"
 },
 "1700": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "thanatos",
  "provenance": "Thanatos Tower angelic sentinels, sorrows and enchanted books"
 },
 "1701": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "thanatos",
  "provenance": "Thanatos Tower angelic sentinels, sorrows and enchanted books"
 },
 "1702": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "thanatos",
  "provenance": "Thanatos Tower angelic sentinels, sorrows and enchanted books"
 },
 "1703": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "thanatos",
  "provenance": "Thanatos Tower angelic sentinels, sorrows and enchanted books"
 },
 "1704": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "thanatos",
  "provenance": "Thanatos Tower angelic sentinels, sorrows and enchanted books"
 },
 "1705": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "thanatos",
  "provenance": "Thanatos Tower angelic sentinels, sorrows and enchanted books"
 },
 "1706": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "thanatos",
  "provenance": "Thanatos Tower angelic sentinels, sorrows and enchanted books"
 },
 "1707": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "thanatos",
  "provenance": "Thanatos Tower angelic sentinels, sorrows and enchanted books"
 },
 "1693": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "odin-shrine",
  "provenance": "Odin Shrine sacred ruins: Valkyries, Skeggiold and Plasma spirits"
 },
 "1694": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "odin-shrine",
  "provenance": "Odin Shrine sacred ruins: Valkyries, Skeggiold and Plasma spirits"
 },
 "1695": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "odin-shrine",
  "provenance": "Odin Shrine sacred ruins: Valkyries, Skeggiold and Plasma spirits"
 },
 "1696": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "odin-shrine",
  "provenance": "Odin Shrine sacred ruins: Valkyries, Skeggiold and Plasma spirits"
 },
 "1697": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "odin-shrine",
  "provenance": "Odin Shrine sacred ruins: Valkyries, Skeggiold and Plasma spirits"
 },
 "1751": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "odin-shrine",
  "provenance": "Odin Shrine sacred ruins: Valkyries, Skeggiold and Plasma spirits"
 },
 "1752": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "odin-shrine",
  "provenance": "Odin Shrine sacred ruins: Valkyries, Skeggiold and Plasma spirits"
 },
 "1754": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "odin-shrine",
  "provenance": "Odin Shrine sacred ruins: Valkyries, Skeggiold and Plasma spirits"
 },
 "1755": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "odin-shrine",
  "provenance": "Odin Shrine sacred ruins: Valkyries, Skeggiold and Plasma spirits"
 },
 "1765": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "odin-shrine",
  "provenance": "Odin Shrine sacred ruins: Valkyries, Skeggiold and Plasma spirits"
 },
 "1769": {
  "habitats": [
   "ruins",
   "arcane"
  ],
  "ecologyRule": "rachel-shrine",
  "provenance": "Rachel Sanctuary and its cultist guardians"
 },
 "1770": {
  "habitats": [
   "ruins",
   "arcane"
  ],
  "ecologyRule": "rachel-shrine",
  "provenance": "Rachel Sanctuary and its cultist guardians"
 },
 "1771": {
  "habitats": [
   "ruins",
   "arcane"
  ],
  "ecologyRule": "rachel-shrine",
  "provenance": "Rachel Sanctuary and its cultist guardians"
 },
 "1772": {
  "habitats": [
   "ruins",
   "arcane"
  ],
  "ecologyRule": "rachel-shrine",
  "provenance": "Rachel Sanctuary and its cultist guardians"
 },
 "1774": {
  "habitats": [
   "ruins",
   "arcane"
  ],
  "ecologyRule": "rachel-shrine",
  "provenance": "Rachel Sanctuary and its cultist guardians"
 },
 "1713": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "abyss-dragons",
  "provenance": "Abyss Lake dragon caverns: draconic eggs, whelps and guardians"
 },
 "1715": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "abyss-dragons",
  "provenance": "Abyss Lake dragon caverns: draconic eggs, whelps and guardians"
 },
 "1716": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "abyss-dragons",
  "provenance": "Abyss Lake dragon caverns: draconic eggs, whelps and guardians"
 },
 "1720": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "abyss-dragons",
  "provenance": "Abyss Lake dragon caverns: draconic eggs, whelps and guardians"
 },
 "1721": {
  "habitats": [
   "cave"
  ],
  "ecologyRule": "abyss-dragons",
  "provenance": "Abyss Lake dragon caverns: draconic eggs, whelps and guardians"
 },
 "1714": {
  "habitats": [
   "firecave",
   "cave"
  ],
  "ecologyRule": "elemental-abyss-dragons",
  "provenance": "Abyss Lake fire dragons; authored compatible volcanic cave encounters"
 },
 "1717": {
  "habitats": [
   "firecave",
   "cave"
  ],
  "ecologyRule": "elemental-abyss-dragons",
  "provenance": "Abyss Lake fire dragons; authored compatible volcanic cave encounters"
 },
 "1155": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "geffen-field-dragons",
  "provenance": "Geffen draconic woodland margins and rocky nesting caves"
 },
 "1156": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "geffen-field-dragons",
  "provenance": "Geffen draconic woodland margins and rocky nesting caves"
 },
 "1262": {
  "habitats": [
   "forest",
   "cave"
  ],
  "ecologyRule": "geffen-field-dragons",
  "provenance": "Geffen draconic woodland margins and rocky nesting caves"
 },
 "1865": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "abbey",
  "provenance": "Nameless Island ruined abbey and its undead/demonic ecology"
 },
 "1867": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "abbey",
  "provenance": "Nameless Island ruined abbey and its undead/demonic ecology"
 },
 "1869": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "abbey",
  "provenance": "Nameless Island ruined abbey and its undead/demonic ecology"
 },
 "1870": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "abbey",
  "provenance": "Nameless Island ruined abbey and its undead/demonic ecology"
 },
 "1871": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "abbey",
  "provenance": "Nameless Island ruined abbey and its undead/demonic ecology"
 },
 "1873": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "abbey",
  "provenance": "Nameless Island ruined abbey and its undead/demonic ecology"
 },
 "1874": {
  "habitats": [
   "haunted",
   "ruins"
  ],
  "ecologyRule": "abbey",
  "provenance": "Nameless Island ruined abbey and its undead/demonic ecology"
 },
 "1916": {
  "habitats": [
   "desert",
   "arcane"
  ],
  "ecologyRule": "morroc-rift",
  "provenance": "Destroyed Morroc/Dimensional Gorge: ruined desert rift and all four incarnations"
 },
 "1918": {
  "habitats": [
   "desert",
   "arcane"
  ],
  "ecologyRule": "morroc-rift",
  "provenance": "Destroyed Morroc/Dimensional Gorge: ruined desert rift and all four incarnations"
 },
 "1919": {
  "habitats": [
   "desert",
   "arcane"
  ],
  "ecologyRule": "morroc-rift",
  "provenance": "Destroyed Morroc/Dimensional Gorge: ruined desert rift and all four incarnations"
 },
 "1920": {
  "habitats": [
   "desert",
   "arcane"
  ],
  "ecologyRule": "morroc-rift",
  "provenance": "Destroyed Morroc/Dimensional Gorge: ruined desert rift and all four incarnations"
 },
 "1921": {
  "habitats": [
   "desert",
   "arcane"
  ],
  "ecologyRule": "morroc-rift",
  "provenance": "Destroyed Morroc/Dimensional Gorge: ruined desert rift and all four incarnations"
 },
 "1829": {
  "habitats": [
   "ruins",
   "arcane"
  ],
  "ecologyRule": "castle-guardians",
  "provenance": "War of Emperium castle guardians are fortress constructs"
 },
 "1830": {
  "habitats": [
   "ruins",
   "arcane"
  ],
  "ecologyRule": "castle-guardians",
  "provenance": "War of Emperium castle guardians are fortress constructs"
 },
 "1957": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "endless-final-sanctum",
  "provenance": "Endless Tower final magical sanctuary and its living thorns"
 },
 "1958": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "endless-final-sanctum",
  "provenance": "Endless Tower final magical sanctuary and its living thorns"
 },
 "1959": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "endless-final-sanctum",
  "provenance": "Endless Tower final magical sanctuary and its living thorns"
 },
 "1960": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "endless-final-sanctum",
  "provenance": "Endless Tower final magical sanctuary and its living thorns"
 },
 "1961": {
  "habitats": [
   "arcane",
   "ruins"
  ],
  "ecologyRule": "endless-final-sanctum",
  "provenance": "Endless Tower final magical sanctuary and its living thorns"
 },
 "1388": {
  "habitats": [
   "meadow",
   "arcane"
  ],
  "ecologyRule": "rarefield-angeling",
  "provenance": "Juno field rare holy gelatinous creature"
 },
 "1313": {
  "habitats": [
   "forest",
   "meadow"
  ],
  "ecologyRule": "upland-trader",
  "provenance": "Mobster ambushes travellers on wooded/open field routes"
 },
 "1113": {
  "habitats": [
   "meadow",
   "desert"
  ],
  "ecologyRule": "dry-field-drops",
  "provenance": "Prontera/Sograt grassland edges and sandy fields"
 },
 "1148": {
  "habitats": [
   "cave",
   "coast"
  ],
  "ecologyRule": "comodo-medusa",
  "provenance": "Comodo Beach Dungeon coastal stone caverns"
 },
 "1092": {
  "habitats": [
   "forest",
   "meadow"
  ],
  "ecologyRule": "forest-wolf-leader",
  "provenance": "Payon woodland/grassland wolf pack leader"
 },
 "1283": {
  "habitats": [
   "ruins",
   "arcane"
  ],
  "ecologyRule": "castle-chimera",
  "provenance": "Glast Heim Castle chimera guarding old magical ruins"
 },
 "1115": {
  "habitats": [
   "forest"
  ],
  "ecologyRule": "payon-tiger",
  "provenance": "Payon deep forest tiger patriarch"
 }
};
// The throne guardian belongs to the tower's haunted stone sanctuary.
CURATED[1956]={habitats:['haunted','ruins'],ecologyRule:'endless-tower-final-throne',provenance:'EndlessTower.txt, 6@tower Tyrant throne, source monster 1956'};
// Named minibosses occupy guardian encounters, not ordinary random waves.
for(const id of [1613,1627,1682,1634,1635,1636,1637,1638,1639,1652,1653,1654,1655,1656,1657,1658])if(CURATED[id]&&!CURATED[id].habitats.includes('biolab'))CURATED[id].habitats.push('biolab');
const minibosses=new Set([1088,1090,1091,1092,1096,1120,1186,1259,1262,1270,1283,1296,1298,1299,1302,1307,1388,1582,1618,1720,1765]);
const expansion=new Map(RAGNAROK_EXPANSION.map(m=>[m.key,m])),mvps=new Set(RAGNAROK_MVPS.map(m=>m.key));
const baseRoles={familiar:'flyer',thiefbug:'swarm',tarou:'swarm',archerskeleton:'ranged',icetitan:'heavy',kasa:'flyer',salamander:'heavy',poring:'swarm',marin:'swarm',spore:'skirmisher',mandragora:'ranged',willow:'heavy',elderwillow:'caster',scorpion:'skirmisher',andre:'swarm',hode:'heavy',golem:'heavy',mummy:'skirmisher',whisper:'flyer',siroma:'skirmisher',gazeti:'caster'};
const baseTiers={familiar:1,thiefbug:1,tarou:1,archerskeleton:1,icetitan:3,kasa:3,salamander:3,poring:1,marin:1,spore:1,mandragora:1,willow:1,elderwillow:2,scorpion:1,andre:1,hode:2,golem:2,mummy:1,whisper:1,siroma:1,gazeti:2};
// These early volcanic natives keep the first fire-cave tier playable without importing forest animals.
const tierOverrides={metaling:1,anopheles:1,remover:2,magmaring:1,knocker:1,imp:2,snowier:2,freezer:2,heater:2};
export const MONSTER_HABITATS=freeze(Object.fromEntries(Object.values(RAGNAROK_VOXEL_REFERENCES).map(ref=>{
 const ecology=CURATED[ref.id];if(!ecology)throw new Error('Missing curated Ragnarok ecology for '+ref.key+' ('+ref.id+')');
 const m=expansion.get(ref.key),bossKind=mvps.has(ref.key)||m?.boss===true?'mvp':minibosses.has(ref.id)?'miniboss':null,bossOnly=bossKind!==null;
 const tier=bossKind==='mvp'?3:(tierOverrides[ref.key]??baseTiers[ref.key]??((m?.unlockWave??40)<=10?1:(m?.unlockWave??40)<=22?2:3));
 return [ref.key,{key:ref.key,habitats:[...ecology.habitats],primary:ecology.habitats[0],role:m?.role??baseRoles[ref.key],tier,bossOnly,bossKind,sourceId:ref.id,sourceName:ref.sourceName,curated:true,ecologyRule:ecology.ecologyRule,provenance:ecology.provenance}];
})));
// Returns an immutable metadata record (or null), resolving only the game's known aliases.
export function monsterHabitats(key){if(typeof key!=='string')return null;const native=Object.hasOwn(MONSTER_HABITATS,key)?key:monsterVisualReference(key);return native&&Object.hasOwn(MONSTER_HABITATS,native)?MONSTER_HABITATS[native]:null;}
const pools=new Map(),empty=Object.freeze([]);
// bosses=false selects ordinary natives only; bosses=true selects bosses only.
// Tier is cumulative (1;1+2;1+2+3), and every result is a concrete native sculpture key.
export function habitatSpecies(habitat,{tier=3,bosses=false}={}){
 if(!Object.hasOwn(RO_HABITAT_BY_KEY,habitat))return empty;
 const limit=Number.isFinite(tier)?Math.max(1,Math.min(3,Math.floor(tier))):3,key=habitat+':'+limit+':'+!!bosses;
 if(!pools.has(key))pools.set(key,Object.freeze(Object.values(MONSTER_HABITATS).filter(m=>m.habitats.includes(habitat)&&m.tier<=limit&&m.bossOnly===!!bosses).map(m=>m.key)));
 return pools.get(key);
}
