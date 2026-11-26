import {RO_RACE_NAMES} from '../shared/ro-equipment-target-bonuses.js';
const names={str:'FOR',agi:'AGI',vit:'VIT',int:'INT',dex:'DES',luk:'SOR',maxHp:'Vida',maxMana:'SP',attack:'Ataque',armor:'Defesa',magicDefense:'Defesa mágica',matk:'Ataque mágico',moveSpeed:'Movimento',crit:'Crítico',critDamage:'Dano crítico',perfectEvasion:'Esquiva perfeita',haste:'Vel. de ataque',hit:'Precisão',flee:'Esquiva',variableCastReduction:'Redução da conjuração variável',afterCastReduction:'Redução da pós-conjuração',maxHpRate:'Vida máxima',maxManaRate:'SP máximo',spCostReduction:'Redução do custo de SP',magicDamageReduction:'Resistência a magia',attackRate:'Ataque físico',magicAttackRate:'Ataque mágico'};
const rates=new Set(['moveSpeed','crit','critDamage','perfectEvasion','haste','variableCastReduction','fixedCastReduction','afterCastReduction','maxHpRate','maxManaRate','spCostReduction','magicDamageReduction','attackRate','magicAttackRate']);
const number=(n,rate=false)=>(n>=0?'+':'')+Number((n*(rate?100:1)).toFixed(2)).toLocaleString('pt-BR')+(rate?'%':'');
export function roCardEffectText(card){
 if(!card)return '';
 const text=Object.entries(card.stats||{}).map(([key,n])=>(names[key]||key)+' '+number(n,rates.has(key)));
 for(const [field,label]of [['raceDamage','Dano físico contra'],['magicRaceDamage','Dano mágico contra'],['raceResistance','Resistência a'],['raceCritical','Crítico contra'],['raceExperience','XP de']])for(const [race,n]of Object.entries(card[field]||{}))text.push(label+' '+(RO_RACE_NAMES[race]||race)+' '+number(n,true));
 for(const [status,n]of Object.entries(card.statusResistance||{}))text.push('Resistência a '+({stone:'petrificação',freeze:'congelamento',stun:'atordoamento',poison:'veneno',sleep:'sono',bleeding:'sangramento'}[status]||status)+' '+number(n,true));
 for(const [key,bonus]of Object.entries(card.skillBonuses||{}))if(bonus.damage)text.push((key==='KN_BOWLINGBASH'?'Impacto de Tyr':key)+' '+number(bonus.damage,true));
 if(card.sourceId===4427)text.push('Com espada de uma ou duas mãos');
 if(card.armorElement)text.push('Armadura de elemento '+card.armorElement);
 if(card.onHit?.length)text.push('Efeito adicional ao acertar');
 if(!text.length)text.push(card.original||'Efeito especial');
 return text.join(' · ');
}
