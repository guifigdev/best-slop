import {RO_BUILD_EQUIPMENT} from './ro-build-equipment.js';
import {RO_BAG_CAPACITY,roBagUsage,createRoEquipment,roReceiveEquipment} from './ragnarok-equipment.js';
import {bonkBlocked} from './bonk-level.js';
import {BONK_RULES} from './bonk-catalog.js';

export const RO_SECRET_MERCHANT_RULES=Object.freeze({perMap:1,offers:3,discoverRange:11,minPrice:220,maxPrice:390,ledgerLimit:1024});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const hash=(seed,n)=>{let v=(seed^Math.imul(n+1,0x9e3779b9))>>>0;v=Math.imul(v^(v>>>16),0x21f0aaad);v=Math.imul(v^(v>>>15),0x735a2d97);return(v^(v>>>15))>>>0;};
const textHash=s=>{let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const isMerchant=o=>o?.type==='secretMerchant';
function pathDistance(p,path){const a=path.from,b=path.to;if(!a||!b)return Infinity;const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
function clearSegment(map,a,b){const n=Math.max(1,Math.ceil(distance(a,b)/.6));for(let i=0;i<=n;i++)if(bonkBlocked(map,{x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n},.5))return false;return true;}
// A coarse flood proves that the optional clearing is connected to the entrance.
// It never removes scenery/colliders or depends on the gameplay RNG stream.
export function roMerchantReachableCells(map){
 if(!map||map.tower)return[];const step=3,minX=-108,minZ=-108,size=73,open=new Uint8Array(size*size),seen=new Uint8Array(size*size),point=i=>({x:minX+(i%size)*step,z:minZ+Math.floor(i/size)*step});
 for(let i=0;i<open.length;i++)open[i]=Number(!bonkBlocked(map,point(i),.9));
 const start=Array.from({length:open.length},(_,i)=>i).filter(i=>open[i]&&distance(point(i),map.spawn)<8&&clearSegment(map,map.spawn,point(i))).sort((a,b)=>distance(point(a),map.spawn)-distance(point(b),map.spawn))[0];if(start===undefined)return[];
 const queue=[start];seen[start]=1;for(let at=0;at<queue.length;at++){const i=queue[at],x=i%size,z=Math.floor(i/size);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,j=nz*size+nx;if(nx<0||nz<0||nx>=size||nz>=size||seen[j]||!open[j]||!clearSegment(map,point(i),point(j)))continue;seen[j]=1;queue.push(j);}}
 return queue.map(point);
}
export function generateRoSecretMerchants(map){
 if(!map||map.tower)return[];const seed=map.seed>>>0,cells=roMerchantReachableCells(map);
 const candidates=cells.filter(p=>distance(p,map.spawn)>32&&!bonkBlocked(map,p,3.1)&&!(map.objects||[]).some(o=>distance(o,p)<8)&&(map.paths||[]).every(path=>pathDistance(p,path)>Math.max(14,(path.width||12)/2+7)));
 candidates.sort((a,b)=>hash(seed,Math.round(a.x+111)*89+Math.round(a.z+111))-hash(seed,Math.round(b.x+111)*89+Math.round(b.z+111)));
 const p=candidates[0];if(!p)return[];
 return[{id:`ro-merchant:${seed}:0`,type:'secretMerchant',name:['Véu, o mercador errante','Nara, a negociadora oculta','Ravel, o colecionador'][seed%3],...p,seed,discovered:false,used:false}];
}
export function validateRoMerchantPurchases(value){
 if(value===undefined)return[];if(!Array.isArray(value)||value.length>RO_SECRET_MERCHANT_RULES.ledgerLimit||new Set(value).size!==value.length)return null;
 if(value.some(id=>typeof id!=='string'||!/^ro-merchant:\d{1,10}:0:build_\d{1,7}$/.test(id)||!Object.hasOwn(RO_BUILD_EQUIPMENT,id.slice(id.lastIndexOf(':')+1))))return null;
 return [...value];
}
export function roSecretMerchantOffers(merchant,unit,purchases=[]){
 if(!isMerchant(merchant)||!unit)return[];const seed=textHash(merchant.id+':'+unit.roLineage),pool=Object.values(RO_BUILD_EQUIPMENT).filter(d=>d.grade===3&&d.lineages.includes(unit.roLineage)),sort=(a,b)=>hash(seed,a.sourceId)-hash(seed,b.sourceId),weapons=pool.filter(d=>d.slot==='weapon').sort(sort),primary=weapons[0],other=pool.filter(d=>d.slot!=='weapon'&&!(primary?.hands===2&&d.slot==='offhand')).sort(sort),chosen=primary?[primary]:[];
 for(const item of other)if(chosen.length<3&&!chosen.some(d=>d.slot===item.slot))chosen.push(item);
 const sold=new Set(purchases);return chosen.map(d=>{const id=merchant.id+':'+d.key,price=220+(d.slot==='weapon'?70:0)+hash(textHash(merchant.id),d.sourceId)%101,wasSold=sold.has(id),canCarry=roBagUsage(unit)<RO_BAG_CAPACITY,reason=wasSold?'Esgotado':!canCarry?'Mochila cheia. Libere um dos 30 espaços.':!Number.isFinite(unit.gold)||unit.gold<price?'Ouro insuficiente.':'';return{id,key:d.key,name:d.name,slot:d.slot,sockets:d.sockets,stats:{...d.stats},weaponType:d.weaponType,hands:d.hands,sourceId:d.sourceId,source:d.source,price,sold:wasSold,canBuy:!reason,reason};});
}
export function discoverRoSecretMerchants(game,units){
 for(const o of game.bonk?.objects||[])if(isMerchant(o)&&!o.discovered&&units.some(u=>u.alive&&distance(o,u)<=RO_SECRET_MERCHANT_RULES.discoverRange&&clearSegment(game.bonk.map,u,o)))o.discovered=true;
}
export function nearbyRoSecretMerchant(game,unit){return(game.bonk?.objects||[]).filter(o=>isMerchant(o)&&o.discovered&&distance(o,unit)<=BONK_RULES.interactRange&&clearSegment(game.bonk.map,unit,o)).sort((a,b)=>distance(a,unit)-distance(b,unit))[0]||null;}
export function openRoSecretMerchant(game,unit,id){const b=game.bonk,o=b?.objects.find(o=>o.id===id&&isMerchant(o));if(!unit.alive||!o||!['playing','cleared'].includes(b.stage)||distance(o,unit)>BONK_RULES.interactRange||!clearSegment(b.map,unit,o))return false;o.discovered=true;unit.bonkSecretMerchant=o.id;return true;}
export function roSecretMerchantSnapshot(game,unit){
 const o=nearbyRoSecretMerchant(game,unit);if(!o||o.id!==unit.bonkSecretMerchant||!unit.alive)return null;
 return{id:o.id,name:o.name,x:o.x,z:o.z,offers:roSecretMerchantOffers(o,unit,game.bonk.merchantPurchases),gold:unit.gold,canCarry:roBagUsage(unit)<RO_BAG_CAPACITY};
}
/** Atomic server purchase: the client supplies identity only, never price/stats. */
export function buyRoSecretMerchant(game,unit,object,offer){
 const b=game.bonk,o=b?.objects.find(o=>o.id===object&&isMerchant(o)),fail=reason=>({ok:false,reason});
 if(game.options?.mode!=='bonk'||b.activity==='tower'||!unit.alive||!['playing','cleared'].includes(b.stage)||unit.bonkOffer)return fail('O mercador não está disponível agora.');
 if(!o||!o.discovered||unit.bonkSecretMerchant!==o.id||distance(o,unit)>BONK_RULES.interactRange||!clearSegment(b.map,unit,o))return fail('Aproxime-se do mercador e abra a loja.');
 const row=roSecretMerchantOffers(o,unit,b.merchantPurchases).find(row=>row.id===offer);if(!row)return fail('Esse equipamento não faz parte do estoque.');if(!row.canBuy)return fail(row.reason);
 if((b.merchantPurchases||[]).length>=RO_SECRET_MERCHANT_RULES.ledgerLimit)return fail('O estoque desta expedição terminou.');
 const usedIds=new Set((game.units||[unit]).flatMap(u=>[...(u.roInventory||[]),...(u.roUnclaimed||[])].map(i=>i.id)));let itemId;do{itemId='merchant-'+game.id();}while(usedIds.has(itemId));
 const item=createRoEquipment(row.key,itemId);if(!item||!roReceiveEquipment(unit,item))return fail('Mochila cheia. Libere um dos 30 espaços.');
 unit.gold-=row.price;(b.merchantPurchases||=[]).push(row.id);return{ok:true,item,offer:row};
}
