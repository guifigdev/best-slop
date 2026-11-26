import {RO_EQUIPMENT,createRoEquipment,roReceiveEquipment,rollRoEquipmentDrops} from './ragnarok-equipment.js';
import {RO_TOWER_DROP_MAP} from './ragnarok-tower-drops.js';

export const RO_YGGDRASIL_DROP_CHANCE=Object.freeze({normal:.003,elite:.08,boss:1});
export function roMvpEquipmentKey(visual,random){
 const pool=(RO_TOWER_DROP_MAP[visual]?.equipmentKeys||[]).filter(key=>RO_EQUIPMENT[key]);
 if(!pool.length)return 'ring';
 return pool[Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)))];
}
// One personal MVP prize is guaranteed; independent extra rolls stay on the ground.
// A full bag reserves the prize through the existing saved pending-item system.
export function awardRoMvpEquipment(game,hero,enemy){
 if(!enemy?.bonkBoss||enemy.roMvpRewarded)return null;
 enemy.roMvpRewarded=true;
 const drops=rollRoEquipmentDrops(()=>game.random(),enemy.ragnarokVisual,{boss:true}),key=drops.shift()||roMvpEquipmentKey(enemy.ragnarokVisual,()=>game.random()),item=createRoEquipment(key,'mvp-'+game.id()),received=roReceiveEquipment(hero,item);
 let pending=false;if(!received){if((hero.roUnclaimed?.length||0)>=4096){drops.unshift(key);return{item:null,extras:drops};} (hero.roUnclaimed??=[]).push(item);pending=true;}
 const definition=RO_EQUIPMENT[key];hero.bonkLastLoot={id:'mvp:'+enemy.id,kind:'mvp',name:'Recompensa MVP',description:'Equipamento de MVP + Bênção do Ferreiro.',at:game.time,pending,equipment:[{id:item.id,key,name:definition.name,pending}]};
 return {item,pending,extras:drops};
}
