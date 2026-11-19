import {CASTLE_BUILDINGS,CASTLE_UNITS} from '../shared/castle-catalog.js';
import {castleUpgradeAvailability} from '../shared/castle-build-rules.js';
import {escapeHTML as esc} from './competition-ui.js';
const n=value=>Number(value||0).toLocaleString('pt-BR');
export function castleUpgradeHint(definition){
 const branches=(definition.upgradesTo||[]).map(key=>CASTLE_BUILDINGS[key]).filter(Boolean);
 return branches.length?`<em class="cf-upgrade-hint">↑ Evolui para ${branches.map(b=>esc(b.name)).join(' / ')}</em>`:'';
}
export function castleUpgradeMarkup(state,hero,building){
 const definition=CASTLE_BUILDINGS[building.key],keys=definition?.upgradesTo||[];
 return `<section class="cf-selection cf-upgrades"><b>Evoluções da construção</b>${keys.length?'<p>Melhore este prédio para mudar as próximas unidades produzidas. Tropas que já nasceram permanecem iguais.</p>':'<p>Esta construção já está no último estágio de sua cadeia.</p>'}${keys.map(key=>{
  const next=CASTLE_BUILDINGS[key],check=castleUpgradeAvailability(state,hero,building,key),unit=typeof next.unit==='string'?CASTLE_UNITS[next.unit]:next.unit;
  return `<button class="cf-upgrade-choice" data-cf-upgrade="${esc(key)}" ${check.allowed?'':'disabled'}><b>↑ ${esc(next.name)}</b><strong>◆ ${n(next.cost)}${next.lumberCost?' · ♣ '+n(next.lumberCost):''}</strong><span>${esc(unit?'Passa a produzir '+unit.name:'Melhoria de suporte')}</span><small>${esc(check.allowed?'Disponível · '+n(next.buildTime)+'s de obra':check.reason)}</small></button>`;
 }).join('')}</section>`;
}
