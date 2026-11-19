// Original voxel monsters: angular humanoids, stone demons and northern giants.
// Parts are merged into the renderer's shared vertex-colour body geometry.
// The same immutable specifications drive 3D actors and isometric HUD portraits.
export const NORDIC_MONSTER_KINDS=Object.freeze(['goblin','brute','ram','bat','champion','helhound']);
const specifications=new Map(),portraits=new Map();
const colours={
 goblin:{skin:0x79988e,shadow:0x496c68,cloth:0x3b5359,metal:0x899b99,trim:0xb7a579,eye:0xb7e6bc},
 brute:{skin:0x7b8c6c,shadow:0x53684f,cloth:0x655640,metal:0x87958a,trim:0xc9b482,eye:0xf1cb78},
 ram:{skin:0x897c98,shadow:0x5a4b6a,cloth:0x485967,metal:0x94a8a1,trim:0xd3c7a0,eye:0xc6dcd0},
 bat:{skin:0x85929d,shadow:0x566470,cloth:0x53646a,metal:0xaeb9bb,trim:0xc6caba,eye:0x9edbe3},
 champion:{skin:0x91bbc7,shadow:0x5f8a9b,cloth:0x546776,metal:0xc2d4d5,trim:0xe1d8b4,eye:0xe4fcf1},
 helhound:{skin:0x3f4856,shadow:0x293443,cloth:0x715d87,metal:0xa4a9b4,trim:0xd8d0b5,eye:0xbfa3ef}
};
const leg=(x,y,z,w,h,d,color)=>({x,y,z,w,h,d,color});
export function nordicMonsterSpec(kind){
 if(typeof kind!=='string'||!Object.hasOwn(colours,kind))return null;
 if(specifications.has(kind))return specifications.get(kind);
 const c=colours[kind],parts=[],legs=[],wings=[],box=(...p)=>parts.push(p);
 const eyes=(y,z,space=.23)=>{for(const side of [-1,1]){box(side*space,y,z,.16,.13,.055,c.eye);box(side*space-.025,y+.025,z+.035,.035,.045,.025,0xf0f1d4);}};
 const rune=(x,y,z,color=c.trim)=>{box(x,y,z,.05,.3,.035,color);box(x+.08,y+.055,z,.15,.04,.035,color);box(x+.08,y-.055,z,.15,.04,.035,color);};
 const belt=(y,w,z)=>{box(0,y,0,w,.16,z,c.cloth);box(0,y,z/2+.025,.27,.25,.08,c.trim);rune(0,y,z/2+.075,c.shadow);};
 const fang=(x,y,z,h=.2)=>box(x,y,z,.1,h,.08,c.trim);
 let height=3,eyeLine=2.35;
 if(kind==='goblin'){
  // Draugr: a cadaverous warrior with exposed ribs, a cleaver and a round shield.
  box(0,1.23,0,.88,1.05,.56,c.skin);box(0,1.48,.3,.8,.46,.13,c.cloth);
  for(const side of [-1,1])for(let i=0;i<3;i++)box(side*.25,1.1-i*.14,.32,.32,.065,.08,c.trim);
  box(0,2.06,.02,.64,.69,.59,c.skin);box(0,1.8,.26,.53,.2,.37,c.shadow);box(0,1.82,.47,.36,.12,.07,c.trim);
  eyes(2.14,.35,.2);box(0,2.28,.34,.69,.1,.13,c.shadow);box(0,2.35,.0,.74,.2,.68,c.metal);
  box(0,2.53,-.08,.13,.24,.41,c.trim);box(-.35,2.44,.02,.15,.27,.2,c.metal);box(.35,2.4,.02,.16,.18,.2,c.metal);
  for(const side of [-1,1]){box(side*.57,1.35,.05,.3,.85,.33,c.skin);box(side*.6,1.79,.0,.4,.28,.55,c.metal);box(side*.58,.96,.16,.3,.24,.34,c.shadow);legs.push(leg(side*.25,.39,.02,.32,.74,.4,c.cloth));}
  belt(.81,1.01,.65);box(0,1.34,-.36,.94,1.08,.14,c.cloth);box(0,.65,-.39,.86,.35,.13,c.shadow);
  // Distinct split-top iron shield and hooked sword, substantial at play zoom.
  box(-.94,1.2,.22,.17,1.05,.83,c.metal);box(-1.05,1.22,.23,.06,.75,.59,c.shadow);box(-1.09,1.22,.24,.055,.27,.27,c.trim);
  box(.68,1.04,.45,.13,.47,.14,c.cloth);box(.68,1.28,.45,.39,.1,.19,c.trim);box(.68,1.85,.45,.2,1.08,.16,c.metal);box(.8,2.39,.45,.38,.2,.17,c.metal);height=2.7;eyeLine=2.14;
 }
 if(kind==='brute'){
  // A broad two-legged jotun, hunched behind massive tusks and stone shoulders.
  box(0,1.65,-.08,1.37,1.4,.94,c.skin);box(0,2.18,-.25,1.54,.69,1.04,c.shadow);box(0,1.61,.44,1.17,.77,.15,c.skin);
  box(0,2.71,.3,.86,.84,.79,c.skin);box(0,2.43,.66,.88,.31,.49,c.shadow);box(0,2.57,.93,.57,.2,.17,c.skin);
  eyes(2.88,.74,.25);box(0,3.02,.71,1.0,.16,.19,c.shadow);for(const side of [-1,1]){box(side*.46,2.83,.26,.32,.18,.32,c.skin);fang(side*.31,2.54,.96,.4);box(side*.9,1.85,.02,.51,1.29,.62,c.skin);box(side*.93,1.19,.13,.58,.42,.65,c.shadow);box(side*.95,2.54,-.02,.76,.37,.94,c.metal);box(side*1.05,2.81,-.05,.23,.32,.3,c.trim);legs.push(leg(side*.4,.52,0,.5,1.0,.6,c.shadow));}
  belt(1.02,1.49,1.05);box(0,.75,.45,1.15,.39,.21,c.cloth);box(0,2.17,-.83,.95,.7,.13,c.cloth);rune(.07,1.54,.54);
  // A massive stone-headed club, visibly larger than the warrior's sword.
  box(1.09,1.38,.68,.2,1.35,.2,0x8f7552);box(1.09,2.18,.68,.88,.65,.62,c.metal);box(1.09,2.56,.68,.54,.17,.5,c.shadow);rune(1.01,2.2,1.005,c.trim);
  box(-.58,3.29,-.12,.26,.23,.31,c.cloth);box(-.25,3.35,-.14,.35,.3,.33,c.cloth);box(.12,3.3,-.13,.3,.24,.32,c.cloth);height=3.58;eyeLine=2.88;
 }
 if(kind==='ram'){
  // Upright northern satyr: curved horns, beard, narrow waist and dark hooves.
  box(0,1.31,-.05,.86,1.07,.59,c.skin);box(0,1.69,.22,.99,.49,.2,c.shadow);box(0,2.19,.18,.65,.75,.61,c.skin);
  box(0,2.05,.61,.48,.3,.36,c.shadow);box(0,1.84,.62,.25,.37,.24,c.trim);eyes(2.32,.52,.2);
  for(const side of [-1,1]){box(side*.37,2.26,.11,.3,.18,.36,c.skin);box(side*.34,2.65,-.02,.24,.5,.26,c.trim);box(side*.46,2.94,-.1,.42,.17,.32,c.trim);box(side*.68,2.82,-.07,.16,.32,.25,c.trim);box(side*.64,2.61,.02,.2,.17,.2,c.shadow);box(side*.56,1.45,.06,.29,.8,.32,c.skin);box(side*.58,1.07,.2,.28,.25,.31,c.shadow);legs.push(leg(side*.29,.42,.0,.33,.8,.48,c.shadow));box(side*.26,.84,-.17,.37,.4,.51,c.skin);}
  belt(.98,.94,.66);box(0,.87,.32,.7,.35,.18,c.cloth);box(0,1.31,-.67,.22,.2,.81,c.shadow);box(0,1.3,-1.13,.3,.27,.28,c.trim);
  // A crescent glaive identifies the raider role without an animal ram head.
  box(.75,1.4,.45,.13,2.08,.13,0x8c7454);box(.75,2.5,.45,.23,.29,.2,c.metal);box(.96,2.75,.45,.55,.14,.2,c.metal);box(1.25,2.64,.45,.18,.3,.2,c.metal);box(1.18,2.4,.45,.23,.18,.2,c.trim);rune(-.11,1.64,.34);height=3.06;eyeLine=2.32;
 }
 if(kind==='bat'){
  // A crouching gargoyle carved from cold stone; wings use the baked wing rig.
  box(0,1.11,-.03,.88,1.08,.66,c.skin);box(0,1.45,-.22,1.03,.66,.81,c.shadow);box(0,1.88,.29,.71,.66,.62,c.skin);
  box(0,1.75,.67,.55,.25,.25,c.shadow);box(0,1.59,.69,.37,.17,.18,c.trim);eyes(2.01,.63,.22);
  for(const side of [-1,1]){box(side*.31,2.29,.19,.2,.47,.23,c.metal);box(side*.43,2.52,.1,.34,.15,.21,c.metal);box(side*.58,1.15,.24,.29,.82,.37,c.skin);box(side*.59,.76,.36,.32,.24,.46,c.shadow);fang(side*.16,1.7,.82,.2);legs.push(leg(side*.26,.27,.11,.34,.5,.59,c.shadow));for(let i=0;i<3;i++)box(side*(.47+i*.08),.76,.62,.06,.11,.2,c.trim);
   wings.push({side,pivot:[side*.42,1.5,-.27],parts:[[side*.25,.25,-.02,.58,.17,.25,c.metal],[side*.68,.56,-.09,.42,.18,.24,c.metal],[side*.95,.78,-.16,.2,.3,.25,c.metal],[side*.4,.04,-.08,.6,.4,.16,c.shadow],[side*.77,.28,-.13,.31,.5,.14,c.skin],[side*.46,-.24,-.14,.44,.18,.14,c.skin]]});}
  box(0,.87,-.72,.22,.2,.65,c.shadow);box(0,.71,-1.1,.18,.31,.28,c.metal);box(0,1.2,.34,.39,.44,.13,c.cloth);rune(-.04,1.2,.43,c.eye);height=2.66;eyeLine=2.01;
 }
 if(kind==='champion'){
  // An ancient frost jotun: monumental shoulders, icy beard and runic hammer.
  box(0,1.84,-.05,1.53,1.7,1.01,c.skin);box(0,2.51,-.22,1.74,.81,1.12,c.shadow);box(0,2.01,.52,1.29,.76,.16,c.skin);
  box(0,3.12,.22,.93,.99,.83,c.skin);box(0,2.83,.67,.82,.36,.43,c.shadow);eyes(3.32,.69,.26);box(0,3.5,.69,1.02,.17,.19,c.shadow);
  for(const side of [-1,1]){box(side*.96,1.95,.03,.58,1.35,.69,c.skin);box(side*1.01,1.3,.2,.64,.47,.75,c.shadow);box(side*.97,2.85,-.04,.77,.4,1.07,c.metal);box(side*1.15,3.17,-.17,.24,.39,.32,0xd9eee4);box(side*.83,3.15,.24,.28,.38,.31,0xacd7de);legs.push(leg(side*.46,.58,.02,.58,1.12,.68,c.shadow));box(side*.36,3.74,.07,.24,.39,.25,c.metal);box(side*.5,3.94,-.04,.31,.16,.27,0xdceddc);}
  for(let i=-1;i<=1;i++){box(i*.22,2.63-Math.abs(i)*.1,.77,.25,.66-Math.abs(i)*.1,.27,c.metal);box(i*.22,2.25-Math.abs(i)*.1,.76,.2,.2,.21,0xdbe6da);}
  belt(1.08,1.66,1.15);box(0,.89,.55,1.11,.43,.18,c.cloth);box(0,2.24,-.71,1.2,1.12,.19,c.cloth);rune(-.13,1.75,.63,c.metal);
  box(1.15,1.65,.88,.22,1.83,.22,0x78949d);box(1.15,2.72,.88,1.13,.77,.77,c.metal);box(1.15,3.17,.88,.78,.17,.6,0xd5ece4);box(1.7,2.72,.88,.12,.62,.64,c.shadow);rune(1.08,2.74,1.29,c.shadow);height=4.1;eyeLine=3.32;
 }
 if(kind==='helhound'){
  // A low demonic hound with a jaw of exposed fangs, curved horns and stone hide.
  box(0,.99,-.21,1.1,.98,1.95,c.skin);box(0,1.32,.42,.97,.91,.95,c.shadow);box(0,1.73,.8,.83,.75,.77,c.skin);
  box(0,1.46,1.34,.71,.37,.67,c.shadow);box(0,1.23,1.36,.66,.14,.57,c.metal);box(0,1.31,1.67,.58,.12,.11,0x202c3a);eyes(1.88,1.2,.27);
  for(const side of [-1,1]){box(side*.4,2.13,.6,.23,.42,.27,c.metal);box(side*.52,2.38,.43,.39,.14,.26,c.trim);box(side*.71,2.27,.4,.14,.3,.23,c.trim);box(side*.53,1.34,-.3,.17,.71,1.09,c.cloth);for(const z of [-.66,.6])legs.push(leg(side*.4,.32,z,.29,.59,.39,c.shadow));for(let i=0;i<3;i++)fang(side*.27,1.35,1.2+i*.2,.26);}
  for(let i=0;i<5;i++){box(0,1.58-i*.035,.09-i*.37,.21,.39,.27,c.cloth);box(0,1.84-i*.035,.09-i*.37,.11,.15,.15,c.trim);}
  box(0,1.03,-1.5,.3,.28,.94,c.skin);box(0,1.18,-2.02,.24,.48,.23,c.cloth);box(0,1.49,-2.04,.32,.19,.28,c.trim);height=2.54;eyeLine=1.88;
 }
 const freezeParts=items=>Object.freeze(items.map(part=>Object.freeze(part)));
 const model=Object.freeze({kind,parts:freezeParts(parts),legs:Object.freeze(legs.map(p=>Object.freeze(p))),wings:Object.freeze(wings.map(w=>Object.freeze({...w,pivot:Object.freeze(w.pivot),parts:freezeParts(w.parts)}))),fur:c.skin,muzzle:c.trim,height,eyeLine});
 specifications.set(kind,model);return model;
}
export function buildNordicMonster(kind,body,voxel){
 const spec=nordicMonsterSpec(kind);if(!spec)return null;
 for(const part of spec.parts)voxel(body,...part);
 return spec;
}
const shade=(colour,tint)=>'#'+[16,8,0].map(shift=>Math.round(((colour>>shift)&255)*tint).toString(16).padStart(2,'0')).join('');
export function nordicMonsterPortrait(kind){
 const spec=nordicMonsterSpec(kind);if(!spec)return null;if(portraits.has(kind))return portraits.get(kind);
 const parts=[...spec.parts,...spec.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...spec.wings.flatMap(w=>w.parts.map(p=>[p[0]+w.pivot[0],p[1]+w.pivot[1],p[2]+w.pivot[2],...p.slice(3)]))],polygons=[],project=([x,y,z])=>[x*.88-z*.72,-y+z*.38+x*.27];
 for(const[x,y,z,w,h,d,colour]of parts){const a=x-w/2,b=x+w/2,l=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;for(const[corners,tint,depth]of [[[[a,t,n],[b,t,n],[b,t,f],[a,t,f]],1,x+z-.01],[[[b,l,n],[b,t,n],[b,t,f],[b,l,f]],.77,x+z+.02],[[[a,l,f],[a,t,f],[b,t,f],[b,l,f]],.9,x+z+.03]])polygons.push({points:corners.map(project),colour:shade(colour,tint),depth});}
 const all=polygons.flatMap(p=>p.points),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1])),scale=Math.min(79/(maxX-minX),66/(maxY-minY)),ox=(96-(maxX-minX)*scale)/2-minX*scale,oy=(76-(maxY-minY)*scale)/2-minY*scale;
 const svg=`<svg viewBox="0 0 96 80" class="army-portrait nordic-monster-portrait" aria-hidden="true"><path d="m5 66 43-12 43 12-43 12z" fill="#607f7c" opacity=".25"/>${polygons.sort((a,b)=>a.depth-b.depth).map(p=>`<polygon points="${p.points.map(([x,y])=>(x*scale+ox).toFixed(2)+','+(y*scale+oy).toFixed(2)).join(' ')}" fill="${p.colour}"/>`).join('')}</svg>`;
 portraits.set(kind,svg);return svg;
}
