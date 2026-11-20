import {LOOT_SKILLS} from './loot-skills.js';
import {SKILLS} from './catalog.js';
import {CUSTOM_HERO_BESTIARY,CUSTOM_HERO_SKILL_THEMES} from './customhero-bestiary.js';
// Original animals and mythical challengers. These are not Warcraft assets.
// Multipliers for ordinary fauna apply once to the wave's existing base damage.
export const MONSTER_PROFILES={
 goblin:{name:'Pintinho briguento',size:.78,moveSpeed:3.4,attackInterval:1.25,accuracy:.82,evasion:.03,critChance:.02,critMultiplier:1.6,attackMultiplier:.85},
 duck:{name:'Pato do coliseu',size:.9,moveSpeed:2.8,attackInterval:1.5,accuracy:.9,evasion:.02,critChance:.02,critMultiplier:1.6,attackMultiplier:1.05},
 frog:{name:'Sapo dos ladrilhos',size:.8,moveSpeed:3.2,attackInterval:1.6,accuracy:.85,evasion:.08,critChance:0,critMultiplier:1.6,attackMultiplier:.9},
 hare:{name:'Lebre saltadora',size:.78,moveSpeed:4.7,attackInterval:.95,accuracy:.8,evasion:.16,critChance:.06,critMultiplier:1.7,attackMultiplier:.8},
 brute:{name:'Javali de guerra',size:1.3,moveSpeed:2.3,attackInterval:1.9,accuracy:.88,evasion:0,critChance:.08,critMultiplier:2,attackMultiplier:1.2},
 ram:{name:'Carneiro aríete',size:1.05,moveSpeed:3.2,attackInterval:1.65,accuracy:.87,evasion:.02,critChance:.05,critMultiplier:1.8,attackMultiplier:1.1},
 bat:{name:'Morcego das arquibancadas',size:.7,moveSpeed:4.2,attackInterval:1.7,accuracy:.8,evasion:.13,critChance:.02,critMultiplier:1.6,attackMultiplier:.8},
 tortoise:{name:'Cágado de muralha',size:1.15,moveSpeed:1.85,attackInterval:1.9,accuracy:.9,evasion:0,critChance:0,critMultiplier:1.6,attackMultiplier:1.15},
 hedgehog:{name:'Ouriço do musgo',size:.8,moveSpeed:2.6,attackInterval:1.3,accuracy:.87,evasion:.07,critChance:.03,critMultiplier:1.6,attackMultiplier:.85},
 champion:{name:'Urso campeão',size:1.6,moveSpeed:2.5,attackInterval:1.7,accuracy:.93,evasion:.03,critChance:.1,critMultiplier:2,attackMultiplier:1.15},
 wolf:{name:'Lobo do eco',size:.85,moveSpeed:4.8,attackInterval:.8,accuracy:.88,evasion:.1,critChance:.06,critMultiplier:1.7,attackMultiplier:.9},
 bonus:{name:'Eco de prova',size:.9,moveSpeed:1.8,attackInterval:1.8,accuracy:.75,evasion:0,critChance:0,critMultiplier:1.6,attackMultiplier:.75}
};
export const MONSTERS={
 lion:{name:'Leão da juba solar',description:'Um guardião de juba dourada que anuncia a investida com um rugido. Enfrentá-lo exige resistir ao seu breve surto de força.',size:1.2,color:0xd8aa56,skill:'battlecry',unlockWave:4,hpMultiplier:1.15,damageMultiplier:1.1,armorBonus:1,flying:false,altitude:0},
 rhino:{name:'Rinoceronte de basalto',description:'Placas de rocha recobrem um corredor impaciente. Seu chifre abre caminho, mas o aviso da investida oferece uma chance de desviar.',size:1.45,color:0x92978d,skill:'hornrush',unlockWave:7,hpMultiplier:1.45,damageMultiplier:1.05,armorBonus:3,flying:false,altitude:0},
 griffin:{name:'Grifo das tempestades',description:'Um caçador de penas claras e patas felinas. Sobrevoa pilares antes de mergulhar envolto em eletricidade; o gelo corta sua vantagem elemental.',size:1.25,color:0xd9c994,skill:'stormdive',unlockWave:12,hpMultiplier:1.3,damageMultiplier:0.65,armorBonus:1,flying:true,altitude:1.3,range:4,element:'lightning',resistances:{lightning:.2,ice:-.15},mythic:true},
 chimera:{name:'Quimera do brejo',description:'Uma mistura inquieta de fera e serpente. Prefere cobrir a arena com uma névoa venenosa antes de se aproximar.',size:1.35,color:0x9f85ba,skill:'venomcloud',unlockWave:18,hpMultiplier:1.4,damageMultiplier:1.1,armorBonus:2,flying:false,altitude:0,mythic:true},
 dragon:{name:'Dragão das brasas',description:'Um grande réptil alado que mantém distância com garras e fogo. Resiste às brasas, mas sua couraça aquecida cede mais ao gelo.',size:1.6,color:0xbe7751,skill:'flamebreath',unlockWave:25,hpMultiplier:1.65,damageMultiplier:0.7,armorBonus:3,flying:true,altitude:1.6,range:5,element:'fire',resistances:{fire:.25,ice:-.2},mythic:true},
 sphinx:{name:'Esfinge do crepúsculo',description:'Uma guardiã paciente de pedra e areia. Seu desafio é uma defesa persistente, não uma perseguição veloz.',size:1.45,color:0xc9b589,skill:'stonehide',unlockWave:32,hpMultiplier:1.5,damageMultiplier:1.15,armorBonus:6,flying:false,altitude:0,mythic:true},
 valkyrie:{name:'Coruja valquíria do trovão',description:'Uma coruja de plumagem prateada e elmo dourado que guarda os andares altos. Ataca do ar e anuncia seu mergulho elétrico antes de tocar o coliseu.',size:1.15,color:0xd8d5b1,skill:'stormdive',unlockWave:18,hpMultiplier:1.2,damageMultiplier:0.65,armorBonus:2,flying:true,altitude:1.7,range:5,element:'lightning',resistances:{lightning:.25,poison:-.15},mythic:true},
 harpy:{name:'Harpia dos ventos frios',description:'Uma ave de asas lilases que dança entre as correntes de ar. Seu orbe gelado interrompe perseguições, mas relâmpagos atravessam sua defesa leve.',size:1,color:0xaba3cc,skill:'warlockfrost',unlockWave:9,hpMultiplier:.95,damageMultiplier:0.65,armorBonus:0,flying:true,altitude:1.4,range:4,element:'wind',resistances:{wind:.2,lightning:-.15},mythic:true},
 phoenix:{name:'Fênix da alvorada',description:'Penas de cobre e ouro cercam uma chama viva. Lança esferas de fogo que disputam espaço; gelo é sua fraqueza. Não ressuscita nesta adaptação.',size:1.25,color:0xea9a4f,skill:'warlockfire',unlockWave:23,hpMultiplier:1.2,damageMultiplier:0.65,armorBonus:1,flying:true,altitude:1.8,range:5,element:'fire',resistances:{fire:.25,ice:-.2},mythic:true},
 frostwyrm:{name:'Serpente alada da geada',description:'Uma serpente de escamas azuis que paira sobre os pisos congelados. Seus orbes frios punem trajetos previsíveis, enquanto fogo encontra frestas nas escamas.',size:1.4,color:0x9bc4d6,skill:'warlockfrost',unlockWave:30,hpMultiplier:1.45,damageMultiplier:0.7,armorBonus:3,flying:true,altitude:1.8,range:5,element:'ice',resistances:{ice:.25,fire:-.2},mythic:true},
 basilisk:{name:'Basilisco das raízes',description:'Um réptil terrestre de crista verde que cospe névoa tóxica a curta distância. Tolera veneno e prefere emboscadas entre obstáculos; fogo o expulsa do abrigo.',size:1.2,color:0x899e70,skill:'venomcloud',unlockWave:14,hpMultiplier:1.2,damageMultiplier:0.65,armorBonus:2,flying:false,altitude:0,range:3,element:'poison',resistances:{poison:.25,fire:-.15},mythic:true}
};

// The Pátio is original fiction: creatures from different mythologies crossed
// Bifrost together. Nordic names are a setting, not a historical bestiary claim.
const NORDIC_FAUNA={goblin:'Draugr de Midgard',duck:'Pato dos Fiordes',frog:'Sapo de Yggdrasil',hare:'Lebre de Skadi',brute:'Jotun das Runas',ram:'Sátiro dos Fiordes',bat:'Gárgula de Helheim',tortoise:'Cágado de Asgard',hedgehog:'Ouriço das Raízes',champion:'Jotun Ancestral de Niflheim',wolf:'Lobo de Fenrir',bonus:'Eco das Nornas'};
for(const [key,name]of Object.entries(NORDIC_FAUNA))MONSTER_PROFILES[key].name=name;
const NORDIC_BEASTS={
 lion:['Leão da Juba de Sol','Um visitante de terras distantes atravessou Bifrost e recebeu uma juba marcada pelo sol. Seu rugido anuncia uma breve explosão de força.'],
 rhino:['Rinoceronte de Jotunheim','Sob placas de basalto, este guardião das passagens dos gigantes prepara investidas. Seu chifre abre caminho; observe o aviso para sair da trajetória.'],
 griffin:['Grifo de Bifrost','Uma fera alada de outra mitologia encontrou abrigo nas torres do Pátio. Patrulha os portais e mergulha envolta em relâmpagos; o gelo rompe sua vantagem.'],
 chimera:['Quimera de Hel','Três vozes cruzaram os portões de Hel e passaram a habitar o mesmo corpo. A névoa venenosa denuncia sua presença antes que as garras alcancem o adversário.'],
 dragon:['Dragão de Muspelheim','As brasas do reino ígneo tingiram suas asas. Ataca do ar com fogo e garras; suas escamas resistem às chamas e cedem ao frio.'],
 sphinx:['Esfinge de Alfheim','Uma guardiã de enigmas de terras distantes aceitou vigiar as passagens luminosas de Alfheim. Sua couraça de pedra recompensa paciência e ataques bem escolhidos.'],
 valkyrie:['Coruja Valquíria de Asgard','Uma coruja de elmo dourado e asas claras guarda as provas mais altas do Pátio. Seu mergulho elétrico é anunciado antes de atingir o campo.'],
 harpy:['Harpia dos Ventos de Njord','Esta ave de rapina atravessou as correntes de Bifrost e fez dos ventos do norte seu território. Seus orbes frios punem perseguições; relâmpagos atravessam suas penas leves.'],
 phoenix:['Fênix de Muspelheim','Penas vermelhas e douradas circundam uma chama que veio de outro mundo pela ponte dos reinos. Lança esferas ígneas e teme o gelo. Esta fênix não ressuscita durante a prova.'],
 frostwyrm:['Serpente Alada de Niflheim','Escamas azuladas e uma cauda longa riscam a névoa gelada. Seus orbes frios atingem trajetos previsíveis; fogo encontra frestas em sua defesa.'],
 basilisk:['Basilisco de Nidhogg','Um réptil de crista verde se esconde entre as raízes feridas de Yggdrasil. Prefere emboscadas com veneno e evita as chamas que invadem seu abrigo.']
};
for(const [key,[name,description]]of Object.entries(NORDIC_BEASTS))Object.assign(MONSTERS[key],{name,description});

const SPECIAL_PROFILES={
 lion:{moveSpeed:3.8,attackInterval:1.55,accuracy:.9,evasion:.03,critChance:.08,critMultiplier:1.9},
 rhino:{moveSpeed:2.7,attackInterval:1.9,accuracy:.88,evasion:0,critChance:.1,critMultiplier:2.1},
 griffin:{moveSpeed:4.2,attackInterval:1.8,accuracy:.87,evasion:.12,critChance:.05,critMultiplier:1.7},
 chimera:{moveSpeed:2.8,attackInterval:1.7,accuracy:.9,evasion:.02,critChance:.05,critMultiplier:1.8},
 dragon:{moveSpeed:2.9,attackInterval:1.9,accuracy:.92,evasion:.01,critChance:.1,critMultiplier:2},
 sphinx:{moveSpeed:2.2,attackInterval:1.9,accuracy:.94,evasion:0,critChance:.04,critMultiplier:1.8},
 valkyrie:{moveSpeed:3.9,attackInterval:1.65,accuracy:.93,evasion:.09,critChance:.08,critMultiplier:1.9},
 harpy:{moveSpeed:4.6,attackInterval:1.7,accuracy:.82,evasion:.18,critChance:.03,critMultiplier:1.6},
 phoenix:{moveSpeed:4.1,attackInterval:1.7,accuracy:.88,evasion:.1,critChance:.07,critMultiplier:1.8},
 frostwyrm:{moveSpeed:3.1,attackInterval:1.9,accuracy:.9,evasion:.04,critChance:.06,critMultiplier:2},
 basilisk:{moveSpeed:2.8,attackInterval:1.8,accuracy:.9,evasion:.03,critChance:.04,critMultiplier:1.7}
};
for(const [key,profile]of Object.entries(SPECIAL_PROFILES))Object.assign(MONSTERS[key],profile,{preferredDropSkill:MONSTERS[key].skill});
Object.assign(MONSTERS,CUSTOM_HERO_BESTIARY);

// A creature's anatomy and element constrain every generated skill. Bosses
// gain variety within that identity; hero builds and acquired loot stay free.
export const MONSTER_SKILL_THEMES=Object.freeze(Object.fromEntries(Object.entries({
 lion:['battlecry','critical','rage','doubleattack','violentforce','dash','endurance','packaura','fenrirfang','weakeninghowl','freyjascat'],
 rhino:['hornrush','stonehide','stomp','bash','devotion','cleave','forcepush','shockwave','thorsjudgment'],
 griffin:['stormdive','chain','bolt','hurricane','endurance','evasion','odinsravens'],
 chimera:['venomcloud','poison','drain','vampiric','helguard','scarabs','weakeninghowl','manabreak'],
 dragon:['flamebreath','warlockfire','fireball','firesteps','auraflame','violentforce','critical','rage','cleave'],
 sphinx:['stonehide','bolt','shield','runicbarrier','spiritward','gravity','blink','swap','heal','brilliance','lifeaura','devotion','freyjasgrace'],
 valkyrie:['stormdive','chain','bolt','odinsravens','thorsjudgment','gungnir','devotion','brilliance','heal','avatar'],
 harpy:['warlockfrost','hurricane','forcepush','froststeps','multishot','bounce','evasion'],
 phoenix:['warlockfire','fireball','flamebreath','auraflame','firesteps','heal','freyjasgrace','lifeaura'],
 frostwyrm:['warlockfrost','frostnova','blizzard','icewall','icepulse','helsfrost','froststeps','manabreak'],
 basilisk:['venomcloud','poison','scarabs','weakeninghowl','drain','hook','thorns','spiritward'],
 goblin:['helguard','manabreak','drain','runicbarrier','spiritward','shield','critical'],
 duck:['hurricane','forcepush','multishot','bounce','endurance','evasion'],
 frog:['poison','venomcloud','hook','dash','evasion','doubleattack'],
 hare:['dash','evasion','endurance','doubleattack','critical','froststeps'],
 brute:['hornrush','stomp','stonehide','cleave','bash','rage','violentforce'],
 ram:['hornrush','bash','stomp','endurance','thorsgoats','critical'],
 bat:['drain','vampiric','weakeninghowl','evasion','critical','doubleattack'],
 tortoise:['stonehide','thorns','devotion','shield','runicbarrier','bash','lifeaura'],
 hedgehog:['thorns','bounce','critical','evasion','poison','doubleattack'],
 champion:['stomp','stonehide','cleave','bash','avatar','violentforce','rage','devotion'],
 wolf:['fenrirfang','summon','packaura','weakeninghowl','critical','endurance','doubleattack'],
 bonus:['dash','evasion','endurance','critical','doubleattack'],
 ...CUSTOM_HERO_SKILL_THEMES
}).map(([kind,skills])=>[kind,Object.freeze(skills)])));

// A boss can mix roles, but cannot fill every slot with stuns or self-sustain.
const CONTROL_SKILLS=new Set(['bolt','stomp','bash','stormdive','hornrush','forcepush','hook','gravity','warlockfire']);
const SUSTAIN_SKILLS=new Set(['heal','vampiric','drain','shield','avatar']);
const normalizeLevel=value=>Math.max(1,Number.isFinite(value)?Math.floor(value):1);
const unitRoll=value=>Math.max(0,Math.min(.999999999,Number.isFinite(value)?value:.5));

export function monsterLoadout(kind,level=1,boss=false,random){
 const actualLevel=normalizeLevel(level),rank=Math.max(1,Math.min(5,1+Math.floor((actualLevel-1)/10))),species=Object.hasOwn(MONSTERS,kind)?MONSTERS[kind]:null;
 const isBoss=boss===true||boss==='boss'||boss==='miniboss',rarity=isBoss?(boss==='miniboss'?'miniboss':'boss'):species?'special':'normal',skills=[];
 const count=isBoss?Math.min(5,1+Math.floor(actualLevel/15)):species?1:0;
 if(!count)return{level:actualLevel,rank,rarity,skills,skillLevels:{}};
 const roll=()=>unitRoll(typeof random==='function'?random():.5),theme=MONSTER_SKILL_THEMES[kind]||MONSTER_SKILL_THEMES.champion,all=theme.filter(key=>LOOT_SKILLS.includes(key)),primary=species?.skill;
 let controls=0,sustain=0;
 for(let i=0;i<count;i++){
  let pool=all.filter(key=>!skills.includes(key)&&(!controls||!CONTROL_SKILLS.has(key))&&(!sustain||!SUSTAIN_SKILLS.has(key)));
  if(!pool.length)break;
  let r=roll(),key;
  if(i===0&&primary&&pool.includes(primary))key=primary;
  if(!key)key=pool[Math.min(pool.length-1,Math.floor(r*pool.length))];
  skills.push(key);if(CONTROL_SKILLS.has(key))controls++;if(SUSTAIN_SKILLS.has(key))sustain++;
 }
 return{level:actualLevel,rank,rarity,skills,skillLevels:Object.fromEntries(skills.map(key=>[key,rank]))};
}

export function monsterKind(base,wave,roll,boss=false){
 const available=Object.keys(MONSTERS).filter(key=>wave>=MONSTERS[key].unlockWave),r=Math.max(0,Math.min(.999999,Number.isFinite(roll)?roll:0));
 if(!available.length)return base;
 if(boss){const mythic=available.filter(key=>MONSTERS[key].mythic),pool=mythic.length?mythic:available;return pool[Math.floor(r*pool.length)];}
 // Retain the existing fauna as the pool grows instead of replacing every wave.
 return r<.45?available[Math.min(available.length-1,Math.floor(r/.45*available.length))]:base;
}
