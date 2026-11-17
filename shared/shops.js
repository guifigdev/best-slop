import {ITEMS} from './catalog.js';

// Shared service locations: the scene, UI and authoritative server use these.
// Heroes approach from the arena at z=-8.8, inside the NPC's interaction range.
export const SHOPS={
 equipment:{id:'equipment',name:'Arsenal dos seis clãs',role:'Equipamentos',npc:'Brás',hero:'knight',color:0xd8b36c,x:-10,z:-10.8,range:2.7,service:'equipment'},
 consumables:{id:'consumables',name:'Botica de Cora',role:'Poções e consumíveis',npc:'Cora',hero:'mage',color:0xb39aca,x:-5,z:-10.8,range:2.7,service:'consumables'},
 books:{id:'books',name:'Biblioteca de Orfeu',role:'Livros de experiência',npc:'Orfeu',hero:'owl',color:0x9ab4c5,x:0,z:-10.8,range:2.7,service:'books'},
 smith:{id:'smith',name:'Forja de Nico',role:'Melhorias de equipamento',npc:'Nico',hero:'raccoon',color:0xb68a66,x:5,z:-10.8,range:2.7,service:'smith'},
 enchanter:{id:'enchanter',name:'Ateliê de Faísca',role:'Encantamentos de armas',npc:'Faísca',hero:'ranger',color:0x83ae88,x:10,z:-10.8,range:2.7,service:'enchanter'}
};

export function shopForItem(key){
 if(!Object.hasOwn(ITEMS,key))return null;
 const item=ITEMS[key];
 return item.xp>0?'books':item.consumable?'consumables':'equipment';
}

export const shopCanSell=id=>Object.hasOwn(SHOPS,id);

export function shopPosition(id){
 if(!Object.hasOwn(SHOPS,id))return null;
 const {x,z,range}=SHOPS[id];return{x,z,range};
}
