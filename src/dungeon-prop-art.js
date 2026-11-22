import {stoneRockParts,stoneColumnParts} from './stone-landmark-art.js';
// Small voxel sculptures, designed as complete objects rather than proxy boxes.
// Local coordinates are shared by scenery and interactive objects.
const P={stone:[0x566367,0x718083,0x8c9b98,0xa7b2a7],wood:[0x66462f,0x8d6745,0xb18b5d,0xd0ac76],clay:[0x764c36,0xa5744c,0xc8996a,0xe0bd8c],iron:[0x35474b,0x677f83,0xa5b8b1],moss:[0x425c46,0x65805a,0x8a9b65]};
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const seedOf=id=>[...String(id)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7);
export function dungeonRockParts(options={}){return stoneRockParts({w:3,d:2.6,h:3,...options});}
export function dungeonPropParts(type,{id=type,w=1.25,d=1.25,h=1.6,biome='cavern'}={}){
 const a=[],wood=P.wood,iron=P.iron,seed=seedOf(id),b=(x,y,z,ww,hh,dd,c,ry=0,rx=0,rz=0)=>a.push([x,y,z,ww,hh,dd,c,ry,rx,rz]);
 if(['rock','boulder','stalagmite','rubble'].includes(type))return dungeonRockParts({id,w,d,h,biome});
 if(type==='urn'){
  const radii=[.22,.32,.43,.49,.48,.43,.30,.25,.29],dy=h/10;
  for(let j=0;j<radii.length;j++)for(let i=0;i<12;i++){const t=i*Math.PI/6,r=radii[j]*w/.98;b(Math.sin(t)*r,dy*(j+.5),Math.cos(t)*r,.18*w,dy+.008,.18*d,(j===2||j===6)?P.clay[3]:P.clay[(i+j+seed)%3]);}
  b(0,.035,0,w*.47,.07,d*.47,P.clay[0]);
  for(const side of [-1,1]){b(side*w*.49,h*.63,0,w*.12,h*.25,d*.16,P.clay[2]);b(side*w*.41,h*.77,0,w*.22,h*.09,d*.16,P.clay[3]);}
  // The lip surrounds an actual dark opening; no lid-shaped cube.
  b(0,h*.81,0,w*.35,.035,d*.35,0x302a26);
 }else if(type==='barrel'){
  for(let i=0;i<12;i++){const t=i*Math.PI/6,r=.38;for(let j=0;j<3;j++){const bulge=j===1?1:.89;b(Math.sin(t)*r*w*bulge,h*(j+.5)/3,Math.cos(t)*r*d*bulge,w*.22,h/3-.025,d*.22,wood[1+i%2]);}}
  for(const yy of [.14,.52,.87])for(let i=0;i<12;i++){const t=i*Math.PI/6;b(Math.sin(t)*w*.4,yy*h,Math.cos(t)*d*.4,w*.22,.095,d*.22,iron[1]);}
  for(let i=-2;i<=2;i++){const length=Math.sqrt(Math.max(0,.17-(i*.14)**2))*2;b(i*w*.14,h+.025,0,w*.125,.07,d*length,wood[2+(i%2===0?1:0)]);}b(w*.13,h+.08,d*.13,.12,.05,.12,wood[0]);
 }else if(type==='crystal'){
  for(let i=0;i<5;i++){const xx=(i%3-1)*w*.25,zz=(Math.floor(i/3)-.5)*d*.3,hh=h*(.45+hash(seed+i)*.55);for(let j=0;j<5;j++)b(xx,hh*(j+.5)/5,zz,w*(.22-j*.025),hh/5,d*(.24-j*.026),[0x5f99ad,0x86c5d3,0xc1e9e3][(i+j)%3]);}
 }else if(type==='crate'){
  for(let side=0;side<4;side++)for(let i=0;i<5;i++){const t=(i-2)*.18;side<2?b(side? w*.43:-w*.43,h*.5,t*d,w*.075,h*.85,d*.16,wood[1+i%2]):b(t*w,h*.5,side===2?-d*.43:d*.43,w*.16,h*.85,d*.075,wood[1+i%2]);}
  for(const x of [-1,1])for(const z of [-1,1]){b(x*w*.41,h*.5,z*d*.41,w*.13,h,d*.13,wood[3]);for(const y of [.12,.88])b(x*w*.43,h*y,z*d*.45,w*.075,.065,d*.04,iron[1]);}
  for(const y of [.12,.88]){b(0,h*y,d*.46,w,.12,.09,wood[2]);b(w*.46,h*y,0,.09,.12,d,wood[2]);}
  for(let i=-2;i<=2;i++)b(i*w*.18,h+.015,0,w*.16,.09,d*.85,wood[1+(i%2===0?1:0)]);
  b(0,h*.5,d*.49,w*.13,h*.95,.08,wood[3],0,0,-.62);b(w*.49,h*.5,0,.08,h*.95,d*.13,wood[3],0,.62,0);
 }else if(type==='supplies'){
  for(const s of [-1,1])b(s*w*.38,h*.38,0,w*.14,h*.76,d*.78,wood[1]);
  for(let i=-3;i<=3;i++)b(i*w*.13,h*.8,0,w*.12,.14,d,wood[2]);
  for(let i=0;i<4;i++){b(-w*.23,h*.95+i*.065,-d*.15,w*.34,.06,d*.5,i%2?0xb9b19a:0x7c6f6d);}b(w*.24,h*1.01,0,w*.12,h*.4,d*.12,0xaac0b3);b(w*.24,h*1.2,0,w*.25,.08,d*.24,0xc3af78);
 }else if(type==='bedroll'){
  b(0,.08,0,w,.16,d,wood[0]);for(let i=0;i<7;i++)b((i-3)*w*.13,.22,0,w*.14,.18,d*.94,i%2?0x697b74:0x83938b);for(let j=0;j<3;j++)b(0,.36+j*.09,-d*.34,w*.8-j*.12,.1,d*.23,0xb7b5a0);
 }else if(type==='shelf'){
  for(const side of [-1,1])b(side*w*.43,h*.5,0,w*.12,h,d*.72,wood[1]);for(const yy of [.08,.4,.72,1]){for(let i=-2;i<=2;i++)b(i*w*.18,h*yy,0,w*.17,.12,d,wood[2]);}
  for(let row=0;row<3;row++)for(let i=0;i<5;i++)b((i-2)*w*.15,h*(.2+row*.3),0,w*.11,h*.22,d*.62,[0x87795d,0x66857e,0xb0a27c,0x735d66,0xa4b59d][(i+row)%5]);
 }else if(type==='pillar'){
  return stoneColumnParts({id,w,d,h,biome,broken:seed%4===3});
 }
 return a;
}

export function dungeonWallParts({id='wall',w=1.5,d=1.5,h=10,biome='crypt'}={}){
 const parts=[],seed=seedOf(id),stone=biome==='frost'?[0x678c9a,0x91b2b9,0xc0d2cb]:biome==='forge'?[0x3b3a3a,0x5a4c43,0x806b55]:[0x52615e,0x768278,0xa0a48e];
 // Offsetting individual masonry courses exposes mortar, broken corners and
 // slender fluted buttresses. The complete silhouette remains the solid wall.
 for(let j=0;j<13;j++){const bh=h/13;for(let k=0;k<2;k++){const x=(k-.5)*w*.49,rough=.84+hash(seed+j*7+k)*.12;parts.push([x,bh*(j+.5),0,w*.48,bh-.035,d*rough,stone[(j+k)%3]]);}}
 for(let j=0;j<6;j++){const y=.5+j*h/6;parts.push([-w*.31,y,d*.43,w*.18,h/6-.05,d*.16,stone[2]]);}
 if(biome==='forest'||biome==='cavern'||biome==='crypt')for(let j=0;j<5;j++){const yy=h*(.12+j*.07),x=Math.sin(seed+j)*w*.32;parts.push([x,yy,d*.48,w*.22,h*.09,.12,P.moss[j%3]]);}
 for(let i=0;i<3;i++)parts.push([(i-1)*w*.31,h+.1,0,w*.29,.23,d*1.01,stone[2]]);
 return parts;
}
