import {RO_TOWN_SERVICE_TYPES} from '../shared/ro-town-services.js';
import {RO_TOWN_NPC_MODELS} from './ro-town-npc-models.js';
export const isRoTownNpc=o=>RO_TOWN_SERVICE_TYPES.includes(o?.type);
const cache=new Map();
// The people retain the actual client SPR silhouettes, costumes and palette.
// Stalls are separate scenery, placed behind them so faces and clothing stay visible.
export function roTownNpcParts(o){
 if(!isRoTownNpc(o))return [];if(cache.has(o.type))return cache.get(o.type);
 const parts=RO_TOWN_NPC_MODELS[o.type].map(p=>[...p]),add=(x,y,z,w,h,d,c,a=0)=>parts.push([x,y,z,w,h,d,c,a]);
 const wood=0x714d35,light=0xb28b59,dark=0x443b35;
 if(o.type==='kafra'){
  for(const x of [-.75,.75]){add(x,.3,-.75,.65,.55,.52,wood);add(x,.61,-.75,.7,.1,.57,light);for(const dx of [-.22,.22])add(x+dx,.3,-.75,.07,.6,.55,0x9c987c);add(x,.37,-.45,.14,.16,.04,0xc9b472);}
  add(0,.6,-1.1,1.9,.12,.5,wood);
 }else if(o.type==='blacksmith'){
  add(.95,.24,.15,.5,.48,.48,dark);add(.95,.59,.15,.3,.45,.3,0x64636a);add(.95,.86,.15,.9,.18,.42,0xa5a4ab);add(1.5,.84,.15,.3,.13,.27,0x83838b);
  add(-.75,.2,-.9,.75,.4,.6,wood);for(let i=0;i<3;i++)add(-1+i*.25,.48,-.9,.2,.13,.38,0x8d9da2);
 }else if(o.type==='healer'){
  add(.82,.08,-.45,.65,.16,.65,0x8d8c84);add(.82,.57,-.45,.28,.9,.28,0xb5b8af);add(.82,1.05,-.45,.7,.15,.7,0xd7d8ca);add(.82,1.13,-.45,.5,.06,.5,0x769eac);
 }else{
  const red=o.type==='potionShop'?0x687f9a:0x995f4f;
  add(0,.67,-.94,2.3,1.18,.65,wood);add(0,1.3,-.94,2.5,.14,.86,light);
  for(const x of [-1.12,1.12])add(x,1.6,-1.45,.11,3.2,.11,wood);
  for(let i=0;i<8;i++){const x=-1.16+i*.33;add(x,3.18,-1,.33,.12,1.6,i%2?0xe8dec2:red);add(x,3.04,-.19,.33,.23,.08,i%2?0xe8dec2:red);}
  if(o.type==='potionShop')for(let i=0;i<5;i++){const x=-.8+i*.4;add(x,1.53,-.94,.18,.29,.18,i%2?0x70b4d3:0xc55755);add(x,1.72,-.94,.1,.11,.1,0xcdb58a);}
  else{add(-.6,1.51,-.94,.12,.55,.11,0xc0c6bf,-.65);add(-.6,1.39,-.9,.46,.07,.12,0xd9bf83);add(.5,1.6,-.94,.42,.52,.14,0x708b92);add(.5,1.6,-.85,.05,.36,.03,0xc8bc85);}
 }
 const frozen=Object.freeze(parts.map(p=>Object.freeze(p)));cache.set(o.type,frozen);return frozen;
}
