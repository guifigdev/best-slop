import {CASTLE_ITEMS} from '../shared/castle-catalog.js';
import {icon} from './art.js';
import {escapeHTML as esc} from './competition-ui.js';
const art={bassline:'endurance',repair_rune:'heal',double_damage:'critical',quad_damage:'rage',chain_orb:'chain',stone_scroll:'devotion',cheese:'avatar',bass_drums:'roar',blast_staff:'warlockfire'};
export function castleInventoryMarkup(hero,profile,elapsed=0){
 return Array.from({length:6},(_,slot)=>{const entry=hero.inventory?.[slot],item=entry&&CASTLE_ITEMS[entry.key],cooldown=item?Math.max(0,(profile?.cooldowns?.[entry.key]||0)-elapsed):0;
 return `<button class="inventory-slot cf-inventory-slot ${item?'filled':''} ${cooldown?'cooling':''}" data-cf-inventory="${slot}" title="${esc(item?item.name+' · '+(entry.passive?'Efeito permanente':cooldown?'Recarga '+Math.ceil(cooldown)+'s':'Clique ou '+(slot+1)+' para usar'):'Espaço vazio')}" aria-label="${esc((slot+1)+': '+(item?.name||'vazio'))}" ${!item?'disabled':''}><small>${slot+1}</small>${item?icon(art[entry.key]||'avatar'):'<span>+</span>'}${item?'<em>'+(entry.passive?'AURA':'×'+entry.charges)+'</em>':''}${cooldown?'<strong class="cf-item-timer">'+Math.ceil(cooldown)+'</strong>':''}</button>`;}).join('');
}
