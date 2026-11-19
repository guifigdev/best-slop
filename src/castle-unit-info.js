import {castleTargetSummary} from '../shared/castle-weapons.js';
import {castleDamageMultiplier,CASTLE_ATTACK_TYPES} from '../shared/castle-catalog.js';
import {escapeHTML as esc} from './competition-ui.js';
export const castleTypeName=type=>({normal:'normal',pierce:'perfurante',siege:'cerco',magic:'mágico',hero:'heroico',chaos:'caos',spells:'magia',light:'leve',medium:'média',heavy:'pesada',fortified:'fortificada',unarmored:'sem armadura',divine:'divina'})[type]||type;
const n=value=>Number(value||0).toLocaleString('pt-BR',{maximumFractionDigits:2}),percent=value=>`${value>1?'+':'−'}${Math.round(Math.abs(value-1)*100)}%`;
const armors=['light','medium','heavy','fortified','unarmored','hero','divine'];
export function castleMatchups(unit){
 const attack=armors.map(type=>({type,multiplier:castleDamageMultiplier(unit.attackType,type)})),defense=CASTLE_ATTACK_TYPES.map(type=>({type,multiplier:castleDamageMultiplier(type,unit.armorType)}));
 return {strong:attack.filter(x=>x.multiplier>1),reduced:attack.filter(x=>x.multiplier<1),weak: defense.filter(x=>x.multiplier>1),resistant:defense.filter(x=>x.multiplier<1)};
}
export function castleUnitInfo(unit){
 const m=castleMatchups(unit),chips=(values,armor=false)=>values.map(v=>`<span>${armor&&v.type!=='unarmored'?'armadura ':''}${esc(armor&&v.type==='hero'?'heroica':castleTypeName(v.type))} <b>${percent(v.multiplier)}</b></span>`).join('')||'<span>Sem modificador de tipo</span>',row=(label,values,kind,armor=false)=>`<div class="cf-matchup ${kind}"><b>${label}</b><div>${chips(values,armor)}</div></div>`;
 return `<h3>${esc(unit.name)}</h3><p class="cf-unit-role">${unit.flying?'Voador':'Terrestre'} · ${unit.ranged||unit.range>1.2?'Ataque à distância':'Corpo a corpo'}</p><dl class="cf-unit-stats"><div><dt>Vida</dt><dd>${n(unit.hp)} / ${n(unit.maxHp??unit.hp)}</dd></div><div><dt>Dano ${esc(castleTypeName(unit.attackType))}</dt><dd>${n(unit.damage)}</dd></div><div><dt>Armadura ${esc(castleTypeName(unit.armorType))}</dt><dd>${n(unit.armor)} pontos</dd></div><div><dt>Alcance</dt><dd>${n(unit.range)} m</dd></div><div><dt>Intervalo de ataque</dt><dd>${n(unit.interval)} s</dd></div><div><dt>Movimento</dt><dd>${n(unit.speed)} m/s</dd></div></dl><p class="cf-unit-targets">Ataca ${esc(castleTargetSummary(unit))}.</p>${unit.weapons?.length>1?'<p>'+unit.weapons.map(w=>`Ataque ${w.slot}: ${n(w.damage)} de dano · ${n(w.range)} m · ${n(w.interval)} s · ${esc(castleTargetSummary({weapons:[w]}))}`).join('<br>')+'</p>':''}${row('Forte ao atacar',m.strong,'strong',true)}${row('Causa menos dano em',m.reduced,'reduced',true)}${row('Vulnerável a',m.weak,'weak')}${row('Resiste a',m.resistant,'resistant')}`;
}
