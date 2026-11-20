import {monsterReferenceName} from './monster-visual-references.js';
export const DUNGEON_RULES=Object.freeze({partyMax:4,teamsMax:4,cellSize:1.5,width:133,bounds:99.75,roomStride:44,corridorRadius:2,roomWaveSize:24,maxActiveEnemies:128,equipmentDropChance:.08,fragmentDropChance:.05,goldDropChance:.25,interactionRange:2.6,reviveRange:2.8,reviveSeconds:3,exitGatherRange:5,exitVoteSeconds:45,intermissionSeconds:7,clashSeconds:150});
export const DUNGEON_BIOMES=Object.freeze({
 forest:{name:'Raízes de Yggdrasil',floor:0x8d9a70,path:0xa9a17b,wall:0x59694e,trim:0xb7c099,glow:0xc4df9e,sky:0x596c59,expandedEnemies:['rat','spider','spore','mandragora','willow','snake','archer'],enemies:['rat','spider','snake','archer'],boss:'broodmother'},
 cavern:{name:'Grutas de Nidavellir',floor:0x857a69,path:0xa59478,wall:0x514d48,trim:0xa6a294,glow:0xc4ac7c,sky:0x464843,expandedEnemies:['scarab','andre','scorpion','spider','cavebat','hode','golem'],enemies:['scarab','spider','cavebat','worm'],boss:'worm'},
 crypt:{name:'Cripta dos Einherjar',floor:0x888b86,path:0x9b9989,wall:0x575e62,trim:0xb7b8a5,glow:0x9fd1cc,sky:0x555e60,expandedEnemies:['mummy','archer','whisper','guardian','stonebeast'],enemies:['guardian','archer','cavebat','stonebeast'],boss:'guardian'},
 frost:{name:'Galerias de Niflheim',floor:0xb6c9c8,path:0x8dabae,wall:0x69848d,trim:0xdce4cf,glow:0xb5e9ed,sky:0x718b96,expandedEnemies:['siroma','slime','gazeti','scarab','guardian'],enemies:['slime','scarab','cavebat','guardian'],boss:'stonebeast'},
 forge:{name:'Fornalha de Muspelheim',floor:0x9e795b,path:0xb5966f,wall:0x635550,trim:0xd0ad7b,glow:0xf1bd72,sky:0x745a50,expandedEnemies:['firemage','elderwillow','scorpion','stonebeast','scarab'],enemies:['firemage','scarab','snake','stonebeast'],boss:'stonebeast'},
 void:{name:'Fendas de Ginnungagap',floor:0x8f819f,path:0xa995a7,wall:0x554d68,trim:0xc9b6cd,glow:0xe0c0ee,sky:0x5c526a,expandedEnemies:['worm','whisper','firemage','slime','golem'],enemies:['worm','firemage','cavebat','slime'],boss:'worm'}
});
export const DUNGEON_RARITIES=Object.freeze({common:{name:'Comum',color:'#c5cfb4'},rare:{name:'Raro',color:'#9cced9'},epic:{name:'Épico',color:'#c4a0da'},legendary:{name:'Lendário',color:'#edc26c'}});
export const DUNGEON_OBJECT_NAMES=Object.freeze({portal:'Escadaria para o próximo andar',chest:'Cofre dos viajantes',merchant:'Mercador oculto',shrine:'Santuário de Eir',equipment:'Equipamento',fragment:'Fragmento de técnica',gold:'Bolsa de ouro',corpse:'Companheiro caído',key:'Chave do cofre',prop:'Objeto quebrável'});

// Combat archetypes are local. Direct Ragnarok visual reconstructions and
// names are separately identified in monster-visual-references.js.
export const DUNGEON_DESIGN_REFERENCES=Object.freeze([
 {url:'https://roc.gnjoy.in.th/event/update-new-dungeon/',purpose:'Official dungeon bestiary demonstrates spider/boss and elemental monster variety; no stats or art copied.'},
 {url:'https://ro.gnjoy.in.th/landingpage/limitbreak-lv260%26NewDungeons/newDungeon/index.html',purpose:'Official underground cavern and elemental dungeon theme reference.'}
]);
const baseSpecies={
 rat:{name:'Rato das raízes',hp:.65,damage:.75,speed:4.1,interval:1.05,size:.65,radius:.3,behavior:'skitter'},
 spider:{name:'Aranha tecelã',hp:.9,damage:1,speed:3.3,interval:1.35,size:1,radius:.55,behavior:'web'},
 scarab:{name:'Escaravelho de bronze',hp:1.35,damage:1.15,speed:2.7,interval:1.7,size:1.05,radius:.6,armor:3,behavior:'shell'},
 cavebat:{name:'Morcego das galerias',hp:.7,damage:.9,speed:4.3,interval:1.3,size:.8,radius:.38,flying:true,behavior:'swoop'},
 snake:{name:'Serpente de seiva negra',hp:1,damage:1,speed:3.4,interval:1.6,size:1.1,radius:.48,behavior:'venom'},
 worm:{name:'Verme das profundezas',hp:3.5,damage:1.6,speed:2.5,interval:2,size:2.2,radius:1.05,behavior:'burrow'},
 slime:{name:'Gosma rúnica',hp:1.2,damage:.9,speed:2.3,interval:1.9,size:1.05,radius:.55,behavior:'slime'},
 archer:{name:'Arqueiro dos túmulos',hp:.95,damage:1.25,speed:2.7,interval:2.1,size:1,radius:.43,range:12,behavior:'volley',projectile:'arrow'},
 firemage:{name:'Cultista das brasas',hp:1.1,damage:1.15,speed:2.5,interval:2.2,size:1,radius:.45,range:10,element:'fire',behavior:'fireball',projectile:'fireball'},
 guardian:{name:'Guardião das runas',hp:2.6,damage:1.3,speed:2.65,interval:1.8,size:1.25,radius:.65,armor:4,behavior:'slam'},
 stonebeast:{name:'Fera de granito',hp:2.5,damage:1.5,speed:2.5,interval:2,size:1.65,radius:.85,armor:5,behavior:'charge'},
 broodmother:{name:'Matriarca das teias',hp:3.7,damage:1.4,speed:2.8,interval:1.7,size:2.1,radius:1.1,behavior:'brood'}
};

// New visual species inherit an existing role's combat budget. The first
// teaching chamber retains its original roster; later rooms use these variants.
const variant=(parent,key,extra={})=>Object.freeze({...baseSpecies[parent],name:monsterReferenceName(key,key),...extra});
export const DUNGEON_SPECIES=Object.freeze({...baseSpecies,
 spore:variant('snake','spore',{element:'poison',size:.95}),
 mandragora:variant('archer','mandragora',{element:'poison',projectile:'poison',speed:0}),
 willow:variant('guardian','willow'),elderwillow:variant('firemage','elderwillow'),
 scorpion:variant('snake','scorpion',{element:'poison'}),andre:variant('scarab','andre'),
 hode:variant('worm','hode'),golem:variant('guardian','golem'),
 mummy:variant('rat','mummy',{size:1,speed:2.2}),whisper:variant('cavebat','whisper'),
 siroma:variant('slime','siroma'),gazeti:variant('archer','gazeti',{element:'ice',projectile:'frost',flying:true}),
});
