import {refineStarterSurfaces,starterGarmentRelief} from './starter-surface-detail.js';
// Independent faction builders. Stable Castle Fight identity keys choose these
// original vertex-colour models; combat heroes and animal NPCs keep their art.
const palettes=Object.freeze({
 knight:{skin:0xd4b391,cloth:0x5d8296,trim:0xd6bc7e,metal:0xaab9b7,hair:0x806144},
 mage:{skin:0xe4d4b5,cloth:0x548b78,trim:0xe2cd86,metal:0xadbcb0,hair:0xd7c18d},
 ranger:{skin:0xa68db8,cloth:0x555d86,trim:0xd2d4c4,metal:0x9eafba,hair:0xbdd0d4},
 turtle:{skin:0x72a49b,cloth:0x4b776d,trim:0xd6c886,metal:0xa1b5a5,hair:0x4c827c},
 owl:{skin:0xc5c5b3,cloth:0x5e849b,trim:0xe0d1a1,metal:0xa4bdc3,hair:0xe4e4d4},
 raccoon:{skin:0x8fa76f,cloth:0x68776b,trim:0xd7b775,metal:0xa5b6b2,hair:0x57634e},
 orc:{skin:0x7c9a62,cloth:0x866646,trim:0xc7a56a,metal:0x94a19a,hair:0x465341},
 undead:{skin:0xaeb9aa,cloth:0x4e576c,trim:0xb8cabb,metal:0x8f9f9f,hair:0x394957},
 chaos:{skin:0xad7362,cloth:0x65515c,trim:0xe0b566,metal:0x92939b,hair:0x553d42},
 corrupted:{skin:0x7b7264,cloth:0x657354,trim:0xb4a6bd,metal:0x96a99b,hair:0x8c799f}
});
const cache=new Map(),portraits=new Map(),DARK=0x2f403c,IVORY=0xe9e0c4;
const valid=key=>typeof key==='string'&&Object.hasOwn(palettes,key);
export function castleBuilderSpec(key){
 if(!valid(key))return null;if(cache.has(key))return cache.get(key);
 const c=palettes[key],boxes=[],legs=[],wings=[],b=(...p)=>boxes.push(p),leg=(x,color=c.cloth,h=.43)=>legs.push({x,y:h/2+.05,z:0,w:.3,h,d:.42,color});
 const eyes=(y=1.85,z=.415,glow=DARK)=>{for(const side of [-1,1]){b(side*.18,y,z,.12,.15,.05,glow);b(side*.18-.022,y+.032,z+.035,.033,.04,.02,IVORY);}};
 const head=(skin=c.skin)=>{b(0,1.76,.02,.75,.7,.68,skin);b(0,1.61,.4,.19,.17,.15,skin);eyes();};
 const body=(cloth=c.cloth,skin=c.skin)=>{b(0,.99,0,.81,.88,.58,cloth);b(0,.61,.025,.9,.16,.67,0x4e5042);b(0,.65,.39,.24,.19,.08,c.trim);for(const side of [-1,1]){b(side*.55,1.03,0,.29,.67,.34,cloth);b(side*.55,.72,.04,.29,.24,.36,skin);}leg(-.24);leg(.24);head(skin);};
 const apron=()=>{b(0,.87,.36,.64,.75,.14,c.cloth);b(0,.54,.38,.71,.12,.16,c.trim);b(-.2,1.06,.45,.22,.2,.05,c.metal);};
 const mallet=(x=.76,y=1.03)=>{b(x,y,.23,.13,1,.13,0x806747);b(x,y+.58,.23,.7,.35,.43,c.metal);b(x,y+.79,.23,.56,.08,.34,IVORY);};
 const robe=()=>{b(0,.51,.02,1.01,.42,.76,c.cloth);b(0,.27,.03,1.1,.15,.81,c.trim);};
 const scroll=(x=-.76)=>{b(x,1.06,.26,.42,.62,.18,IVORY);b(x,1.4,.26,.49,.12,.23,c.trim);b(x,.72,.26,.49,.12,.23,c.trim);b(x,1.06,.38,.27,.06,.025,c.cloth);};
 const hood=()=>{b(0,2.12,-.04,.91,.26,.84,c.cloth);b(0,2.31,-.08,.6,.17,.56,c.cloth);for(const side of [-1,1])b(side*.41,1.83,-.05,.21,.56,.77,c.cloth);};
 const pointedEars=()=>{for(const side of [-1,1]){b(side*.48,1.89,.03,.36,.14,.22,c.skin);b(side*.67,1.96,.02,.18,.1,.16,c.skin);}};
 let eyeLine=1.85;
 if(key==='knight'){
  body();apron();mallet();scroll(-.78);b(0,2.12,-.02,.85,.2,.76,c.hair);for(const side of [-1,1]){b(side*.36,1.88,-.08,.17,.47,.66,c.hair);b(side*.42,1.43,0,.35,.16,.62,c.metal);}b(0,1.52,.42,.44,.13,.11,c.hair);b(0,2.14,.39,.77,.1,.1,c.trim);b(0,2.22,.4,.21,.18,.11,c.metal);
 }else if(key==='mage'){
  body();robe();pointedEars();for(const side of [-1,1])b(side*.35,1.77,-.09,.18,.79,.69,c.hair);b(0,2.12,0,.85,.18,.76,c.hair);b(0,2.11,.42,.83,.1,.1,c.trim);b(0,2.25,.45,.16,.31,.12,0xa2c9ce);scroll();b(.74,1.25,.14,.11,1.76,.12,0x8b7550);b(.74,2.25,.14,.42,.44,.38,c.metal);b(.74,2.56,.14,.23,.2,.24,0xc3e3cf);b(0,1.36,.37,.23,.22,.07,c.trim);
 }else if(key==='ranger'){
  body();robe();hood();pointedEars();for(const side of [-1,1]){b(side*.23,1.57,.38,.13,.37,.13,c.hair);b(side*.45,1.41,0,.38,.2,.61,c.metal);}b(0,2.23,.45,.5,.1,.12,c.trim);for(const side of [-1,1])b(side*.25,2.34,.45,.1,.2,.12,c.trim);b(0,1.02,-.4,1.02,1.1,.17,c.cloth);scroll(-.79);b(.72,1.15,.2,.12,1.45,.12,c.metal);b(.72,1.94,.2,.44,.17,.3,c.trim);b(.72,2.12,.2,.13,.3,.14,c.metal);
 }else if(key==='turtle'){
  // A long tapered tail replaces the legs; the upper body is a naga craftsperson.
  for(let i=0;i<5;i++)b(0,.18+i*.12,-.79+i*.25,1.1-i*.12,.25,1.08-i*.11,i%2?c.skin:c.hair);
  b(0,1.13,.04,.79,1.18,.57,c.cloth);head();for(const side of [-1,1]){b(side*.55,1.13,.07,.28,.77,.34,c.skin);b(side*.55,.78,.15,.29,.23,.35,c.skin);b(side*.41,1.96,-.07,.3,.56,.14,c.trim);b(side*.55,2.12,-.07,.2,.24,.13,c.hair);}b(0,2.11,-.02,.14,.6,.33,c.hair);b(0,1.23,-.32,.14,1.13,.26,c.trim);scroll(-.79);mallet(.78,1.02);b(0,1.12,.36,.21,.23,.07,c.trim);
 }else if(key==='owl'){
  body();apron();mallet(.83,1.04);scroll(-.81);b(0,2.12,.01,.88,.23,.8,c.metal);for(const side of [-1,1]){b(side*.39,1.91,0,.19,.46,.72,c.metal);b(side*.44,1.45,.01,.45,.24,.68,c.hair);b(side*.23,1.56,.4,.19,.37,.2,c.hair);}b(0,1.48,.45,.55,.23,.18,c.hair);b(0,1.26,.47,.4,.24,.2,c.hair);b(0,1.06,.48,.21,.17,.17,c.hair);b(0,2.17,.44,.79,.12,.11,c.trim);b(0,2.31,.02,.24,.22,.32,0xcbe0da);b(0,1.12,-.41,.9,.86,.2,c.cloth);
 }else if(key==='raccoon'){
  body();apron();pointedEars();b(0,1.65,.42,.44,.16,.1,c.skin);b(0,2.11,.01,.88,.18,.76,c.cloth);b(0,2.13,.39,.81,.13,.13,c.trim);for(const side of [-1,1]){b(side*.2,2.15,.47,.3,.23,.12,c.metal);b(side*.2,2.15,.55,.19,.15,.055,0x8ebcc5);}b(0,2.15,.48,.16,.09,.09,c.trim);b(0,1.18,-.47,.83,.94,.41,c.metal);for(const side of [-1,1]){b(side*.27,1.3,-.74,.23,.75,.2,c.trim);b(side*.27,1.71,-.74,.27,.14,.25,DARK);}mallet(-.8,.9);b(.78,.98,.22,.14,1.08,.14,c.metal);b(.78,1.62,.22,.49,.16,.2,c.metal);b(.56,1.78,.22,.14,.23,.2,c.metal);b(1,1.78,.22,.14,.23,.2,c.metal);
 }else if(key==='orc'){
  body();apron();b(0,1.53,.34,.83,.34,.36,c.skin);for(const side of [-1,1]){b(side*.29,1.48,.56,.13,.32,.14,IVORY);b(side*.51,1.83,.03,.32,.2,.25,c.skin);b(side*.47,1.39,.02,.49,.29,.73,c.cloth);}b(0,2.13,-.06,.54,.2,.62,c.hair);b(0,2.34,-.14,.23,.3,.31,c.hair);mallet(.86,1.02);scroll(-.83);b(0,1.12,-.4,.81,.83,.3,0x735d45);b(0,1.6,-.4,.85,.12,.34,c.trim);
 }else if(key==='undead'){
  body();robe();hood();eyes(1.85,.45,0xb4dfcd);b(0,1.56,.4,.47,.22,.13,c.skin);for(const x of [-.16,0,.16])b(x,1.56,.48,.055,.13,.035,DARK);b(0,1.74,.46,.13,.17,.04,DARK);for(const side of [-1,1])b(side*.45,1.41,0,.35,.18,.64,c.metal);scroll(-.8);b(.76,1.16,.13,.11,1.8,.12,0x756b5f);b(.76,2.18,.13,.42,.45,.38,c.skin);b(.76,2.19,.35,.28,.18,.05,DARK);for(const side of [-1,1])b(.76+side*.08,2.2,.38,.06,.07,.025,0xb7e2cf);b(.76,2.49,.13,.21,.19,.23,0xa9d4bb);
 }else if(key==='chaos'){
  body();apron();for(const side of [-1,1]){b(side*.35,2.16,-.02,.2,.44,.25,IVORY);b(side*.48,2.42,-.08,.22,.21,.19,c.trim);b(side*.52,2.61,-.12,.15,.2,.15,IVORY);b(side*.44,1.42,.03,.43,.24,.67,c.metal);b(side*.12,1.56,.47,.08,.17,.07,IVORY);}eyes(1.85,.45,0xe7be7d);b(0,2.09,.01,.67,.14,.64,c.hair);b(0,1.12,-.42,.96,1.13,.17,c.cloth);mallet(-.82,.99);for(const x of [.73,.89])b(x,1.03,.18,.075,1.05,.08,c.metal);b(.81,1.58,.18,.28,.1,.1,c.trim);b(.81,1.79,.18,.31,.27,.29,0xe9a25d);
 }else{
  // A corrupted walking tree has bark, roots and a violet leaf crown, no wolf body.
  body(c.skin,c.skin);b(0,1.15,.35,.21,.69,.17,0x4d5044);for(const side of [-1,1]){b(side*.37,1.65,-.06,.16,.81,.72,c.skin);b(side*.68,1.18,.05,.24,.87,.28,c.skin);b(side*.8,1.48,.04,.17,.46,.21,c.skin);b(side*.94,1.71,.04,.35,.15,.2,c.skin);b(side*.5,.22,.25,.55,.19,.48,0x625c50);b(side*.44,2.18,-.11,.17,.8,.22,c.skin);b(side*.67,2.47,-.1,.53,.17,.26,c.skin);}b(0,2.36,-.02,1.25,.52,.92,c.hair);b(-.49,2.57,-.04,.68,.35,.66,0x6f6682);b(.5,2.59,-.03,.7,.39,.7,0xa18bae);b(0,2.76,-.04,.64,.25,.59,0xb3a0ba);eyes(1.85,.46,0xcab8e5);scroll(-.86);b(.81,1.02,.27,.12,.98,.13,c.skin);b(.81,1.58,.27,.65,.26,.38,c.metal);
 }
 const height=Math.max(...boxes.map(p=>p[1]+p[4]/2),...legs.map(p=>p.y+p.h/2));
 starterGarmentRelief(boxes,{cloth:c.cloth,trim:c.trim,hair:c.hair,skin:c.skin});const spec=Object.freeze({key,theme:'castle-builder',boxes:Object.freeze(refineStarterSurfaces(boxes).map(p=>Object.freeze(p))),legs:Object.freeze(legs.map(p=>Object.freeze(p))),wings:Object.freeze(wings),fur:c.skin,muzzle:c.skin,height,eyeLine});cache.set(key,spec);return spec;
}
export function buildCastleBuilderModel(unit,body,voxel){const spec=castleBuilderSpec(unit?.castleBuilderKey);if(!spec)return null;for(const part of spec.boxes)voxel(body,...part);return spec;}
const shade=(color,tint)=>'#'+[16,8,0].map(shift=>Math.round(((color>>shift)&255)*tint).toString(16).padStart(2,'0')).join('');
export function castleBuilderPortrait(key,fallback=''){
 const spec=castleBuilderSpec(key);if(!spec)return fallback;if(portraits.has(key))return portraits.get(key);
 const boxes=[...spec.boxes,...spec.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])],polygons=[],project=([x,y,z])=>[x*.88-z*.72,-y+z*.38+x*.27];
 for(const[x,y,z,w,h,d,color]of boxes){const a=x-w/2,b=x+w/2,l=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;for(const[corners,tint,depth]of [[[[a,t,n],[b,t,n],[b,t,f],[a,t,f]],1,x+z-.01],[[[b,l,n],[b,t,n],[b,t,f],[b,l,f]],.77,x+z+.02],[[[a,l,f],[a,t,f],[b,t,f],[b,l,f]],.9,x+z+.03]])polygons.push({points:corners.map(project),color:shade(color,tint),depth});}
 const all=polygons.flatMap(p=>p.points),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1])),scale=Math.min(80/(maxX-minX),81/(maxY-minY)),ox=(96-(maxX-minX)*scale)/2-minX*scale,oy=(92-(maxY-minY)*scale)/2-minY*scale;
 const svg=`<svg viewBox="0 0 96 96" class="army-portrait castle-builder-portrait" aria-hidden="true"><path d="m6 82 42-11 42 11-42 12z" fill="#607b6b" opacity=".23"/>${polygons.sort((a,b)=>a.depth-b.depth).map(p=>`<polygon points="${p.points.map(([x,y])=>(x*scale+ox).toFixed(2)+','+(y*scale+oy).toFixed(2)).join(' ')}" fill="${p.color}"/>`).join('')}</svg>`;portraits.set(key,svg);return svg;
}
