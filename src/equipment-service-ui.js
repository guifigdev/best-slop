import {itemAt} from '../shared/catalog.js';
import {isEnchantable} from '../shared/enchantments.js';
import {serviceMarkup,enchantingMarkup,consumableSaleMarkup} from './enchanting-ui.js';
import {equipmentMarkup} from './equipment-ui.js';
import {icon} from './art.js';

function consumableInspection(player,index){const slot=player.inventory[index],item=itemAt(slot.key,slot.level||1);return `<div class="equipment-hero"><span>${icon(slot.key)}</span><div><small>CONSUMÍVEL · MOCHILA</small><h3>${item.name}</h3><p>${slot.charges||1} carga(s)</p></div></div><p class="equipment-info">${slot.xpValue?'Concede '+slot.xpValue+' XP ao ser lido no mercado.':item.description}</p><p class="equipment-info">Use este item pelo botão abaixo. Tomos e livros são consumidos no mercado e não acionam a recarga das poções.</p>`;}

export function equipmentServiceItems(player,mode='forge'){
 return (player?.inventory||[]).flatMap((slot,index)=>{const item=itemAt(slot?.key,slot?.level||1);return item&&(['sell','inspect'].includes(mode)||!item.consumable&&(mode!=='enchant'||isEnchantable(slot.key)))?[{slot,index,item}]:[];});
}
export function equipmentServiceSelection(player,mode,selectedIndex){
 const items=equipmentServiceItems(player,mode);return items.find(entry=>entry.index===selectedIndex)?.index??items[0]?.index??null;
}
export function equipmentServiceMarkup(player,mode,state,{selectedIndex=null,pending=false}={}){
 const index=equipmentServiceSelection(player,mode,selectedIndex),slot=index===null?null:player.inventory[index],item=slot?itemAt(slot.key,slot.level||1):null;
 const detail=!item?'<div class="service-blank"><span aria-hidden="true">◇</span><h3>Nenhum item compatível</h3><p>Compre um equipamento no Arsenal para usar este serviço.</p></div>':mode==='inspect'&&item.consumable?consumableInspection(player,index):mode==='sell'||item.consumable?consumableSaleMarkup(player,index,state,pending):mode==='enchant'?enchantingMarkup(player,index,state,pending):equipmentMarkup(player,index,state,pending);
 return `<section class="equipment-service-layout"><aside aria-label="Itens da mochila">${serviceMarkup(player,mode,state,{selectedIndex:index})}</aside><section class="equipment-service-detail" aria-label="${mode==='forge'?'Refino do equipamento':mode==='enchant'?'Encantamentos do equipamento':mode==='inspect'?'Detalhes do item':'Venda do item'}">${detail}</section></section>`;
}
