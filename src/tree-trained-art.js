import {TREE_TAG_UNITS} from '../shared/tree-tag-catalog.js';
import {voxelTagPortrait} from './tag-character-art.js';

// Original voxel silhouettes, shared by the battlefield model and its portrait.
// These are cosmetic descriptors; the native unit catalog owns all statistics.
const descriptions=Object.freeze({
 eC26:'Ent combatente de curta distância. Um tronco vivo que protege a linha de frente.',
 eC27:'Ent veterano de curta distância, com mais vida e dano que o Tree Fighter.',
 h004:'Elemental de água. Ataca à distância e oferece apoio atrás da linha de frente.',
 h005:'Elemental de água reforçado, com mais vida, dano e alcance que Water.',
 eC28:'Carro de guerra de madeira, armado para atacar a longa distância.',
 eC34:'Veículo blindado de cerco. Mais resistente e poderoso que Armed Transport.',
 eC48:'Caçador da floresta. Uma unidade rápida de ataque à distância.',
 EC29:'Guardião da natureza de combate próximo. Um defensor ágil da floresta.'
});
const cached=new Map(),portraits=new Map();
const rawKey=value=>{const key=typeof value==='string'?value:value?.rawId||value?.unitKey;return typeof key==='string'&&key.startsWith('tree-trained:')?key.slice(13):key;};
export function treeTrainedDescription(value){const raw=rawKey(value);return Object.hasOwn(descriptions,raw)?descriptions[raw]:'';}
export function treeTrainedModelKey(unit){if(!unit?.treeTagSummon||!unit.treeTagTrained||unit.treeTagWorker)return null;const key=rawKey(unit);return Object.hasOwn(descriptions,key)?'tree-trained:'+key:null;}
export function treeTrainedSpec(value){
 const raw=rawKey(value);if(!Object.hasOwn(descriptions,raw))return null;if(cached.has(raw))return cached.get(raw);
 const parts=[],legs=[],wings=[],b=(...p)=>parts.push(p),leg=(x,z,w=.34,h=.6,color=0x6d6447)=>legs.push({x,y:h/2+.04,z,w,h,d:.5,color});let fur=0x88744e,muzzle=0xb39c6c,height=2.7,eyeLine=1.9,motion='walk';
 if(raw==='eC26'||raw==='eC27'){
  const elite=raw==='eC27',bark=elite?0x626b4b:0x877148,wood=elite?0xb3ad73:0xc1a574,leaf=elite?0x587b60:0x779450;fur=bark;muzzle=wood;
  b(0,1.18,0,1.05,1.35,.72,bark);b(0,1.94,.09,.91,.77,.72,bark);b(0,.88,.42,.65,.53,.12,wood);b(0,1.62,.46,.46,.14,.12,wood);
  for(const side of [-1,1]){b(side*.68,1.13,.05,.36,1.11,.45,bark);b(side*.69,.68,.17,.45,.39,.55,wood);b(side*.27,2.05,.47,.19,.13,.06,0xe0d896);b(side*.46,2.45,-.1,.18,.66,.19,bark);b(side*.67,2.61,-.11,.52,.19,.36,leaf);leg(side*.3,0,.4,.61,bark);}
  b(0,2.5,-.12,1.37,.47,.98,leaf);b(-.31,2.85,-.13,.81,.32,.69,elite?0x8da580:0xa3b574);b(.46,2.49,.24,.5,.25,.59,0x607b4b);b(0,1.06,.44,.12,.59,.08,bark);
  if(elite){b(0,1.26,.48,.85,.62,.15,0x9aab9b);b(0,1.3,.59,.21,.35,.07,0xe0d6a7);for(const side of [-1,1]){b(side*.7,1.55,.04,.58,.25,.66,0x92a18c);b(side*.43,2.64,-.18,.2,.39,.17,0xcbb78a);}b(0,2.94,-.11,.23,.28,.24,0xd4c78e);}
  height=elite?3.16:3.02;eyeLine=2.05;
 }else if(raw==='h004'||raw==='h005'){
  const elder=raw==='h005',water=elder?0x77a9c1:0x6bafb8,foam=elder?0xc9e2de:0xb5dfcd,deep=elder?0x427e9b:0x4c8b9c;fur=water;muzzle=foam;motion='float';
  b(0,1.2,0,1.07,1.24,.69,water);b(0,.57,0,.9,.35,.7,deep);b(0,.35,0,1.2,.17,.94,foam);b(0,2.02,.05,.79,.74,.7,water);b(0,2.39,.02,.46,.22,.48,foam);
  for(const side of [-1,1]){b(side*.75,1.19,.02,.4,.96,.47,water);b(side*.76,.78,.23,.51,.39,.58,foam);b(side*.2,2.09,.43,.13,.11,.055,0xe7edc7);b(side*.38,1.69,-.14,.46,.38,.62,foam);b(side*.38,.66,-.1,.29,.42,.42,deep);}
  b(0,1.13,.4,.34,.67,.16,foam);b(-.16,.46,.48,.66,.2,.19,water);b(.25,.26,-.43,.62,.16,.21,water);
  if(elder){for(const side of [-1,1]){b(side*.4,2.44,-.02,.2,.62,.3,foam);b(side*.8,1.76,.03,.43,.35,.62,deep);}b(0,2.62,.02,.32,.37,.31,0xe3edcf);b(0,1.18,.52,.18,.32,.08,0xd4e4cd);}
  height=elder?2.89:2.56;eyeLine=2.09;
 }else if(raw==='eC28'||raw==='eC34'){
  const tank=raw==='eC34',wood=0x8e7955,iron=tank?0x77918b:0x9caa91,shade=0x465b52,gold=0xc9b77c;fur=iron;muzzle=gold;motion='vehicle';
  b(0,.65,0,1.56,.47,2.15,wood);b(0,.94,-.13,1.37,.35,1.8,iron);for(const side of [-1,1])for(const z of [-.68,.65]){b(side*.84,.4,z,.3,.69,.61,shade);b(side*1.01,.42,z,.08,.29,.28,gold);}
  b(0,1.23,-.48,1.24,.6,.72,tank?iron:wood);b(0,1.57,-.48,1.42,.16,.86,shade);b(0,1.33,-.08,.67,.25,.13,0xbcd0b5);b(0,1.26,.59,.57,.47,1.24,iron);b(0,1.28,1.26,.34,.31,.17,shade);b(0,1.28,1.36,.17,.16,.06,0x233d36);
  for(const side of [-1,1]){b(side*.65,1.11,.52,.17,.48,1.13,wood);b(side*.65,1.41,.52,.2,.12,1.18,gold);}
  if(tank){b(0,1.51,-.18,1.31,.51,1.17,iron);b(0,1.87,-.29,.61,.2,.62,shade);b(0,1.59,.72,.32,.3,1.66,0x91a99b);b(0,1.59,1.58,.38,.35,.18,shade);b(0,1.59,1.68,.2,.18,.07,0x263d35);for(const side of [-1,1]){b(side*.83,.88,0,.3,.38,2.22,iron);b(side*.87,1.08,.7,.23,.12,.4,gold);}}
  else{b(-.46,1.94,-.55,.09,.7,.09,wood);b(-.23,2.1,-.55,.43,.28,.09,0x91b178);b(.45,1.56,-.75,.37,.31,.37,0xb7a675);}
  height=tank?2.08:2.36;eyeLine=1.37;
 }else{
  const protector=raw==='EC29',cloak=protector?0x6e8797:0x4f7656,skin=protector?0xbbbea0:0xc0b28d,hood=protector?0xa8bba1:0x7c965d;fur=skin;muzzle=skin;
  b(0,1.07,0,.79,1.03,.58,cloak);b(0,1.84,.06,.7,.62,.65,skin);b(0,2.19,0,.85,.22,.76,hood);b(0,1.78,-.3,.88,.91,.18,hood);b(0,.61,.03,.83,.15,.66,0x4b5a42);b(0,.64,.4,.19,.19,.09,0xc2b677);
  for(const side of [-1,1]){b(side*.51,1.14,.01,.29,.7,.38,cloak);b(side*.51,.78,.08,.29,.23,.37,skin);b(side*.17,1.89,.42,.13,.11,.05,0x3b5143);leg(side*.24,0,.31,.56,0x4d614a);}
  if(protector){b(0,1.13,.36,.65,.67,.14,0xa6b8a3);b(0,1.21,.47,.19,.34,.06,0xdec98c);b(-.66,1.17,.14,.18,1.2,.63,0x6f8e76);b(-.79,1.17,.14,.08,.63,.31,0xcfcda6);b(.72,1.5,.12,.12,1.47,.15,0xc9d6c4);b(.72,1,.12,.38,.12,.19,0xc2ae75);for(const side of [-1,1]){b(side*.41,2.32,-.1,.17,.49,.19,0x8a9d80);b(side*.55,2.49,-.1,.35,.14,.19,0xc1bf91);}height=2.68;}
  else{b(.68,1.04,.12,.12,1.46,.13,0x8d7653);b(.68,1.82,.12,.4,.24,.32,0xb9c49b);b(-.68,1.12,.35,.15,.8,.43,0x94a88d);for(const y of [.78,1.48])b(-.69,y,.46,.49,.1,.1,0xc2b16f);b(-.69,1.13,.56,.05,.76,.05,0xdcdab7);b(.21,.97,-.41,.38,.68,.27,0x8c774e);height=2.44;}
 }
 const spec=Object.freeze({key:'tree-trained:'+raw,rawId:raw,name:TREE_TAG_UNITS[raw].name,parts:Object.freeze(parts),legs:Object.freeze(legs),wings:Object.freeze(wings),fur,muzzle,height,eyeLine,motion});cached.set(raw,spec);return spec;
}
export function buildTreeTrainedModel(unit,body,voxel){const key=treeTrainedModelKey(unit),spec=key&&treeTrainedSpec(key);if(!spec)return null;for(const p of spec.parts)voxel(body,...p);return spec;}
export function treeTrainedPortrait(value){const raw=rawKey(value);if(portraits.has(raw))return portraits.get(raw);const spec=treeTrainedSpec(raw);if(!spec)return '';const portrait=voxelTagPortrait([...spec.parts,...spec.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])],'tree-trained-portrait');portraits.set(raw,portrait);return portrait;}
