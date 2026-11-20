import {ragnarokMonsterSpec} from './ragnarok-monster-art.js';
// Voxel characters for the legacy custom-map games. No Warcraft
// meshes or textures are imported. Model boxes also drive their HUD portraits.
const TREE_KEYS=new Set(['ent','blaze','pyra','burnin']);
const WARLOCK_KEYS=new Set(['warlock','heretic','occultist','inquisitor']);
const specs=new Map(),portraits=new Map();
export function legacyCharacterModelKey(unit){
 const tree=unit?.treeTagCharacter||(unit?.treeTagSummon?(unit.kind==='treant'?'ent':unit.kind==='infernal'?'blaze':null):null),warlock=unit?.warlockCharacter;
 if(typeof tree==='string'&&TREE_KEYS.has(tree))return 'tree:'+tree;
 if(typeof warlock==='string'&&WARLOCK_KEYS.has(warlock))return 'warlock:'+warlock;
 return null;
}
const leg=(x,y,z,w,h,d,color)=>({x,y,z,w,h,d,color});
export function legacyCharacterSpec(key){
 if(typeof key!=='string'||key.split(':').length!==2)return null;const[mode,kind]=key.split(':');if(!(mode==='tree'?TREE_KEYS.has(kind):mode==='warlock'&&WARLOCK_KEYS.has(kind)))return null;
 if(specs.has(key))return specs.get(key);
 if(key==='tree:ent'){
  const sculpture=ragnarokMonsterSpec('willow'),spec=Object.freeze({...sculpture,key,ragnarokVisual:'willow',muzzle:0xbd9580});specs.set(key,spec);return spec;
 }
 const parts=[],legs=[],box=(...p)=>parts.push(p);let fur=0x806a47,muzzle=0xd7c59a,height=3,eyeLine=2;
 if(mode==='tree'){
  const palette=kind==='blaze'?{rock:0x505d52,dark:0x313d35,edge:0x7f8c6c,flame:0x99cc5e,core:0xd8ed91}:kind==='pyra'?{rock:0x65574e,dark:0x423830,edge:0x918270,flame:0xeaa04d,core:0xffd681}:{rock:0x565266,dark:0x353348,edge:0x8c859c,flame:0xa990e1,core:0xe0cefa};
  const c=palette;fur=c.rock;muzzle=c.edge;
  // Each infernal is a massive stone golem, with clear gaps of living flame.
  box(0,1.92,-.05,1.39,1.44,.92,c.dark);box(0,2.02,.02,1.2,1.19,1.07,c.flame);
  box(-.34,2.28,.36,.68,.65,.45,c.rock);box(.37,2.31,.35,.61,.71,.47,c.rock);box(0,1.61,.42,1.17,.41,.36,c.rock);box(0,2.28,.66,.22,.36,.1,c.core);box(0,1.76,.62,.25,.18,.1,c.flame);
  box(0,3.12,.08,.85,.8,.76,c.rock);box(0,2.85,.44,.84,.26,.45,c.dark);box(0,3.12,.51,.41,.27,.13,c.flame);box(0,3.01,.6,.48,.09,.07,c.core);
  for(const side of [-1,1]){box(side*.23,3.35,.51,.18,.12,.06,c.core);box(side*.24,3.48,.47,.43,.16,.17,c.dark);box(side*.99,2.69,-.05,.91,.61,1.06,c.rock);box(side*1.01,2.31,.01,.55,.43,.62,c.flame);box(side*1.06,1.85,.02,.68,.76,.72,c.rock);box(side*1.11,1.32,.17,.78,.46,.82,c.dark);box(side*1.11,1.34,.6,.54,.13,.08,c.flame);box(side*.88,3.08,-.16,.38,.29,.41,c.edge);box(side*1.24,3.17,-.16,.24,.49,.31,c.rock);legs.push(leg(side*.46,.61,.03,.67,1.16,.83,c.rock));box(side*.48,.94,.41,.48,.25,.15,c.flame);}
  box(0,1.18,0,1.33,.22,.92,c.flame);box(0,1.02,.26,1.49,.27,.72,c.dark);box(0,2.35,-.62,.7,.8,.2,c.rock);
  if(kind==='blaze'){
   // Green infernal: a vertical crest and two separated shoulder flame stacks.
   box(0,3.7,-.05,.35,.35,.43,c.flame);box(0,3.98,-.08,.17,.24,.23,c.core);for(const side of [-1,1]){box(side*.83,3.47,-.1,.2,.55,.23,c.flame);box(side*.9,3.81,-.12,.12,.23,.17,c.core);box(side*.42,3.58,.08,.22,.2,.25,c.edge);}
   height=4.15;
  }else if(kind==='pyra'){
   // Heavy fire infernal: broad ridged shoulders and a crown of ember horns.
   box(0,2.65,-.31,1.88,.49,.93,c.rock);for(const side of [-1,1]){box(side*.4,3.68,.0,.22,.47,.28,c.flame);box(side*.55,3.95,-.08,.36,.14,.27,c.core);box(side*1.42,2.94,-.07,.24,.45,.4,c.edge);box(side*1.47,3.23,-.07,.15,.23,.25,c.flame);}
   box(0,2.1,.72,.36,.61,.13,c.core);height=4.08;
  }else{
   // Hel infernal: asymmetric broken monolith plates and pale horned crown.
   for(const side of [-1,1]){box(side*.34,3.78,-.04,.21,.49,.25,c.edge);box(side*.48,4.04,-.13,.34,.15,.28,c.flame);box(side*.47,1.92,.63,.17,.62,.12,c.flame);}
   box(-1.35,2.96,-.16,.37,.75,.49,c.rock);box(-1.35,3.44,-.16,.22,.25,.31,c.core);box(.43,2.71,-.62,.31,.44,.23,c.flame);height=4.18;
  }
  eyeLine=3.35;
 }else{
  const palette=kind==='warlock'?{robe:0x8b4c46,dark:0x4e3338,trim:0xb8a06c,skin:0xb7a58d,glow:0xf3b763}:kind==='heretic'?{robe:0x746087,dark:0x40344f,trim:0xbaa1ba,skin:0xb7b2a4,glow:0xd6b3eb}:kind==='occultist'?{robe:0x3e7771,dark:0x284e52,trim:0x96b7a2,skin:0xb4bfa8,glow:0xa9e1bf}:{robe:0xd1c9ab,dark:0x706c66,trim:0xc0a46a,skin:0xc5b295,glow:0xf1dfa0};
  const c=palette;fur=c.robe;muzzle=c.skin;
  // Robes have an independent flared hem, hood cavity and feet, not an animal.
  box(0,1.16,-.04,.84,1.21,.62,c.robe);box(0,.59,-.02,1.0,.33,.76,c.robe);box(0,.37,-.02,1.1,.21,.83,c.dark);box(0,1.19,.32,.16,1.09,.08,c.trim);box(0,.74,.39,.27,.18,.06,c.trim);
  box(0,2.07,.03,.79,.83,.68,c.dark);box(0,2.15,.41,.49,.46,.1,c.skin);box(0,2.32,.46,.54,.15,.08,c.dark);box(0,1.89,.42,.56,.14,.08,c.dark);
  for(const side of [-1,1]){box(side*.34,2.1,.33,.15,.65,.23,c.robe);box(side*.14,2.13,.48,.07,.09,.025,kind==='inquisitor'?0x65563e:c.glow);box(side*.54,1.24,.02,.28,.85,.42,c.robe);box(side*.55,.88,.2,.22,.22,.28,c.skin);legs.push(leg(side*.22,.15,.05,.28,.28,.39,c.dark));}
  box(0,2.52,-.02,.68,.24,.59,c.robe);box(0,2.72,-.1,.44,.2,.43,c.robe);box(0,2.87,-.17,.25,.14,.27,c.dark);box(0,1.16,-.41,.92,1.34,.16,c.dark);box(0,.46,-.46,1.05,.29,.19,c.robe);
  // Basic Warcraft-style staff, set off to one side, with family-specific focus.
  box(-.76,1.26,.29,.12,2.15,.12,0x8d7654);box(-.76,2.38,.29,.28,.14,.26,c.trim);
  if(kind==='warlock'){
   box(-.76,2.65,.29,.36,.42,.35,c.glow);box(-.76,2.96,.29,.16,.23,.17,0xffdf91);box(.66,1.19,.09,.27,.54,.5,c.dark);box(.66,1.2,.36,.25,.44,.07,c.trim);box(.66,1.2,.41,.1,.23,.035,c.robe);
  }else if(kind==='heretic'){
   for(const side of [-1,1]){box(side*.52,1.76,-.02,.43,.24,.61,c.dark);box(side*.68,1.98,-.07,.15,.28,.23,c.trim);}
   box(-.76,2.65,.29,.42,.36,.38,c.glow);box(-.76,2.93,.29,.16,.22,.16,c.trim);box(.67,1.1,.14,.3,.6,.47,c.trim);box(.67,1.12,.4,.22,.49,.055,c.dark);box(.69,.91,.44,.1,.23,.04,c.glow);
  }else if(kind==='occultist'){
   for(const side of [-1,1]){box(-.76+side*.22,2.68,.29,.13,.58,.16,c.trim);box(-.76+side*.17,2.99,.29,.25,.12,.16,c.trim);box(side*.48,1.64,-.29,.26,.25,.28,c.robe);}
   box(-.76,2.72,.29,.21,.3,.2,c.glow);box(.66,1.07,.13,.31,.57,.35,c.dark);box(.66,1.12,.34,.23,.33,.08,c.glow);box(.66,1.41,.13,.38,.11,.41,c.trim);box(0,2.91,-.25,.2,.29,.22,c.robe);
  }else{
   box(-.76,2.73,.29,.16,.59,.17,c.trim);box(-.76,2.78,.29,.56,.12,.19,c.trim);box(-.76,3.07,.29,.19,.15,.21,c.glow);box(0,1.61,.36,.36,.16,.07,c.trim);box(.68,1.18,.12,.27,.66,.34,c.dark);box(.68,1.18,.33,.2,.52,.08,c.robe);box(.68,1.55,.12,.31,.12,.38,c.trim);
  }
  height=3.2;eyeLine=2.13;
 }
 const frozen=Object.freeze({key,parts:Object.freeze(parts.map(p=>Object.freeze(p))),legs:Object.freeze(legs.map(p=>Object.freeze(p))),wings:Object.freeze([]),fur,muzzle,height,eyeLine});specs.set(key,frozen);return frozen;
}
export function buildLegacyCharacterModel(unit,body,voxel){
 const spec=legacyCharacterSpec(legacyCharacterModelKey(unit));if(!spec)return null;for(const p of spec.parts)voxel(body,...p);return spec;
}
const shade=(colour,tint)=>'#'+[16,8,0].map(shift=>Math.round(((colour>>shift)&255)*tint).toString(16).padStart(2,'0')).join('');
export function legacyCharacterPortrait(mode,kind){
 const key=(mode==='tree'||mode==='treetag'?'tree':mode==='warlock'?'warlock':'')+':'+kind,spec=legacyCharacterSpec(key);if(!spec)return '';if(portraits.has(key))return portraits.get(key);
 const parts=[...spec.parts,...spec.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])],polygons=[],project=([x,y,z])=>[x*.88-z*.72,-y+z*.38+x*.27];
 for(const[x,y,z,w,h,d,colour]of parts){const a=x-w/2,b=x+w/2,l=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;for(const[corners,tint,depth]of [[[[a,t,n],[b,t,n],[b,t,f],[a,t,f]],1,x+z-.01],[[[b,l,n],[b,t,n],[b,t,f],[b,l,f]],.77,x+z+.02],[[[a,l,f],[a,t,f],[b,t,f],[b,l,f]],.9,x+z+.03]])polygons.push({points:corners.map(project),colour:shade(colour,tint),depth});}
 const all=polygons.flatMap(p=>p.points),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1])),scale=Math.min(79/(maxX-minX),66/(maxY-minY)),ox=(96-(maxX-minX)*scale)/2-minX*scale,oy=(76-(maxY-minY)*scale)/2-minY*scale;
 const svg=`<svg viewBox="0 0 96 80" class="army-portrait legacy-character-portrait" aria-hidden="true"><path d="m5 66 43-12 43 12-43 12z" fill="#607f7c" opacity=".25"/>${polygons.sort((a,b)=>a.depth-b.depth).map(p=>`<polygon points="${p.points.map(([x,y])=>(x*scale+ox).toFixed(2)+','+(y*scale+oy).toFixed(2)).join(' ')}" fill="${p.colour}"/>`).join('')}</svg>`;portraits.set(key,svg);return svg;
}
