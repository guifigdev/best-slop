import {ITEMS} from './catalog.js';

// Shared service locations: the scene, UI and authoritative server use these.
// Heroes approach from the arena at z=-8.8, inside the NPC's interaction range.
export const SHOPS={
 equipment:{id:'equipment',name:'Arsenal dos nove reinos',role:'Equipamentos',npc:'Brokkr',hero:'knight',color:0xd8b36c,x:-12.5,z:-10.8,range:2.7,service:'equipment'},
 consumables:{id:'consumables',name:'Botica de Eir',role:'Poções e consumíveis',npc:'Eir',hero:'mage',color:0xb39aca,x:-7.5,z:-10.8,range:2.7,service:'consumables'},
 books:{id:'books',name:'Arquivo de Hugin',role:'Livros e tomos de atributos',npc:'Hugin',hero:'owl',color:0x9ab4c5,x:-2.5,z:-10.8,range:2.7,service:'books'},
 smith:{id:'smith',name:'Forja de Sindri',role:'Melhorias de equipamento',npc:'Sindri',hero:'raccoon',color:0xb68a66,x:2.5,z:-10.8,range:2.7,service:'smith'},
 enchanter:{id:'enchanter',name:'Ateliê de Freya',role:'Encantar armas e armaduras',npc:'Freya',hero:'ranger',color:0x83ae88,x:7.5,z:-10.8,range:2.7,service:'enchanter'},
 runemaster:{id:'runemaster',name:'Runas de Skuld',role:'Runas permanentes',npc:'Skuld',hero:'owl',color:0x986fe0,x:12.5,z:-10.8,range:2.7,service:'runemaster'},
 fountain:{id:'fountain',name:'Fonte do clã',role:'Mercado e recuperação',npc:'Fonte do clã',hero:'mage',color:0x83cdd1,x:0,z:46,range:5,service:'fountain',universal:true,lineWarsOnly:true}
};

export function shopForItem(key){
 if(!Object.hasOwn(ITEMS,key))return null;
 const item=ITEMS[key];
 return item.xp>0||item.attributeTome?'books':item.consumable?'consumables':'equipment';
}

export const shopCanSell=id=>Object.hasOwn(SHOPS,id);

export function shopPosition(id){
 if(!Object.hasOwn(SHOPS,id))return null;
 const {x,z,range}=SHOPS[id];return{x,z,range};
}
