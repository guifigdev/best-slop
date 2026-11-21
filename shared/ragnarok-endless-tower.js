// Classic Endless Tower enemy composition from rAthena F_Tower_Monster.
// Source facts only: our combat, maps and progression are authored separately.
// Floor99 selects7 groups WITH replacement from30 alternatives; never spawn its entire pool.
// Floor100: Entweihen +25 fixed thorns +2 random thorn selections.
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
export const RO_ENDLESS_SOURCE=freeze({url:'https://github.com/rathena/rathena/blob/master/npc/instances/EndlessTower.txt',database:'https://github.com/rathena/rathena/blob/master/db/re/mob_db.yml',variant:'Classic 100 floors, pre-Naght-Sieger finale',floor99:'Seven draws with replacement from30 groups',floor100:'Entweihen Knothen/Crothen1957;25 fixed thorns;2 random thorns',retrieved:'2026-11-21'});
export const RO_ENDLESS_FLOORS=freeze([
 {
  "floor": 1,
  "monsters": [
   {
    "sourceName": "Metaling",
    "sourceId": 1613,
    "count": 15,
    "key": "metaling"
   },
   {
    "sourceName": "Marin",
    "sourceId": 1242,
    "count": 5,
    "key": "marin"
   },
   {
    "sourceName": "Poporing",
    "sourceId": 1031,
    "count": 5,
    "key": "poporing"
   },
   {
    "sourceName": "Drops",
    "sourceId": 1113,
    "count": 5,
    "key": "drops"
   },
   {
    "sourceName": "Mastering",
    "sourceId": 1090,
    "count": 1,
    "key": "tower_1090"
   },
   {
    "sourceName": "Poring",
    "sourceId": 1002,
    "count": 5,
    "key": "poring"
   }
  ]
 },
 {
  "floor": 2,
  "monsters": [
   {
    "sourceName": "Desert Wolf",
    "sourceId": 1106,
    "count": 20,
    "key": "desertwolf"
   },
   {
    "sourceName": "Vagabond Wolf",
    "sourceId": 1092,
    "count": 1,
    "key": "tower_1092"
   },
   {
    "sourceName": "Baby Desert Wolf",
    "sourceId": 1107,
    "count": 10,
    "key": "tower_1107"
   }
  ]
 },
 {
  "floor": 3,
  "monsters": [
   {
    "sourceName": "Archer Skeleton",
    "sourceId": 1016,
    "count": 5,
    "key": "archerskeleton"
   },
   {
    "sourceName": "Skel Worker",
    "sourceId": 1169,
    "count": 5,
    "key": "tower_1169"
   },
   {
    "sourceName": "Soldier Skeleton",
    "sourceId": 1028,
    "count": 5,
    "key": "soldierskeleton"
   },
   {
    "sourceName": "Orc Skeleton",
    "sourceId": 1152,
    "count": 5,
    "key": "orcskeleton"
   },
   {
    "sourceName": "Pirate Skeleton",
    "sourceId": 1071,
    "count": 5,
    "key": "tower_1071"
   },
   {
    "sourceName": "Skeleton",
    "sourceId": 1076,
    "count": 5,
    "key": "skeleton"
   }
  ]
 },
 {
  "floor": 4,
  "monsters": [
   {
    "sourceName": "Argiope",
    "sourceId": 1099,
    "count": 15,
    "key": "argiope"
   },
   {
    "sourceName": "Mantis",
    "sourceId": 1139,
    "count": 5,
    "key": "mantis"
   },
   {
    "sourceName": "Argos",
    "sourceId": 1100,
    "count": 5,
    "key": "argos"
   },
   {
    "sourceName": "Vocal",
    "sourceId": 1088,
    "count": 1,
    "key": "tower_1088"
   },
   {
    "sourceName": "Rocker",
    "sourceId": 1052,
    "count": 5,
    "key": "rocker"
   },
   {
    "sourceName": "Hornet",
    "sourceId": 1004,
    "count": 5,
    "key": "tower_1004"
   }
  ]
 },
 {
  "floor": 5,
  "monsters": [
   {
    "sourceName": "Golden Thief Bug",
    "sourceId": 1086,
    "count": 1,
    "key": "gtb",
    "boss": true
   },
   {
    "sourceName": "Thief Bug Male",
    "sourceId": 1054,
    "count": 15,
    "key": "tower_1054"
   },
   {
    "sourceName": "Thief Bug Female",
    "sourceId": 1053,
    "count": 15,
    "key": "tower_1053"
   },
   {
    "sourceName": "Thief Bug",
    "sourceId": 1051,
    "count": 15,
    "key": "thiefbug"
   },
   {
    "sourceName": "Thief Bug Egg",
    "sourceId": 1048,
    "count": 5,
    "key": "tower_1048"
   }
  ],
  "bosses": [
   {
    "sourceName": "Golden Thief Bug",
    "sourceId": 1086,
    "count": 1,
    "key": "gtb",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Golden Thief Bug",
   "sourceId": 1086,
   "count": 1,
   "key": "gtb",
   "boss": true
  }
 },
 {
  "floor": 6,
  "monsters": [
   {
    "sourceName": "Dragon Egg",
    "sourceId": 1721,
    "count": 5,
    "key": "dragonegg"
   },
   {
    "sourceName": "Thief Bug Egg",
    "sourceId": 1048,
    "count": 5,
    "key": "tower_1048"
   },
   {
    "sourceName": "Ant Egg",
    "sourceId": 1097,
    "count": 5,
    "key": "tower_1097"
   },
   {
    "sourceName": "Pupa",
    "sourceId": 1008,
    "count": 5,
    "key": "pupa"
   }
  ]
 },
 {
  "floor": 7,
  "monsters": [
   {
    "sourceName": "Explosion",
    "sourceId": 1383,
    "count": 15,
    "key": "tower_1383"
   },
   {
    "sourceName": "Drainliar",
    "sourceId": 1111,
    "count": 15,
    "key": "drainliar"
   },
   {
    "sourceName": "Anopheles",
    "sourceId": 1627,
    "count": 15,
    "key": "anopheles"
   },
   {
    "sourceName": "Farmiliar",
    "sourceId": 1005,
    "count": 15,
    "key": "familiar"
   }
  ]
 },
 {
  "floor": 8,
  "monsters": [
   {
    "sourceName": "Firelock Soldier",
    "sourceId": 1403,
    "count": 15,
    "key": "firelock"
   },
   {
    "sourceName": "Cruiser",
    "sourceId": 1248,
    "count": 15,
    "key": "cruiser"
   }
  ]
 },
 {
  "floor": 9,
  "monsters": [
   {
    "sourceName": "Obsidian",
    "sourceId": 1615,
    "count": 15,
    "key": "obsidian"
   },
   {
    "sourceName": "Golem",
    "sourceId": 1040,
    "count": 15,
    "key": "golem"
   },
   {
    "sourceName": "Stapo",
    "sourceId": 1784,
    "count": 10,
    "key": "stapo"
   }
  ]
 },
 {
  "floor": 10,
  "monsters": [
   {
    "sourceName": "Mistress",
    "sourceId": 1059,
    "count": 1,
    "key": "mistress",
    "boss": true
   },
   {
    "sourceName": "Giant Hornet",
    "sourceId": 1303,
    "count": 25,
    "key": "tower_1303"
   },
   {
    "sourceName": "Hornet",
    "sourceId": 1004,
    "count": 20,
    "key": "tower_1004"
   }
  ],
  "bosses": [
   {
    "sourceName": "Mistress",
    "sourceId": 1059,
    "count": 1,
    "key": "mistress",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Mistress",
   "sourceId": 1059,
   "count": 1,
   "key": "mistress",
   "boss": true
  }
 },
 {
  "floor": 11,
  "monsters": [
   {
    "sourceName": "Dryad",
    "sourceId": 1493,
    "count": 15,
    "key": "dryad"
   },
   {
    "sourceName": "Parasite",
    "sourceId": 1500,
    "count": 15,
    "key": "parasite"
   },
   {
    "sourceName": "Hermit Plant",
    "sourceId": 1413,
    "count": 15,
    "key": "tower_1413"
   },
   {
    "sourceName": "Rafflesia",
    "sourceId": 1162,
    "count": 5,
    "key": "rafflesia"
   }
  ]
 },
 {
  "floor": 12,
  "monsters": [
   {
    "sourceName": "Demon Pungus",
    "sourceId": 1378,
    "count": 25,
    "key": "demonpungus"
   },
   {
    "sourceName": "Punk",
    "sourceId": 1199,
    "count": 25,
    "key": "punk"
   }
  ]
 },
 {
  "floor": 13,
  "monsters": [
   {
    "sourceName": "Yao Yun",
    "sourceId": 1512,
    "count": 15,
    "key": "tower_1512"
   },
   {
    "sourceName": "Bongunn",
    "sourceId": 1188,
    "count": 15,
    "key": "bongun"
   },
   {
    "sourceName": "Munak",
    "sourceId": 1026,
    "count": 10,
    "key": "munak"
   }
  ]
 },
 {
  "floor": 14,
  "monsters": [
   {
    "sourceName": "High Orc",
    "sourceId": 1213,
    "count": 15,
    "key": "highorc"
   },
   {
    "sourceName": "Orc Archer",
    "sourceId": 1189,
    "count": 10,
    "key": "orcarcher"
   },
   {
    "sourceName": "Orc Lady",
    "sourceId": 1273,
    "count": 10,
    "key": "orclady"
   },
   {
    "sourceName": "Orc Warrior",
    "sourceId": 1023,
    "count": 5,
    "key": "orcwarrior"
   },
   {
    "sourceName": "Orc Baby",
    "sourceId": 1686,
    "count": 5,
    "key": "tower_1686"
   }
  ]
 },
 {
  "floor": 15,
  "monsters": [
   {
    "sourceName": "Maya",
    "sourceId": 1147,
    "count": 1,
    "key": "maya",
    "boss": true
   },
   {
    "sourceName": "Phreeoni",
    "sourceId": 1159,
    "count": 1,
    "key": "phreeoni",
    "boss": true
   },
   {
    "sourceName": "Deniro",
    "sourceId": 1105,
    "count": 15,
    "key": "deniro"
   },
   {
    "sourceName": "Pierre",
    "sourceId": 1160,
    "count": 15,
    "key": "pierre"
   },
   {
    "sourceName": "Andre",
    "sourceId": 1095,
    "count": 15,
    "key": "andre"
   },
   {
    "sourceName": "Ant Egg",
    "sourceId": 1097,
    "count": 5,
    "key": "tower_1097"
   }
  ],
  "bosses": [
   {
    "sourceName": "Maya",
    "sourceId": 1147,
    "count": 1,
    "key": "maya",
    "boss": true
   },
   {
    "sourceName": "Phreeoni",
    "sourceId": 1159,
    "count": 1,
    "key": "phreeoni",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Maya",
   "sourceId": 1147,
   "count": 1,
   "key": "maya",
   "boss": true
  }
 },
 {
  "floor": 16,
  "monsters": [
   {
    "sourceName": "Raydric Archer",
    "sourceId": 1276,
    "count": 10,
    "key": "raydricarcher"
   },
   {
    "sourceName": "Orc Archer",
    "sourceId": 1189,
    "count": 10,
    "key": "orcarcher"
   },
   {
    "sourceName": "Gargoyle",
    "sourceId": 1253,
    "count": 10,
    "key": "tower_1253"
   },
   {
    "sourceName": "Archer Skeleton",
    "sourceId": 1016,
    "count": 10,
    "key": "archerskeleton"
   }
  ]
 },
 {
  "floor": 17,
  "monsters": [
   {
    "sourceName": "Merman",
    "sourceId": 1264,
    "count": 10,
    "key": "merman"
   },
   {
    "sourceName": "Baphomet Jr.",
    "sourceId": 1101,
    "count": 10,
    "key": "tower_1101"
   },
   {
    "sourceName": "Strouf",
    "sourceId": 1065,
    "count": 15,
    "key": "tower_1065"
   },
   {
    "sourceName": "Hill Wind",
    "sourceId": 1629,
    "count": 5,
    "key": "hillwind"
   }
  ]
 },
 {
  "floor": 18,
  "monsters": [
   {
    "sourceName": "Cramp",
    "sourceId": 1209,
    "count": 25,
    "key": "tower_1209"
   },
   {
    "sourceName": "Tarou",
    "sourceId": 1175,
    "count": 15,
    "key": "tarou"
   }
  ]
 },
 {
  "floor": 19,
  "monsters": [
   {
    "sourceName": "Deviace",
    "sourceId": 1108,
    "count": 10,
    "key": "tower_1108"
   },
   {
    "sourceName": "Megalodon",
    "sourceId": 1064,
    "count": 10,
    "key": "tower_1064"
   },
   {
    "sourceName": "Swordfish",
    "sourceId": 1069,
    "count": 10,
    "key": "swordfish"
   },
   {
    "sourceName": "Phen",
    "sourceId": 1158,
    "count": 10,
    "key": "tower_1158"
   }
  ]
 },
 {
  "floor": 20,
  "monsters": [
   {
    "sourceName": "Drake",
    "sourceId": 1112,
    "count": 1,
    "key": "drake",
    "boss": true
   },
   {
    "sourceName": "Pirate Skeleton",
    "sourceId": 1071,
    "count": 50,
    "key": "tower_1071"
   }
  ],
  "bosses": [
   {
    "sourceName": "Drake",
    "sourceId": 1112,
    "count": 1,
    "key": "drake",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Drake",
   "sourceId": 1112,
   "count": 1,
   "key": "drake",
   "boss": true
  }
 },
 {
  "floor": 21,
  "monsters": [
   {
    "sourceName": "Plasma",
    "sourceId": 1693,
    "count": 10,
    "key": "tower_1693"
   },
   {
    "sourceName": "Plasma",
    "sourceId": 1696,
    "count": 10,
    "key": "tower_1696"
   },
   {
    "sourceName": "Plasma",
    "sourceId": 1695,
    "count": 5,
    "key": "tower_1695"
   },
   {
    "sourceName": "Plasma",
    "sourceId": 1697,
    "count": 5,
    "key": "tower_1697"
   },
   {
    "sourceName": "Plasma",
    "sourceId": 1694,
    "count": 5,
    "key": "tower_1694"
   }
  ]
 },
 {
  "floor": 22,
  "monsters": [
   {
    "sourceName": "Muscipular",
    "sourceId": 1780,
    "count": 15,
    "key": "muscipular"
   },
   {
    "sourceName": "Drosera",
    "sourceId": 1781,
    "count": 15,
    "key": "drosera"
   },
   {
    "sourceName": "Flora",
    "sourceId": 1118,
    "count": 15,
    "key": "flora"
   },
   {
    "sourceName": "Hydra",
    "sourceId": 1068,
    "count": 15,
    "key": "hydra"
   },
   {
    "sourceName": "Mandragora",
    "sourceId": 1020,
    "count": 10,
    "key": "mandragora"
   },
   {
    "sourceName": "Rafflesia",
    "sourceId": 1162,
    "count": 10,
    "key": "rafflesia"
   }
  ]
 },
 {
  "floor": 23,
  "monsters": [
   {
    "sourceName": "Penomena",
    "sourceId": 1216,
    "count": 15,
    "key": "penomena"
   },
   {
    "sourceName": "Obeaune",
    "sourceId": 1044,
    "count": 10,
    "key": "obeaune"
   },
   {
    "sourceName": "Marse",
    "sourceId": 1144,
    "count": 10,
    "key": "marse"
   },
   {
    "sourceName": "Swordfish",
    "sourceId": 1069,
    "count": 10,
    "key": "swordfish"
   },
   {
    "sourceName": "Hydra",
    "sourceId": 1068,
    "count": 5,
    "key": "hydra"
   }
  ]
 },
 {
  "floor": 24,
  "monsters": [
   {
    "sourceName": "Joker",
    "sourceId": 1131,
    "count": 15,
    "key": "tower_1131"
   },
   {
    "sourceName": "Carat",
    "sourceId": 1267,
    "count": 15,
    "key": "tower_1267"
   },
   {
    "sourceName": "Jakk",
    "sourceId": 1130,
    "count": 10,
    "key": "tower_1130"
   }
  ]
 },
 {
  "floor": 25,
  "monsters": [
   {
    "sourceName": "Cat o' Nine Tails",
    "sourceId": 1307,
    "count": 15,
    "key": "tower_1307"
   },
   {
    "sourceName": "Moonlight",
    "sourceId": 1150,
    "count": 1,
    "key": "tower_1150",
    "boss": true
   },
   {
    "sourceName": "Nine Tail",
    "sourceId": 1180,
    "count": 15,
    "key": "ninetails"
   }
  ],
  "bosses": [
   {
    "sourceName": "Moonlight",
    "sourceId": 1150,
    "count": 1,
    "key": "tower_1150",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Moonlight",
   "sourceId": 1150,
   "count": 1,
   "key": "tower_1150",
   "boss": true
  }
 },
 {
  "floor": 26,
  "monsters": [
   {
    "sourceName": "Gibbet",
    "sourceId": 1503,
    "count": 10,
    "key": "gibbet"
   },
   {
    "sourceName": "Enchanted Peach Tree",
    "sourceId": 1410,
    "count": 10,
    "key": "peachtree"
   },
   {
    "sourceName": "Wooden Golem",
    "sourceId": 1497,
    "count": 10,
    "key": "woodengolem"
   },
   {
    "sourceName": "Stone Shooter",
    "sourceId": 1495,
    "count": 10,
    "key": "stoneshooter"
   },
   {
    "sourceName": "Elder Willow",
    "sourceId": 1033,
    "count": 5,
    "key": "elderwillow"
   }
  ]
 },
 {
  "floor": 27,
  "monsters": [
   {
    "sourceName": "Goblin Archer",
    "sourceId": 1258,
    "count": 10,
    "key": "tower_1258"
   },
   {
    "sourceName": "Goblin",
    "sourceId": 1122,
    "count": 10,
    "key": "tower_1122"
   },
   {
    "sourceName": "Goblin",
    "sourceId": 1123,
    "count": 5,
    "key": "tower_1123"
   },
   {
    "sourceName": "Goblin",
    "sourceId": 1124,
    "count": 5,
    "key": "tower_1124"
   },
   {
    "sourceName": "Goblin",
    "sourceId": 1125,
    "count": 5,
    "key": "tower_1125"
   },
   {
    "sourceName": "Goblin",
    "sourceId": 1126,
    "count": 5,
    "key": "tower_1126"
   }
  ]
 },
 {
  "floor": 28,
  "monsters": [
   {
    "sourceName": "Arclouse",
    "sourceId": 1194,
    "count": 30,
    "key": "arclouze"
   },
   {
    "sourceName": "Neraid",
    "sourceId": 1255,
    "count": 15,
    "key": "tower_1255"
   },
   {
    "sourceName": "Pest",
    "sourceId": 1256,
    "count": 15,
    "key": "tower_1256"
   },
   {
    "sourceName": "Kukre",
    "sourceId": 1070,
    "count": 10,
    "key": "kukre"
   }
  ]
 },
 {
  "floor": 29,
  "monsters": [
   {
    "sourceName": "Dark Frame",
    "sourceId": 1260,
    "count": 10,
    "key": "tower_1260"
   },
   {
    "sourceName": "The Paper",
    "sourceId": 1375,
    "count": 10,
    "key": "tower_1375"
   },
   {
    "sourceName": "Hylozoist",
    "sourceId": 1510,
    "count": 10,
    "key": "heirozoist"
   },
   {
    "sourceName": "Quve",
    "sourceId": 1508,
    "count": 5,
    "key": "tower_1508"
   },
   {
    "sourceName": "Lude",
    "sourceId": 1509,
    "count": 5,
    "key": "tower_1509"
   },
   {
    "sourceName": "Whisper",
    "sourceId": 1179,
    "count": 10,
    "key": "whisper"
   }
  ]
 },
 {
  "floor": 30,
  "monsters": [
   {
    "sourceName": "White Lady",
    "sourceId": 1630,
    "count": 1,
    "key": "tower_1630",
    "boss": true
   },
   {
    "sourceName": "Evil Nymph",
    "sourceId": 1416,
    "count": 30,
    "key": "tower_1416"
   }
  ],
  "bosses": [
   {
    "sourceName": "White Lady",
    "sourceId": 1630,
    "count": 1,
    "key": "tower_1630",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "White Lady",
   "sourceId": 1630,
   "count": 1,
   "key": "tower_1630",
   "boss": true
  }
 },
 {
  "floor": 31,
  "monsters": [
   {
    "sourceName": "Gig",
    "sourceId": 1387,
    "count": 20,
    "key": "tower_1387"
   },
   {
    "sourceName": "Iron Fist",
    "sourceId": 1212,
    "count": 15,
    "key": "tower_1212"
   },
   {
    "sourceName": "Argiope",
    "sourceId": 1099,
    "count": 10,
    "key": "argiope"
   },
   {
    "sourceName": "Scorpion",
    "sourceId": 1001,
    "count": 5,
    "key": "scorpion"
   }
  ]
 },
 {
  "floor": 32,
  "monsters": [
   {
    "sourceName": "Goblin Leader",
    "sourceId": 1299,
    "count": 1,
    "key": "tower_1299"
   },
   {
    "sourceName": "Goblin Archer",
    "sourceId": 1258,
    "count": 10,
    "key": "tower_1258"
   },
   {
    "sourceName": "Goblin",
    "sourceId": 1122,
    "count": 10,
    "key": "tower_1122"
   },
   {
    "sourceName": "Goblin",
    "sourceId": 1123,
    "count": 5,
    "key": "tower_1123"
   },
   {
    "sourceName": "Goblin",
    "sourceId": 1124,
    "count": 5,
    "key": "tower_1124"
   },
   {
    "sourceName": "Goblin",
    "sourceId": 1125,
    "count": 5,
    "key": "tower_1125"
   },
   {
    "sourceName": "Goblin",
    "sourceId": 1126,
    "count": 5,
    "key": "tower_1126"
   }
  ]
 },
 {
  "floor": 33,
  "monsters": [
   {
    "sourceName": "Kobold Leader",
    "sourceId": 1296,
    "count": 1,
    "key": "tower_1296"
   },
   {
    "sourceName": "Kobold",
    "sourceId": 1133,
    "count": 15,
    "key": "tower_1133"
   },
   {
    "sourceName": "Kobold Archer",
    "sourceId": 1282,
    "count": 15,
    "key": "tower_1282"
   },
   {
    "sourceName": "Kobold",
    "sourceId": 1134,
    "count": 10,
    "key": "tower_1134"
   },
   {
    "sourceName": "Kobold",
    "sourceId": 1135,
    "count": 5,
    "key": "tower_1135"
   }
  ]
 },
 {
  "floor": 34,
  "monsters": [
   {
    "sourceName": "Flame Skull",
    "sourceId": 1869,
    "count": 20,
    "key": "tower_1869"
   },
   {
    "sourceName": "Whisper",
    "sourceId": 1179,
    "count": 10,
    "key": "whisper"
   },
   {
    "sourceName": "Giant Whisper",
    "sourceId": 1186,
    "count": 10,
    "key": "tower_1186"
   }
  ]
 },
 {
  "floor": 35,
  "monsters": [
   {
    "sourceName": "Turtle General",
    "sourceId": 1312,
    "count": 1,
    "key": "tower_1312",
    "boss": true
   },
   {
    "sourceName": "Freezer",
    "sourceId": 1319,
    "count": 10,
    "key": "freezer"
   },
   {
    "sourceName": "Solider",
    "sourceId": 1316,
    "count": 10,
    "key": "solider"
   },
   {
    "sourceName": "Heater",
    "sourceId": 1318,
    "count": 10,
    "key": "heater"
   },
   {
    "sourceName": "Permeter",
    "sourceId": 1314,
    "count": 10,
    "key": "permeter"
   }
  ],
  "bosses": [
   {
    "sourceName": "Turtle General",
    "sourceId": 1312,
    "count": 1,
    "key": "tower_1312",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Turtle General",
   "sourceId": 1312,
   "count": 1,
   "key": "tower_1312",
   "boss": true
  }
 },
 {
  "floor": 36,
  "monsters": [
   {
    "sourceName": "Anolian",
    "sourceId": 1206,
    "count": 30,
    "key": "tower_1206"
   },
   {
    "sourceName": "Grove",
    "sourceId": 1687,
    "count": 10,
    "key": "tower_1687"
   },
   {
    "sourceName": "Alligator",
    "sourceId": 1271,
    "count": 10,
    "key": "alligator"
   }
  ]
 },
 {
  "floor": 37,
  "monsters": [
   {
    "sourceName": "Clock Tower Manager",
    "sourceId": 1270,
    "count": 10,
    "key": "tower_1270"
   },
   {
    "sourceName": "Clock",
    "sourceId": 1269,
    "count": 10,
    "key": "clock"
   },
   {
    "sourceName": "Alarm",
    "sourceId": 1193,
    "count": 30,
    "key": "alarm"
   }
  ]
 },
 {
  "floor": 38,
  "monsters": [
   {
    "sourceName": "Death Word",
    "sourceId": 1698,
    "count": 25,
    "key": "tower_1698"
   },
   {
    "sourceName": "Rideword",
    "sourceId": 1195,
    "count": 25,
    "key": "rideword"
   }
  ]
 },
 {
  "floor": 39,
  "monsters": [
   {
    "sourceName": "Evil Nymph",
    "sourceId": 1416,
    "count": 10,
    "key": "tower_1416"
   },
   {
    "sourceName": "Mao Gui",
    "sourceId": 1513,
    "count": 10,
    "key": "tower_1513"
   },
   {
    "sourceName": "Taoist Hermit",
    "sourceId": 1412,
    "count": 10,
    "key": "taoisthermit"
   },
   {
    "sourceName": "Zhu Po Long",
    "sourceId": 1514,
    "count": 10,
    "key": "tower_1514"
   },
   {
    "sourceName": "Jin Guai",
    "sourceId": 1517,
    "count": 5,
    "key": "tower_1517"
   }
  ]
 },
 {
  "floor": 40,
  "monsters": [
   {
    "sourceName": "Samurai Specter",
    "sourceId": 1492,
    "count": 1,
    "key": "tower_1492",
    "boss": true
   },
   {
    "sourceName": "Shinobi",
    "sourceId": 1401,
    "count": 10,
    "key": "shinobi"
   },
   {
    "sourceName": "Tengu",
    "sourceId": 1405,
    "count": 10,
    "key": "tengu"
   },
   {
    "sourceName": "Firelock Soldier",
    "sourceId": 1403,
    "count": 5,
    "key": "firelock"
   },
   {
    "sourceName": "Miyabi Doll",
    "sourceId": 1404,
    "count": 10,
    "key": "miyabidoll"
   },
   {
    "sourceName": "Karakasa",
    "sourceId": 1400,
    "count": 5,
    "key": "karakasa"
   }
  ],
  "bosses": [
   {
    "sourceName": "Samurai Specter",
    "sourceId": 1492,
    "count": 1,
    "key": "tower_1492",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Samurai Specter",
   "sourceId": 1492,
   "count": 1,
   "key": "tower_1492",
   "boss": true
  }
 },
 {
  "floor": 41,
  "monsters": [
   {
    "sourceName": "Kraben",
    "sourceId": 1587,
    "count": 50,
    "key": "tower_1587"
   }
  ]
 },
 {
  "floor": 42,
  "monsters": [
   {
    "sourceName": "Sleeper",
    "sourceId": 1386,
    "count": 20,
    "key": "sleeper"
   },
   {
    "sourceName": "Sting",
    "sourceId": 1207,
    "count": 10,
    "key": "tower_1207"
   },
   {
    "sourceName": "Mi Gao",
    "sourceId": 1516,
    "count": 10,
    "key": "tower_1516"
   },
   {
    "sourceName": "Sandman",
    "sourceId": 1165,
    "count": 5,
    "key": "tower_1165"
   },
   {
    "sourceName": "Hode",
    "sourceId": 1127,
    "count": 5,
    "key": "hode"
   }
  ]
 },
 {
  "floor": 43,
  "monsters": [
   {
    "sourceName": "Medusa",
    "sourceId": 1148,
    "count": 10,
    "key": "medusa"
   },
   {
    "sourceName": "Sidewinder",
    "sourceId": 1037,
    "count": 40,
    "key": "tower_1037"
   },
   {
    "sourceName": "Anacondaq",
    "sourceId": 1030,
    "count": 5,
    "key": "anacondaq"
   },
   {
    "sourceName": "Boa",
    "sourceId": 1025,
    "count": 5,
    "key": "boa"
   }
  ]
 },
 {
  "floor": 44,
  "monsters": [
   {
    "sourceName": "Hatii Baby",
    "sourceId": 1515,
    "count": 20,
    "key": "tower_1515"
   },
   {
    "sourceName": "Baphomet Jr.",
    "sourceId": 1101,
    "count": 20,
    "key": "tower_1101"
   },
   {
    "sourceName": "Orc Baby",
    "sourceId": 1686,
    "count": 1,
    "key": "tower_1686"
   },
   {
    "sourceName": "Baby Desert Wolf",
    "sourceId": 1107,
    "count": 10,
    "key": "tower_1107"
   },
   {
    "sourceName": "Savage Babe",
    "sourceId": 1167,
    "count": 10,
    "key": "savagebabe"
   }
  ]
 },
 {
  "floor": 45,
  "monsters": [
   {
    "sourceName": "Osiris",
    "sourceId": 1038,
    "count": 1,
    "key": "osiris",
    "boss": true
   },
   {
    "sourceName": "Ancient Mummy",
    "sourceId": 1297,
    "count": 15,
    "key": "tower_1297"
   },
   {
    "sourceName": "Verit",
    "sourceId": 1032,
    "count": 15,
    "key": "verit"
   },
   {
    "sourceName": "Mummy",
    "sourceId": 1041,
    "count": 20,
    "key": "mummy"
   }
  ],
  "bosses": [
   {
    "sourceName": "Osiris",
    "sourceId": 1038,
    "count": 1,
    "key": "osiris",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Osiris",
   "sourceId": 1038,
   "count": 1,
   "key": "osiris",
   "boss": true
  }
 },
 {
  "floor": 46,
  "monsters": [
   {
    "sourceName": "Seeker",
    "sourceId": 1774,
    "count": 20,
    "key": "tower_1774"
   },
   {
    "sourceName": "Beholder",
    "sourceId": 1633,
    "count": 20,
    "key": "tower_1633"
   }
  ]
 },
 {
  "floor": 47,
  "monsters": [
   {
    "sourceName": "Deleter",
    "sourceId": 1384,
    "count": 20,
    "key": "deleter"
   },
   {
    "sourceName": "Deleter",
    "sourceId": 1385,
    "count": 10,
    "key": "tower_1385"
   },
   {
    "sourceName": "Petite",
    "sourceId": 1156,
    "count": 10,
    "key": "tower_1156"
   },
   {
    "sourceName": "Petite",
    "sourceId": 1155,
    "count": 10,
    "key": "petite"
   }
  ]
 },
 {
  "floor": 48,
  "monsters": [
   {
    "sourceName": "Ancient Worm",
    "sourceId": 1305,
    "count": 10,
    "key": "tower_1305"
   },
   {
    "sourceName": "Ancient Mummy",
    "sourceId": 1297,
    "count": 10,
    "key": "tower_1297"
   },
   {
    "sourceName": "Ancient Mimic",
    "sourceId": 1699,
    "count": 10,
    "key": "ancientmimic"
   }
  ]
 },
 {
  "floor": 49,
  "monsters": [
   {
    "sourceName": "Grizzly",
    "sourceId": 1381,
    "count": 20,
    "key": "tower_1381"
   },
   {
    "sourceName": "Leib Olmai",
    "sourceId": 1306,
    "count": 7,
    "key": "tower_1306"
   },
   {
    "sourceName": "Zipper Bear",
    "sourceId": 1417,
    "count": 5,
    "key": "zipperbear"
   },
   {
    "sourceName": "Sasquatch",
    "sourceId": 1243,
    "count": 5,
    "key": "tower_1243"
   },
   {
    "sourceName": "Bigfoot",
    "sourceId": 1060,
    "count": 5,
    "key": "bigfoot"
   }
  ]
 },
 {
  "floor": 50,
  "monsters": [
   {
    "sourceName": "Pharaoh",
    "sourceId": 1157,
    "count": 1,
    "key": "tower_1157",
    "boss": true
   },
   {
    "sourceName": "Amon Ra",
    "sourceId": 1511,
    "count": 1,
    "key": "amonra",
    "boss": true
   },
   {
    "sourceName": "Anubis",
    "sourceId": 1098,
    "count": 10,
    "key": "anubis"
   },
   {
    "sourceName": "Marduk",
    "sourceId": 1140,
    "count": 10,
    "key": "tower_1140"
   },
   {
    "sourceName": "Matyr",
    "sourceId": 1146,
    "count": 10,
    "key": "matyr"
   }
  ],
  "bosses": [
   {
    "sourceName": "Pharaoh",
    "sourceId": 1157,
    "count": 1,
    "key": "tower_1157",
    "boss": true
   },
   {
    "sourceName": "Amon Ra",
    "sourceId": 1511,
    "count": 1,
    "key": "amonra",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Pharaoh",
   "sourceId": 1157,
   "count": 1,
   "key": "tower_1157",
   "boss": true
  }
 },
 {
  "floor": 51,
  "monsters": [
   {
    "sourceName": "Mini Demon",
    "sourceId": 1292,
    "count": 20,
    "key": "tower_1292"
   },
   {
    "sourceName": "Diabolic",
    "sourceId": 1382,
    "count": 20,
    "key": "tower_1382"
   },
   {
    "sourceName": "Deviruchi",
    "sourceId": 1109,
    "count": 10,
    "key": "deviruchi"
   }
  ]
 },
 {
  "floor": 52,
  "monsters": [
   {
    "sourceName": "Harpy",
    "sourceId": 1376,
    "count": 20,
    "key": "harpy"
   },
   {
    "sourceName": "Grand Peco",
    "sourceId": 1369,
    "count": 10,
    "key": "grandpeco"
   },
   {
    "sourceName": "Bloody Butterfly",
    "sourceId": 1408,
    "count": 10,
    "key": "bloodybutterfly"
   },
   {
    "sourceName": "Gargoyle",
    "sourceId": 1253,
    "count": 10,
    "key": "tower_1253"
   },
   {
    "sourceName": "Hill Wind",
    "sourceId": 1680,
    "count": 5,
    "key": "tower_1680"
   },
   {
    "sourceName": "Hill Wind",
    "sourceId": 1629,
    "count": 5,
    "key": "hillwind"
   }
  ]
 },
 {
  "floor": 53,
  "monsters": [
   {
    "sourceName": "Assaulter",
    "sourceId": 1315,
    "count": 25,
    "key": "assaulter"
   },
   {
    "sourceName": "Shinobi",
    "sourceId": 1401,
    "count": 30,
    "key": "shinobi"
   }
  ]
 },
 {
  "floor": 54,
  "monsters": [
   {
    "sourceName": "Chepet",
    "sourceId": 1250,
    "count": 10,
    "key": "chepet"
   },
   {
    "sourceName": "Marionette",
    "sourceId": 1143,
    "count": 10,
    "key": "marionette"
   },
   {
    "sourceName": "Miyabi Doll",
    "sourceId": 1404,
    "count": 10,
    "key": "miyabidoll"
   }
  ]
 },
 {
  "floor": 55,
  "monsters": [
   {
    "sourceName": "Medusa",
    "sourceId": 1148,
    "count": 25,
    "key": "medusa"
   },
   {
    "sourceName": "Evil Snake Lord",
    "sourceId": 1418,
    "count": 1,
    "key": "tower_1418",
    "boss": true
   },
   {
    "sourceName": "Isis",
    "sourceId": 1029,
    "count": 15,
    "key": "isis"
   },
   {
    "sourceName": "Sidewinder",
    "sourceId": 1037,
    "count": 15,
    "key": "tower_1037"
   }
  ],
  "bosses": [
   {
    "sourceName": "Evil Snake Lord",
    "sourceId": 1418,
    "count": 1,
    "key": "tower_1418",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Evil Snake Lord",
   "sourceId": 1418,
   "count": 1,
   "key": "tower_1418",
   "boss": true
  }
 },
 {
  "floor": 56,
  "monsters": [
   {
    "sourceName": "Freezer",
    "sourceId": 1319,
    "count": 10,
    "key": "freezer"
   },
   {
    "sourceName": "Hatii Baby",
    "sourceId": 1515,
    "count": 10,
    "key": "tower_1515"
   },
   {
    "sourceName": "Ice Titan",
    "sourceId": 1777,
    "count": 15,
    "key": "tower_1777"
   },
   {
    "sourceName": "Snowier",
    "sourceId": 1775,
    "count": 10,
    "key": "snowier"
   },
   {
    "sourceName": "Gazeti",
    "sourceId": 1778,
    "count": 10,
    "key": "gazeti"
   }
  ]
 },
 {
  "floor": 57,
  "monsters": [
   {
    "sourceName": "Arc Angeling",
    "sourceId": 1388,
    "count": 1,
    "key": "arcangeling"
   },
   {
    "sourceName": "Deviling",
    "sourceId": 1582,
    "count": 1,
    "key": "deviling"
   },
   {
    "sourceName": "Angeling",
    "sourceId": 1096,
    "count": 1,
    "key": "angeling"
   },
   {
    "sourceName": "Ghostring",
    "sourceId": 1120,
    "count": 1,
    "key": "ghostring"
   },
   {
    "sourceName": "Mastering",
    "sourceId": 1090,
    "count": 1,
    "key": "tower_1090"
   },
   {
    "sourceName": "Metaling",
    "sourceId": 1613,
    "count": 25,
    "key": "metaling"
   },
   {
    "sourceName": "Marin",
    "sourceId": 1242,
    "count": 5,
    "key": "marin"
   },
   {
    "sourceName": "Poporing",
    "sourceId": 1031,
    "count": 5,
    "key": "poporing"
   },
   {
    "sourceName": "Drops",
    "sourceId": 1113,
    "count": 5,
    "key": "drops"
   }
  ]
 },
 {
  "floor": 58,
  "monsters": [
   {
    "sourceName": "Phendark",
    "sourceId": 1202,
    "count": 20,
    "key": "tower_1202"
   },
   {
    "sourceName": "Rybio",
    "sourceId": 1201,
    "count": 10,
    "key": "tower_1201"
   },
   {
    "sourceName": "Zombie Prisoner",
    "sourceId": 1197,
    "count": 10,
    "key": "tower_1197"
   },
   {
    "sourceName": "Skeleton Prisoner",
    "sourceId": 1196,
    "count": 5,
    "key": "tower_1196"
   },
   {
    "sourceName": "Injustice",
    "sourceId": 1257,
    "count": 5,
    "key": "tower_1257"
   }
  ]
 },
 {
  "floor": 59,
  "monsters": [
   {
    "sourceName": "Ancient Mimic",
    "sourceId": 1699,
    "count": 30,
    "key": "ancientmimic"
   },
   {
    "sourceName": "Mimic",
    "sourceId": 1191,
    "count": 20,
    "key": "mimic"
   },
   {
    "sourceName": "Mystcase",
    "sourceId": 1249,
    "count": 10,
    "key": "mystcase"
   }
  ]
 },
 {
  "floor": 60,
  "monsters": [
   {
    "sourceName": "Egnigem Cenia",
    "sourceId": 1658,
    "count": 1,
    "key": "tower_1658",
    "boss": true
   },
   {
    "sourceName": "Doppelganger",
    "sourceId": 1046,
    "count": 1,
    "key": "doppelganger",
    "boss": true
   },
   {
    "sourceName": "Armeyer Dinze",
    "sourceId": 1654,
    "count": 10,
    "key": "tower_1654"
   },
   {
    "sourceName": "Wickebine Tres",
    "sourceId": 1653,
    "count": 10,
    "key": "tower_1653"
   },
   {
    "sourceName": "Laurell Winder",
    "sourceId": 1657,
    "count": 10,
    "key": "tower_1657"
   },
   {
    "sourceName": "Kavach Icarus",
    "sourceId": 1656,
    "count": 10,
    "key": "tower_1656"
   },
   {
    "sourceName": "Errende Ebecee",
    "sourceId": 1655,
    "count": 10,
    "key": "tower_1655"
   },
   {
    "sourceName": "Egnigem Cenia",
    "sourceId": 1652,
    "count": 10,
    "key": "tower_1652"
   }
  ],
  "bosses": [
   {
    "sourceName": "Egnigem Cenia",
    "sourceId": 1658,
    "count": 1,
    "key": "tower_1658",
    "boss": true
   },
   {
    "sourceName": "Doppelganger",
    "sourceId": 1046,
    "count": 1,
    "key": "doppelganger",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Egnigem Cenia",
   "sourceId": 1658,
   "count": 1,
   "key": "tower_1658",
   "boss": true
  }
 },
 {
  "floor": 61,
  "monsters": [
   {
    "sourceName": "Agav",
    "sourceId": 1769,
    "count": 10,
    "key": "tower_1769"
   },
   {
    "sourceName": "Echio",
    "sourceId": 1770,
    "count": 10,
    "key": "tower_1770"
   },
   {
    "sourceName": "Isilla",
    "sourceId": 1772,
    "count": 5,
    "key": "tower_1772"
   },
   {
    "sourceName": "Mobster",
    "sourceId": 1313,
    "count": 10,
    "key": "tower_1313"
   },
   {
    "sourceName": "Pasana",
    "sourceId": 1154,
    "count": 10,
    "key": "pasana"
   },
   {
    "sourceName": "Vanberk",
    "sourceId": 1771,
    "count": 5,
    "key": "tower_1771"
   }
  ]
 },
 {
  "floor": 62,
  "monsters": [
   {
    "sourceName": "Wanderer",
    "sourceId": 1208,
    "count": 35,
    "key": "tower_1208"
   }
  ]
 },
 {
  "floor": 63,
  "monsters": [
   {
    "sourceName": "Ragged Zombie",
    "sourceId": 1865,
    "count": 20,
    "key": "tower_1865"
   },
   {
    "sourceName": "Zombie Master",
    "sourceId": 1298,
    "count": 10,
    "key": "tower_1298"
   },
   {
    "sourceName": "Zombie Prisoner",
    "sourceId": 1197,
    "count": 5,
    "key": "tower_1197"
   },
   {
    "sourceName": "Orc Zombie",
    "sourceId": 1153,
    "count": 5,
    "key": "tower_1153"
   },
   {
    "sourceName": "Zombie",
    "sourceId": 1015,
    "count": 5,
    "key": "zombie"
   }
  ]
 },
 {
  "floor": 64,
  "monsters": [
   {
    "sourceName": "Ungoliant",
    "sourceId": 1618,
    "count": 30,
    "key": "tower_1618"
   },
   {
    "sourceName": "Ancient Worm",
    "sourceId": 1305,
    "count": 2,
    "key": "tower_1305"
   },
   {
    "sourceName": "Caterpillar",
    "sourceId": 1300,
    "count": 2,
    "key": "tower_1300"
   },
   {
    "sourceName": "Creamy Fear",
    "sourceId": 1293,
    "count": 2,
    "key": "tower_1293"
   },
   {
    "sourceName": "Killer Mantis",
    "sourceId": 1294,
    "count": 2,
    "key": "tower_1294"
   },
   {
    "sourceName": "Giant Hornet",
    "sourceId": 1303,
    "count": 2,
    "key": "tower_1303"
   }
  ]
 },
 {
  "floor": 65,
  "monsters": [
   {
    "sourceName": "Atroce",
    "sourceId": 1785,
    "count": 1,
    "key": "tower_1785",
    "boss": true
   },
   {
    "sourceName": "Galion",
    "sourceId": 1783,
    "count": 20,
    "key": "galion"
   }
  ],
  "bosses": [
   {
    "sourceName": "Atroce",
    "sourceId": 1785,
    "count": 1,
    "key": "tower_1785",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Atroce",
   "sourceId": 1785,
   "count": 1,
   "key": "tower_1785",
   "boss": true
  }
 },
 {
  "floor": 66,
  "monsters": [
   {
    "sourceName": "Incubus",
    "sourceId": 1374,
    "count": 20,
    "key": "tower_1374"
   },
   {
    "sourceName": "Aliot",
    "sourceId": 1736,
    "count": 20,
    "key": "tower_1736"
   },
   {
    "sourceName": "Injustice",
    "sourceId": 1257,
    "count": 10,
    "key": "tower_1257"
   }
  ]
 },
 {
  "floor": 67,
  "monsters": [
   {
    "sourceName": "Acidus",
    "sourceId": 1716,
    "count": 10,
    "key": "tower_1716"
   },
   {
    "sourceName": "Acidus",
    "sourceId": 1713,
    "count": 10,
    "key": "acidus"
   },
   {
    "sourceName": "Deleter",
    "sourceId": 1384,
    "count": 5,
    "key": "deleter"
   },
   {
    "sourceName": "Mutant Dragonoid",
    "sourceId": 1262,
    "count": 10,
    "key": "tower_1262"
   },
   {
    "sourceName": "Petite",
    "sourceId": 1156,
    "count": 5,
    "key": "tower_1156"
   }
  ]
 },
 {
  "floor": 68,
  "monsters": [
   {
    "sourceName": "Lava Golem",
    "sourceId": 1366,
    "count": 10,
    "key": "tower_1366"
   },
   {
    "sourceName": "Stalactic Golem",
    "sourceId": 1278,
    "count": 10,
    "key": "stalacticgolem"
   },
   {
    "sourceName": "Ice Titan",
    "sourceId": 1777,
    "count": 10,
    "key": "tower_1777"
   },
   {
    "sourceName": "Wooden Golem",
    "sourceId": 1497,
    "count": 5,
    "key": "woodengolem"
   },
   {
    "sourceName": "Golem",
    "sourceId": 1040,
    "count": 5,
    "key": "golem"
   }
  ]
 },
 {
  "floor": 69,
  "monsters": [
   {
    "sourceName": "Dame of Sentinel",
    "sourceId": 1700,
    "count": 20,
    "key": "tower_1700"
   },
   {
    "sourceName": "Mistress of Shelter",
    "sourceId": 1701,
    "count": 10,
    "key": "tower_1701"
   },
   {
    "sourceName": "Baroness of Retribution",
    "sourceId": 1702,
    "count": 10,
    "key": "tower_1702"
   },
   {
    "sourceName": "Lady Solace",
    "sourceId": 1703,
    "count": 10,
    "key": "tower_1703"
   },
   {
    "sourceName": "False Angel",
    "sourceId": 1371,
    "count": 10,
    "key": "tower_1371"
   }
  ]
 },
 {
  "floor": 70,
  "monsters": [
   {
    "sourceName": "Orc Hero",
    "sourceId": 1087,
    "count": 1,
    "key": "tower_1087",
    "boss": true
   },
   {
    "sourceName": "Orc Lord",
    "sourceId": 1190,
    "count": 1,
    "key": "tower_1190",
    "boss": true
   },
   {
    "sourceName": "Orc Baby",
    "sourceId": 1686,
    "count": 20,
    "key": "tower_1686"
   }
  ],
  "bosses": [
   {
    "sourceName": "Orc Hero",
    "sourceId": 1087,
    "count": 1,
    "key": "tower_1087",
    "boss": true
   },
   {
    "sourceName": "Orc Lord",
    "sourceId": 1190,
    "count": 1,
    "key": "tower_1190",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Orc Hero",
   "sourceId": 1087,
   "count": 1,
   "key": "tower_1087",
   "boss": true
  }
 },
 {
  "floor": 71,
  "monsters": [
   {
    "sourceName": "Succubus",
    "sourceId": 1370,
    "count": 20,
    "key": "tower_1370"
   },
   {
    "sourceName": "Nightmare Terror",
    "sourceId": 1379,
    "count": 20,
    "key": "tower_1379"
   },
   {
    "sourceName": "Incubus",
    "sourceId": 1374,
    "count": 20,
    "key": "tower_1374"
   },
   {
    "sourceName": "Nightmare",
    "sourceId": 1061,
    "count": 5,
    "key": "nightmare"
   }
  ]
 },
 {
  "floor": 72,
  "monsters": [
   {
    "sourceName": "Margaretha Sorin",
    "sourceId": 1637,
    "count": 10,
    "key": "tower_1637"
   },
   {
    "sourceName": "Permeter",
    "sourceId": 1314,
    "count": 10,
    "key": "permeter"
   },
   {
    "sourceName": "Errende Ebecee",
    "sourceId": 1655,
    "count": 10,
    "key": "tower_1655"
   },
   {
    "sourceName": "Enchanted Peach Tree",
    "sourceId": 1410,
    "count": 10,
    "key": "peachtree"
   }
  ]
 },
 {
  "floor": 73,
  "monsters": [
   {
    "sourceName": "Succubus",
    "sourceId": 1370,
    "count": 10,
    "key": "tower_1370"
   },
   {
    "sourceName": "Loli Ruri",
    "sourceId": 1505,
    "count": 20,
    "key": "loliruri"
   },
   {
    "sourceName": "Aliza",
    "sourceId": 1737,
    "count": 10,
    "key": "tower_1737"
   },
   {
    "sourceName": "Zealotus",
    "sourceId": 1200,
    "count": 5,
    "key": "tower_1200"
   },
   {
    "sourceName": "Alice",
    "sourceId": 1275,
    "count": 5,
    "key": "alice"
   },
   {
    "sourceName": "Green Maiden",
    "sourceId": 1519,
    "count": 10,
    "key": "tower_1519"
   }
  ]
 },
 {
  "floor": 74,
  "monsters": [
   {
    "sourceName": "Dimik",
    "sourceId": 1671,
    "count": 6,
    "key": "tower_1671"
   },
   {
    "sourceName": "Dimik",
    "sourceId": 1673,
    "count": 6,
    "key": "tower_1673"
   },
   {
    "sourceName": "Dimik",
    "sourceId": 1672,
    "count": 6,
    "key": "tower_1672"
   },
   {
    "sourceName": "Venatu",
    "sourceId": 1677,
    "count": 6,
    "key": "tower_1677"
   },
   {
    "sourceName": "Dimik",
    "sourceId": 1670,
    "count": 6,
    "key": "tower_1670"
   },
   {
    "sourceName": "Archdam",
    "sourceId": 1668,
    "count": 6,
    "key": "tower_1668"
   },
   {
    "sourceName": "Venatu",
    "sourceId": 1678,
    "count": 6,
    "key": "tower_1678"
   },
   {
    "sourceName": "Venatu",
    "sourceId": 1679,
    "count": 6,
    "key": "tower_1679"
   },
   {
    "sourceName": "Venatu",
    "sourceId": 1676,
    "count": 6,
    "key": "tower_1676"
   }
  ]
 },
 {
  "floor": 75,
  "monsters": [
   {
    "sourceName": "Baphomet",
    "sourceId": 1039,
    "count": 1,
    "key": "baphomet",
    "boss": true
   },
   {
    "sourceName": "Dark Lord",
    "sourceId": 1272,
    "count": 1,
    "key": "tower_1272",
    "boss": true
   },
   {
    "sourceName": "Baphomet Jr.",
    "sourceId": 1101,
    "count": 20,
    "key": "tower_1101"
   },
   {
    "sourceName": "Dark Illusion",
    "sourceId": 1302,
    "count": 10,
    "key": "tower_1302"
   }
  ],
  "bosses": [
   {
    "sourceName": "Baphomet",
    "sourceId": 1039,
    "count": 1,
    "key": "baphomet",
    "boss": true
   },
   {
    "sourceName": "Dark Lord",
    "sourceId": 1272,
    "count": 1,
    "key": "tower_1272",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Baphomet",
   "sourceId": 1039,
   "count": 1,
   "key": "baphomet",
   "boss": true
  }
 },
 {
  "floor": 76,
  "monsters": [
   {
    "sourceName": "Abysmal Knight",
    "sourceId": 1219,
    "count": 30,
    "key": "abyssknight"
   },
   {
    "sourceName": "Nightmare Terror",
    "sourceId": 1379,
    "count": 20,
    "key": "tower_1379"
   },
   {
    "sourceName": "Nightmare",
    "sourceId": 1061,
    "count": 10,
    "key": "nightmare"
   }
  ]
 },
 {
  "floor": 77,
  "monsters": [
   {
    "sourceName": "Banshee",
    "sourceId": 1867,
    "count": 30,
    "key": "tower_1867"
   },
   {
    "sourceName": "Wraith Dead",
    "sourceId": 1291,
    "count": 10,
    "key": "tower_1291"
   },
   {
    "sourceName": "Evil Druid",
    "sourceId": 1117,
    "count": 10,
    "key": "tower_1117"
   },
   {
    "sourceName": "Wraith",
    "sourceId": 1192,
    "count": 10,
    "key": "tower_1192"
   },
   {
    "sourceName": "Wind Ghost",
    "sourceId": 1263,
    "count": 10,
    "key": "tower_1263"
   }
  ]
 },
 {
  "floor": 78,
  "monsters": [
   {
    "sourceName": "Sword Master",
    "sourceId": 1829,
    "count": 5,
    "key": "tower_1829"
   },
   {
    "sourceName": "Bloody Knight",
    "sourceId": 1268,
    "count": 10,
    "key": "tower_1268"
   },
   {
    "sourceName": "Abysmal Knight",
    "sourceId": 1219,
    "count": 5,
    "key": "abyssknight"
   },
   {
    "sourceName": "Dullahan",
    "sourceId": 1504,
    "count": 10,
    "key": "dullahan"
   },
   {
    "sourceName": "Raydric",
    "sourceId": 1163,
    "count": 20,
    "key": "raydric"
   }
  ]
 },
 {
  "floor": 79,
  "monsters": [
   {
    "sourceName": "Hydro",
    "sourceId": 1720,
    "count": 10,
    "key": "tower_1720"
   },
   {
    "sourceName": "Ferus",
    "sourceId": 1714,
    "count": 10,
    "key": "ferus"
   },
   {
    "sourceName": "Ferus",
    "sourceId": 1717,
    "count": 10,
    "key": "tower_1717"
   },
   {
    "sourceName": "Deleter",
    "sourceId": 1385,
    "count": 5,
    "key": "tower_1385"
   },
   {
    "sourceName": "Petite",
    "sourceId": 1155,
    "count": 5,
    "key": "petite"
   }
  ]
 },
 {
  "floor": 80,
  "monsters": [
   {
    "sourceName": "Falling Bishop",
    "sourceId": 1871,
    "count": 1,
    "key": "fallenbishop",
    "boss": true
   },
   {
    "sourceName": "Necromancer",
    "sourceId": 1870,
    "count": 15,
    "key": "tower_1870"
   }
  ],
  "bosses": [
   {
    "sourceName": "Falling Bishop",
    "sourceId": 1871,
    "count": 1,
    "key": "fallenbishop",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Falling Bishop",
   "sourceId": 1871,
   "count": 1,
   "key": "fallenbishop",
   "boss": true
  }
 },
 {
  "floor": 81,
  "monsters": [
   {
    "sourceName": "Mysteltainn",
    "sourceId": 1203,
    "count": 20,
    "key": "mysteltainn"
   },
   {
    "sourceName": "Ogretooth",
    "sourceId": 1204,
    "count": 20,
    "key": "tower_1204"
   },
   {
    "sourceName": "Executioner",
    "sourceId": 1205,
    "count": 20,
    "key": "executioner"
   }
  ]
 },
 {
  "floor": 82,
  "monsters": [
   {
    "sourceName": "Bloody Knight",
    "sourceId": 1268,
    "count": 10,
    "key": "tower_1268"
   },
   {
    "sourceName": "Agav",
    "sourceId": 1769,
    "count": 10,
    "key": "tower_1769"
   },
   {
    "sourceName": "Bloody Murderer",
    "sourceId": 1507,
    "count": 10,
    "key": "tower_1507"
   },
   {
    "sourceName": "Skogul",
    "sourceId": 1752,
    "count": 10,
    "key": "tower_1752"
   },
   {
    "sourceName": "Injustice",
    "sourceId": 1257,
    "count": 10,
    "key": "tower_1257"
   }
  ]
 },
 {
  "floor": 83,
  "monsters": [
   {
    "sourceName": "Skeggiold",
    "sourceId": 1754,
    "count": 10,
    "key": "tower_1754"
   },
   {
    "sourceName": "Dark Illusion",
    "sourceId": 1302,
    "count": 10,
    "key": "tower_1302"
   },
   {
    "sourceName": "Gryphon",
    "sourceId": 1259,
    "count": 10,
    "key": "gryphon"
   },
   {
    "sourceName": "Chimera",
    "sourceId": 1283,
    "count": 10,
    "key": "tower_1283"
   }
  ]
 },
 {
  "floor": 84,
  "monsters": [
   {
    "sourceName": "Succubus",
    "sourceId": 1370,
    "count": 10,
    "key": "tower_1370"
   },
   {
    "sourceName": "Dark Illusion",
    "sourceId": 1302,
    "count": 20,
    "key": "tower_1302"
   },
   {
    "sourceName": "Owl Duke",
    "sourceId": 1320,
    "count": 10,
    "key": "tower_1320"
   },
   {
    "sourceName": "Owl Baron",
    "sourceId": 1295,
    "count": 10,
    "key": "tower_1295"
   },
   {
    "sourceName": "Incubus",
    "sourceId": 1374,
    "count": 10,
    "key": "tower_1374"
   }
  ]
 },
 {
  "floor": 85,
  "monsters": [
   {
    "sourceName": "Ifrit",
    "sourceId": 1832,
    "count": 1,
    "key": "ifrit",
    "boss": true
   }
  ],
  "bosses": [
   {
    "sourceName": "Ifrit",
    "sourceId": 1832,
    "count": 1,
    "key": "ifrit",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Ifrit",
   "sourceId": 1832,
   "count": 1,
   "key": "ifrit",
   "boss": true
  }
 },
 {
  "floor": 86,
  "monsters": [
   {
    "sourceName": "Hydro",
    "sourceId": 1720,
    "count": 10,
    "key": "tower_1720"
   },
   {
    "sourceName": "Gryphon",
    "sourceId": 1259,
    "count": 10,
    "key": "gryphon"
   },
   {
    "sourceName": "Chimera",
    "sourceId": 1283,
    "count": 10,
    "key": "tower_1283"
   },
   {
    "sourceName": "Majoruros",
    "sourceId": 1310,
    "count": 10,
    "key": "tower_1310"
   }
  ]
 },
 {
  "floor": 87,
  "monsters": [
   {
    "sourceName": "Salamander",
    "sourceId": 1831,
    "count": 15,
    "key": "salamander"
   },
   {
    "sourceName": "Kasa",
    "sourceId": 1833,
    "count": 20,
    "key": "kasa"
   },
   {
    "sourceName": "Lava Golem",
    "sourceId": 1366,
    "count": 15,
    "key": "tower_1366"
   },
   {
    "sourceName": "Gajomart",
    "sourceId": 1309,
    "count": 10,
    "key": "tower_1309"
   }
  ]
 },
 {
  "floor": 88,
  "monsters": [
   {
    "sourceName": "Necromancer",
    "sourceId": 1870,
    "count": 15,
    "key": "tower_1870"
   },
   {
    "sourceName": "Anubis",
    "sourceId": 1098,
    "count": 15,
    "key": "anubis"
   },
   {
    "sourceName": "Wraith Dead",
    "sourceId": 1291,
    "count": 10,
    "key": "tower_1291"
   },
   {
    "sourceName": "Ancient Mummy",
    "sourceId": 1297,
    "count": 10,
    "key": "tower_1297"
   },
   {
    "sourceName": "Khalitzburg",
    "sourceId": 1132,
    "count": 10,
    "key": "khalitzburg"
   }
  ]
 },
 {
  "floor": 89,
  "monsters": [
   {
    "sourceName": "Odium of Thanatos",
    "sourceId": 1704,
    "count": 6,
    "key": "tower_1704"
   },
   {
    "sourceName": "Despero of Thanatos",
    "sourceId": 1705,
    "count": 6,
    "key": "tower_1705"
   },
   {
    "sourceName": "Maero of Thanatos",
    "sourceId": 1706,
    "count": 6,
    "key": "tower_1706"
   },
   {
    "sourceName": "Dolor of Thanatos",
    "sourceId": 1707,
    "count": 6,
    "key": "tower_1707"
   }
  ]
 },
 {
  "floor": 90,
  "monsters": [
   {
    "sourceName": "Valkyrie Randgris",
    "sourceId": 1751,
    "count": 1,
    "key": "valkyrierandgris",
    "boss": true
   },
   {
    "sourceName": "Baroness of Retribution",
    "sourceId": 1702,
    "count": 10,
    "key": "tower_1702"
   },
   {
    "sourceName": "Lady Solace",
    "sourceId": 1703,
    "count": 10,
    "key": "tower_1703"
   },
   {
    "sourceName": "False Angel",
    "sourceId": 1371,
    "count": 10,
    "key": "tower_1371"
   }
  ],
  "bosses": [
   {
    "sourceName": "Valkyrie Randgris",
    "sourceId": 1751,
    "count": 1,
    "key": "valkyrierandgris",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Valkyrie Randgris",
   "sourceId": 1751,
   "count": 1,
   "key": "valkyrierandgris",
   "boss": true
  }
 },
 {
  "floor": 91,
  "monsters": [
   {
    "sourceName": "Cecil Damon",
    "sourceId": 1638,
    "count": 10,
    "key": "tower_1638"
   },
   {
    "sourceName": "Bow Master",
    "sourceId": 1830,
    "count": 10,
    "key": "tower_1830"
   },
   {
    "sourceName": "Kavach Icarus",
    "sourceId": 1656,
    "count": 30,
    "key": "tower_1656"
   }
  ]
 },
 {
  "floor": 92,
  "monsters": [
   {
    "sourceName": "Kathryne Keyron",
    "sourceId": 1639,
    "count": 15,
    "key": "tower_1639"
   },
   {
    "sourceName": "Elder",
    "sourceId": 1377,
    "count": 10,
    "key": "tower_1377"
   },
   {
    "sourceName": "Laurell Weinder",
    "sourceId": 1657,
    "count": 10,
    "key": "tower_1657"
   },
   {
    "sourceName": "Wind Ghost",
    "sourceId": 1263,
    "count": 10,
    "key": "tower_1263"
   },
   {
    "sourceName": "Marduk",
    "sourceId": 1140,
    "count": 10,
    "key": "tower_1140"
   }
  ]
 },
 {
  "floor": 93,
  "monsters": [
   {
    "sourceName": "Seyren Windsor",
    "sourceId": 1634,
    "count": 15,
    "key": "tower_1634"
   },
   {
    "sourceName": "Bloody Knight",
    "sourceId": 1268,
    "count": 10,
    "key": "tower_1268"
   },
   {
    "sourceName": "Abysmal Knight",
    "sourceId": 1219,
    "count": 10,
    "key": "abyssknight"
   },
   {
    "sourceName": "Wanderer",
    "sourceId": 1208,
    "count": 10,
    "key": "tower_1208"
   }
  ]
 },
 {
  "floor": 94,
  "monsters": [
   {
    "sourceName": "Sword Master",
    "sourceId": 1829,
    "count": 15,
    "key": "tower_1829"
   },
   {
    "sourceName": "Bow Master",
    "sourceId": 1830,
    "count": 15,
    "key": "tower_1830"
   }
  ]
 },
 {
  "floor": 95,
  "monsters": [
   {
    "sourceName": "Beelzebub",
    "sourceId": 1873,
    "count": 1,
    "key": "tower_1873",
    "boss": true,
    "phaseSourceId": 1874,
    "phaseKey": "tower_1874"
   },
   {
    "sourceName": "Hunter Fly",
    "sourceId": 1035,
    "count": 30,
    "key": "hunterfly"
   },
   {
    "sourceName": "Steel Chonchon",
    "sourceId": 1042,
    "count": 5,
    "key": "steelchonchon"
   },
   {
    "sourceName": "Dragon FLy",
    "sourceId": 1091,
    "count": 5,
    "key": "dragonfly"
   },
   {
    "sourceName": "Chonchon",
    "sourceId": 1011,
    "count": 5,
    "key": "chonchon"
   }
  ],
  "bosses": [
   {
    "sourceName": "Beelzebub",
    "sourceId": 1873,
    "count": 1,
    "key": "tower_1873",
    "boss": true,
    "phaseSourceId": 1874,
    "phaseKey": "tower_1874"
   }
  ],
  "boss": {
   "sourceName": "Beelzebub",
   "sourceId": 1873,
   "count": 1,
   "key": "tower_1873",
   "boss": true,
   "phaseSourceId": 1874,
   "phaseKey": "tower_1874"
  }
 },
 {
  "floor": 96,
  "monsters": [
   {
    "sourceName": "Valkyrie",
    "sourceId": 1765,
    "count": 5,
    "key": "tower_1765"
   },
   {
    "sourceName": "Skeggiold",
    "sourceId": 1755,
    "count": 10,
    "key": "tower_1755"
   },
   {
    "sourceName": "Skeggiold",
    "sourceId": 1754,
    "count": 10,
    "key": "tower_1754"
   }
  ]
 },
 {
  "floor": 97,
  "monsters": [
   {
    "sourceName": "Incarnation of Morocc",
    "sourceId": 1918,
    "count": 5,
    "key": "tower_1918"
   },
   {
    "sourceName": "Incarnation of Morocc",
    "sourceId": 1919,
    "count": 5,
    "key": "tower_1919"
   },
   {
    "sourceName": "Incarnation of Morocc",
    "sourceId": 1920,
    "count": 5,
    "key": "tower_1920"
   },
   {
    "sourceName": "Incarnation of Morocc",
    "sourceId": 1921,
    "count": 5,
    "key": "tower_1921"
   }
  ]
 },
 {
  "floor": 98,
  "monsters": [
   {
    "sourceName": "Kathryne Keyron",
    "sourceId": 1639,
    "count": 2,
    "key": "tower_1639"
   },
   {
    "sourceName": "Seyren Windsor",
    "sourceId": 1634,
    "count": 2,
    "key": "tower_1634"
   },
   {
    "sourceName": "Margaretha Sorin",
    "sourceId": 1637,
    "count": 2,
    "key": "tower_1637"
   },
   {
    "sourceName": "Eremes Guile",
    "sourceId": 1635,
    "count": 2,
    "key": "tower_1635"
   },
   {
    "sourceName": "Howard Alt-Eisen",
    "sourceId": 1636,
    "count": 2,
    "key": "tower_1636"
   },
   {
    "sourceName": "Cecil Damon",
    "sourceId": 1638,
    "count": 2,
    "key": "tower_1638"
   }
  ]
 },
 {
  "floor": 99,
  "monsters": [],
  "randomGroups": {
   "draws": 7,
   "replacement": true,
   "pool": [
    {
     "monsters": [
      {
       "sourceName": "Kathryne Keyron",
       "sourceId": 1639,
       "count": 2,
       "key": "tower_1639"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Seyren Windsor",
       "sourceId": 1634,
       "count": 2,
       "key": "tower_1634"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Margaretha Sorin",
       "sourceId": 1637,
       "count": 2,
       "key": "tower_1637"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Eremes Guile",
       "sourceId": 1635,
       "count": 2,
       "key": "tower_1635"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Howard Alt-Eisen",
       "sourceId": 1636,
       "count": 2,
       "key": "tower_1636"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Cecil Damon",
       "sourceId": 1638,
       "count": 2,
       "key": "tower_1638"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Incarnation of Morocc",
       "sourceId": 1918,
       "count": 5,
       "key": "tower_1918"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Incarnation of Morocc",
       "sourceId": 1919,
       "count": 5,
       "key": "tower_1919"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Incarnation of Morocc",
       "sourceId": 1920,
       "count": 5,
       "key": "tower_1920"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Incarnation of Morocc",
       "sourceId": 1921,
       "count": 5,
       "key": "tower_1921"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Valkyrie",
       "sourceId": 1765,
       "count": 5,
       "key": "tower_1765"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Skeggiold",
       "sourceId": 1755,
       "count": 10,
       "key": "tower_1755"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Skeggiold",
       "sourceId": 1754,
       "count": 10,
       "key": "tower_1754"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Seyren Windsor",
       "sourceId": 1634,
       "count": 15,
       "key": "tower_1634"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Bloody Knight",
       "sourceId": 1268,
       "count": 10,
       "key": "tower_1268"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Abysmal Knight",
       "sourceId": 1219,
       "count": 10,
       "key": "abyssknight"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Wanderer",
       "sourceId": 1208,
       "count": 10,
       "key": "tower_1208"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Sword Master",
       "sourceId": 1829,
       "count": 15,
       "key": "tower_1829"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Bow Master",
       "sourceId": 1830,
       "count": 15,
       "key": "tower_1830"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Kathryne Keyron",
       "sourceId": 1639,
       "count": 15,
       "key": "tower_1639"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Elder",
       "sourceId": 1377,
       "count": 10,
       "key": "tower_1377"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Laurell Weinder",
       "sourceId": 1657,
       "count": 10,
       "key": "tower_1657"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Wind Ghost",
       "sourceId": 1263,
       "count": 10,
       "key": "tower_1263"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Marduk",
       "sourceId": 1140,
       "count": 10,
       "key": "tower_1140"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Cecil Damon",
       "sourceId": 1638,
       "count": 10,
       "key": "tower_1638"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Bow Master",
       "sourceId": 1830,
       "count": 10,
       "key": "tower_1830"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Kavach Icarus",
       "sourceId": 1656,
       "count": 30,
       "key": "tower_1656"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Baroness of Retribution",
       "sourceId": 1702,
       "count": 10,
       "key": "tower_1702"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Lady Solace",
       "sourceId": 1703,
       "count": 10,
       "key": "tower_1703"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "False Angel",
       "sourceId": 1371,
       "count": 10,
       "key": "tower_1371"
      }
     ]
    }
   ]
  }
 },
 {
  "floor": 100,
  "monsters": [
   {
    "sourceName": "Entweihen Knothen",
    "sourceId": 1957,
    "count": 1,
    "key": "tower_1957",
    "boss": true
   },
   {
    "sourceName": "Thorny Skeleton",
    "sourceId": 1958,
    "count": 9,
    "key": "tower_1958"
   },
   {
    "sourceName": "Thorn of Magic",
    "sourceId": 1960,
    "count": 8,
    "key": "tower_1960"
   },
   {
    "sourceName": "Thorn of Pureness",
    "sourceId": 1961,
    "count": 4,
    "key": "tower_1961"
   },
   {
    "sourceName": "Thorn of Recovery",
    "sourceId": 1959,
    "count": 4,
    "key": "tower_1959"
   }
  ],
  "randomGroups": {
   "draws": 2,
   "replacement": true,
   "pool": [
    {
     "monsters": [
      {
       "sourceName": "Thorny Skeleton",
       "sourceId": 1958,
       "count": 1,
       "key": "tower_1958"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Thorn of Magic",
       "sourceId": 1960,
       "count": 1,
       "key": "tower_1960"
      }
     ]
    },
    {
     "monsters": [
      {
       "sourceName": "Thorn of Purification",
       "sourceId": 1961,
       "count": 1,
       "key": "tower_1961"
      }
     ]
    }
   ]
  },
  "bosses": [
   {
    "sourceName": "Entweihen Knothen",
    "sourceId": 1957,
    "count": 1,
    "key": "tower_1957",
    "boss": true
   }
  ],
  "boss": {
   "sourceName": "Entweihen Knothen",
   "sourceId": 1957,
   "count": 1,
   "key": "tower_1957",
   "boss": true
  }
 }
]);
export const RO_ENDLESS_MISSING=freeze([
 {
  "key": "tower_1004",
  "id": 1004,
  "sourceId": 1004,
  "sourceName": "Hornet",
  "name": "Hornet da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "swarm",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 3,
  "boss": false,
  "race": "Insect",
  "size": "Small",
  "sourceLevel": 11
 },
 {
  "key": "tower_1037",
  "id": 1037,
  "sourceId": 1037,
  "sourceName": "Side Winder",
  "name": "Side Winder da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "poison",
  "element": "poison",
  "unlockWave": 23,
  "boss": false,
  "race": "Brute",
  "size": "Medium",
  "sourceLevel": 70
 },
 {
  "key": "tower_1048",
  "id": 1048,
  "sourceId": 1048,
  "sourceName": "Thief Bug Egg",
  "name": "Thief Bug Egg da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 6,
  "boss": false,
  "race": "Insect",
  "size": "Small",
  "sourceLevel": 20
 },
 {
  "key": "tower_1053",
  "id": 1053,
  "sourceId": 1053,
  "sourceName": "Thief Bug Female",
  "name": "Thief Bug Female da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 9,
  "boss": false,
  "race": "Insect",
  "size": "Medium",
  "sourceLevel": 28
 },
 {
  "key": "tower_1054",
  "id": 1054,
  "sourceId": 1054,
  "sourceName": "Thief Bug Male",
  "name": "Thief Bug Male da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 10,
  "boss": false,
  "race": "Insect",
  "size": "Medium",
  "sourceLevel": 30
 },
 {
  "key": "tower_1064",
  "id": 1064,
  "sourceId": 1064,
  "sourceName": "Megalodon",
  "name": "Megalodon da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 15,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 46
 },
 {
  "key": "tower_1065",
  "id": 1065,
  "sourceId": 1065,
  "sourceName": "Strouf",
  "name": "Strouf da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "heavy",
  "skill": "frostnova",
  "element": "water",
  "unlockWave": 20,
  "boss": false,
  "race": "Fish",
  "size": "Large",
  "sourceLevel": 61
 },
 {
  "key": "tower_1071",
  "id": 1071,
  "sourceId": 1071,
  "sourceName": "Pirate Skeleton",
  "name": "Pirate Skeleton da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 16,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 48
 },
 {
  "key": "tower_1087",
  "id": 1087,
  "sourceId": 1087,
  "sourceName": "Orc Hero",
  "name": "Orc Hero da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "stomp",
  "element": "earth",
  "unlockWave": 16,
  "boss": true,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 50
 },
 {
  "key": "tower_1088",
  "id": 1088,
  "sourceId": 1088,
  "sourceName": "Vocal",
  "name": "Vocal da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 6,
  "boss": false,
  "race": "Insect",
  "size": "Medium",
  "sourceLevel": 18
 },
 {
  "key": "tower_1090",
  "id": 1090,
  "sourceId": 1090,
  "sourceName": "Mastering",
  "name": "Mastering da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "frostnova",
  "element": "water",
  "unlockWave": 14,
  "boss": false,
  "race": "Plant",
  "size": "Medium",
  "sourceLevel": 42
 },
 {
  "key": "tower_1092",
  "id": 1092,
  "sourceId": 1092,
  "sourceName": "Vagabond Wolf",
  "name": "Vagabond Wolf da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 31,
  "boss": false,
  "race": "Brute",
  "size": "Medium",
  "sourceLevel": 93
 },
 {
  "key": "tower_1097",
  "id": 1097,
  "sourceId": 1097,
  "sourceName": "Ant Egg",
  "name": "Ant Egg da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "swarm",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 9,
  "boss": false,
  "race": "Formless",
  "size": "Small",
  "sourceLevel": 28
 },
 {
  "key": "tower_1101",
  "id": 1101,
  "sourceId": 1101,
  "sourceName": "Baphomet Jr.",
  "name": "Baphomet Jr. da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 19,
  "boss": false,
  "race": "Demon",
  "size": "Small",
  "sourceLevel": 57
 },
 {
  "key": "tower_1107",
  "id": 1107,
  "sourceId": 1107,
  "sourceName": "Baby Desert Wolf",
  "name": "Baby Desert Wolf da Torre",
  "biomes": [
   "forge"
  ],
  "role": "swarm",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 4,
  "boss": false,
  "race": "Brute",
  "size": "Small",
  "sourceLevel": 14
 },
 {
  "key": "tower_1108",
  "id": 1108,
  "sourceId": 1108,
  "sourceName": "Deviace",
  "name": "Deviace da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "frostnova",
  "element": "water",
  "unlockWave": 20,
  "boss": false,
  "race": "Fish",
  "size": "Medium",
  "sourceLevel": 60
 },
 {
  "key": "tower_1117",
  "id": 1117,
  "sourceId": 1117,
  "sourceName": "Evil Druid",
  "name": "Evil Druid da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "heavy",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 26,
  "boss": false,
  "race": "Undead",
  "size": "Large",
  "sourceLevel": 80
 },
 {
  "key": "tower_1122",
  "id": 1122,
  "sourceId": 1122,
  "sourceName": "Goblin",
  "name": "Goblin da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 16,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 48
 },
 {
  "key": "tower_1123",
  "id": 1123,
  "sourceId": 1123,
  "sourceName": "Goblin",
  "name": "Goblin da Torre",
  "biomes": [
   "forge"
  ],
  "role": "skirmisher",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 14,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 44
 },
 {
  "key": "tower_1124",
  "id": 1124,
  "sourceId": 1124,
  "sourceName": "Goblin",
  "name": "Goblin da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "poison",
  "element": "poison",
  "unlockWave": 14,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 44
 },
 {
  "key": "tower_1125",
  "id": 1125,
  "sourceId": 1125,
  "sourceName": "Goblin",
  "name": "Goblin da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 16,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 49
 },
 {
  "key": "tower_1126",
  "id": 1126,
  "sourceId": 1126,
  "sourceName": "Goblin",
  "name": "Goblin da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "frostnova",
  "element": "water",
  "unlockWave": 18,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 56
 },
 {
  "key": "tower_1130",
  "id": 1130,
  "sourceId": 1130,
  "sourceName": "Jakk",
  "name": "Jakk da Torre",
  "biomes": [
   "forge"
  ],
  "role": "skirmisher",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 21,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 63
 },
 {
  "key": "tower_1131",
  "id": 1131,
  "sourceId": 1131,
  "sourceName": "Joker",
  "name": "Joker da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 30,
  "boss": false,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 90
 },
 {
  "key": "tower_1133",
  "id": 1133,
  "sourceId": 1133,
  "sourceName": "Kobold",
  "name": "Kobold da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 35,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 107
 },
 {
  "key": "tower_1134",
  "id": 1134,
  "sourceId": 1134,
  "sourceName": "Kobold",
  "name": "Kobold da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "poison",
  "element": "poison",
  "unlockWave": 34,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 102
 },
 {
  "key": "tower_1135",
  "id": 1135,
  "sourceId": 1135,
  "sourceName": "Kobold",
  "name": "Kobold da Torre",
  "biomes": [
   "forge"
  ],
  "role": "skirmisher",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 33,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 101
 },
 {
  "key": "tower_1140",
  "id": 1140,
  "sourceId": 1140,
  "sourceName": "Marduk",
  "name": "Marduk da Torre",
  "biomes": [
   "forge"
  ],
  "role": "heavy",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 24,
  "boss": false,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 73
 },
 {
  "key": "tower_1150",
  "id": 1150,
  "sourceId": 1150,
  "sourceName": "Moonlight Flower",
  "name": "Moonlight Flower da Torre",
  "biomes": [
   "forge"
  ],
  "role": "skirmisher",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 26,
  "boss": true,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 79
 },
 {
  "key": "tower_1153",
  "id": 1153,
  "sourceId": 1153,
  "sourceName": "Orc Zombie",
  "name": "Orc Zombie da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 17,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 51
 },
 {
  "key": "tower_1156",
  "id": 1156,
  "sourceId": 1156,
  "sourceName": "Petite",
  "name": "Petite da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 26,
  "boss": false,
  "race": "Dragon",
  "size": "Medium",
  "sourceLevel": 79
 },
 {
  "key": "tower_1157",
  "id": 1157,
  "sourceId": 1157,
  "sourceName": "Pharaoh",
  "name": "Pharaoh da Torre",
  "biomes": [
   "void"
  ],
  "role": "heavy",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 28,
  "boss": true,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 85
 },
 {
  "key": "tower_1158",
  "id": 1158,
  "sourceId": 1158,
  "sourceName": "Phen",
  "name": "Phen da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "frostnova",
  "element": "water",
  "unlockWave": 17,
  "boss": false,
  "race": "Fish",
  "size": "Medium",
  "sourceLevel": 52
 },
 {
  "key": "tower_1165",
  "id": 1165,
  "sourceId": 1165,
  "sourceName": "Sandman",
  "name": "Sandman da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 20,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 61
 },
 {
  "key": "tower_1169",
  "id": 1169,
  "sourceId": 1169,
  "sourceName": "Skeleton Worker",
  "name": "Skeleton Worker da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 14,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 44
 },
 {
  "key": "tower_1186",
  "id": 1186,
  "sourceId": 1186,
  "sourceName": "Giant Whisper",
  "name": "Giant Whisper da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 22,
  "boss": false,
  "race": "Demon",
  "size": "Small",
  "sourceLevel": 66
 },
 {
  "key": "tower_1190",
  "id": 1190,
  "sourceId": 1190,
  "sourceName": "Orc Lord",
  "name": "Orc Lord da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "stomp",
  "element": "earth",
  "unlockWave": 18,
  "boss": true,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 55
 },
 {
  "key": "tower_1192",
  "id": 1192,
  "sourceId": 1192,
  "sourceName": "Wraith",
  "name": "Wraith da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "heavy",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 25,
  "boss": false,
  "race": "Undead",
  "size": "Large",
  "sourceLevel": 77
 },
 {
  "key": "tower_1196",
  "id": 1196,
  "sourceId": 1196,
  "sourceName": "Skeleton Prisoner",
  "name": "Skeleton Prisoner da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 30,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 91
 },
 {
  "key": "tower_1197",
  "id": 1197,
  "sourceId": 1197,
  "sourceName": "Zombie Prisoner",
  "name": "Zombie Prisoner da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 29,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 89
 },
 {
  "key": "tower_1200",
  "id": 1200,
  "sourceId": 1200,
  "sourceName": "Zealotus",
  "name": "Zealotus da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 35,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 105
 },
 {
  "key": "tower_1201",
  "id": 1201,
  "sourceId": 1201,
  "sourceName": "Rybio",
  "name": "Rybio da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "stomp",
  "element": "neutral",
  "unlockWave": 32,
  "boss": false,
  "race": "Demon",
  "size": "Large",
  "sourceLevel": 98
 },
 {
  "key": "tower_1202",
  "id": 1202,
  "sourceId": 1202,
  "sourceName": "Phendark",
  "name": "Phendark da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "stomp",
  "element": "neutral",
  "unlockWave": 34,
  "boss": false,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 102
 },
 {
  "key": "tower_1204",
  "id": 1204,
  "sourceId": 1204,
  "sourceName": "Ogretooth",
  "name": "Ogretooth da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 38,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 114
 },
 {
  "key": "tower_1206",
  "id": 1206,
  "sourceId": 1206,
  "sourceName": "Anolian",
  "name": "Anolian da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "frostnova",
  "element": "water",
  "unlockWave": 36,
  "boss": false,
  "race": "Fish",
  "size": "Medium",
  "sourceLevel": 109
 },
 {
  "key": "tower_1207",
  "id": 1207,
  "sourceId": 1207,
  "sourceName": "Sting",
  "name": "Sting da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 34,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 104
 },
 {
  "key": "tower_1208",
  "id": 1208,
  "sourceId": 1208,
  "sourceName": "Wanderer",
  "name": "Wanderer da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 40,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 120
 },
 {
  "key": "tower_1209",
  "id": 1209,
  "sourceId": 1209,
  "sourceName": "Cramp",
  "name": "Cramp da Torre",
  "biomes": [
   "forest"
  ],
  "role": "swarm",
  "skill": "poison",
  "element": "poison",
  "unlockWave": 27,
  "boss": false,
  "race": "Brute",
  "size": "Small",
  "sourceLevel": 82
 },
 {
  "key": "tower_1212",
  "id": 1212,
  "sourceId": 1212,
  "sourceName": "Iron Fist",
  "name": "Iron Fist da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 15,
  "boss": false,
  "race": "Insect",
  "size": "Medium",
  "sourceLevel": 47
 },
 {
  "key": "tower_1243",
  "id": 1243,
  "sourceId": 1243,
  "sourceName": "Sasquatch",
  "name": "Sasquatch da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "stomp",
  "element": "neutral",
  "unlockWave": 24,
  "boss": false,
  "race": "Brute",
  "size": "Large",
  "sourceLevel": 72
 },
 {
  "key": "tower_1253",
  "id": 1253,
  "sourceId": 1253,
  "sourceName": "Gargoyle",
  "name": "Gargoyle da Torre",
  "biomes": [
   "forest"
  ],
  "role": "caster",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 33,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 100
 },
 {
  "key": "tower_1255",
  "id": 1255,
  "sourceId": 1255,
  "sourceName": "Nereid",
  "name": "Nereid da Torre",
  "biomes": [
   "forest"
  ],
  "role": "swarm",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 32,
  "boss": false,
  "race": "Brute",
  "size": "Small",
  "sourceLevel": 98
 },
 {
  "key": "tower_1256",
  "id": 1256,
  "sourceId": 1256,
  "sourceName": "Pest",
  "name": "Pest da Torre",
  "biomes": [
   "void"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 29,
  "boss": false,
  "race": "Brute",
  "size": "Small",
  "sourceLevel": 89
 },
 {
  "key": "tower_1257",
  "id": 1257,
  "sourceId": 1257,
  "sourceName": "Injustice",
  "name": "Injustice da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 31,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 95
 },
 {
  "key": "tower_1258",
  "id": 1258,
  "sourceId": 1258,
  "sourceName": "Goblin Archer",
  "name": "Goblin Archer da Torre",
  "biomes": [
   "forest"
  ],
  "role": "caster",
  "skill": "poison",
  "element": "poison",
  "unlockWave": 18,
  "boss": false,
  "race": "Demihuman",
  "size": "Small",
  "sourceLevel": 55
 },
 {
  "key": "tower_1260",
  "id": 1260,
  "sourceId": 1260,
  "sourceName": "Dark Frame",
  "name": "Dark Frame da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 25,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 76
 },
 {
  "key": "tower_1262",
  "id": 1262,
  "sourceId": 1262,
  "sourceName": "Mutant Dragonoid",
  "name": "Mutant Dragonoid da Torre",
  "biomes": [
   "forge"
  ],
  "role": "ranged",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 21,
  "boss": false,
  "race": "Dragon",
  "size": "Large",
  "sourceLevel": 65
 },
 {
  "key": "tower_1263",
  "id": 1263,
  "sourceId": 1263,
  "sourceName": "Wind Ghost",
  "name": "Wind Ghost da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 26,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 80
 },
 {
  "key": "tower_1267",
  "id": 1267,
  "sourceId": 1267,
  "sourceName": "Carat",
  "name": "Carat da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 34,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 103
 },
 {
  "key": "tower_1268",
  "id": 1268,
  "sourceId": 1268,
  "sourceName": "Bloody Knight",
  "name": "Bloody Knight da Torre",
  "biomes": [
   "void"
  ],
  "role": "ranged",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 38,
  "boss": false,
  "race": "Formless",
  "size": "Large",
  "sourceLevel": 116
 },
 {
  "key": "tower_1270",
  "id": 1270,
  "sourceId": 1270,
  "sourceName": "Clock Tower Manager",
  "name": "Clock Tower Manager da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "ranged",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 30,
  "boss": false,
  "race": "Formless",
  "size": "Large",
  "sourceLevel": 90
 },
 {
  "key": "tower_1272",
  "id": 1272,
  "sourceId": 1272,
  "sourceName": "Dark Lord",
  "name": "Dark Lord da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "heavy",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 32,
  "boss": true,
  "race": "Demon",
  "size": "Large",
  "sourceLevel": 96
 },
 {
  "key": "tower_1282",
  "id": 1282,
  "sourceId": 1282,
  "sourceName": "Kobold Archer",
  "name": "Kobold Archer da Torre",
  "biomes": [
   "forge"
  ],
  "role": "caster",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 36,
  "boss": false,
  "race": "Demihuman",
  "size": "Small",
  "sourceLevel": 108
 },
 {
  "key": "tower_1283",
  "id": 1283,
  "sourceId": 1283,
  "sourceName": "Chimera",
  "name": "Chimera da Torre",
  "biomes": [
   "forge"
  ],
  "role": "heavy",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 23,
  "boss": false,
  "race": "Brute",
  "size": "Large",
  "sourceLevel": 70
 },
 {
  "key": "tower_1291",
  "id": 1291,
  "sourceId": 1291,
  "sourceName": "Wraith Dead",
  "name": "Wraith Dead da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "heavy",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 40,
  "boss": false,
  "race": "Undead",
  "size": "Large",
  "sourceLevel": 121
 },
 {
  "key": "tower_1292",
  "id": 1292,
  "sourceId": 1292,
  "sourceName": "Mini Demon",
  "name": "Mini Demon da Torre",
  "biomes": [
   "void"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 39,
  "boss": false,
  "race": "Demon",
  "size": "Small",
  "sourceLevel": 117
 },
 {
  "key": "tower_1293",
  "id": 1293,
  "sourceId": 1293,
  "sourceName": "Creamy Fear",
  "name": "Creamy Fear da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "swarm",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 39,
  "boss": false,
  "race": "Insect",
  "size": "Small",
  "sourceLevel": 117
 },
 {
  "key": "tower_1294",
  "id": 1294,
  "sourceId": 1294,
  "sourceName": "Killer Mantis",
  "name": "Killer Mantis da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 40,
  "boss": false,
  "race": "Insect",
  "size": "Medium",
  "sourceLevel": 141
 },
 {
  "key": "tower_1295",
  "id": 1295,
  "sourceId": 1295,
  "sourceName": "Owl Baron",
  "name": "Owl Baron da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "stomp",
  "element": "neutral",
  "unlockWave": 40,
  "boss": false,
  "race": "Demon",
  "size": "Large",
  "sourceLevel": 120
 },
 {
  "key": "tower_1296",
  "id": 1296,
  "sourceId": 1296,
  "sourceName": "Kobold Leader",
  "name": "Kobold Leader da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 37,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 112
 },
 {
  "key": "tower_1297",
  "id": 1297,
  "sourceId": 1297,
  "sourceName": "Ancient Mummy",
  "name": "Ancient Mummy da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 38,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 114
 },
 {
  "key": "tower_1298",
  "id": 1298,
  "sourceId": 1298,
  "sourceName": "Zombie Master",
  "name": "Zombie Master da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 39,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 119
 },
 {
  "key": "tower_1299",
  "id": 1299,
  "sourceId": 1299,
  "sourceName": "Goblin Leader",
  "name": "Goblin Leader da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 18,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 55
 },
 {
  "key": "tower_1300",
  "id": 1300,
  "sourceId": 1300,
  "sourceName": "Caterpillar",
  "name": "Caterpillar da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "swarm",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 40,
  "boss": false,
  "race": "Insect",
  "size": "Small",
  "sourceLevel": 121
 },
 {
  "key": "tower_1302",
  "id": 1302,
  "sourceId": 1302,
  "sourceName": "Dark Illusion",
  "name": "Dark Illusion da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "heavy",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 32,
  "boss": false,
  "race": "Demon",
  "size": "Large",
  "sourceLevel": 96
 },
 {
  "key": "tower_1303",
  "id": 1303,
  "sourceId": 1303,
  "sourceName": "Giant Hornet",
  "name": "Giant Hornet da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "swarm",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 40,
  "boss": false,
  "race": "Insect",
  "size": "Small",
  "sourceLevel": 120
 },
 {
  "key": "tower_1305",
  "id": 1305,
  "sourceId": 1305,
  "sourceName": "Ancient Worm",
  "name": "Ancient Worm da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "heavy",
  "skill": "poison",
  "element": "poison",
  "unlockWave": 40,
  "boss": false,
  "race": "Insect",
  "size": "Large",
  "sourceLevel": 121
 },
 {
  "key": "tower_1306",
  "id": 1306,
  "sourceId": 1306,
  "sourceName": "Leib Olmai",
  "name": "Leib Olmai da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "stomp",
  "element": "earth",
  "unlockWave": 39,
  "boss": false,
  "race": "Brute",
  "size": "Large",
  "sourceLevel": 118
 },
 {
  "key": "tower_1307",
  "id": 1307,
  "sourceId": 1307,
  "sourceName": "Cat o' Nine Tails",
  "name": "Cat o' Nine Tails da Torre",
  "biomes": [
   "forge"
  ],
  "role": "skirmisher",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 26,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 79
 },
 {
  "key": "tower_1309",
  "id": 1309,
  "sourceId": 1309,
  "sourceName": "Gajomart",
  "name": "Gajomart da Torre",
  "biomes": [
   "forge"
  ],
  "role": "swarm",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 40,
  "boss": false,
  "race": "Formless",
  "size": "Small",
  "sourceLevel": 140
 },
 {
  "key": "tower_1310",
  "id": 1310,
  "sourceId": 1310,
  "sourceName": "Majoruros",
  "name": "Majoruros da Torre",
  "biomes": [
   "forge"
  ],
  "role": "heavy",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 35,
  "boss": false,
  "race": "Brute",
  "size": "Large",
  "sourceLevel": 107
 },
 {
  "key": "tower_1312",
  "id": 1312,
  "sourceId": 1312,
  "sourceName": "Turtle General",
  "name": "Turtle General da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "stomp",
  "element": "earth",
  "unlockWave": 36,
  "boss": true,
  "race": "Brute",
  "size": "Large",
  "sourceLevel": 110
 },
 {
  "key": "tower_1313",
  "id": 1313,
  "sourceId": 1313,
  "sourceName": "Mobster",
  "name": "Mobster da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 19,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 58
 },
 {
  "key": "tower_1320",
  "id": 1320,
  "sourceId": 1320,
  "sourceName": "Owl Duke",
  "name": "Owl Duke da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "stomp",
  "element": "neutral",
  "unlockWave": 30,
  "boss": false,
  "race": "Demon",
  "size": "Large",
  "sourceLevel": 92
 },
 {
  "key": "tower_1366",
  "id": 1366,
  "sourceId": 1366,
  "sourceName": "Lava Golem",
  "name": "Lava Golem da Torre",
  "biomes": [
   "forge"
  ],
  "role": "heavy",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 34,
  "boss": false,
  "race": "Formless",
  "size": "Large",
  "sourceLevel": 103
 },
 {
  "key": "tower_1370",
  "id": 1370,
  "sourceId": 1370,
  "sourceName": "Succubus",
  "name": "Succubus da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 39,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 119
 },
 {
  "key": "tower_1371",
  "id": 1371,
  "sourceId": 1371,
  "sourceName": "False Angel",
  "name": "False Angel da Torre",
  "biomes": [
   "void"
  ],
  "role": "swarm",
  "skill": "heal",
  "element": "holy",
  "unlockWave": 35,
  "boss": false,
  "race": "Angel",
  "size": "Small",
  "sourceLevel": 105
 },
 {
  "key": "tower_1374",
  "id": 1374,
  "sourceId": 1374,
  "sourceName": "Incubus",
  "name": "Incubus da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 40,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 120
 },
 {
  "key": "tower_1375",
  "id": 1375,
  "sourceId": 1375,
  "sourceName": "The Paper",
  "name": "The Paper da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 32,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 97
 },
 {
  "key": "tower_1377",
  "id": 1377,
  "sourceId": 1377,
  "sourceName": "Elder",
  "name": "Elder da Torre",
  "biomes": [
   "forest"
  ],
  "role": "caster",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 30,
  "boss": false,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 92
 },
 {
  "key": "tower_1379",
  "id": 1379,
  "sourceId": 1379,
  "sourceName": "Nightmare Terror",
  "name": "Nightmare Terror da Torre",
  "biomes": [
   "void"
  ],
  "role": "heavy",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 35,
  "boss": false,
  "race": "Demon",
  "size": "Large",
  "sourceLevel": 107
 },
 {
  "key": "tower_1381",
  "id": 1381,
  "sourceId": 1381,
  "sourceName": "Grizzly",
  "name": "Grizzly da Torre",
  "biomes": [
   "forge"
  ],
  "role": "heavy",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 22,
  "boss": false,
  "race": "Brute",
  "size": "Large",
  "sourceLevel": 66
 },
 {
  "key": "tower_1382",
  "id": 1382,
  "sourceId": 1382,
  "sourceName": "Diabolic",
  "name": "Diabolic da Torre",
  "biomes": [
   "void"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 34,
  "boss": false,
  "race": "Demon",
  "size": "Small",
  "sourceLevel": 104
 },
 {
  "key": "tower_1383",
  "id": 1383,
  "sourceId": 1383,
  "sourceName": "Explosion",
  "name": "Explosion da Torre",
  "biomes": [
   "forge"
  ],
  "role": "swarm",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 33,
  "boss": false,
  "race": "Brute",
  "size": "Small",
  "sourceLevel": 100
 },
 {
  "key": "tower_1385",
  "id": 1385,
  "sourceId": 1385,
  "sourceName": "Deleter",
  "name": "Deleter da Torre",
  "biomes": [
   "forge"
  ],
  "role": "skirmisher",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 35,
  "boss": false,
  "race": "Dragon",
  "size": "Medium",
  "sourceLevel": 105
 },
 {
  "key": "tower_1387",
  "id": 1387,
  "sourceId": 1387,
  "sourceName": "Gig",
  "name": "Gig da Torre",
  "biomes": [
   "forge"
  ],
  "role": "swarm",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 33,
  "boss": false,
  "race": "Brute",
  "size": "Small",
  "sourceLevel": 100
 },
 {
  "key": "tower_1413",
  "id": 1413,
  "sourceId": 1413,
  "sourceName": "Hermit Plant",
  "name": "Hermit Plant da Torre",
  "biomes": [
   "forge"
  ],
  "role": "swarm",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 30,
  "boss": false,
  "race": "Plant",
  "size": "Small",
  "sourceLevel": 90
 },
 {
  "key": "tower_1416",
  "id": 1416,
  "sourceId": 1416,
  "sourceName": "Evil Nymph",
  "name": "Evil Nymph da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 32,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 97
 },
 {
  "key": "tower_1418",
  "id": 1418,
  "sourceId": 1418,
  "sourceName": "Evil Snake Lord",
  "name": "Evil Snake Lord da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "ranged",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 35,
  "boss": true,
  "race": "Brute",
  "size": "Large",
  "sourceLevel": 105
 },
 {
  "key": "tower_1492",
  "id": 1492,
  "sourceId": 1492,
  "sourceName": "Samurai Specter",
  "name": "Samurai Specter da Torre",
  "biomes": [
   "void"
  ],
  "role": "caster",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 33,
  "boss": true,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 100
 },
 {
  "key": "tower_1507",
  "id": 1507,
  "sourceId": 1507,
  "sourceName": "Bloody Murderer",
  "name": "Bloody Murderer da Torre",
  "biomes": [
   "void"
  ],
  "role": "heavy",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 36,
  "boss": false,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 110
 },
 {
  "key": "tower_1508",
  "id": 1508,
  "sourceId": 1508,
  "sourceName": "Quve",
  "name": "Quve da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 33,
  "boss": false,
  "race": "Undead",
  "size": "Small",
  "sourceLevel": 100
 },
 {
  "key": "tower_1509",
  "id": 1509,
  "sourceId": 1509,
  "sourceName": "Lude",
  "name": "Lude da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 33,
  "boss": false,
  "race": "Undead",
  "size": "Small",
  "sourceLevel": 101
 },
 {
  "key": "tower_1512",
  "id": 1512,
  "sourceId": 1512,
  "sourceName": "Yao Jun",
  "name": "Yao Jun da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 29,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 87
 },
 {
  "key": "tower_1513",
  "id": 1513,
  "sourceId": 1513,
  "sourceName": "Mao Guai",
  "name": "Mao Guai da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 29,
  "boss": false,
  "race": "Brute",
  "size": "Medium",
  "sourceLevel": 89
 },
 {
  "key": "tower_1514",
  "id": 1514,
  "sourceId": 1514,
  "sourceName": "Zhu Po Long",
  "name": "Zhu Po Long da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 27,
  "boss": false,
  "race": "Dragon",
  "size": "Medium",
  "sourceLevel": 82
 },
 {
  "key": "tower_1515",
  "id": 1515,
  "sourceId": 1515,
  "sourceName": "Baby Hatii",
  "name": "Baby Hatii da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "frostnova",
  "element": "water",
  "unlockWave": 31,
  "boss": false,
  "race": "Brute",
  "size": "Medium",
  "sourceLevel": 94
 },
 {
  "key": "tower_1516",
  "id": 1516,
  "sourceId": 1516,
  "sourceName": "Mi Gao",
  "name": "Mi Gao da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 27,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 83
 },
 {
  "key": "tower_1517",
  "id": 1517,
  "sourceId": 1517,
  "sourceName": "Jing Guai",
  "name": "Jing Guai da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 26,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 80
 },
 {
  "key": "tower_1519",
  "id": 1519,
  "sourceId": 1519,
  "sourceName": "Green Maiden",
  "name": "Green Maiden da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 16,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 49
 },
 {
  "key": "tower_1587",
  "id": 1587,
  "sourceId": 1587,
  "sourceName": "Kraben",
  "name": "Kraben da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 23,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 70
 },
 {
  "key": "tower_1618",
  "id": 1618,
  "sourceId": 1618,
  "sourceName": "Ungoliant",
  "name": "Ungoliant da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "heavy",
  "skill": "poison",
  "element": "poison",
  "unlockWave": 31,
  "boss": false,
  "race": "Insect",
  "size": "Large",
  "sourceLevel": 94
 },
 {
  "key": "tower_1630",
  "id": 1630,
  "sourceId": 1630,
  "sourceName": "White Lady",
  "name": "White Lady da Torre",
  "biomes": [
   "forest"
  ],
  "role": "caster",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 32,
  "boss": true,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 97
 },
 {
  "key": "tower_1633",
  "id": 1633,
  "sourceId": 1633,
  "sourceName": "Beholder",
  "name": "Beholder da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "ranged",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 40,
  "boss": false,
  "race": "Formless",
  "size": "Small",
  "sourceLevel": 120
 },
 {
  "key": "tower_1634",
  "id": 1634,
  "sourceId": 1634,
  "sourceName": "Seyren Windsor",
  "name": "Seyren Windsor da Torre",
  "biomes": [
   "forge"
  ],
  "role": "skirmisher",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 40,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 142
 },
 {
  "key": "tower_1635",
  "id": 1635,
  "sourceId": 1635,
  "sourceName": "Eremes Guile",
  "name": "Eremes Guile da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "poison",
  "element": "poison",
  "unlockWave": 40,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 140
 },
 {
  "key": "tower_1636",
  "id": 1636,
  "sourceId": 1636,
  "sourceName": "Howard Alt-Eisen",
  "name": "Howard Alt-Eisen da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "frostnova",
  "element": "water",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 142
 },
 {
  "key": "tower_1637",
  "id": 1637,
  "sourceId": 1637,
  "sourceName": "Margaretha Sorin",
  "name": "Margaretha Sorin da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "heal",
  "element": "holy",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 140
 },
 {
  "key": "tower_1638",
  "id": 1638,
  "sourceId": 1638,
  "sourceName": "Cecil Damon",
  "name": "Cecil Damon da Torre",
  "biomes": [
   "forest"
  ],
  "role": "caster",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 141
 },
 {
  "key": "tower_1639",
  "id": 1639,
  "sourceId": 1639,
  "sourceName": "Kathryne Keyron",
  "name": "Kathryne Keyron da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 141
 },
 {
  "key": "tower_1652",
  "id": 1652,
  "sourceId": 1652,
  "sourceName": "Egnigem Cenia",
  "name": "Egnigem Cenia da Torre",
  "biomes": [
   "forge"
  ],
  "role": "skirmisher",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 136
 },
 {
  "key": "tower_1653",
  "id": 1653,
  "sourceId": 1653,
  "sourceName": "Wickebine Tres",
  "name": "Wickebine Tres da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "poison",
  "element": "poison",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 132
 },
 {
  "key": "tower_1654",
  "id": 1654,
  "sourceId": 1654,
  "sourceName": "Armeyer Dinze",
  "name": "Armeyer Dinze da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 134
 },
 {
  "key": "tower_1655",
  "id": 1655,
  "sourceId": 1655,
  "sourceName": "Errende Ebecee",
  "name": "Errende Ebecee da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "heal",
  "element": "holy",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 133
 },
 {
  "key": "tower_1656",
  "id": 1656,
  "sourceId": 1656,
  "sourceName": "Kavach Icarus",
  "name": "Kavach Icarus da Torre",
  "biomes": [
   "forest"
  ],
  "role": "caster",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 135
 },
 {
  "key": "tower_1657",
  "id": 1657,
  "sourceId": 1657,
  "sourceName": "Laurell Weinder",
  "name": "Laurell Weinder da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 133
 },
 {
  "key": "tower_1658",
  "id": 1658,
  "sourceId": 1658,
  "sourceName": "Egnigem Cenia",
  "name": "Egnigem Cenia da Torre",
  "biomes": [
   "forge"
  ],
  "role": "skirmisher",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 40,
  "boss": true,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 141
 },
 {
  "key": "tower_1668",
  "id": 1668,
  "sourceId": 1668,
  "sourceName": "Archdam",
  "name": "Archdam da Torre",
  "biomes": [
   "forest"
  ],
  "role": "caster",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 39,
  "boss": false,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 119
 },
 {
  "key": "tower_1670",
  "id": 1670,
  "sourceId": 1670,
  "sourceName": "Dimik",
  "name": "Dimik da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "ranged",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 38,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 116
 },
 {
  "key": "tower_1671",
  "id": 1671,
  "sourceId": 1671,
  "sourceName": "Dimik",
  "name": "Dimik da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "ranged",
  "skill": "frostnova",
  "element": "water",
  "unlockWave": 38,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 116
 },
 {
  "key": "tower_1672",
  "id": 1672,
  "sourceId": 1672,
  "sourceName": "Dimik",
  "name": "Dimik da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "ranged",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 38,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 116
 },
 {
  "key": "tower_1673",
  "id": 1673,
  "sourceId": 1673,
  "sourceName": "Dimik",
  "name": "Dimik da Torre",
  "biomes": [
   "forge"
  ],
  "role": "ranged",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 38,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 116
 },
 {
  "key": "tower_1676",
  "id": 1676,
  "sourceId": 1676,
  "sourceName": "Venatu",
  "name": "Venatu da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 37,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 113
 },
 {
  "key": "tower_1677",
  "id": 1677,
  "sourceId": 1677,
  "sourceName": "Venatu",
  "name": "Venatu da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 37,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 113
 },
 {
  "key": "tower_1678",
  "id": 1678,
  "sourceId": 1678,
  "sourceName": "Venatu",
  "name": "Venatu da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 37,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 113
 },
 {
  "key": "tower_1679",
  "id": 1679,
  "sourceId": 1679,
  "sourceName": "Venatu",
  "name": "Venatu da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "frostnova",
  "element": "water",
  "unlockWave": 37,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 113
 },
 {
  "key": "tower_1680",
  "id": 1680,
  "sourceId": 1680,
  "sourceName": "Hill Wind",
  "name": "Hill Wind da Torre",
  "biomes": [
   "forest"
  ],
  "role": "ranged",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 33,
  "boss": false,
  "race": "Brute",
  "size": "Medium",
  "sourceLevel": 101
 },
 {
  "key": "tower_1686",
  "id": 1686,
  "sourceId": 1686,
  "sourceName": "Orc Baby",
  "name": "Orc Baby da Torre",
  "biomes": [
   "forest"
  ],
  "role": "swarm",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 14,
  "boss": false,
  "race": "Demihuman",
  "size": "Small",
  "sourceLevel": 43
 },
 {
  "key": "tower_1687",
  "id": 1687,
  "sourceId": 1687,
  "sourceName": "Grove",
  "name": "Grove da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 18,
  "boss": false,
  "race": "Brute",
  "size": "Medium",
  "sourceLevel": 55
 },
 {
  "key": "tower_1693",
  "id": 1693,
  "sourceId": 1693,
  "sourceName": "Plasma",
  "name": "Plasma da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 39,
  "boss": false,
  "race": "Formless",
  "size": "Small",
  "sourceLevel": 119
 },
 {
  "key": "tower_1694",
  "id": 1694,
  "sourceId": 1694,
  "sourceName": "Plasma",
  "name": "Plasma da Torre",
  "biomes": [
   "forge"
  ],
  "role": "swarm",
  "skill": "flamebreath",
  "element": "fire",
  "unlockWave": 39,
  "boss": false,
  "race": "Formless",
  "size": "Small",
  "sourceLevel": 118
 },
 {
  "key": "tower_1695",
  "id": 1695,
  "sourceId": 1695,
  "sourceName": "Plasma",
  "name": "Plasma da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "swarm",
  "skill": "bash",
  "element": "earth",
  "unlockWave": 38,
  "boss": false,
  "race": "Formless",
  "size": "Small",
  "sourceLevel": 116
 },
 {
  "key": "tower_1696",
  "id": 1696,
  "sourceId": 1696,
  "sourceName": "Plasma",
  "name": "Plasma da Torre",
  "biomes": [
   "void"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 39,
  "boss": false,
  "race": "Formless",
  "size": "Small",
  "sourceLevel": 117
 },
 {
  "key": "tower_1697",
  "id": 1697,
  "sourceId": 1697,
  "sourceName": "Plasma",
  "name": "Plasma da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "swarm",
  "skill": "frostnova",
  "element": "water",
  "unlockWave": 38,
  "boss": false,
  "race": "Formless",
  "size": "Small",
  "sourceLevel": 115
 },
 {
  "key": "tower_1698",
  "id": 1698,
  "sourceId": 1698,
  "sourceName": "Death Word",
  "name": "Death Word da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 38,
  "boss": false,
  "race": "Formless",
  "size": "Medium",
  "sourceLevel": 114
 },
 {
  "key": "tower_1700",
  "id": 1700,
  "sourceId": 1700,
  "sourceName": "Dame of Sentinel",
  "name": "Dame of Sentinel da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 40,
  "boss": false,
  "race": "Angel",
  "size": "Medium",
  "sourceLevel": 127
 },
 {
  "key": "tower_1701",
  "id": 1701,
  "sourceId": 1701,
  "sourceName": "Mistress of Shelter",
  "name": "Mistress of Shelter da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "heal",
  "element": "holy",
  "unlockWave": 40,
  "boss": false,
  "race": "Angel",
  "size": "Medium",
  "sourceLevel": 125
 },
 {
  "key": "tower_1702",
  "id": 1702,
  "sourceId": 1702,
  "sourceName": "Baroness of Retribution",
  "name": "Baroness of Retribution da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 40,
  "boss": false,
  "race": "Angel",
  "size": "Medium",
  "sourceLevel": 121
 },
 {
  "key": "tower_1703",
  "id": 1703,
  "sourceId": 1703,
  "sourceName": "Lady Solace",
  "name": "Lady Solace da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "heal",
  "element": "holy",
  "unlockWave": 40,
  "boss": false,
  "race": "Angel",
  "size": "Medium",
  "sourceLevel": 123
 },
 {
  "key": "tower_1704",
  "id": 1704,
  "sourceId": 1704,
  "sourceName": "Odium of Thanatos",
  "name": "Odium of Thanatos da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "caster",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 40,
  "boss": false,
  "race": "Undead",
  "size": "Large",
  "sourceLevel": 129
 },
 {
  "key": "tower_1705",
  "id": 1705,
  "sourceId": 1705,
  "sourceName": "Despero of Thanatos",
  "name": "Despero of Thanatos da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "heavy",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 40,
  "boss": false,
  "race": "Undead",
  "size": "Large",
  "sourceLevel": 129
 },
 {
  "key": "tower_1706",
  "id": 1706,
  "sourceId": 1706,
  "sourceName": "Maero of Thanatos",
  "name": "Maero of Thanatos da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 40,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 129
 },
 {
  "key": "tower_1707",
  "id": 1707,
  "sourceId": 1707,
  "sourceName": "Dolor of Thanatos",
  "name": "Dolor of Thanatos da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 40,
  "boss": false,
  "race": "Undead",
  "size": "Small",
  "sourceLevel": 129
 },
 {
  "key": "tower_1716",
  "id": 1716,
  "sourceId": 1716,
  "sourceName": "Acidus",
  "name": "Acidus da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 40,
  "boss": false,
  "race": "Dragon",
  "size": "Large",
  "sourceLevel": 130
 },
 {
  "key": "tower_1717",
  "id": 1717,
  "sourceId": 1717,
  "sourceName": "Ferus",
  "name": "Ferus da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "stomp",
  "element": "earth",
  "unlockWave": 40,
  "boss": false,
  "race": "Dragon",
  "size": "Large",
  "sourceLevel": 126
 },
 {
  "key": "tower_1720",
  "id": 1720,
  "sourceId": 1720,
  "sourceName": "Hydrolancer",
  "name": "Hydrolancer da Torre",
  "biomes": [
   "void"
  ],
  "role": "ranged",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 40,
  "boss": false,
  "race": "Dragon",
  "size": "Large",
  "sourceLevel": 121
 },
 {
  "key": "tower_1736",
  "id": 1736,
  "sourceId": 1736,
  "sourceName": "Aliot",
  "name": "Aliot da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 37,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 112
 },
 {
  "key": "tower_1737",
  "id": 1737,
  "sourceId": 1737,
  "sourceName": "Aliza",
  "name": "Aliza da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 37,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 112
 },
 {
  "key": "tower_1752",
  "id": 1752,
  "sourceId": 1752,
  "sourceName": "Skogul",
  "name": "Skogul da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 40,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 126
 },
 {
  "key": "tower_1754",
  "id": 1754,
  "sourceId": 1754,
  "sourceName": "Skeggiold",
  "name": "Skeggiold da Torre",
  "biomes": [
   "void"
  ],
  "role": "swarm",
  "skill": "heal",
  "element": "holy",
  "unlockWave": 40,
  "boss": false,
  "race": "Angel",
  "size": "Small",
  "sourceLevel": 131
 },
 {
  "key": "tower_1755",
  "id": 1755,
  "sourceId": 1755,
  "sourceName": "Skeggiold",
  "name": "Skeggiold da Torre",
  "biomes": [
   "void"
  ],
  "role": "swarm",
  "skill": "heal",
  "element": "holy",
  "unlockWave": 40,
  "boss": false,
  "race": "Angel",
  "size": "Small",
  "sourceLevel": 131
 },
 {
  "key": "tower_1765",
  "id": 1765,
  "sourceId": 1765,
  "sourceName": "Valkyrie",
  "name": "Valkyrie da Torre",
  "biomes": [
   "void"
  ],
  "role": "caster",
  "skill": "heal",
  "element": "holy",
  "unlockWave": 40,
  "boss": false,
  "race": "Angel",
  "size": "Large",
  "sourceLevel": 141
 },
 {
  "key": "tower_1769",
  "id": 1769,
  "sourceId": 1769,
  "sourceName": "Agav",
  "name": "Agav da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 128
 },
 {
  "key": "tower_1770",
  "id": 1770,
  "sourceId": 1770,
  "sourceName": "Echio",
  "name": "Echio da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 126
 },
 {
  "key": "tower_1771",
  "id": 1771,
  "sourceId": 1771,
  "sourceName": "Vanberk",
  "name": "Vanberk da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 123
 },
 {
  "key": "tower_1772",
  "id": 1772,
  "sourceId": 1772,
  "sourceName": "Isilla",
  "name": "Isilla da Torre",
  "biomes": [
   "forest"
  ],
  "role": "skirmisher",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Medium",
  "sourceLevel": 124
 },
 {
  "key": "tower_1774",
  "id": 1774,
  "sourceId": 1774,
  "sourceName": "Seeker",
  "name": "Seeker da Torre",
  "biomes": [
   "cavern"
  ],
  "role": "ranged",
  "skill": "chain",
  "element": "wind",
  "unlockWave": 40,
  "boss": false,
  "race": "Formless",
  "size": "Small",
  "sourceLevel": 124
 },
 {
  "key": "tower_1777",
  "id": 1777,
  "sourceId": 1777,
  "sourceName": "Ice Titan",
  "name": "Ice Titan da Torre",
  "biomes": [
   "frost"
  ],
  "role": "heavy",
  "skill": "frostnova",
  "element": "water",
  "unlockWave": 36,
  "boss": false,
  "race": "Formless",
  "size": "Large",
  "sourceLevel": 110
 },
 {
  "key": "tower_1785",
  "id": 1785,
  "sourceId": 1785,
  "sourceName": "Atroce",
  "name": "Atroce da Torre",
  "biomes": [
   "void"
  ],
  "role": "heavy",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 37,
  "boss": true,
  "race": "Brute",
  "size": "Large",
  "sourceLevel": 113
 },
 {
  "key": "tower_1829",
  "id": 1829,
  "sourceId": 1829,
  "sourceName": "Sword Guardian",
  "name": "Sword Guardian da Torre",
  "biomes": [
   "forest"
  ],
  "role": "heavy",
  "skill": "stomp",
  "element": "neutral",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 133
 },
 {
  "key": "tower_1830",
  "id": 1830,
  "sourceId": 1830,
  "sourceName": "Bow Guardian",
  "name": "Bow Guardian da Torre",
  "biomes": [
   "forest"
  ],
  "role": "caster",
  "skill": "bash",
  "element": "neutral",
  "unlockWave": 40,
  "boss": false,
  "race": "Demihuman",
  "size": "Large",
  "sourceLevel": 132
 },
 {
  "key": "tower_1865",
  "id": 1865,
  "sourceId": 1865,
  "sourceName": "Ragged Zombie",
  "name": "Ragged Zombie da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "caster",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 40,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 123
 },
 {
  "key": "tower_1867",
  "id": 1867,
  "sourceId": 1867,
  "sourceName": "Banshee",
  "name": "Banshee da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 40,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 130
 },
 {
  "key": "tower_1869",
  "id": 1869,
  "sourceId": 1869,
  "sourceName": "Flame Skull",
  "name": "Flame Skull da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 40,
  "boss": false,
  "race": "Demon",
  "size": "Small",
  "sourceLevel": 121
 },
 {
  "key": "tower_1870",
  "id": 1870,
  "sourceId": 1870,
  "sourceName": "Necromancer",
  "name": "Necromancer da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 40,
  "boss": false,
  "race": "Undead",
  "size": "Medium",
  "sourceLevel": 133
 },
 {
  "key": "tower_1873",
  "id": 1873,
  "sourceId": 1873,
  "sourceName": "Beelzebub",
  "name": "Beelzebub da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "swarm",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 40,
  "boss": false,
  "race": "Demon",
  "size": "Small",
  "sourceLevel": 147
 },
 {
  "key": "tower_1874",
  "id": 1874,
  "sourceId": 1874,
  "sourceName": "Beelzebub",
  "name": "Beelzebub da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "heavy",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 40,
  "boss": true,
  "race": "Demon",
  "size": "Large",
  "sourceLevel": 147
 },
 {
  "key": "tower_1918",
  "id": 1918,
  "sourceId": 1918,
  "sourceName": "Incarnation of Morocc",
  "name": "Incarnation of Morocc da Torre",
  "biomes": [
   "void"
  ],
  "role": "heavy",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 40,
  "boss": false,
  "race": "Angel",
  "size": "Large",
  "sourceLevel": 132
 },
 {
  "key": "tower_1919",
  "id": 1919,
  "sourceId": 1919,
  "sourceName": "Incarnation of Morocc",
  "name": "Incarnation of Morocc da Torre",
  "biomes": [
   "void"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 40,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 132
 },
 {
  "key": "tower_1920",
  "id": 1920,
  "sourceId": 1920,
  "sourceName": "Incarnation of Morocc",
  "name": "Incarnation of Morocc da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "undead",
  "unlockWave": 40,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 133
 },
 {
  "key": "tower_1921",
  "id": 1921,
  "sourceId": 1921,
  "sourceName": "Incarnation of Morocc",
  "name": "Incarnation of Morocc da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "skirmisher",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 40,
  "boss": false,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 134
 },
 {
  "key": "tower_1957",
  "id": 1957,
  "sourceId": 1957,
  "sourceName": "Entweihen Crothen",
  "name": "Entweihen Crothen da Torre",
  "biomes": [
   "void"
  ],
  "role": "caster",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 30,
  "boss": true,
  "race": "Demon",
  "size": "Medium",
  "sourceLevel": 90
 },
 {
  "key": "tower_1958",
  "id": 1958,
  "sourceId": 1958,
  "sourceName": "Thorny Skeleton",
  "name": "Thorny Skeleton da Torre",
  "biomes": [
   "void"
  ],
  "role": "caster",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 29,
  "boss": false,
  "race": "Demon",
  "size": "Small",
  "sourceLevel": 89
 },
 {
  "key": "tower_1959",
  "id": 1959,
  "sourceId": 1959,
  "sourceName": "Thorn of Recovery",
  "name": "Thorn of Recovery da Torre",
  "biomes": [
   "crypt"
  ],
  "role": "caster",
  "skill": "drain",
  "element": "ghost",
  "unlockWave": 29,
  "boss": false,
  "race": "Demon",
  "size": "Small",
  "sourceLevel": 89
 },
 {
  "key": "tower_1960",
  "id": 1960,
  "sourceId": 1960,
  "sourceName": "Thorn of Magic",
  "name": "Thorn of Magic da Torre",
  "biomes": [
   "void"
  ],
  "role": "caster",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 29,
  "boss": false,
  "race": "Demon",
  "size": "Small",
  "sourceLevel": 89
 },
 {
  "key": "tower_1961",
  "id": 1961,
  "sourceId": 1961,
  "sourceName": "Thorn of Purification",
  "name": "Thorn of Purification da Torre",
  "biomes": [
   "void"
  ],
  "role": "caster",
  "skill": "drain",
  "element": "dark",
  "unlockWave": 29,
  "boss": false,
  "race": "Demon",
  "size": "Small",
  "sourceLevel": 89
 }
]);
export const RO_ENDLESS_SOURCE_IDS=Object.freeze([1001, 1002, 1004, 1005, 1008, 1011, 1015, 1016, 1020, 1023, 1025, 1026, 1028, 1029, 1030, 1031, 1032, 1033, 1035, 1037, 1038, 1039, 1040, 1041, 1042, 1044, 1046, 1048, 1051, 1052, 1053, 1054, 1059, 1060, 1061, 1064, 1065, 1068, 1069, 1070, 1071, 1076, 1086, 1087, 1088, 1090, 1091, 1092, 1095, 1096, 1097, 1098, 1099, 1100, 1101, 1105, 1106, 1107, 1108, 1109, 1111, 1112, 1113, 1117, 1118, 1120, 1122, 1123, 1124, 1125, 1126, 1127, 1130, 1131, 1132, 1133, 1134, 1135, 1139, 1140, 1143, 1144, 1146, 1147, 1148, 1150, 1152, 1153, 1154, 1155, 1156, 1157, 1158, 1159, 1160, 1162, 1163, 1165, 1167, 1169, 1175, 1179, 1180, 1186, 1188, 1189, 1190, 1191, 1192, 1193, 1194, 1195, 1196, 1197, 1199, 1200, 1201, 1202, 1203, 1204, 1205, 1206, 1207, 1208, 1209, 1212, 1213, 1216, 1219, 1242, 1243, 1248, 1249, 1250, 1253, 1255, 1256, 1257, 1258, 1259, 1260, 1262, 1263, 1264, 1267, 1268, 1269, 1270, 1271, 1272, 1273, 1275, 1276, 1278, 1282, 1283, 1291, 1292, 1293, 1294, 1295, 1296, 1297, 1298, 1299, 1300, 1302, 1303, 1305, 1306, 1307, 1309, 1310, 1312, 1313, 1314, 1315, 1316, 1318, 1319, 1320, 1366, 1369, 1370, 1371, 1374, 1375, 1376, 1377, 1378, 1379, 1381, 1382, 1383, 1384, 1385, 1386, 1387, 1388, 1400, 1401, 1403, 1404, 1405, 1408, 1410, 1412, 1413, 1416, 1417, 1418, 1492, 1493, 1495, 1497, 1500, 1503, 1504, 1505, 1507, 1508, 1509, 1510, 1511, 1512, 1513, 1514, 1515, 1516, 1517, 1519, 1582, 1587, 1613, 1615, 1618, 1627, 1629, 1630, 1633, 1634, 1635, 1636, 1637, 1638, 1639, 1652, 1653, 1654, 1655, 1656, 1657, 1658, 1668, 1670, 1671, 1672, 1673, 1676, 1677, 1678, 1679, 1680, 1686, 1687, 1693, 1694, 1695, 1696, 1697, 1698, 1699, 1700, 1701, 1702, 1703, 1704, 1705, 1706, 1707, 1713, 1714, 1716, 1717, 1720, 1721, 1736, 1737, 1751, 1752, 1754, 1755, 1765, 1769, 1770, 1771, 1772, 1774, 1775, 1777, 1778, 1780, 1781, 1783, 1784, 1785, 1829, 1830, 1831, 1832, 1833, 1865, 1867, 1869, 1870, 1871, 1873, 1874, 1918, 1919, 1920, 1921, 1957, 1958, 1959, 1960, 1961]);
