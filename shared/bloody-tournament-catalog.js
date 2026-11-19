import {BLOODY_BATTLEFIELD,bloodyPreparationPlot} from './bloody-battlefield.js';
import {CASTLE_UNITS} from './castle-catalog.js';

export const BLOODY_REFERENCE=Object.freeze({
 requestedVideo:'https://www.youtube.com/watch?v=QdDI60ckoxo',
 mechanicsSource:'https://github.com/Jaccouille/wc3-blood-tournament',
 terrainSource:BLOODY_BATTLEFIELD.source.source,
 title:'Star Wars Blood Tournament 6.4d',
 verified:'Native W3E terrain, WPM pathability, doodad positions, eight private color plots and eight battlefield fronts extracted from the map.',
 adaptation:'Original Nordic voxel art. Browser economy, army catalog and seven-round rules remain adaptations; eight-player free-for-all uses the native plots, five-versus-five adds two isolated preparation gardens.'
});
export const BLOODY_RULES=Object.freeze({rounds:7,preparationTime:45,battleTime:100,resultTime:8,startingGold:420,roundGold:180,catchupGold:60,startingBlood:0,maxFood:30,maxWarbands:12,maxRank:3,killBloodCap:120,unitScale:1.55});
export const BLOODY_MAP=BLOODY_BATTLEFIELD.map;
const unit=(key,name,source,count,cost,food,category,description,extra={})=>Object.freeze({key,name,source,count,cost,food,category,description,...extra});
export const BLOODY_UNITS=Object.freeze({
 shieldwall:unit('shieldwall','Muralha de Midgard','hfoo',3,65,3,'frontline','Três guerreiros de escudo. Protegem os aliados frágeis e atacam somente alvos terrestres.'),
 einherjar:unit('einherjar','Einherjar','h03B',1,115,3,'frontline','Um campeão resistente para romper a linha de frente.'),
 berserkers:unit('berserkers','Berserkers do Norte','n00V',2,110,4,'frontline','Dois combatentes de machado. Dano sustentado contra formações terrestres.'),
 hunters:unit('hunters','Caçadoras de Skadi','n022',3,95,3,'ranged','Três arqueiras com arcos. Alcançam tropas terrestres e aéreas.'),
 sniper:unit('sniper','Vigia de Nidavellir','hrif',2,115,4,'ranged','Dois atiradores com rifles. Mantenha-os atrás dos escudos.'),
 marksman:unit('marksman','Olho de Heimdall','h05C',1,165,4,'ranged','Um atirador veterano de longo alcance, vulnerável quando cercado.'),
 druids:unit('druids','Druidas de Yggdrasil','e007',2,140,4,'magic','Dois conjuradores. Ataques arcanos contra inimigos de armadura pesada.'),
 shamans:unit('shamans','Runomantes da Tempestade','o003',2,145,4,'magic','Dois xamãs de ataque mágico. Bons contra armadura pesada.'),
 healer:unit('healer','Guardiões de Eir','n015',2,155,4,'support','Dois sacerdotes restauram a vida do aliado ferido mais próximo a cada quatro segundos.',{heal:55,healRange:7}),
 wolves:unit('wolves','Matilha de Fenrir','n017',3,105,3,'frontline','Três lobos velozes flanqueiam o inimigo e perseguem seus atiradores.',{speedBonus:.4}),
 golem:unit('golem','Sentinela de Ferro','n01X',1,160,4,'frontline','Uma sentinela de alta armadura para absorver ataques físicos.'),
 mortar:unit('mortar','Bombarda de Brokkr','hmtm',1,180,5,'siege','Artilharia de longo alcance. Cada impacto também atinge inimigos próximos.',{splash:1.7}),
 aircraft:unit('aircraft','Asas de Nidavellir','h06Q',2,170,5,'flying','Dois rotores de combate. Voam acima do solo e exigem ataques antiaéreos.'),
 valkyrie:unit('valkyrie','Cavaleira dos Céus','h016',1,160,4,'flying','Uma montaria alada com ataque mágico. Não pode ser atingida por guerreiros sem antiaéreo.'),
 hydra:unit('hydra','Hidra de Jormungand','n01P',1,280,7,'siege','Monstro de elite com grande corpo e muito dano. Exige espaço na formação.'),
 wraiths:unit('wraiths','Vozes de Hel','u001',2,170,5,'magic','Dois espíritos atacantes com resistência divina e grande fragilidade física.')
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
