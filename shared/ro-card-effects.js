import {RO_CARD_NATIVE} from './ro-card-native-data.js';
import {roNativeEquipment} from './ro-equipment-native.js';
import {roMonsterProperties} from './ro-monster-properties.js';
import {RO_TARGET_BONUS_FAMILIES} from './ro-equipment-target-bonuses.js';
const maps=['elementalPower','elementalResistance',...RO_TARGET_BONUS_FAMILIES,'raceCritical','raceExperience','statusResistance','ignoreDefense','monsterDamage'];
export function roCardEffects(card,unit={},item={}){
 const data=RO_CARD_NATIVE[card?.sourceId];if(!data)return card;
 const native=roNativeEquipment(card.sourceId,unit,item,data),supported=Object.keys(native.stats).length||maps.some(k=>Object.keys(native[k]||{}).length)||Object.keys(native.skillBonuses||{}).length||native.onHit.length||native.armorElement||native.ignoreSize||native.noCastCancel;
 return supported||!native.unsupported.length?native:card;
}
export function addRoCardEffects(bonuses,card,unit={},item={}){
 const effects=roCardEffects(card,unit,item);
 for(const [key,value]of Object.entries(effects.stats||{}))if(Number.isFinite(value))bonuses[key]=key==='fixedCastReduction'?Math.max(bonuses[key]||0,value):(bonuses[key]||0)+value;
 for(const field of maps)for(const [key,n]of Object.entries(effects[field]||{})){const target=bonuses[field]??={};target[key]=(target[key]||0)+n;}
 for(const [key,values]of Object.entries(effects.skillBonuses||{})){const target=(bonuses.skillBonuses??={})[key]??={};for(const [stat,n]of Object.entries(values))target[stat]=(target[stat]||0)+n;}
 if(effects.onHit?.length)(bonuses.onHit??=[]).push(...effects.onHit);
 for(const flag of ['ignoreSize','noCastCancel','noGemStone'])if(effects[flag])bonuses[flag]=true;
 if(effects.armorElement)bonuses.armorElement=effects.armorElement;
 return bonuses;
}
export function roCardRaceValue(values,enemy){const race=roMonsterProperties(enemy)?.race,key=({Humanoide:'demihuman',Humano:'demihuman',Bruto:'brute',Inseto:'insect',Planta:'plant','Morto-vivo':'undead','Demônio':'demon',Amorfo:'formless',Peixe:'fish',Anjo:'angel','Dragão':'dragon'})[race]||race;return(values?.all||0)+(values?.[key]||0);}
