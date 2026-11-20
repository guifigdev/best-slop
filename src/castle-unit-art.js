import {CASTLE_UNITS,CASTLE_BUILDINGS} from '../shared/castle-catalog.js';
import {buildMonster} from './monster-art.js';
import {ragnarokMonsterSpec} from './ragnarok-monster-art.js';

// Native names and gameplay data choose visual families. Compatible creatures
// reuse the shared Ragnarok reconstructions; gameplay data remains native.
const RACES=Object.freeze({human:{skin:0xd3b18b,cloth:0x547a9c,metal:0xa6b3b2,trim:0xd9c28c},elf:{skin:0xe1d4b2,cloth:0x538d79,metal:0xa3b4a2,trim:0xe3cc85},nightelf:{skin:0xb39dbd,cloth:0x626289,metal:0xa1adb4,trim:0xd4d1ac},orc:{skin:0x7f9d63,cloth:0x896649,metal:0x8d9991,trim:0xd8ba80},undead:{skin:0xa6b19d,cloth:0x555c78,metal:0x87949a,trim:0xc8cbb2},naga:{skin:0x76a9a3,cloth:0x4d8077,metal:0x91b4af,trim:0xd5c68d},north:{skin:0xbdcdd0,cloth:0x6b95b0,metal:0x9cb9c3,trim:0xe0d5b0},chaos:{skin:0xa77568,cloth:0x6d4c56,metal:0x6a666e,trim:0xe0af79},corrupted:{skin:0x8b86a2,cloth:0x565875,metal:0x7d8898,trim:0xb8cfa4},mech:{skin:0x8ea16f,cloth:0x667c70,metal:0x91a6a4,trim:0xddbb75}});
const unitRace=new Map(Object.values(CASTLE_BUILDINGS).filter(b=>typeof b.unit==='string').map(b=>[b.unit,b.race]));
const unitRanks=new Map();
function buildingRank(building,seen=new Set()){
 if(!building?.requiresBuilding||seen.has(building.key))return 0;
 seen.add(building.key);return 1+buildingRank(CASTLE_BUILDINGS[building.requiresBuilding],seen);
}
for(const building of Object.values(CASTLE_BUILDINGS))if(building.unit)unitRanks.set(building.unit,Math.max(unitRanks.get(building.unit)||0,buildingRank(building)));
const cache=new Map(),portraits=new Map();
const resolve=value=>{const key=typeof value==='string'?value:value?.unitKey||value?.key||value?.sourceStats?.rawId;return typeof key==='string'&&Object.hasOwn(CASTLE_UNITS,key)?{key,unit:CASTLE_UNITS[key]}:null;};
function familyFor(unit){const n=unit.name.toLowerCase();
 if(/roterothopter|gyrocopter|helicopter|rotor/.test(n))return 'aircraft';
 if(/tank|mine layer|infernal machine/.test(n))return 'tank';if(/shredder/.test(n))return 'shredder';
 if(/mortar|ballista|catapult|glaive thrower/.test(n))return 'artillery';if(/golem|^infernal$/.test(n))return 'golem';
 if(/corrupted ent|treant|annihilator/.test(n))return 'treant';if(/hydra/.test(n))return 'hydra';if(/dragon turtle/.test(n))return 'dragon-turtle';
 if(/frost wolf|felhound|polar bear|kodo/.test(n))return 'beast';if(/magnataur/.test(n))return 'magnataur';
 if(/gryphon|dragonhawk|dragon|drake|wyrm|wyvern|winged serpent/.test(n))return 'winged-beast';if(/huntress/.test(n))return 'mounted-huntress';
 if(/naga|siren/.test(n))return 'naga';if(/murloc/.test(n))return 'murloc';if(/suumpmolk|wandigoo|hrimthrusa/.test(n))return 'beastman';
 if(/void walker|void keeper|banshee|avenging spirit|avatar of vengeance/.test(n))return 'spirit';if(/vampire/.test(n))return 'vampire';if(/zombie|plague bearer/.test(n))return 'zombie';if(/blood fiend|satyr|quill demon|succubus|incubus/.test(n))return 'demon';
 if(/gobbo|flamegunner|lunatic goblin/.test(n))return 'goblin';
 if(/sorceress|wizard|warlock|necromancer|lich|shaman|priest|witch doctor|ice queen|druid/.test(n))return 'caster';
 if(/sniper|marksman|gunner/.test(n))return 'rifleman';if(/archer|ranger|amazon/.test(n))return 'archer';return 'warrior';
}
function referenceFor(family,name){
 if(family==='golem'&&!/flesh|^infernal$/.test(name))return /ice|frost/.test(name)?'icetitan':'golem';
 if(family==='treant')return /annihilator|ancient|elder/.test(name)?'elderwillow':'willow';
 if(family==='spirit')return 'whisper';
 if(family==='zombie')return 'mummy';
 if(/ancient wandigoo|wandigoo/.test(name))return 'icetitan';
 if(/hrimthrusa/.test(name))return 'siroma';
 if(/skeleton.*archer|archer.*skeleton/.test(name))return 'archerskeleton';
 if(/crypt fiend|beetle|scarab|insect/.test(name))return 'thiefbug';
 return null;
}
const nativeProjectile=(family,name,unit)=>family==='aircraft'||family==='rifleman'?'bullet':/flamegunner|red dragon|infernal machine|infernal tank/.test(name)?'fire':family==='tank'||family==='artillery'?'siege':/frost wyrm|azure drake|ice queen|ice troll/.test(name)?'frost':/winged serpent|hydra/.test(name)?'poison':['caster','spirit'].includes(family)||['magic','spells'].includes(unit.attackType)?'arcane':'arrow';
function rankedSculpture(source,reference,rank,palette,name){
 if(!rank)return source;
 const added=[],add=(...p)=>added.push(Object.freeze(p));
 // Upgrade ornaments are actual additional geometry on the shared sculpture.
 // Never scale the unit/collider or repaint a predecessor in place.
 if(reference==='mummy'){
  // Suffocated zombies gain face bindings, shackles and a corroded collar.
  for(const side of [-1,1]){add(side*.31,1.34,.18,.10,.68,.12,0x755b45);add(side*.48,.95,.09,.27,.17,.32,0x59645c);add(side*.48,.95,.267,.12,.10,.035,0xb29c76);}
  add(0,1.73,.08,.63,.16,.56,0x665e50);add(0,1.75,.38,.29,.11,.08,0xb49b73);add(0,1.95,.36,.53,.13,.11,0x826c55);
  if(rank>=2){
   // The final Plague Bearer grows diseased shoulders and torn outer wrappings.
   for(const side of [-1,1]){add(side*.44,1.60,.03,.45,.24,.48,0x8e9a69);add(side*.56,1.74,.13,.20,.20,.20,0xb1be79);add(side*.46,1.55,.32,.19,.16,.16,0x5b6c44);add(side*.24,.59,.20,.28,.42,.23,0x78805b);}
   add(-.16,1.34,.36,.20,.23,.13,0xc3ca8a);add(.19,1.18,.37,.18,.20,.15,0x93a764);add(0,2.44,.02,.66,.14,.58,0xa3ac79);
  }
 }else if(reference==='golem'){
  // Adamant plates enlarge shoulders, cover the stone fists and frame the core.
  for(const side of [-1,1]){add(side*.70,2.29,-.05,.82,.20,.78,palette.metal);add(side*.78,2.43,-.09,.48,.13,.51,0xd0d9ce);add(side*1.02,.94,.59,.59,.30,.16,0x5b7073);add(side*1.02,.96,.69,.29,.12,.07,palette.trim);}
  add(0,1.53,.57,.76,.58,.16,0x637b7b);add(0,1.55,.68,.21,.38,.07,0xd3caaa);add(0,1.55,.73,.12,.17,.045,0x92d4cc);add(0,2.78,.12,.91,.14,.77,palette.metal);
 }else if(reference==='willow'||reference==='elderwillow'){
  // Higher corrupted ancients develop spreading roots and fungal branch fans.
  const bark=reference==='elderwillow'?0x9b5548:0x7d6658;
  for(const side of [-1,1]){
   for(let i=0;i<4;i++)add(side*(.66+i*.13),1.59+i*.16,-.09,.17,.29,.19,bark);
   add(side*1.05,2.17,-.10,.45,.11,.40,0x9985ad);add(side*1.11,2.27,-.12,.26,.12,.28,0xc4b2d1);
   add(side*.78,.18,-.37,.52,.18,.33,bark);add(side*.97,.13,-.48,.31,.13,.23,0x5a4e40);
  }
  if(rank>=2){for(const side of [-1,1]){add(side*.28,2.84,-.10,.19,.44,.22,0xb7a2c9);add(side*.36,3.08,-.12,.24,.11,.23,0xd6bfdc);}add(0,1.07,.58,.20,.45,.12,0xd9c6b4);}
 }else if(reference==='whisper'){
  // The upgraded apparition has a three-point rune crown and shoulder shards.
  const dark=/void/.test(name)?0x62567e:0x6c8179,glow=/void/.test(name)?0xc2a8e0:0xb9ddbd;
  for(const side of [-1,1]){add(side*.50,1.60,-.02,.24,.24,.31,dark);add(side*.63,1.78,-.06,.14,.29,.18,glow);add(side*.31,source.height+.02,-.04,.14,.28,.19,dark);add(side*.31,source.height+.17,-.04,.10,.10,.13,glow);}
  add(0,source.height+.02,-.04,.69,.12,.49,dark);add(0,source.height+.21,-.04,.17,.36,.22,glow);add(0,1.31,.58,.13,.28,.06,glow);
 }else if(reference==='icetitan'){
  // Ancient frost beasts grow a crystalline crown and long shoulder crystals.
  for(const side of [-1,1]){add(side*.86,2.71,-.16,.34,.54,.40,0xa0bddc);add(side*1.02,3.00,-.18,.21,.34,.25,0xd9e9ee);add(side*.37,3.04,-.03,.19,.55,.23,0xc3d9e9);add(side*.42,3.34,-.05,.14,.15,.18,0xf0f6f0);add(side*.76,1.26,.58,.27,.30,.15,0xdbebed);}
  add(0,2.88,.05,.72,.16,.70,0xa5bfdd);
 }
 const parts=Object.freeze([...source.parts,...added]),height=Math.max(source.height,...added.map(p=>p[1]+p[4]/2));
 return Object.freeze({...source,parts,height});
}
export function castleUnitModelKey(unit){return unit?.castleUnit?`castle:${resolve(unit)?.key||unit.unitKey||unit.key||unit.kind}`:unit?.castleBuilderKey?`builder:${unit.castleBuilderKey}`:unit?.hero||unit?.kind;}
export function castleUnitVisual(value){
 const found=resolve(value);if(!found)return null;if(cache.has(found.key))return cache.get(found.key);const {key,unit}=found,race=unitRace.get(key)||'human',palette=RACES[race]||RACES.human,name=unit.name.toLowerCase(),family=familyFor(unit),parts=[],legs=[],wings=[],rotors=[],advanced=/royal|elder|master|lord|ancient|mighty|champion|veteran|adamant|heavy|sergeant|avatar|annihilat|queen|king|defender|crusader/.test(name);
 const reference=referenceFor(family,name),sculpture=reference?ragnarokMonsterSpec(reference):null;
 if(sculpture){
  const visualRank=unitRanks.get(key)||0,model=rankedSculpture(sculpture,reference,visualRank,palette,name),visual=Object.freeze({...model,key,name:unit.name.trim(),race,family,palette,rotors:Object.freeze([]),ragnarokVisual:reference,visualRank,projectileKind:nativeProjectile(family,name,unit),vehicle:false,weapon:family==='archer'?'bow':null,muzzle:palette.trim});
  cache.set(key,visual);return visual;
 }
 const b=(x,y,z,w,h,d,color)=>parts.push([x,y,z,w,h,d,color]),leg=(x,z,color=palette.metal,w=.3,h=.5,y=.25,d=.36)=>legs.push({x,y,z,w,h,d,color}),eye=(x,y,z,color=0x293f3d)=>b(x,y,z,.11,.12,.055,color);
 const p=palette,ivory=0xe4dcc4,dark=0x344743;let motion='walk';
 function humanoid({skin=p.skin,robe=false,helmet=false}={}){const armor=!['goblin','murloc','zombie','demon','beastman','vampire','archer'].includes(family);b(0,1,0,.78,.85,.5,robe?p.cloth:['murloc','demon','beastman'].includes(family)?skin:armor?p.metal:p.cloth);b(0,1.7,.02,.56,.54,.5,skin);b(0,1.42,.04,.22,.15,.25,skin);for(const side of [-1,1]){b(side*.53,1.03,.02,.28,.68,.32,robe?p.cloth:skin);eye(side*.15,1.77,.29);}b(0,.7,0,.87,.15,.6,p.trim);if(robe){b(0,.54,0,.92,.28,.64,p.cloth);b(0,.34,0,1.03,.22,.7,p.cloth);leg(-.2,0,p.cloth,.22,.26,.13,.3);leg(.2,0,p.cloth,.22,.26,.13,.3);}else{leg(-.23,.02,armor?p.metal:p.cloth);leg(.23,.02,armor?p.metal:p.cloth);}if(helmet){b(0,1.97,.02,.64,.2,.58,p.metal);for(const side of [-1,1])b(side*.26,1.73,.02,.1,.44,.57,p.metal);b(0,2.12,-.04,.2,.2,.4,p.trim);}if(['elf','nightelf'].includes(race))for(const side of [-1,1])b(side*.36,1.82,-.01,.3,.12,.17,skin);if(['orc','north'].includes(race))for(const side of [-1,1])b(side*.17,1.49,.32,.12,.3,.12,ivory);if(race==='undead'){b(0,1.59,.29,.2,.12,.04,dark);for(const side of [-1,1])b(side*.12,1.49,.27,.06,.13,.05,ivory);}if(['chaos','corrupted'].includes(race))for(const side of [-1,1]){b(side*.3,2.05,0,.16,.38,.18,ivory);b(side*.36,2.26,0,.12,.16,.14,ivory);}}
 function staff(color=0xb7d5e4){b(-.7,.99,.12,.12,1.85,.12,0x7c6950);b(-.7,2.04,.12,.36,.4,.36,color);b(-.7,2.32,.12,.15,.16,.15,ivory);}
 function rider(y=1.8,skin=p.skin){b(0,y,0,.45,.5,.4,p.cloth);b(0,y+.42,.06,.4,.37,.37,skin);b(0,y+.65,.06,.46,.14,.43,p.metal);for(const side of [-1,1])eye(side*.11,y+.47,.26);}
 function quadruped(color,headColor=color){b(0,.88,0,1.05,.85,1.5,color);b(0,1.38,.65,.8,.64,.8,headColor);b(0,1.19,1.14,.64,.31,.4,headColor);for(const side of [-1,1]){eye(side*.26,1.51,1.05);b(side*.31,1.84,.55,.22,.3,.25,color);leg(side*.37,-.45,color);leg(side*.37,.48,color);}b(0,1,-1,.25,.23,.7,color);}
 if(family==='aircraft'){
  motion='vehicle';b(0,.93,0,.9,.67,1.65,p.metal);b(0,1.25,.62,.75,.38,.7,0xa8d4d7);b(0,1,.99,.76,.17,.12,dark);b(0,.92,-1.15,.2,.24,1.1,p.metal);b(0,1.26,-1.6,.12,.7,.4,p.cloth);b(0,1.5,-.05,.16,.45,.16,p.trim);for(const side of [-1,1]){b(side*.66,.66,.06,.4,.3,1.14,p.cloth);b(side*.46,.38,.12,.13,.13,1.7,dark);b(side*.46,.56,.45,.1,.4,.1,p.metal);if(/gyro/.test(name))b(side*.67,.4,.05,.34,.38,.54,p.trim);else b(side*.58,.84,1,.15,.16,.52,dark);}
  rotors.push({axis:'y',pivot:[0,1.82,-.05],parts:[[0,0,0,3.15,.075,.16,dark],[0,.025,0,.16,.075,3.15,dark],[0,.08,0,.3,.18,.3,p.trim]]},{axis:'x',pivot:[.2,1.18,-1.58],parts:[[0,0,0,.06,.8,.1,p.trim],[0,0,0,.06,.1,.8,p.trim]]});
 }else if(family==='tank'||family==='artillery'){
  motion='vehicle';const mechanical=family==='tank',wood=0x8d7250,metal=mechanical?p.metal:wood;for(const side of [-1,1]){b(side*.64,.35,0,.36,.54,1.78,dark);for(const z of [-.58,0,.58])b(side*.83,.36,z,.045,.25,.26,p.metal);}b(0,.68,0,1.22,.49,1.57,metal);
  if(mechanical){b(0,1,.03,.95,.4,1.08,p.cloth);b(0,1.29,0,.67,.23,.66,p.metal);if(/rocket/.test(name))for(const side of [-1,1]){b(side*.32,1.48,.1,.4,.34,.9,dark);for(const x of [-.1,.1])b(side*.32+x,1.49,.59,.11,.11,.08,p.trim);}else if(/mine layer/.test(name)){for(const x of [-.25,.25])b(x,1.2,-.35,.32,.18,.35,p.trim);b(0,1.13,.6,.19,.15,.7,dark);}else{b(0,1.2,.8,/heavy|assault/.test(name)?.28:.2,.23,1.1,dark);b(0,1.22,1.38,.36,.3,.2,p.metal);}if(/infernal/.test(name)){b(0,.98,.83,.4,.22,.08,0xaddb7a);for(const side of [-1,1])b(side*.47,1.4,-.4,.2,.65,.23,ivory);}}
  else if(/mortar/.test(name)){b(0,1,.1,.7,.7,.7,dark);b(0,1.45,.3,.52,.3,.55,0x899a96);b(0,1.62,.3,.32,.04,.35,dark);rider(1.05);}
  else if(/ballista|glaive/.test(name)){b(0,.96,.06,.16,.24,2,wood);for(const side of [-1,1]){b(side*.63,1,.35,1.15,.13,.15,p.trim);b(side*.96,1,.6,.13,.13,.6,p.metal);}if(/glaive/.test(name)){b(0,1.34,.32,1.05,.13,.18,p.metal);b(0,1.34,.32,.17,.13,1.05,p.metal);}}
  else{b(0,1.05,-.1,.2,1.15,.2,wood);b(0,1.5,.35,.2,.22,1.6,wood);b(0,1.53,1,.65,.25,.6,dark);b(0,1.73,1,.42,.18,.4,0x9da394);}
 }else if(family==='golem'||family==='shredder'||family==='treant'){
  motion='heavy';const tree=family==='treant',flesh=/flesh/.test(name),infernal=/^infernal$/.test(name),body=tree?0x746250:flesh?0xaab398:infernal?0x67686c:p.metal,accent=tree?0xb59bd9:infernal?0xa4cf68:p.trim;
  b(0,1.23,0,1.2,1.25,.85,body);b(0,2.13,.08,.72,.65,.65,body);for(const side of [-1,1]){b(side*.85,1.34,.05,.45,1.1,.55,body);b(side*.85,.83,.22,.5,.35,.65,body);eye(side*.2,2.23,.43,infernal?0xc5e885:0x8bd3ce);leg(side*.38,0,body,.4,.7,.35,.55);}
  if(tree){for(const side of [-1,1]){b(side*.74,2.13,0,.3,1,.35,body);b(side*1.04,2.46,0,.7,.27,.4,body);b(side*1.15,2.76,0,.25,.45,.25,accent);}b(0,1.32,.47,.25,.55,.12,0x484546);}
  else if(family==='shredder'){b(0,1.48,.5,.66,.62,.18,dark);b(0,1.58,.62,.34,.37,.13,p.skin);b(0,1.84,.62,.38,.13,.19,p.trim);for(let i=0;i<8;i++){const a=i*Math.PI/4;b(.95+Math.sin(a)*.42,1.1+Math.cos(a)*.42,.3,.2,.2,.16,ivory);}b(.95,1.1,.34,.62,.62,.2,p.metal);b(-.9,1.22,.58,.2,.22,.65,dark);}
  else{b(0,1.32,.47,.4,.45,.1,accent);if(advanced){b(0,2.59,.04,.6,.2,.62,accent);for(const side of [-1,1])b(side*.55,1.94,0,.65,.25,.9,accent);}if(flesh)for(const x of [-.32,0,.32])b(x,1.33,.45,.08,.42,.05,0x6f7461);}
 }else if(family==='winged-beast'){
  const kind=/gryphon/.test(name)?'griffin':/wyrm/.test(name)?'frostwyrm':/winged serpent/.test(name)?'frostwyrm':'dragon',template=[];const model=buildMonster(kind,null,(_,...part)=>template.push(part));const color=/red dragon/.test(name)?0xb5715d:/azure|frost/.test(name)?0x8bb8c9:/nether|shadow|faerie/.test(name)?0x9591b7:/winged serpent/.test(name)?0x6caa91:model?.fur;
  for(const part of template)b(...part.slice(0,6),part[6]===model?.fur?color:part[6]);for(const wing of model?.wings||[])wings.push({...wing,parts:wing.parts.map(part=>[...part.slice(0,6),part[6]===model.fur?color:part[6]])});
  if(!/wyrm|serpent/.test(name))for(const side of [-1,1]){leg(side*.34,-.44,color);if(!/wyvern/.test(name))leg(side*.34,.44,color);}if(/rider/.test(name))rider(2.03);if(/faerie/.test(name))for(const side of [-1,1])b(side*.32,2.35,.6,.1,.45,.13,p.trim);
 }else if(family==='beast'||family==='mounted-huntress'){
  const color=/polar|frost wolf/.test(name)?0xdce4d9:/felhound/.test(name)?0x6c657c:family==='mounted-huntress'?0x6a6b7d:0x9c8a6b;quadruped(color);if(/bear|kodo/.test(name)){b(0,.96,-.06,1.32,.92,1.7,color);b(0,1.64,.64,.97,.63,.78,color);b(0,1.28,1.32,.5,.3,.27,dark);}if(/kodo/.test(name)){rider(1.9);for(const side of [-1,1]){b(side*.58,1.22,1.04,.16,.65,.2,ivory);b(side*.62,1.3,-.3,.5,.6,.6,p.cloth);b(side*.62,1.65,-.3,.54,.1,.64,ivory);}}if(/felhound/.test(name))for(const side of [-1,1])b(side*.33,2.05,.57,.16,.55,.16,ivory);if(family==='mounted-huntress')rider(1.86);
 }else if(family==='dragon-turtle'||family==='hydra'||family==='magnataur'){
  const color=family==='dragon-turtle'?0x8aab83:family==='hydra'?0x71978b:0xaeb9bd;quadruped(color);
  if(family==='dragon-turtle'){b(0,1.35,-.1,1.5,.68,1.75,0x5d7c66);b(0,1.8,-.1,.9,.25,1.1,p.trim);for(const x of [-.6,0,.6])b(x,1.75,-.1,.19,.37,.2,ivory);}
  if(family==='hydra')for(const side of [-1,0,1]){b(side*.63,1.7,0,.32,1.35,.4,color);b(side*.63,2.42,.29,.55,.5,.8,color);b(side*.63,2.24,.77,.48,.19,.27,0xd7ccb1);eye(side*.63-.16,2.5,.7);eye(side*.63+.16,2.5,.7);}
  if(family==='magnataur'){b(0,1.9,.1,1.2,1.2,.7,color);b(0,2.7,.14,.7,.66,.6,color);for(const side of [-1,1]){b(side*.8,2,.1,.4,1.25,.5,color);b(side*.43,2.85,.25,.2,.8,.25,ivory);eye(side*.18,2.83,.47);}b(0,1.8,.49,.8,.22,.12,p.trim);}
 }else if(family==='murloc'){
  // The native chain changes species and silhouette, rather than recoloring
  // the same soldier: Murloc, Mutant, Flesheater and Nightcrawler.
  const tier={n003:0,n00I:1,n00J:2,n00K:3}[key]??0;
  const skin=[0x7da99b,0x6b9a8a,0x8eaa72,0x555e74][tier],fin=[0xc6b775,0xd5aa75,0xc8b778,0x8c7dad][tier];
  const bulk=1+tier*.12;motion='waddle';
  b(0,.91,0,.84*bulk,.9,.66*bulk,skin);b(0,1.55,.16,.96*bulk,.76,.72*bulk,skin);b(0,1.32,.6,.82*bulk,.27,.37,0xb9c7a0);b(0,1.4,.81,.58,.12,.035,dark);
  for(const side of [-1,1]){b(side*.46*bulk,1.82,.43,.36,.34,.3,ivory);eye(side*.48*bulk,1.82,.6,tier===3?0xd6a2b1:dark);b(side*.66*bulk,.97,.1,.28,.67,.35,skin);b(side*.63*bulk,.63,.3,.37,.2,.48,skin);leg(side*.29*bulk,.06,skin,.35,.36,.18,.48);b(side*.29*bulk,.13,.33,.42,.16,.6,skin);for(const x of [-.1,.1])b(side*.29*bulk+x,.14,.65,.07,.09,.2,ivory);}
  for(let i=0;i<4+tier;i++)b(0,.64+i*.22,-.43,.12,.26,.28+(i%2)*.12,fin);
  if(tier<3){b(.79*bulk,1.03,.3,.1,1.6+tier*.14,.1,0x816849);b(.79*bulk,1.93+tier*.07,.3,.28,.44,.15,p.metal);if(tier>0){b(-.81*bulk,1.04,.28,.18,.74+tier*.12,.67,p.metal);b(-.92*bulk,1.04,.28,.05,.49,.37,fin);}}
  if(tier===2){for(const side of [-1,1])b(side*.58,1.32,0,.42,.24,.72,p.metal);b(0,2.02,.1,.58,.14,.52,fin);for(const x of [-.23,0,.23])b(x,2.18,.1,.1,.28,.16,ivory);}
  if(tier===3){b(0,1.87,-.05,1.15,.22,.81,0x444654);b(0,1.13,-.42,.9,1.12,.18,0x444654);for(const side of [-1,1]){b(side*.8,1.04,.55,.11,.72,.13,p.metal);b(side*.8,.73,.55,.31,.08,.18,fin);}b(0,1.12,.65,.66,.17,.08,0x444654);}
 }else if(family==='naga'){
  motion='serpent';for(let i=0;i<4;i++)b(0,.24+i*.17,-.75+i*.27,1.1-i*.17,.25,1.15-i*.15,p.skin);b(0,1.15,0,.7,1.25,.52,p.cloth);b(0,2,.06,.61,.63,.55,p.skin);for(const side of [-1,1]){b(side*.48,1.25,.05,.24,.8,.3,p.skin);eye(side*.18,2.12,.36);b(side*.37,2.05,-.03,.25,.47,.12,p.trim);}b(0,1.82,-.3,.2,1,.18,p.trim);if(/guard/.test(name)){b(.68,1.3,.2,.11,2.4,.12,p.metal);b(.68,2.58,.2,.35,.4,.17,p.trim);}else staff(0xc7d9b8);
 }else if(family==='spirit'){
  motion='float';for(let i=0;i<4;i++)b(0,.45+i*.37,0,1.1-i*.14,.42,.72-i*.07,p.cloth);b(0,1.94,.05,.5,.55,.46,p.skin);for(const side of [-1,1]){b(side*.65,1.4,.03,.65,.23,.3,p.skin);eye(side*.14,2.03,.31,0xc9e3d4);}b(0,2.28,.02,.7,.23,.61,p.cloth);if(/avatar|keeper/.test(name))for(const side of [-1,1])b(side*.31,2.49,0,.15,.45,.2,p.trim);
 }else{
  const robed=family==='caster',skin=/troll/.test(name)?0x8baab1:family==='goblin'?0x8eac78:family==='murloc'?0x7da99b:family==='beastman'?0xb5c2bd:p.skin;humanoid({skin,robe:robed,helmet:family==='warrior'||family==='rifleman'});
  if(family==='vampire'){b(0,1.12,-.35,1.05,1.45,.18,0x574858);b(0,1.38,.32,.6,.2,.1,0x9b625e);for(const side of [-1,1])b(side*.12,1.49,.32,.08,.16,.06,ivory);}
  else if(family==='zombie'){for(const side of [-1,1])b(side*.53,.83,.2,.26,.4,.3,skin);b(0,1.24,.29,.52,.15,.05,0x778875);if(/plague/.test(name))b(0,1.13,-.43,.7,.85,.36,0x8a9d6d);}
  else if(family==='demon'){for(const side of [-1,1]){b(side*.55,.78,.3,.3,.3,.4,p.skin);for(const x of [-.08,.08])b(side*.55+x,.78,.56,.07,.16,.24,ivory);}if(/quill/.test(name))for(const x of [-.45,0,.45])b(x,1.6,-.34,.13,.8,.2,ivory);if(/succubus/.test(name))staff(0xd5a7c6);if(/succubus|incubus/.test(name))for(const side of [-1,1])wings.push({side,pivot:[side*.32,1.35,-.27],parts:[[side*.38,.12,0,.7,.16,.72,p.cloth],[side*.68,-.15,-.08,.42,.48,.3,p.skin]]});}
  else if(family==='caster'){staff(race==='undead'?0xb6d598:race==='north'?0xb5e4eb:0xc8b6df);b(0,2.08,-.02,.8,.25,.73,p.cloth);if(/wizard|lich|queen/.test(name)){b(0,2.34,-.02,.48,.35,.5,advanced?p.trim:p.cloth);b(0,2.6,-.02,.2,.2,.25,p.trim);}}
  else if(family==='rifleman'||/flamegunner/.test(name)){b(.51,1.15,.45,.23,.24,.62,0x856d50);b(.51,1.23,.98,.13,.13,.7,p.metal);b(.51,1.23,1.35,.2,.2,.13,dark);b(.51,1.42,.62,.15,.14,.23,p.trim);if(/sniper|marksman/.test(name)){b(.51,1.49,.72,.2,.2,.63,dark);b(.51,1.49,1.06,.15,.15,.08,0x80b9bf);b(.51,1.23,1.65,.11,.11,.72,p.metal);b(.51,1.23,2.05,.18,.18,.22,dark);b(.51,1.01,.15,.28,.17,.5,0x755e44);}if(/heavy|flame/.test(name)){b(0,1.2,-.46,.73,.8,.35,/flame/.test(name)?0xab7056:p.cloth);b(.57,1.23,1.08,.27,.27,.63,p.metal);}}
  else if(family==='archer'){
   // Stepped recurved limbs, a taut string and a nocked arrow face the target.
   b(.66,1.24,.48,.14,.34,.18,0x8c6947);
   for(const side of [-1,1]){b(.66,1.24+side*.3,.55,.12,.3,.16,p.trim);b(.66,1.24+side*.55,.67,.1,.25,.14,p.trim);b(.66,1.24+side*.72,.8,.12,.14,.17,0xb69a67);}
   b(.66,1.24,.85,.035,1.46,.035,ivory);b(.66,1.24,1.05,.045,.045,.95,0xba9e67);b(.66,1.24,1.55,.09,.09,.2,p.metal);
   b(0,1.2,-.4,.5,.7,.3,0x826b4e);for(const x of [-.16,0,.16]){b(x,1.66,-.43,.05,.5,.05,p.trim);b(x,1.94,-.43,.14,.15,.08,ivory);}
  }
  else if(family==='goblin'){if(/lunatic/.test(name)){b(.55,1.05,.37,.65,.8,.65,0xb77859);b(.55,1.52,.37,.08,.2,.08,0xe1cd86);}else{b(.62,1.15,.25,.14,1,.14,p.metal);b(.62,1.73,.25,.5,.22,.2,p.metal);b(0,1.2,-.42,.6,.6,.35,p.trim);}b(0,2.02,.05,.69,.18,.65,p.metal);}
  else if(family==='murloc'){b(0,1.32,-.35,.13,1.4,.3,p.trim);for(const side of [-1,1])b(side*.25,2.02,.1,.25,.32,.23,ivory);b(.65,1.25,.15,.1,1.7,.13,p.metal);}
  else if(family==='beastman'){for(const side of [-1,1]){b(side*.28,2.15,0,.17,.55,.2,ivory);b(side*.48,1.2,.1,.32,.9,.42,skin);}b(0,1.05,.31,.2,.7,.15,ivory);}
  else{b(.65,1.28,.35,.15,1.45,.18,p.metal);b(.65,.72,.35,.52,.1,.3,p.trim);b(-.65,1.13,.2,.2,.85,.72,p.cloth);b(-.77,1.13,.2,.06,.3,.32,p.trim);if(/paladin|champion/.test(name)){b(.65,1.9,.35,.5,.32,.4,p.trim);}}
  if(advanced){b(0,2.12,.04,.66,.16,.59,p.trim);for(const side of [-1,1])b(side*.48,1.5,0,.4,.25,.65,p.trim);}
 }
 // Equipment and anatomy distinguish native evolutions even when they share
 // a family. These boxes also generate the portrait used in the upgrade UI.
 if(key==='h05C'){b(0,1.28,-.4,.82,1.08,.17,0x657650);b(.51,.94,1.38,.08,.55,.08,dark);b(.51,1.49,.75,.28,.25,.78,dark);}
 if(key==='n00X'){for(const side of [-1,1])b(side*.48,1.7,.02,.42,.32,.64,p.metal);for(const x of [-.25,0,.25])b(x,2.43,.05,.12,.4,.18,p.trim);}
 if(key==='n00Y'){b(0,1.15,-.4,1.1,1.25,.2,0xe4e3cf);b(-.78,1.3,.35,.15,1.5,.2,p.metal);}
 if(key==='n01K'){b(0,1.17,-.5,.95,1.06,.45,0x747c50);for(const x of [-.3,0,.3])b(x,1.23,.36,.13,.6,.12,0x59634d);b(0,1.5,.35,.73,.23,.2,0x59634d);}
 if(key==='o00B'){b(0,2.6,0,.12,1.25,.14,p.metal);b(0,3.13,0,.76,.45,.19,0xa6c5df);}
 if(key==='o008'){for(const side of [-1,1]){b(side*.62,1.66,-.3,.7,.16,.8,0xb77b59);b(side*.62,2,-.3,.1,.58,.15,ivory);}}
 if(key==='o006'){for(const side of [-1,1]){b(side*.72,1.15,.07,.22,.91,1.26,p.metal);b(side*.85,1.15,.07,.08,.6,.63,p.trim);}}
 if(key==='o005'){b(.65,1.86,.35,.93,.46,.22,p.metal);b(-.65,1.87,.35,.73,.37,.22,p.metal);}
 if(key==='n01O'){b(-.79,1.39,.38,.9,.76,.08,ivory);for(const x of [-1.09,-.79,-.49])b(x,1.39,.44,.035,.8,.035,dark);for(const y of [1.13,1.39,1.65])b(-.79,y,.44,.94,.035,.035,dark);}
 if(key==='o00A'){for(const side of [-1,1]){b(side*.48,2.19,0,.55,.17,.23,0xa7d3df);b(side*.69,2.38,0,.13,.43,.17,ivory);}b(0,1.63,.35,.46,.38,.14,0x7f609a);}
 if(key==='n01H'){b(0,2.6,-.03,1.26,.6,.88,0x626f54);for(const side of [-1,1])b(side*.86,1.17,.4,.32,.65,.23,0x9ba57b);}
 if(key==='n027'){for(const side of [-1,1]){b(side*.9,1.23,.43,.7,.68,.45,0x8c7eab);b(side*1.21,1.28,.43,.18,.94,.28,ivory);}b(0,2.69,.05,.21,.86,.26,0xb59bd9);}
 if(key==='n01E'){for(const side of [-1,1]){b(side*.36,1.57,-.38,.25,.8,.27,dark);b(side*.36,1.83,-.38,.32,.12,.34,0xb8d876);}b(0,1.04,.85,.8,.37,.12,0x9dbb70);}
 if(key==='n01B'){b(0,1.32,0,.84,.83,1.12,0x595d79);for(const side of [-1,1])b(side*.28,2.25,.57,.16,.65,.19,0xaba1cb);}
 if(key==='e00J'){b(0,1.1,-.4,1.05,1.34,.22,0x789765);for(const side of [-1,1]){b(side*.37,2.31,0,.16,.58,.18,0xc7b391);b(side*.53,2.55,0,.45,.13,.16,0xc7b391);}}
 if(key==='e004'){for(const side of [-1,1])b(side*.49,1.49,0,.42,.24,.64,p.metal);b(0,2.12,.03,.3,.48,.31,0x9c6c7c);b(0,1.16,-.49,.62,.87,.28,p.metal);}
 const projectileKind=nativeProjectile(family,name,unit);
 const height=Math.max(1.5,...parts.map(part=>part[1]+part[4]/2),...rotors.map(r=>r.pivot[1]+.2)),visual={key,name:unit.name.trim(),race,family,palette,parts,legs,wings,rotors,projectileKind,motion,vehicle:motion==='vehicle',height,weapon:family==='archer'?'bow':family==='rifleman'?/sniper|marksman/.test(name)?'sniper-rifle':'rifle':null,eyeLine:height*.68,fur:palette.skin,muzzle:palette.trim};cache.set(key,visual);return visual;
}
export function castleBasicProjectile(event,unit){if(!unit?.castleUnit||!event?.basicAttack||!event.castle||event.skill||event.projectileKind==='siege')return null;return castleUnitVisual(unit)?.projectileKind||null;}
export function buildCastleUnitModel(unit,body,voxel){const visual=castleUnitVisual(unit);if(!visual)return null;for(const part of visual.parts)voxel(body,...part);return visual;}
export function castleUnitAnimation(visual,time,unit={}){const frame=Math.floor(time*8);return{frame,rotor:frame*Math.PI*.37,bodyY:visual?.vehicle?(unit.flying?[0,.025,.05,.025,0,-.025,-.05,-.025][frame%8]:0):visual?.motion==='float'?[0,.035,.07,.035,0,-.035,-.07,-.035][frame%8]:0,tilt:visual?.vehicle&&unit.flying&&unit.moving?.04:0,recoil:visual?.vehicle&&time-(unit.attackAt??-10)<.3?-.045:0};}
const hex=color=>'#'+color.toString(16).padStart(6,'0');
const shade=(color,factor)=>{let value=0;for(const shift of [16,8,0])value|=Math.round(((color>>shift)&255)*factor)<<shift;return hex(value);};
export function castleUnitPortrait(value){
 const visual=castleUnitVisual(value);if(!visual)return '';if(portraits.has(visual.key))return portraits.get(visual.key);const parts=[...visual.parts,...visual.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...visual.wings.flatMap(w=>w.parts.map(p=>[p[0]+w.pivot[0],p[1]+w.pivot[1],p[2]+w.pivot[2],...p.slice(3)])),...visual.rotors.flatMap(r=>r.parts.map(p=>[p[0]+r.pivot[0],p[1]+r.pivot[1],p[2]+r.pivot[2],...p.slice(3)]))];
 const project=([x,y,z])=>[x*.88-z*.72,-y+z*.38+x*.27],polygons=[];
 for(const [x,y,z,w,h,d,color]of parts){const a=x-w/2,b=x+w/2,l=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;for(const [corners,tint,depth]of [[[[a,t,n],[b,t,n],[b,t,f],[a,t,f]],1,x+z-.01],[[[b,l,n],[b,t,n],[b,t,f],[b,l,f]],.77,x+z+.02],[[[a,l,f],[a,t,f],[b,t,f],[b,l,f]],.9,x+z+.03]])polygons.push({points:corners.map(project),color:shade(color,tint),depth});}
 const all=polygons.flatMap(p=>p.points),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1])),scale=Math.min(79/Math.max(.1,maxX-minX),66/Math.max(.1,maxY-minY)),offsetX=(96-(maxX-minX)*scale)/2-minX*scale,offsetY=(76-(maxY-minY)*scale)/2-minY*scale;
 const svg=`<svg viewBox="0 0 96 80" aria-hidden="true" class="army-portrait castle-unit-portrait"><path d="M5 65 48 51l43 14-43 13z" fill="${hex(visual.palette.cloth)}" opacity=".18"/>${polygons.sort((a,b)=>a.depth-b.depth).map(p=>`<polygon points="${p.points.map(([x,y])=>(x*scale+offsetX).toFixed(2)+','+(y*scale+offsetY).toFixed(2)).join(' ')}" fill="${p.color}"/>`).join('')}</svg>`;portraits.set(visual.key,svg);return svg;
}
