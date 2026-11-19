import {voxelTagPortrait} from './tag-character-art.js';

// Original Nidavellir automaton: a low, six-legged insect rather than an animal
// reskin. Static boxes merge into one vertex-colour body; six leg descriptors
// use the renderer's existing baked locomotion frames without extra textures.
export const SCARAB_ART=Object.freeze({name:'Escaravelho rúnico',description:'Um pequeno autômato de Nidavellir. Seis patas de ferro sustentam sua carapaça de bronze, marcada por uma runa azul.'});
let cachedSpec=null,cachedPortrait='';
const valid=value=>value==='scarab'||value?.kind==='scarab';
export function scarabSpec(value='scarab'){
 if(!valid(value))return null;if(cachedSpec)return cachedSpec;
 const parts=[],legs=[],b=(...p)=>parts.push(p),bronze=0x9c8050,gold=0xd3b777,shadow=0x394f55,iron=0x627f82,light=0xa5c3bc,rune=0xa5e8e4;
 // Stepped oval abdomen; two wing-cases and a dark central seam read clearly
 // from the elevated camera, even at the summon’s small gameplay scale.
 b(0,.55,-.15,1.04,.45,1.48,shadow);b(0,.68,-.2,1.24,.37,1.18,bronze);
 for(const side of [-1,1]){
  b(side*.31,.88,-.24,.56,.25,1.09,bronze);b(side*.27,1.04,-.22,.44,.12,.82,gold);
  b(side*.59,.69,-.22,.13,.22,.86,iron);b(side*.47,.87,-.74,.26,.15,.17,gold);
 }
 b(0,.95,-.23,.075,.29,1.18,shadow);b(0,.7,-.92,.63,.25,.2,iron);
 // A separate head shield, tiny cyan eyes and curved, stepped mandibles.
 b(0,.65,.66,.78,.37,.58,iron);b(0,.87,.65,.63,.13,.44,bronze);
 b(0,.57,.98,.51,.17,.14,shadow);
 for(const side of [-1,1]){
  b(side*.28,.72,.95,.13,.12,.055,rune);b(side*.34,.5,1.07,.17,.2,.32,gold);
  b(side*.26,.48,1.28,.23,.16,.18,gold);b(side*.13,.52,1.3,.1,.19,.14,light);
  b(side*.42,.87,.83,.1,.1,.38,iron);b(side*.48,.91,1.04,.1,.12,.14,gold);
 }
 // Runic clasp bridges the shell without closing its visible centre seam.
 b(0,1.135,-.18,.35,.07,.4,shadow);b(0,1.18,-.18,.065,.035,.31,rune);
 b(.075,1.18,-.12,.16,.035,.055,rune);b(.075,1.18,-.25,.16,.035,.055,rune);
 // Three separated legs on each side. Wider knee/hip boxes belong to the
 // shell; slender outer segments are independently animated by the view.
 for(const side of [-1,1])for(const z of [-.64,-.05,.55]){
  b(side*.64,.5,z,.34,.17,.17,iron);b(side*.84,.42,z,.17,.21,.21,gold);
  legs.push(Object.freeze({x:side*.99,y:.23,z,w:.13,h:.44,d:.25,color:shadow}));
 }
 const freezeParts=Object.freeze(parts.map(Object.freeze));
 cachedSpec=Object.freeze({key:'scarab',kind:'scarab',parts:freezeParts,legs:Object.freeze(legs),wings:Object.freeze([]),fur:bronze,muzzle:gold,height:1.21,eyeLine:.72,motion:'insect'});return cachedSpec;
}
export function buildScarabModel(kind,body,voxel){const spec=scarabSpec(kind);if(!spec)return null;for(const p of spec.parts)voxel(body,...p);return spec;}
export function scarabPortrait(value='scarab'){
 if(!valid(value))return '';if(cachedPortrait)return cachedPortrait;const s=scarabSpec();
 cachedPortrait=voxelTagPortrait([...s.parts,...s.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])],'scarab-portrait');return cachedPortrait;
}
