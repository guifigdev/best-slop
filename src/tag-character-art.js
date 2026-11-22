import {refineStarterSurfaces,starterGarmentRelief} from './starter-surface-detail.js';
import {ragnarokMonsterSpec} from './ragnarok-monster-art.js';
// Voxel workers and kodos. Descriptors supply the same boxes to the
// renderer and to selection portraits; no Warcraft models are imported.
const cache=new Map(),portraits=new Map();
export function tagCharacterKey(u){
 if(u?.treeTagSummon&&u.kind==='waterElemental')return 'elemental:water';
 if(u?.kodoTagKodo)return 'kodo:'+String(u.unitKey||u.rawId||u.kind||'normal');
 if(u?.kodoTagCharacter)return 'runner';
 if(u?.kodoTagSoldier)return 'soldier:'+String(u.unitKey||u.rawId||'hC10');
 if(u?.kodoTagWorker)return 'worker:'+String(u.workerType||u.unitKey||u.rawId||'peasant');
 if(u?.treeTagWorker)return 'tree-worker:'+String(u.workerType||u.rawId||u.unitKey||'uC43');
 return null;
}
export function tagCharacterSpec(key){
 if(typeof key!=='string'||!(/^(runner|(kodo|worker|tree-worker|soldier|elemental):[a-zA-Z0-9_-]+)$/.test(key)))return null;if(cache.has(key))return cache.get(key);
 if(key==='soldier:hC12'){
  const sculpture=ragnarokMonsterSpec('archerskeleton'),spec=Object.freeze({...sculpture,key,ragnarokVisual:'archerskeleton',muzzle:0xd9cfab});cache.set(key,spec);return spec;
 }
 const parts=[],legs=[],wings=[],b=(...p)=>parts.push(p),leg=(x,z,color,w=.3,h=.48)=>legs.push({x,y:h/2+.04,z,w,h,d:.4,color});let fur=0xc3aa86,muzzle=0xe0c5a2,height=2.45,eyeLine=1.77;
 if(key.startsWith('kodo:')){
  fur=0x9b9b80;muzzle=0xc6c2a2;
  b(0,1.03,-.12,1.65,1.23,2.24,fur);b(0,1.41,.97,1.24,.9,1.05,fur);b(0,1.17,1.6,1.07,.5,.61,muzzle);b(0,1.35,1.92,.69,.17,.08,0x5b6252);
  for(const side of [-1,1]){b(side*.49,1.72,1.49,.18,.17,.06,0x293b35);b(side*.71,1.64,.76,.35,.39,.33,0x777e69);b(side*.53,1.03,1.53,.2,.67,.24,0xe6dcbc);b(side*.57,1.38,1.69,.2,.32,.2,0xe6dcbc);leg(side*.56,-.71,0x7b826d,.43,.72);leg(side*.56,.65,0x7b826d,.43,.72);}
  b(0,1.36,-1.46,.24,.23,.71,fur);b(0,1.05,-1.8,.23,.49,.2,0x6e7564);b(0,1.69,-.28,1.51,.34,1.67,0x8a9279);b(0,1.91,-.4,1.1,.19,1.29,0xa9ac8b);
  for(const z of [-.69,-.2,.29])b(0,2.04,z,.34,.18,.23,0xb1b298);height=2.46;eyeLine=1.72;
 }else if(key==='elemental:water'){
  fur=0x7db9c2;muzzle=0xc4eadb;b(0,1.03,0,.96,1.1,.66,fur);b(0,1.91,.02,.74,.7,.69,0x9ed8d3);b(0,.45,0,1.04,.34,.78,0x528c9d);for(const side of [-1,1]){b(side*.65,1.11,.06,.37,.97,.43,fur);b(side*.65,.67,.25,.45,.32,.5,0xb2e6da);b(side*.2,2.03,.39,.14,.1,.045,0xe8f2ca);leg(side*.27,0,0x5d9baa,.39,.43);}b(0,2.36,.02,.26,.23,.28,0xcdebdc);height=2.51;eyeLine=2.03;
 }else if(key==='soldier:eC17'){
  fur=0x886d4c;for(const side of [-1,1])for(const z of [-.6,.6])b(side*.62,.32,z,.3,.6,.53,0x536356);b(0,.65,0,1.2,.35,1.6,fur);b(0,1.03,0,.14,.23,2.1,0x9a7d51);for(const side of [-1,1]){b(side*.54,1.11,.57,1.0,.14,.17,0xbc9f67);b(side*.89,1.11,.81,.13,.13,.62,0xc3cbb7);}b(0,1.16,1.17,.1,.11,.45,0xe5ddbd);height=1.42;eyeLine=1.07;
 }else if(key==='tree-worker:e001'){
  fur=0xa8d5a0;muzzle=0xe6e6ae;for(const [x,y,z,w,h,d,c]of [[0,1.0,0,.56,.56,.56,0xa1d59b],[0,1.0,.31,.33,.32,.1,0xe1edb5],[0,1.41,0,.2,.24,.22,0xdbe8ae],[-.4,.87,.02,.22,.18,.26,0x80b98b],[.4,1.1,.02,.22,.2,.26,0xc9e7a9],[0,.57,-.08,.19,.25,.19,0x8aaf7b]])b(x,y,z,w,h,d,c);height=1.58;eyeLine=1.06;
 }else{
  const advanced=key==='tree-worker:uC43',nature=key==='tree-worker:e002',orc=/peon|opeo|orc/i.test(key),cloth=advanced?0x606b79:nature?0x6a9270:orc?0x7a6749:0x6c7e94,skin=orc?0x86a06a:0xc7ad8c;fur=skin;muzzle=skin;
  b(0,1.02,0,.77,.91,.56,cloth);b(0,1.8,.03,.69,.63,.62,skin);b(0,1.59,.37,.27,.16,.17,skin);b(0,.6,.02,.84,.14,.62,0x4d5042);b(0,.64,.36,.2,.2,.08,0xd2b775);
  for(const side of [-1,1]){b(side*.52,1.08,0,.27,.61,.32,cloth);b(side*.52,.78,.02,.28,.23,.35,skin);b(side*.18,1.86,.37,.12,.13,.045,0x334339);leg(side*.24,0,0x4b554b);}
  if(advanced){b(0,2.14,-.06,.9,.28,.76,0x72856b);for(const side of [-1,1])b(side*.4,1.82,-.05,.19,.55,.72,0x72856b);b(0,1.18,.33,.59,.57,.12,0x9ba48c);b(-.71,.98,.19,.13,1.04,.14,0x866c4c);b(-.71,1.61,.19,.65,.33,.38,0xb0b6a7);b(.65,1.08,.23,.15,.66,.36,0xc7d6a9);}
  else if(nature){b(0,2.13,-.05,.84,.25,.73,0xc3b18c);for(const side of [-1,1])b(side*.36,1.72,-.04,.17,.7,.68,0xc3b18c);b(-.7,1.12,.13,.1,1.62,.11,0x7a6849);b(-.7,2.08,.13,.48,.37,.34,0x8cba81);b(-.7,2.37,.13,.23,.24,.22,0xd8e6ad);}
  else if(key.startsWith('soldier:')){b(0,2.1,-.04,.79,.2,.71,0x6a8c98);b(0,1.16,.34,.69,.56,.13,0x90a8a4);}
  else{b(0,2.1,-.04,.81,.22,.7,0x8d7857);b(0,1.35,.37,.58,.24,.14,0xa88960);b(0,.88,.33,.61,.47,.13,0xa28b63);b(-.7,1.02,.14,.12,1.14,.12,0x8b6c49);b(-.7,1.66,.14,.83,.17,.22,0xaab8ad);b(-1.08,1.53,.14,.15,.29,.2,0xaab8ad);b(.57,1.44,-.28,.31,.36,.33,0xb69b60);}
 }
 if(key==='runner'){b(0,2.12,.02,.87,.22,.73,0x9aadae);b(0,1.53,.43,.61,.32,.2,0xc7c5ad);b(0,1.25,.44,.43,.25,.19,0xa7ad9d);for(const side of [-1,1])b(side*.48,1.47,0,.43,.23,.61,0x9aaeb0);b(-.7,1.68,.14,.71,.37,.4,0xa6b6ae);}
 if(key==='soldier:hC10'){b(0,2.13,.03,.79,.25,.71,0x9dafb1);b(0,1.07,.33,.7,.55,.16,0x9dafb1);b(-.67,1.05,.29,.19,.81,.7,0x6b8794);b(.7,1.38,.25,.12,1.47,.14,0xd4dfd2);}
 if(key==='runner'||key.startsWith('worker:'))starterGarmentRelief(parts,{cloth:fur,trim:0xc8b181});const spec=Object.freeze({key,parts:Object.freeze(refineStarterSurfaces(parts).map(Object.freeze)),legs:Object.freeze(legs),wings:Object.freeze(wings),fur,muzzle,height,eyeLine});cache.set(key,spec);return spec;
}
export function buildTagCharacter(u,body,voxel){const spec=tagCharacterSpec(tagCharacterKey(u));if(!spec)return null;for(const p of spec.parts)voxel(body,...p);return spec;}
export function voxelTagPortrait(parts,className='tag-portrait'){
 if(!parts.length)return '';const polygons=[],project=([x,y,z])=>[x*.88-z*.72,-y+z*.38+x*.27],shade=(c,t)=>'#'+[16,8,0].map(s=>Math.round(((c>>s)&255)*t).toString(16).padStart(2,'0')).join('');
 for(const[x,y,z,w,h,d,c]of parts){const a=x-w/2,b=x+w/2,l=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;for(const[corners,tint,depth]of [[[[a,t,n],[b,t,n],[b,t,f],[a,t,f]],1,x+z-.01],[[[b,l,n],[b,t,n],[b,t,f],[b,l,f]],.77,x+z+.02],[[[a,l,f],[a,t,f],[b,t,f],[b,l,f]],.9,x+z+.03]])polygons.push({points:corners.map(project),color:shade(c,tint),depth});}
 const all=polygons.flatMap(p=>p.points),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1])),scale=Math.min(79/Math.max(.1,maxX-minX),66/Math.max(.1,maxY-minY)),ox=(96-(maxX-minX)*scale)/2-minX*scale,oy=(76-(maxY-minY)*scale)/2-minY*scale;
 return `<svg viewBox="0 0 96 80" aria-hidden="true" class="army-portrait ${className}"><path d="m5 66 43-12 43 12-43 12z" fill="#78946b" opacity=".2"/>${polygons.sort((a,b)=>a.depth-b.depth).map(p=>`<polygon points="${p.points.map(([x,y])=>(x*scale+ox).toFixed(2)+','+(y*scale+oy).toFixed(2)).join(' ')}" fill="${p.color}"/>`).join('')}</svg>`;
}
export function tagCharacterPortrait(value){const key=typeof value==='string'?value:tagCharacterKey(value);if(portraits.has(key))return portraits.get(key);const s=tagCharacterSpec(key);if(!s)return '';const svg=voxelTagPortrait([...s.parts,...s.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])]);portraits.set(key,svg);return svg;}
