import {monsterReferenceName} from './monster-visual-references.js';

// Local wave roles, not imported Ragnarok statistics. Prefixes keep these
// challengers separate from Castle Fight and Line Wars unit identifiers.
const roles=Object.freeze({
 swarm:{size:.82,hpMultiplier:.85,damageMultiplier:.8,armorBonus:0,moveSpeed:3.2,attackInterval:1.55,accuracy:.84,evasion:.04,critChance:.02,critMultiplier:1.6},
 skirmisher:{size:.95,hpMultiplier:.95,damageMultiplier:.9,armorBonus:0,moveSpeed:3.6,attackInterval:1.45,accuracy:.87,evasion:.04,critChance:.04,critMultiplier:1.7},
 ranged:{size:.95,hpMultiplier:.9,damageMultiplier:.7,armorBonus:0,moveSpeed:2.8,attackInterval:1.9,accuracy:.87,evasion:.02,critChance:.03,critMultiplier:1.7,range:6.5},
 heavy:{size:1.3,hpMultiplier:1.35,damageMultiplier:1,armorBonus:3,moveSpeed:2.25,attackInterval:1.95,accuracy:.9,evasion:0,critChance:.04,critMultiplier:1.8},
 caster:{size:1,hpMultiplier:1,damageMultiplier:.7,armorBonus:0,moveSpeed:2.7,attackInterval:1.95,accuracy:.88,evasion:.02,critChance:.03,critMultiplier:1.7,range:5},
 flyer:{size:.95,hpMultiplier:1,damageMultiplier:.65,armorBonus:0,moveSpeed:3.8,attackInterval:1.8,accuracy:.85,evasion:.08,critChance:.03,critMultiplier:1.7,range:4,flying:true,altitude:1.3},
});
const definitions=[
 ['poring','Porim',2,'heal','swarm','Uma gota rosada que se recompõe quando ferida.',{color:0xec8791,hpMultiplier:.8,damageMultiplier:.75,moveSpeed:2.5}],
 ['thiefbug','Besouro Saqueador',3,'evasion','skirmisher','Um inseto de carapaça lisa que evita parte dos golpes.',{color:0x80616e,armorBonus:1}],
 ['tarou','Taruk',4,'doubleattack','swarm','Um roedor eriçado que morde em ataques rápidos.',{color:0xe9dcd1,moveSpeed:4.1,attackInterval:1.3}],
 ['andre','Formiga Escavadora',4,'doubleattack','swarm','Suas mandíbulas dão pequenas mordidas em sequência.',{color:0xe9d4ad,armorBonus:1}],
 ['spore','Esporo Saltitante',5,'venomcloud','swarm','Um cogumelo ambulante que espalha uma nuvem de esporos tóxicos.',{color:0xc76d65}],
 ['mandragora','Mandrágora Selvagem',6,'poison','ranged','Uma raiz viva arremessa espinhos envenenados.',{color:0x8baf64,element:'poison',preferredProjectile:'poison'}],
 ['willow','Salgueiro Andante',7,'bash','heavy','Um tronco oco usa os braços de madeira para atordoar.',{color:0x98725e,hpMultiplier:1.15,damageMultiplier:.9,size:1.05,armorBonus:1}],
 ['archerskeleton','Arqueiro Ossífero',8,'multishot','ranged','Um arqueiro de ossos dispara várias flechas num leque.',{color:0xc8ac87,preferredProjectile:'arrow'}],
 ['mummy','Múmia Errante',8,'bash','skirmisher','Um morto envolto em faixas dá golpes pesados e lentos.',{color:0xc8b58f,moveSpeed:2.6,attackInterval:1.8}],
 ['scorpion','Escorpião de Cobre',8,'poison','skirmisher','As pinças seguram a presa enquanto o ferrão aplica veneno.',{color:0xd68b51,armorBonus:1}],
 ['familiar','Morcego do Véu',9,'vampiric','flyer','Um morcego lilás recupera um pouco de vida ao atacar.',{color:0x8b789f,range:1.6,moveSpeed:4.1,size:.8}],
 ['marin','Marim Boreal',10,'warlockfrost','caster','Uma gota gelada lança um orbe de frio anunciado.',{color:0x6eb7de,element:'ice',size:.9}],
 ['siroma','Siro Glacial',11,'frostnova','skirmisher','Uma criatura de neve libera um sopro gelado ao redor do corpo.',{color:0xd4d3ee,element:'ice',damageMultiplier:.8,resistances:{ice:.15,fire:-.15}}],
 ['hode','Verme das Dunas',12,'shockwave','heavy','Um verme surge da areia e rompe o chão com uma onda frontal.',{color:0xbb929e,size:1.2,armorBonus:1}],
 ['elderwillow','Salgueiro das Brasas',13,'warlockfire','caster','Um tronco chamuscado lança brasas a distância.',{color:0xb96a56,element:'fire',resistances:{fire:.15,ice:-.15}}],
 ['golem','Golem de Basalto',16,'stonehide','heavy','Pedras empilhadas formam uma criatura lenta de couraça resistente.',{color:0xb2916f,mythic:true,armorBonus:4}],
 ['whisper','Sussurro Errante',16,'drain','flyer','Um espírito esbranquiçado drena a vitalidade de quem se aproxima.',{color:0xe7d8d4,range:4.5,element:'dark',hpMultiplier:.9}],
 ['gazeti','Olho Glacial',19,'warlockfrost','flyer','Um olho preso em cristal lança estilhaços gelados a distância.',{color:0x90b7d9,element:'ice',range:6,resistances:{ice:.2,fire:-.15}}],
 ['salamander','Salamandra Incandescente',20,'flamebreath','heavy','Um réptil de couraça vermelha sopra fogo à sua frente.',{color:0xb94726,size:1.2,hpMultiplier:1.2,damageMultiplier:.85,element:'fire',resistances:{fire:.2,ice:-.2},mythic:true}],
 ['kasa','Asa de Brasa',22,'warlockfire','flyer','Uma criatura alada de fogo dispara esferas incandescentes.',{color:0xe74916,element:'fire',resistances:{fire:.2,ice:-.2},mythic:true}],
 ['icetitan','Colosso da Geada',25,'frostnova','heavy','Um colosso de cristais lilases congela a área ao seu redor.',{color:0x9a8eb2,size:1.4,hpMultiplier:1.45,damageMultiplier:.9,element:'ice',resistances:{ice:.2,fire:-.2},mythic:true}],
];
export const CUSTOM_HERO_BESTIARY=Object.freeze(Object.fromEntries(definitions.map(([visual,fallback,unlockWave,skill,role,description,extra])=>[
 'ro_'+visual,Object.freeze({name:monsterReferenceName(visual,fallback),description,...roles[role],flying:false,altitude:0,...(roles[role].flying?{flying:true,altitude:roles[role].altitude}:{}),...extra,skill,unlockWave,ragnarokVisual:visual,preferredDropSkill:skill})
])));
export const CUSTOM_HERO_COMMON_VISUALS=Object.freeze({goblin:'mummy',duck:'spore',frog:'poring',hare:'tarou',bat:'familiar',tortoise:'golem',hedgehog:'siroma',brute:'willow',ram:'scorpion',champion:'golem'});
const pools={
 poring:['heal','lifeaura','evasion','doubleattack','endurance'],
 thiefbug:['evasion','doubleattack','critical','stonehide','endurance'],
 tarou:['doubleattack','critical','evasion','endurance','dash'],
 andre:['doubleattack','critical','stonehide','endurance','bash'],
 spore:['venomcloud','poison','thorns','evasion','lifeaura'],
 mandragora:['poison','venomcloud','thorns','multishot','hook'],
 willow:['bash','stonehide','cleave','devotion','stomp'],
 archerskeleton:['multishot','bounce','critical','poison','doubleattack'],
 mummy:['bash','drain','vampiric','stonehide','manabreak'],
 scorpion:['poison','venomcloud','critical','doubleattack','evasion'],
 familiar:['vampiric','drain','evasion','doubleattack','weakeninghowl'],
 marin:['warlockfrost','frostnova','icepulse','froststeps','evasion'],
 siroma:['frostnova','warlockfrost','icepulse','froststeps','endurance'],
 hode:['shockwave','hornrush','stonehide','bash','stomp'],
 elderwillow:['warlockfire','fireball','auraflame','firesteps','flamebreath'],
 golem:['stonehide','devotion','stomp','cleave','bash','thorns'],
 whisper:['drain','vampiric','evasion','manabreak','weakeninghowl'],
 gazeti:['warlockfrost','frostnova','icepulse','helsfrost','multishot'],
 salamander:['flamebreath','warlockfire','firesteps','auraflame','critical'],
 kasa:['warlockfire','fireball','flamebreath','auraflame','firesteps'],
 icetitan:['frostnova','icepulse','warlockfrost','helsfrost','stonehide','stomp'],
};
export const CUSTOM_HERO_SKILL_THEMES=Object.freeze(Object.fromEntries(Object.entries(pools).map(([visual,skills])=>['ro_'+visual,Object.freeze(skills)])));
