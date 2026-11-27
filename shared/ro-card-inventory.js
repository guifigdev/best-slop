import {RO_CARDS,RO_EQUIPMENT,roCardFitsSlot,roEquipmentQuantity} from './ragnarok-equipment.js';
export function roAccountCardStock(state){
 const stock={};if(state?.cardVersion===2&&state.cardStock&&typeof state.cardStock==='object'){for(const [key,count]of Object.entries(state.cardStock))if(RO_CARDS[key]&&Number.isSafeInteger(count)&&count>0&&count<=99999)stock[key]=count;}
 else for(const key of state?.cards||[])if(RO_CARDS[key])stock[key]=1;
 return stock;
}
export function roMigrateAccountCards(state){state.cardStock=roAccountCardStock(state);state.cardVersion=2;state.cardSockets??=[];return state;}
export function roGrantAccountCard(state,key){if(!RO_CARDS[key])return false;roMigrateAccountCards(state);if((state.cardStock[key]||0)>=99999)return false;state.cardStock[key]=(state.cardStock[key]||0)+1;if(!state.cards.includes(key))state.cards.push(key);return true;}
export function validateRoItemCards(item,seen=new Set()){
 const d=RO_EQUIPMENT[item?.key];if(!d)return null;const result=[];if(item.cards===undefined)return result;if(!Array.isArray(item.cards)||item.cards.length>(d.sockets||0)||roEquipmentQuantity(item)>1&&item.cards.length)return null;
 for(const card of item.cards){if(!card||typeof card.id!=='string'||card.id.length<1||card.id.length>100||seen.has(card.id)||!RO_CARDS[card.key]||!roCardFitsSlot(RO_CARDS[card.key],d.slot))return null;seen.add(card.id);if(card.accountId!==undefined&&(typeof card.accountId!=='string'||card.accountId.length>100))return null;result.push({id:card.id,key:card.key,...(card.accountId?{accountId:card.accountId}:{})});}return result;
}
// Receipts are supplied internally by the account service, never trusted from a
// network command. One receipt is permanently attached to one physical piece.
export function roAttachAccountSocket(unit,socket){
 if(!socket||!RO_CARDS[socket.key]||socket.accountId&&unit.roAccountId&&socket.accountId!==unit.roAccountId)return false;let item=unit.roInventory?.find(i=>i.id===socket.itemId);
 if(item?.cards?.some(c=>c.id===socket.id))return true;
 if(!item&&socket.originalItemId){const stack=unit.roInventory?.find(i=>i.id===socket.originalItemId&&i.key===socket.itemKey);if(!stack||roEquipmentQuantity(stack)<2)return false;item={...structuredClone(stack),id:socket.itemId,quantity:1,cards:[]};stack.quantity=roEquipmentQuantity(stack)-1;unit.roInventory.push(item);for(const slot of Object.keys(unit.roEquipment||{}))if(unit.roEquipment[slot]===stack.id)unit.roEquipment[slot]=item.id;}
 const d=RO_EQUIPMENT[item?.key];if(!d||item.key!==socket.itemKey||!roCardFitsSlot(RO_CARDS[socket.key],d.slot)||roEquipmentQuantity(item)>1||(item.cards?.length||0)>=(d.sockets||0))return false;
 item.cards??=[];item.cards.push({id:socket.id,key:socket.key,...(socket.accountId?{accountId:socket.accountId}:{})});return true;
}
export function consumeRoAccountCard(state,{characterId,itemId,key,operation},{id=()=>crypto.randomUUID()}={}){
 roMigrateAccountCards(state);const replay=state.cardSockets.find(s=>s.operation===operation);if(replay)return (replay.initialCharacterId||replay.characterId)===characterId&&replay.originalItemId===itemId&&replay.key===key?{ok:true,socket:replay,replayed:true}:{ok:false,reason:'Tentativa de encaixe inválida.'};
 if(typeof operation!=='string'||operation.length<8||operation.length>64||!RO_CARDS[key]||!(state.cardStock[key]>0))return{ok:false,reason:'Você não tem uma cópia desta carta na conta.'};
 const character=state.progress?.characters?.find(c=>c.id===characterId),hero=character?.checkpoint?.hero,item=hero?.roInventory?.find(i=>i.id===itemId),d=RO_EQUIPMENT[item?.key];
 if(!item||!d||!roCardFitsSlot(RO_CARDS[key],d.slot)||(item.cards?.length||0)>=(d.sockets||0))return{ok:false,reason:'A peça não possui um encaixe compatível livre.'};
 const split=roEquipmentQuantity(item)>1,socket={id:'card:'+id(),accountId:state.id,operation,initialCharacterId:characterId,characterId,originalItemId:itemId,itemId:split?'socket-item:'+id():itemId,itemKey:item.key,key},next=structuredClone(hero);
 if(!roAttachAccountSocket(next,socket))return{ok:false,reason:'Não foi possível encaixar a carta.'};
 state.cardStock[key]--;if(!state.cardStock[key])delete state.cardStock[key];state.cardSockets.push(socket);character.checkpoint.hero=next;
 for(const checkpoint of Object.values(character.checkpoints||{}))checkpoint.hero=structuredClone(next);
 return{ok:true,socket};
}
export function reconcileRoAccountSockets(progress,ledger=[]){
 const valid=new Map(ledger.map(s=>[s.id,s])),seen=new Set();
 const reconcile=(item,characterId=null)=>{const cards=[];for(const c of item.cards||[]){const s=valid.get(c.id);if(s&&s.key===c.key&&s.itemKey===item.key&&!seen.has(c.id)){cards.push({id:c.id,key:c.key,...(s.accountId?{accountId:s.accountId}:{})});s.itemId=item.id;s.characterId=characterId;seen.add(c.id);}}
  for(const s of ledger)if(s.characterId===characterId&&s.itemId===item.id&&s.itemKey===item.key&&!seen.has(s.id)&&cards.length<(RO_EQUIPMENT[item.key]?.sockets||0)){cards.push({id:s.id,key:s.key,...(s.accountId?{accountId:s.accountId}:{})});seen.add(s.id);}item.cards=cards;};
 // Warehouse owns deposited copies; historical activity snapshots are not
 // independent items and receive only their character's current socket state.
 for(const item of progress.warehouse?.items||[])reconcile(item);
 for(const character of progress.characters||[]){const hero=character.checkpoint?.hero;if(!hero)continue;for(const item of [...hero.roInventory||[],...hero.roUnclaimed||[]])reconcile(item,character.id);const current=new Map([...hero.roInventory||[],...hero.roUnclaimed||[]].map(i=>[i.id,i.cards]));for(const checkpoint of Object.values(character.checkpoints||{}))for(const item of [...checkpoint.hero?.roInventory||[],...checkpoint.hero?.roUnclaimed||[]])item.cards=structuredClone(current.get(item.id)||[]);}
 return progress;
}
