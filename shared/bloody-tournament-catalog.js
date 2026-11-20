import {BLOODY_BATTLEFIELD,bloodyPreparationPlot} from './bloody-battlefield.js';
import {CASTLE_UNITS} from './castle-catalog.js';

export const BLOODY_REFERENCE=Object.freeze({
 requestedVideo:'https://www.youtube.com/watch?v=QdDI60ckoxo',
 mechanicsSource:'https://github.com/Jaccouille/wc3-blood-tournament',
 terrainSource:BLOODY_BATTLEFIELD.source.source,
 title:'Star Wars Blood Tournament 6.4d',
 verified:'Native W3E terrain, WPM pathability, doodad positions, eight private color plots and eight battlefield fronts extracted from the map.',
 adaptation:'Original elemental voxel art. Four square outer duels connect to a central arena by corridors, following the requested tournament flow. Expanded gardens, obstacles, realm armies, economy and seven-round rules are browser adaptations; five-versus-five adds two preparation gardens.'
});
export const BLOODY_RULES=Object.freeze({rounds:7,preparationTime:45,battleTime:240,resultTime:8,startingGold:420,roundGold:180,catchupGold:60,startingBlood:0,maxRank:3,killBloodCap:120,unitScale:1.55});
export const BLOODY_MAP=BLOODY_BATTLEFIELD.map;
const unit=(key,name,source,count,cost,food,category,description,extra={})=>Object.freeze({key,name,source,count,cost,food,category,description,...extra});
export const BLOODY_REALMS=Object.freeze({
 stone:{name:'Reino da Pedra',color:'#bcb7a8',description:'Colossos de mármore, guardas de basalto e artilharia de obsidiana.'},
 forest:{name:'Reino Silvestre',color:'#a6c685',description:'Ents, druidas, arqueiras e animais da floresta ancestral.'},
 fire:{name:'Reino da Fornalha',color:'#ef9b5f',description:'Salamandras, impes, dracos e uma serpe nascida na lava.'},
 frost:{name:'Reino da Geada',color:'#a2dce6',description:'Caçadores boreais, conjuradores de gelo e espíritos de Niflheim.'}
});
export const BLOODY_UNITS=Object.freeze({
 shieldwall:unit('shieldwall','Guardas de Basalto','hfoo',3,65,3,'frontline','Três sentinelas de pedra com escudos largos. Protegem a linha de trás e combatem no chão.',{theme:'stone',visualKey:'shieldwall'}),
 einherjar:unit('einherjar','Colosso de Mármore','h03B',1,115,3,'frontline','Uma escultura guerreira desperta. Rompe a linha de frente com espada e escudo.',{theme:'stone',visualKey:'einherjar'}),
 berserkers:unit('berserkers','Salamandras de Muspelheim','n00V',2,110,4,'frontline','Duas feras ígneas de garras e chifres. Pressionam as formações terrestres.',{theme:'fire',visualKey:'berserkers',element:'fire'}),
 hunters:unit('hunters','Arqueiras Silvestres','n022',3,95,3,'ranged','Três guardiãs de folhas e madeira. Flechas contra inimigos terrestres e voadores.',{theme:'forest',visualKey:'hunters'}),
 sniper:unit('sniper','Impes da Brasa','hrif',2,115,4,'ranged','Dois pequenos demônios de carvão arremessam brasas de longe.',{theme:'fire',visualKey:'sniper',element:'fire',projectileKind:'fire'}),
 marksman:unit('marksman','Caçador Boreal','h05C',1,165,4,'ranged','Um arqueiro de gelo de alcance extremo, vulnerável quando cercado.',{theme:'frost',visualKey:'marksman',element:'ice',projectileKind:'frost'}),
 druids:unit('druids','Ents de Yggdrasil','e007',2,140,4,'magic','Duas árvores antigas despertas lançam sementes arcanas contra armaduras pesadas.',{theme:'forest',visualKey:'druids',projectileKind:'thorn'}),
 shamans:unit('shamans','Bruxos da Geada','o003',2,145,4,'magic','Dois conjuradores de cristal lançam magia glacial contra a linha de frente.',{theme:'frost',visualKey:'shamans',element:'ice',projectileKind:'frost'}),
 healer:unit('healer','Druidas do Broto','n015',2,155,4,'support','Dois druidas restauram a vida do aliado ferido mais próximo a cada quatro segundos.',{heal:55,healRange:7,theme:'forest',visualKey:'healer',projectileKind:'thorn'}),
 wolves:unit('wolves','Lobos de Musgo','n017',3,105,3,'frontline','Três lobos cobertos de folhas flanqueiam o inimigo e perseguem seus atiradores.',{speedBonus:.4,theme:'forest',visualKey:'wolves'}),
 golem:unit('golem','Guardião de Granito','n01X',1,160,4,'frontline','Um grande golem de rocha estratificada absorve ataques físicos.',{theme:'stone',visualKey:'golem'}),
 mortar:unit('mortar','Catapulta de Obsidiana','hmtm',1,180,5,'siege','Um engenho de pedra. Cada rocha também atinge inimigos próximos, sem ferir aliados.',{splash:1.7,theme:'stone',visualKey:'mortar',projectileKind:'siege'}),
 aircraft:unit('aircraft','Dracos da Fornalha','h06Q',2,170,5,'flying','Dois dracos de lava voam acima do campo e exigem ataques antiaéreos.',{theme:'fire',visualKey:'aircraft',element:'fire',projectileKind:'fire'}),
 valkyrie:unit('valkyrie','Fênix de Gelo','h016',1,160,4,'flying','Uma ave de cristal alada com ataque mágico. Exige antiaéreo para ser abatida.',{theme:'frost',visualKey:'valkyrie',element:'ice',projectileKind:'frost'}),
 hydra:unit('hydra','Serpe Vulcânica','n01P',1,280,7,'siege','Uma fera reptiliana coberta de placas incandescentes, de grande corpo e muito dano.',{theme:'fire',visualKey:'hydra',element:'fire',projectileKind:'fire'}),
 wraiths:unit('wraiths','Espectros de Niflheim','u001',2,170,5,'magic','Dois espíritos de gelo flutuantes resistem à magia, mas são frágeis contra ataques físicos.',{theme:'frost',visualKey:'wraiths',element:'ice',projectileKind:'frost'})
});

export const BLOODY_CATEGORIES=Object.freeze({frontline:'Linha de frente',ranged:'Atiradores',magic:'Magia',support:'Apoio',flying:'Voadores',siege:'Cerco'});
export function bloodyUnitAt(key,rank=1){
 const definition=typeof key==='string'&&Object.hasOwn(BLOODY_UNITS,key)?BLOODY_UNITS[key]:null;if(!definition)return null;
 const n=Math.max(1,Math.min(BLOODY_RULES.maxRank,Math.floor(Number(rank)||1))),source=CASTLE_UNITS[definition.source];
 return{...definition,rank:n,hp:Math.round(source.hp*(1+(n-1)*.3)),damage:source.damage*(1+(n-1)*.25),armor:source.armor+(n-1)*2,range:source.range<1?source.range:source.range*BLOODY_RULES.unitScale+1.2,speed:source.speed*BLOODY_RULES.unitScale+(definition.speedBonus||0),interval:source.interval,attackType:source.attackType,armorType:source.armorType,flying:!!source.flying,size:source.size||1,weapons:source.weapons.map(w=>({...w,damage:w.damage*(1+(n-1)*.25),range:w.range<1?w.range:w.range*BLOODY_RULES.unitScale+1.2}))};
}
export function bloodyUpgradePrice(entry){return{gold:Math.round((BLOODY_UNITS[entry?.key]?.cost||0)*(.7+(entry?.rank||1)*.15)),blood:20*(entry?.rank||1)};}
export function bloodyRosterFood(player){return (player?.btRoster||[]).reduce((n,e)=>n+(BLOODY_UNITS[e.key]?.food||0),0);}
export function bloodyFormationArea(seat=0){return bloodyPreparationPlot(seat);}
