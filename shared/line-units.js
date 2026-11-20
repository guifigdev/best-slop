import {monsterReferenceName} from './monster-visual-references.js';
// Original northern monsters and fauna reinterpret Warcraft III unit roles. Numbers below
// are original Line Wars balance values, not extracted custom-map statistics.
const guide=(race,unit)=>`https://classic.battle.net/war3/${race}/units/${unit}.shtml`;
const unit=(name,kind,clan,reference,race,path,cost,income,hp,damage,armor,speed,interval,range,extra={})=>({name,kind,clan,reference,source:guide(race,path),cost,income,hp,damage,armor,speed,interval,range,lifeDamage:1,bounty:Math.max(6,Math.round(cost*.12)),size:1,accuracy:.92,evasion:0,critChance:0,critMultiplier:1.5,flying:false,altitude:0,skills:[],...extra});

export const LINE_UNITS={
 shieldling:unit('Draugr escudeiro','goblin','Clã do Sol','Footman','human','footman',50,3,125,9,2,2.7,1.35,1.4,{size:.78,role:'Infantaria de escudo · resistente e acessível'}),
 quillshot:unit('Ouriço do fiorde','hedgehog','Clã do Sol','Rifleman','human','rifleman',80,4,105,14,0,2.6,1.7,6.5,{size:.85,role:'Disparo longo · apoia a linha de frente'}),
 oathhorn:unit('Rinoceronte juramentado','rhino','Clã do Sol','Knight','human','knight',250,11,490,24,5,3.5,1.5,1.5,{size:1.35,lifeDamage:2,skills:['bash'],role:'Cavalaria pesada · interrompe o defensor'}),
 stormgriffin:unit('Grifo de Skadi','griffin','Clã do Sol','Gryphon Rider','human','gryphonrider',500,20,670,38,3,2.6,1.9,5.5,{size:1.3,flying:true,altitude:1.5,element:'lightning',skills:['chain'],lifeDamage:3,role:'Voador elétrico · relâmpagos em cadeia'}),
 boarguard:unit('Jotun da muralha','brute','Clã da Brasa','Grunt','orc','grunt',80,5,240,16,1,2.5,1.6,1.5,{size:1.16,skills:['rage'],role:'Infantaria robusta · fúria de batalha'}),
 marshspear:unit('Sapo arpoador','frog','Clã da Brasa','Troll Headhunter','orc','headhunters',80,4,115,14,0,2.8,1.6,5.5,{size:.85,skills:['poison'],role:'Arremesso à distância · veneno persistente'}),
 frostcharger:unit('Sátiro saqueador','ram','Clã da Brasa','Raider','orc','raider',170,8,280,19,2,4.1,1.35,1.5,{size:1.05,critChance:.08,skills:['critical'],role:'Corredor veloz · ameaça brechas e críticos'}),
 runebull:unit('Leão dos monólitos','lion','Clã da Brasa','Tauren','orc','tauren',360,15,700,29,4,2.3,1.8,1.7,{size:1.5,skills:['stomp'],lifeDamage:3,role:'Colosso terrestre · pisada atordoante'}),
 moonhare:unit('Lebre das auroras','hare','Clã da Lua','Archer','nightelf','archer',45,3,90,13,0,3.2,1.4,6,{size:.78,evasion:.05,role:'Arqueira leve · alcance e mobilidade'}),
 moonhunter:unit('Lince da lua crescente','lynx','Clã da Lua','Huntress','nightelf','huntress',150,7,290,17,1,3.7,1.5,4.8,{size:.95,skills:['bounce'],role:'Caçadora ágil · glaives ricocheteantes'}),
 runedryad:unit('Basilisco dos bosques','basilisk','Clã da Lua','Dryad','nightelf','dryad',200,9,220,20,2,3.2,1.5,6,{size:.95,skills:['poison'],role:'Guarda do bosque · projéteis envenenados'}),
 aurorachimera:unit('Quimera da aurora','chimera','Clã da Lua','Chimaera','nightelf','chimaera',600,25,820,40,4,2.4,1.9,6,{size:1.5,flying:true,altitude:1.7,skills:['venomcloud'],lifeDamage:4,role:'Voador de cerco · nuvem venenosa'}),
 mistwolf:unit('Lobo da névoa','wolf','Clã da Névoa','Ghoul','undead','ghoul',40,3,115,10,0,3.3,.95,1.3,{size:.85,skills:['vampiric'],role:'Atacante rápido · recupera vida ao morder'}),
 cryptbasilisk:unit('Basilisco das runas','basilisk','Clã da Névoa','Crypt Fiend','undead','cryptfiend',120,6,255,20,2,2.4,1.75,6,{size:1.05,skills:['poison'],element:'poison',role:'Atirador das criptas · dardos envenenados'}),
 mosscolossus:unit('Tartaruga dos túmulos','tortoise','Clã da Névoa','Abomination','undead','abomination',320,14,600,25,3,2.2,1.85,1.7,{size:1.5,skills:['thorns'],lifeDamage:2,role:'Tanque de espinhos · devolve golpes corpo a corpo'}),
 winterwyrm:unit('Serpente da longa noite','frostwyrm','Clã da Névoa','Frost Wyrm','undead','frostwyrm',750,30,1150,48,6,2.1,2,6,{size:1.65,flying:true,altitude:1.8,element:'ice',skills:['warlockfrost'],lifeDamage:5,role:'Voador de elite · gelo e dano alto ao portal'})
};

// The same priced recipes use the shared creature sculptures; their stats,
// attack types, native reference roles and counters remain defined above.
for(const [key,visual]of Object.entries({quillshot:'archerskeleton',boarguard:'golem',frostcharger:'scorpion',runebull:'elderwillow',runedryad:'mandragora',mistwolf:'whisper',cryptbasilisk:'scorpion',mosscolossus:'golem',winterwyrm:'gazeti'}))Object.assign(LINE_UNITS[key],{ragnarokVisual:visual,name:monsterReferenceName(visual,LINE_UNITS[key].name)});

export const LINE_UNIT_ORDER=Object.keys(LINE_UNITS);
export const LINE_START_LIVES=30;
export const LINE_START_INCOME=20;
export const LINE_INCOME_INTERVAL=10;
export const LINE_MAX_POPULATION=32;
export const LINE_LANE_SPACING=52;
export const LINE_LANE_HALF=16;
export const LINE_START_Z=-12;
export const LINE_PORTAL_Z=12;
