import {roCardEffectText} from './ro-card-effect-text.js';
import {RO_CARDS,RO_EQUIPMENT_SLOT_NAMES} from '../shared/ragnarok-equipment.js';
import {roCardRarityVisual} from '../shared/ro-card-rarity.js';
import {escapeHTML as esc} from './competition-ui.js';

const statNames={str:'FOR',agi:'AGI',vit:'VIT',int:'INT',dex:'DES',luk:'SOR',maxHp:'Vida',attack:'Ataque',armor:'Defesa',matk:'Ataque mágico',moveSpeed:'Movimento',crit:'Crítico',haste:'Vel. de ataque'};
export function roCardCollectionMarkup(cards,{ownedOnly=false}={}){
 const owned=new Set(cards||[]),list=Object.values(RO_CARDS).filter(c=>!ownedOnly||owned.has(c.key)).sort((a,b)=>Number(owned.has(b.key))-Number(owned.has(a.key))||a.name.localeCompare(b.name));
 return list.map(card=>{const rarity=roCardRarityVisual(card),has=owned.has(card.key);return `<article class="ro-card ${has?'unlocked':'locked'}" data-ro-card="${esc(card.key)}" data-rarity="${rarity.id}" style="--ro-card-rarity:${rarity.color}"><small>${esc(rarity.name.toUpperCase())}${card.mvp?' · MVP':''} · ${esc(card.slot==='accessory'?'Acessórios':RO_EQUIPMENT_SLOT_NAMES[card.slot]||card.slot)}</small><b>${esc(card.name)}</b><span>${esc(roCardEffectText(card))}</span><small>${has?'Conquistada permanentemente':'Ainda não encontrada'}</small></article>`;}).join('')||'<p>Sua coleção ainda está vazia.</p>';
}
export function createRoCardDiscovery({onOpen=()=>{},document:doc=globalThis.document}={}){
 let root=null;const keys=[],counts=new Map(),duplicates=new Map();
 const render=()=>{root?.remove();if(!keys.length)return;root=doc.createElement('aside');root.className='ro-card-discovery';root.setAttribute('role','status');root.setAttribute('aria-live','polite');root.innerHTML=`<button class="ro-card-notice-close" aria-label="Fechar aviso de cartas">×</button><small>CARTAS ENCONTRADAS · ${keys.reduce((n,k)=>n+counts.get(k),0)}</small><ul>${keys.map(key=>{const card=RO_CARDS[key],rarity=roCardRarityVisual(card);return `<li style="--ro-card-rarity:${rarity.color}"><span aria-hidden="true">▰</span><div><b>${esc(card.name)}${counts.get(key)>1?` ×${counts.get(key)}`:''}</b><small>${esc(rarity.name)}${duplicates.get(key)?' · Já conquistada':' · Nova carta'}${card.mvp?' · MVP':''}</small></div></li>`;}).join('')}</ul><p>Adicionadas permanentemente à sua coleção.</p><button data-ro-open-cards>Ver minhas cartas →</button>`;root.querySelector('[aria-label]').onclick=()=>{keys.length=0;counts.clear();duplicates.clear();render();};root.querySelector('[data-ro-open-cards]').onclick=()=>onOpen();doc.body.append(root);};
 return{announce(key,{duplicate=false}={}){if(!RO_CARDS[key])return false;counts.set(key,(counts.get(key)||0)+1);duplicates.set(key,duplicate);if(!keys.includes(key))keys.push(key);if(keys.length>8)keys.shift();render();return true;},clear(){keys.length=0;counts.clear();duplicates.clear();render();},dispose(){keys.length=0;counts.clear();duplicates.clear();root?.remove();root=null;}};
}
