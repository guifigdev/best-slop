import {roMidgardLandmarkParts} from './ro-midgard-landmarks.js';
import {roExpansionSceneryParts} from './ro-expansion-scenery.js';
// Authored voxel miniatures, cached per palette/model/variant. They are merged
// into the existing world batches rather than becoming individual draw calls.
import {RO_REGION_PROP_BUDGET} from '../shared/ro-regional-props.js';
const cache=new Map();
export function roRegionalPropParts(type,p,variant=0){
 const midgard=roMidgardLandmarkParts(type,p,variant);if(midgard)return midgard;
 const expansion=roExpansionSceneryParts(type,p,variant);if(expansion)return expansion;
 const key=[type,p.stone,p.dark,p.wood,p.grass,p.glow,variant%3].join(':');if(cache.has(key))return cache.get(key);const parts=[],b=(x,y,z,w,h,d,c=p.stone,a=0,lit=false)=>parts.push([x,y,z,w,h,d,c,a,lit]),wood=p.wood||0x79593d,dark=p.dark||0x3b463d,stone=p.stone||0xaaa38b,grass=p.grass||0x849953,gold=0xc4a05e,roof=0x8f5142;
 const beam=(x,y,z,w,h,d,c=wood,a=0)=>b(x,y,z,w,h,d,c,a),planks=(x,y,z,w=4,d=3,c=wood)=>{for(let j=0;j<6;j++)b(x+(j-2.5)*w/6,y,z,w/6*.95,.18,d,c);};
 const stairs=(x,z,w=5,depth=3)=>{for(let j=0;j<4;j++)b(x,.10+j*.18,z+j*depth/4,w-j*.25,.2+j*.36,depth/4+.1,j%2?stone:dark);};
 const wheel=(x,y,z,r=1,c=wood)=>{for(let j=0;j<12;j++){const a=j*Math.PI/6;b(x+Math.sin(a)*r,y+Math.cos(a)*r,z,.25,.26,.23,c,-a);if(j%3===0)b(x+Math.sin(a)*r*.45,y+Math.cos(a)*r*.45,z,.13,r*.85,.15,gold,-a);}b(x,y,z,.4,.4,.32,dark);};
 const post=(x,z,h=4)=>{b(x,.18,z,.9,.35,.9,dark);for(let j=0;j<7;j++)b(x,.5+j*h/7,z,.55,h/7*.95,.55,j%3?stone:dark);b(x,h+.3,z,.9,.25,.9,stone);};
 const canopy=(w=6,d=4,y=3.5)=>{for(const side of [-1,1])for(let j=0;j<6;j++)b(side*(j+.5)*w/12,y+(5-j)*.22,0,w/12+.06,.25,d+.5,j%2?roof:0xae6b50);for(const side of [-1,1])for(const z of [-d*.42,d*.42])b(side*w*.4,y*.45,z,.25,y*.9,.25,wood);};
 if(type==='prontera-windmill'){
  for(let level=0;level<11;level++){const w=3.6-level*.14;b(0,.3+level*.57,0,w,.58,w,level%3?0xd2c7a9:stone);if(level%2===0)b(0,.3+level*.57,1.85-level*.07,w*.8,.08,.08,wood);}
  for(const side of [-1,1])for(let j=0;j<5;j++)b(side*(j+.5)*.36,6.5+(4-j)*.3,0,.4,.35,3.7,roof);b(0,2,1.7,1.2,2.6,.08,dark);b(0,4.7,1.52,.7,1.1,.08,p.glow,0,true);
  b(0,6.4,2,.5,.5,.7,wood);for(const side of [-1,1]){b(side*1.8,6.4,2.2,4,.16,.2,wood);b(0,6.4+side*1.8,2.2,.16,4,.2,wood);for(let j=0;j<5;j++){const q=side*(.9+j*.52);b(q,6.7,2.2,.45,.8,.08,0xe2d7b9);b(.3,6.4+q,2.2,.8,.45,.08,0xe2d7b9);}}
  for(const side of [-1,1])b(side*2.1,.28,1.7,.6,.5,.6,0x9a9672);
 }else if(['peco-caravan','desert-caravan','mine-wagon','snowed-sled'].includes(type)){
  const mine=type==='mine-wagon',sled=type==='snowed-sled';planks(0,1.0,0,4.2,2.5,mine?0x6f7770:wood);for(const side of [-1,1]){b(0,1.6,side*1.25,4.4,.95,.18,mine?stone:wood);for(let j=0;j<7;j++)b((j-3)*.62,1.6,side*1.36,.08,1.05,.12,gold);if(sled)b(0,.3,side*1.15,5.2,.22,.22,0x9caca5);else for(const x of [-1.45,1.45])wheel(x,.68,side*1.45,.65,mine?dark:wood);}
  for(const side of [-1,1])b(side*1.55,1.25,2.8,.18,.18,3.2,wood,.05*side);
  if(!mine){for(let j=0;j<5;j++){const y=1.8+Math.sin(j*Math.PI/4)*1.2,x=(j-2)*.75;b(x,y,0,.8,.25,2.6,j%2?0xc7b28a:0xe0c99b);}for(let j=0;j<3;j++)b((j-1)*1.1,2.8,0,.75,.8,.8,j%2?0xb0824a:0xb5a475);}
  else for(let j=0;j<7;j++)b((j%3-1)*1.1,1.9+(j%2)*.4,(Math.floor(j/3)-1)*.7,.9,.7,.8,j%3?dark:stone,j*.2);
  if(sled)for(let j=0;j<5;j++)b((j-2)*.8,2.55,.2,.9,.15,2.6,0xdbe7df);
 }else if(['hay-granary','rice-granary'].includes(type)){
  for(const x of [-2.3,2.3])for(const z of [-1.6,1.6])b(x,.85,z,.45,1.7,.45,wood);planks(0,1.65,0,5.8,4.3);for(let j=0;j<6;j++)b(0,1.9+j*.38,-1.8,5.5,.33,.27,j%2?wood:0x9c8055);for(const side of [-1,1])b(side*2.6,2.8,0,.25,2.6,4.1,wood);canopy(6,4.5,4.1);
  for(let j=0;j<5;j++){const x=(j%3-1)*1.5,z=Math.floor(j/3)*1.1-.5;b(x,2.1,z,1.3,.8,.9,0xc9b679);b(x,2.35,z,1.1,.5,.85,0xd4c387);b(x,2.15,z,.13,.95,1.0,wood);}
 }else if(type==='traveler-stonebridge'){
  for(let j=0;j<12;j++){const x=(j-5.5)*.55,y=.28+Math.sin(j/11*Math.PI)*.5;b(x,y,0,.6,.26,3.2,stone);for(const side of [-1,1]){b(x,y+.4,side*1.65,.56,.65,.4,j%2?stone:dark);if(j%3===0)b(x,y+1,side*1.65,.55,.65,.55,stone);}}
  for(const side of [-1,1]){b(side*2.8,.1,0,1.4,.2,4.1,dark);for(let j=0;j<5;j++)b(side*(1+j*.46),.2,2.25,.3,.3,.45,grass);}
 }else if(['payon-wayshrine','paper-lantern-arch','pilgrim-bellgate','burial-bell'].includes(type)){
  const payon=type.includes('payon')||type.includes('lantern');stairs(0,-1,6,3);for(const side of [-1,1]){post(side*2.2,0,4.3);b(side*2.2,2.8,.6,.65,1,.65,p.glow,0,true);for(let j=0;j<5;j++)b(side*2.2,2.35+j*.2,.6,.73,.05,.73,payon?roof:wood);}
  b(0,4.8,0,5.7,.4,.8,payon?0x9b5e45:stone);for(const side of [-1,1])for(let j=0;j<5;j++)b(side*(j+.5)*.55,5.1+(4-j)*.17,0,.58,.25,2.2,payon?0x526b61:stone);b(0,3.8,0,.13,1.2,.13,wood);
  for(let row=0;row<4;row++){const w=.65+row*.25;for(const side of [-1,1])b(side*w*.45,3.5-row*.25,0,.18,.3,w,gold);}b(0,2.3,0,1.6,.2,1.2,gold);b(0,2.05,0,.18,.4,.18,dark);
  if(type==='payon-wayshrine'){b(0,1.2,-.8,2.2,1.4,1.4,0x8a7360);b(0,1.4,.1,.4,.6,.07,p.glow,0,true);}
 }else if(type==='payon-waterwheel'){
  for(const side of [-1,1])b(side*1.9,2.1,0,.5,4,.65,wood);b(0,3.5,0,4.5,.35,.35,wood);wheel(0,2.1,.45,2,wood);for(let j=0;j<16;j++){const a=j*Math.PI/8;b(Math.sin(a)*2.2,2.1+Math.cos(a)*2.2,.45,.6,.35,1.3,j%2?wood:0xa18459,-a);}for(const side of [-1,1])b(0,.25,side*1.6,6,.4,.45,stone);b(0,.15,0,6,.09,2.8,0x5eaaa6);for(let j=0;j<7;j++)b((j-3)*.8,.22,0,.4,.04,2.3,0x99d0bf);
 }else if(type==='mushroom-log'){
  for(let j=0;j<9;j++)b((j-4)*.55,.55,0,.57,.8,1.1,j%3?wood:dark);for(let j=0;j<7;j++){const x=(j-3)*.7,z=Math.sin(j)*.6,h=.7+(j%3)*.2;b(x,.9+h/2,z,.18,h,.18,0xcfb58d);for(let k=0;k<3;k++)b(x,1.1+h+k*.1,z,1.1-k*.25,.18,.9-k*.2,j%2?0xba8656:0xc8ab75);}
 }else if(['sand-obelisk-camp','oasis-canopy','buried-sarcophagus','broken-sphinx'].includes(type)){
  if(type==='sand-obelisk-camp'){for(const side of [-1,1])for(let j=0;j<9;j++){const w=1.3-j*.10;b(side*1.8,.3+j*.66,0,w,.66,w,j%3?stone:0xa4885b);if(j<6)b(side*1.8,.7+j*.65,.73,.08,.18,.035,p.glow);}for(let j=0;j<4;j++)b(0,.12+j*.1,1.6,2.6-j*.3,.18,1.8-j*.18,dark);}
  else if(type==='oasis-canopy'){canopy(6.8,4.7,3.2);planks(0,.5,0,5,3.5);for(let j=0;j<7;j++){const x=(j-3)*.7;b(x,.9,0,.6,.65,.7,j%2?0xb7a169:0x9e7e4e);b(x,1.3,0,.5,.18,.6,0xd3bf83);}for(let j=0;j<4;j++)b(3.2,.3+j*.2,1.5,1.3-j*.2,.3,1.3-j*.2,0x73894e);}
  else if(type==='buried-sarcophagus'){for(let j=0;j<4;j++)b(0,.2+j*.27,0,5.5-j*.4,.32,2.6-j*.25,j%2?stone:dark);b(0,1.25,0,4.1,.25,1.8,stone);for(let j=0;j<7;j++)b((j-3)*.45,1.45,0,.3,.2,.6,gold);b(1.1,1.65,0,.7,.55,.7,stone);b(1.1,1.95,0,1,.25,.9,gold);for(const x of [-1.9,1.9])b(x,.7,1.4,.45,1.3,.4,dark);}
  else {for(let j=0;j<4;j++)b(0,.2+j*.32,0,6-j*.65,.35,3.5-j*.35,j%2?stone:dark);b(0,1.9,0,3.5,1.4,2,stone);b(-1.9,1.25,1.1,2.1,.5,.8,stone);b(-1.9,1.25,-1.1,2.1,.5,.8,stone);b(1.2,2.9,0,1.6,1.5,1.4,stone);for(let j=0;j<5;j++)b(1.2,3.1+j*.2,0,1.9-j*.2,.22,1.7-j*.2,j%2?gold:stone);b(2,3,0,.15,.35,.55,dark);}
  if(type==='broken-sphinx'){for(const side of [-1,1]){b(2.03,3.12,side*.38,.06,.18,.2,dark);for(let j=0;j<4;j++)b(1.4,3.05+j*.2,side*.78,1.25,.08,.08,gold);for(let j=0;j<3;j++)b(-2.25+j*.2,1.5,side*1.15,.08,.13,.2,dark);}b(2.2,2.9,0,.4,.32,.32,stone);for(let j=0;j<3;j++)b(1.98,2.45-j*.15,0,.25,.18,.48-j*.1,gold);}
  if(type==='buried-sarcophagus')for(const side of [-1,1])for(let j=0;j<8;j++){b((j-3.5)*.47,.78,side*1.18,.17,.25,.06,j%2?gold:dark);b((j-3.5)*.47,.92,side*1.18,.28,.06,.06,stone);}
 }else if(['juno-telescope','runic-engine'].includes(type)){
  stairs(0,-1.4,6,3);post(0,0,2.8);if(type==='juno-telescope'){b(.5,3.8,0,4,.9,.9,gold);for(const x of [-1.4,.1,2.3])b(x,3.8,0,.22,1.2,1.2,x===2.3?p.glow:dark,0,x===2.3);b(-1.7,3.5,0,.3,.65,.65,dark);for(const side of [-1,1])b(side*.8,2.65,0,.3,1.3,.3,stone,side*.2);}
  else{for(let ring=0;ring<3;ring++)for(let j=0;j<20;j++){const a=j*Math.PI/10,r=1.8+ring*.45;b(Math.sin(a)*r,3.8+Math.sin(a)*(ring-1),Math.cos(a)*r,.16,.2,.55,ring===1?gold:stone,-a);}b(0,3.8,0,1.2,1.2,1.2,p.glow,Math.PI/4,true);for(const side of [-1,1])post(side*2.8,1.5,4.2);}
 }else if(['frozen-longboat','ice-crystal-grove','frost-rune-arch'].includes(type)){
  if(type==='frozen-longboat'){for(let j=0;j<11;j++){const x=(j-5)*.55,w=1.7-Math.abs(j-5)*.18;b(x,.35,0,.6,.4,w,wood);for(const side of [-1,1]){b(x,.9,side*w*.5,.6,.9,.17,wood);b(x,1.4,side*w*.5,.65,.15,.3,0xdce9e1);}}for(const side of [-1,1])b(side*3.2,1.25,0,.3,2.1,.4,wood);b(0,3.1,0,.25,5.7,.25,wood);for(let j=0;j<5;j++)b(.8,4.6-j*.5,0,1.4,.52,.12,j%2?0xaebfba:0xcdd9d0);}
  else if(type==='frost-rune-arch'){for(const side of [-1,1])for(let j=0;j<8;j++)b(side*(2.3-Math.max(0,j-4)*.32),.45+j*.65,0,1.1-j*.045,.67,1.25,j%3?0x9fc9d0:0xe0eeeb);b(0,5.5,0,1.1,.6,1.2,p.glow,0,true);for(const side of [-1,1])for(let j=0;j<4;j++)b(side*2.35,1+j*.7,.7,.12,.25,.04,p.glow,0,true);}
  else{for(let stem=0;stem<9;stem++){const a=stem*2.4,r=1+stem*.18,h=3+stem%4*1.3,x=Math.sin(a)*r,z=Math.cos(a)*r;for(let j=0;j<6;j++){const w=.8-j*.1;b(x+j*.035,h*(j+.5)/6,z,w,h/6+.05,w, j%2?0x9bcad3:0xc2e2e2,a);}b(x,.15,z,1.5,.25,1.4,0xe0ebe4);}}
 }else if(['thor-basalt-vent','dwarven-bellows','basalt-forge-shrine'].includes(type)){
  if(type==='thor-basalt-vent'){for(let ring=0;ring<3;ring++)for(let j=0;j<12;j++){const a=j*Math.PI/6,r=2.8-ring*.5;b(Math.sin(a)*r,.25+ring*.7,Math.cos(a)*r,.8,.8,.75,j%3?dark:stone,a);}for(let j=0;j<9;j++){const a=j*Math.PI/4.5;b(Math.sin(a)*.8,.4,Math.cos(a)*.8,.55,.12,.55,j%2?0xf7bb58:0xd87537,a,true);}for(let j=0;j<4;j++){const x=(j-1.5)*.4;b(x,2.2+j*.35,.4,.22,1.9,.25,0xa35636);b(x,3.5+j*.3,.4,.4,.6,.4,p.glow,0,true);}}
  else if(type==='dwarven-bellows'){planks(0,.4,0,5.5,3.7);for(let j=0;j<7;j++)b((j-3)*.46,1.1+Math.sin(j/6*Math.PI)*.4,0,.35,.65,2.3,j%2?wood:0x8b6046);b(2.4,1.2,0,1.6,.5,.7,dark);for(const side of [-1,1])post(side*2.2,1.3,3.5);b(0,3.7,1.3,5,.4,.5,wood);}
  else{for(let j=0;j<5;j++)b(0,.2+j*.4,0,5.2-j*.6,.45,4.7-j*.5,j%2?dark:stone);for(const side of [-1,1])for(let j=0;j<7;j++){b(side*1.6,.7+j*.65,0,.8,.7,1,j%3?dark:stone);if(j<5)b(side*1.6,1+j*.6,.55,.14,.3,.06,p.glow,0,true);}b(0,5.2,0,3.7,.8,1.5,dark);b(0,2.8,0,1.1,1.5,.7,p.glow,Math.PI/4,true);}
 }else if(type==='valkyrie-wing-shrine'){
  stairs(0,-1.4,6,3);post(0,0,5);for(const side of [-1,1])for(let j=0;j<8;j++){const x=side*(.6+j*.33);b(x,4.4+j*.12,0,.6,.3,1,0xdedcc8);b(x,3.9-j*.16,-.2,.22,1.4,.75,j%3?stone:gold);}b(0,5.9,0,.65,.9,.65,p.glow,Math.PI/4,true);b(0,1.5,1.2,2.5,.7,1.2,stone);
 }else return null;
 if(parts.length>RO_REGION_PROP_BUDGET.partsPerProp)throw new RangeError('Regional prop exceeded its authored part budget: '+type);
 const result=Object.freeze(parts.map(Object.freeze));cache.set(key,result);return result;
}
