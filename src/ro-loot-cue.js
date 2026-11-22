import {escapeHTML as esc} from './competition-ui.js';

export function roLootCueMarkup(loot,time){
 if(!loot||!Number.isFinite(loot.at)||!Number.isFinite(time)||time<loot.at||time-loot.at>=6)return '';
 const gear=Array.isArray(loot.equipment)?loot.equipment:[],chest=loot.kind==='chest',pending=loot.pending===true;
 return `<aside class="ro-loot-cue" role="status" aria-live="polite" aria-atomic="true" data-ro-loot-cue="${esc(loot.id||loot.at)}"><small>${chest?'BAÚ ABERTO':pending?'ITEM RESERVADO':'ITEM RECEBIDO'}</small>${gear.length?gear.map(item=>`<b>${esc(item.name||item.key)}</b><span>${item.pending?'Mochila cheia · item aguardando espaço':'Adicionado à mochila'}</span>`).join(''):`<b>${esc(loot.name||'Espólio encontrado')}</b>`}${loot.relic?`<p>Relíquia: ${esc(loot.relic.name)} × ${Number(loot.relic.stacks)||1}</p>`:loot.description?`<p>${esc(loot.description)}</p>`:''}${gear[0]?.id&&!pending?`<button type="button" data-bk-inspect-loot="${esc(gear[0].id)}">Comparar e equipar</button>`:''}<button type="button" data-bk-build>${pending?'Recolher item pendente':'Ver no inventário'} <kbd>Tab</kbd></button></aside>`;
}
