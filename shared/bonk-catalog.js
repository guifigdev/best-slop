import {buildRoEncounter,roStageSpecies,RO_STAGE_HABITATS} from './ro-encounters.js';
import {RO_SKILLS} from './ragnarok-jobs.js';
import {RO_ENCHANTMENTS} from './ro-equipment-enchants.js';
// Original Nordic survivor content. Mechanics take inspiration from automatic
// attack roguelikes; local balance and maps share the voxel bestiary.
export const BONK_REFERENCE='https://store.steampowered.com/app/3405340/Megabonk/';
export const BONK_RULES=Object.freeze({interactRange:8,weaponSlots:12,enchantTypesPerItem:3,maxWeaponLevel:8,maxTomeLevel:8,aliveBudget:280,pickupBudget:420,projectileBudget:220,stageSize:230});
const weapon=(key,name,skill,description,damage,cooldown,range,extra={})=>Object.freeze({key,name,skill,description,damage,cooldown,range,...extra});
export const BONK_WEAPONS=Object.freeze({...RO_SKILLS,
 runeblade:weapon('runeblade','Lâmina das runas','cleave','Golpes largos à frente. Evoluções ampliam o arco e atravessam grupos.',22,.85,5,{kind:'slash',element:'physical'}),
 ember:weapon('ember','Coração da forja','fireball','Orbes de fogo explodem em área e deixam queimadura.',16,1.25,24,{kind:'projectile',element:'fire',radius:2.7,speed:16}),
 frost:weapon('frost','Agulhas de Niflheim','frostbolt','Fragmentos de gelo perfuram e desaceleram os inimigos.',17,1.1,25,{kind:'projectile',element:'ice',pierce:2,speed:21}),
 storm:weapon('storm','Corrente de Thor','bolt','Relâmpagos saltam entre inimigos próximos.',15,1.6,19,{kind:'chain',element:'lightning'}),
 orbit:weapon('orbit','Escudos de Midgard','thorns','Escudos orbitais atingem quem se aproxima, mesmo durante a fuga.',11,.65,4.4,{kind:'orbit',element:'physical'}),
 thorns:weapon('thorns','Jardim de espinhos','multishot','Rajadas de espinhos espalham veneno e multiplicam projéteis.',13,1.05,24,{kind:'projectile',element:'poison',speed:23}),
 axe:weapon('axe','Machado de retorno','whirlwind','Machados pesados atravessam a horda e voltam ao herói.',24,1.8,20,{kind:'projectile',element:'physical',pierce:5,speed:15,returning:true}),
 void:weapon('void','Sino do vazio','shockwave','Uma onda circular empurra e fere todos ao redor.',35,3.2,8.5,{kind:'pulse',element:'arcane'})
});
// Deprecated export retained for old checkpoints and icon/name consumers.
export const BONK_TOMES=RO_ENCHANTMENTS;
const relic=(key,name,skill,description,rarity)=>Object.freeze({key,name,skill,description,rarity});
export const BONK_RELICS=Object.freeze({
 emberseed:relic('emberseed','Semente incandescente','fireball','Queimaduras duram mais e inimigos queimando podem explodir.','rare'),
 frozenheart:relic('frozenheart','Coração de geada','frostnova','Golpes contra inimigos lentos causam +18% de dano por cópia.','rare'),
 thundercoin:relic('thundercoin','Moeda da tempestade','bolt','Críticos têm chance de disparar uma corrente elétrica.','epic'),
 bloodpetal:relic('bloodpetal','Pétala rubra','vampiric','A cada 12 eliminações, recupere vida.','common'),
 luckybell:relic('luckybell','Guizo de Hugin','critical','+10% de ouro por cópia.','common'),
 giantbone:relic('giantbone','Osso de gigante','avatar','+10% de área e +8% de vida máxima por cópia.','rare'),
 glassrune:relic('glassrune','Runa de vidro','rage','+22% de dano e -8 de vida máxima por cópia.','epic'),
 travelersboots:relic('travelersboots','Botas do caminho','sprint','+5% de velocidade de movimento.','rare'),
 silvermirror:relic('silvermirror','Espelho de prata','mirror','+1 projétil por cópia nas armas compatíveis.','epic'),
 thorncrown:relic('thorncrown','Coroa de espinhos','thorns','Ao sofrer dano, emita espinhos em área.','common'),
 scholar:relic('scholar','Pergaminho do erudito','brilliance','+12% de experiência e +1 regeneração por cópia.','common'),
 ironacorn:relic('ironacorn','Bolota de ferro','devotion','+2 de armadura por cópia.','common')
});
const STAGE_DEFINITIONS={
 sands:{key:'sands',name:'Dunas de Morroc',biome:'cavern',description:'Dunas, cactos, poços e ruínas de arenito entre escorpiões e criaturas do deserto.',floor:0xc2a772,path:0xd1ba86,wall:0x9c8058,accent:0xf0d2a0,enemySpecies:[],guardian:'golem',boss:'phreeoni'},
 coast:{key:'coast',name:'Grutas de Izlude',biome:'cavern',description:'Grutas costeiras, poças rasas, corais e destroços habitados por criaturas aquáticas.',floor:0x6e9a91,path:0xb3ad88,wall:0x697d79,accent:0xa4e2dc,enemySpecies:[],guardian:'merman',boss:'drake'},

 payon:{key:'payon',name:'Cavernas de Payon',biome:'cavern',description:'Portais orientais, lanternas, túmulos e galerias de pedra.',floor:0x716b66,path:0x9d8a72,wall:0x665754,accent:0xf6bd84,enemySpecies:[],guardian:'stonebeast',boss:'guardian'},
 crypt:{key:'crypt',name:'Glast Heim',biome:'crypt',description:'Arcos góticos, cemitérios e ruínas tomadas pelos mortos.',floor:0x585d61,path:0x898274,wall:0x41494e,accent:0xadbbd6,enemySpecies:[],guardian:'guardian',boss:'guardian'},
 geffen:{key:'geffen',name:'Torre de Geffen',biome:'void',description:'Obeliscos arcanos, cristais violetas e bibliotecas em ruínas.',floor:0x5f587b,path:0x9690ac,wall:0x45405c,accent:0xc3abfa,enemySpecies:[],guardian:'firemage',boss:'guardian'},

 grove:{key:'grove',name:'Campos de Prontera',biome:'forest',description:'Ruínas entre raízes gigantes, pontes de pedra e clareiras elevadas.',floor:0x628747,path:0xa99e71,wall:0x69735d,accent:0xb5d689,enemySpecies:[],guardian:'stonebeast',boss:'guardian'},
 forge:{key:'forge',name:'Vulcão de Thor',biome:'forge',description:'Anéis de basalto, canais de lava, forjas antigas e rampas largas.',floor:0x6e4637,path:0xa57653,wall:0x493b39,accent:0xffbb68,enemySpecies:[],guardian:'firemage',boss:'worm'},
 glacier:{key:'glacier',name:'Caverna de Gelo',biome:'frost',description:'Lagos congelados, pilares de cristal e santuários na neve.',floor:0xa9c8cc,path:0x809da9,wall:0x668795,accent:0xd8f5ed,enemySpecies:[],guardian:'guardian',boss:'stonebeast'}
};
export const BONK_STAGES=Object.freeze(Object.fromEntries(Object.entries(STAGE_DEFINITIONS).map(([key,d])=>{const e=buildRoEncounter(key,1,3);return[key,Object.freeze({...d,habitats:RO_STAGE_HABITATS[key],enemySpecies:Object.freeze(roStageSpecies(key)),guardian:e.guardians[0],boss:e.boss})];})));
export const BONK_BUILD_EXAMPLES=Object.freeze([
 {name:'Tempestade de agulhas',weapons:['frost','thorns','storm','orbit'],tomes:['amount','haste','crit','magnet'],relics:['frozenheart','thundercoin','silvermirror']},
 {name:'Sol da forja',weapons:['ember','void','runeblade','orbit'],tomes:['damage','area','vitality','haste'],relics:['emberseed','giantbone','bloodpetal']},
 {name:'Peregrino de vidro',weapons:['axe','thorns','storm','void'],tomes:['speed','crit','damage','amount'],relics:['glassrune','travelersboots','luckybell']}
]);
