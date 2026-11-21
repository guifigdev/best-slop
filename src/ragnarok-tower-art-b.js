// Classic Tower sculptures, pack B: source-specific creatures and mechanical rigs.
// Related Ragnarok variants intentionally share their original anatomical family.
import {RAGNAROK_TOWER_PACK_B} from '../shared/ragnarok-tower-pack-b.js';
import {ragnarokCentennialSpec} from './ragnarok-centennial-art.js';
import {ragnarokNatureExpansionSpec} from './ragnarok-nature-expansion-art.js';
import {ragnarokDarkExpansionSpec} from './ragnarok-dark-expansion-art.js';
import {ragnarokCaveSpec} from './ragnarok-cave-art.js';
import {ragnarokElementSpec} from './ragnarok-element-art.js';
import {ragnarokCavernSpec} from './ragnarok-cavern-art.js';
import {ragnarokCryptIceSpec} from './ragnarok-crypt-ice-art.js';
import {ragnarokMvpSpec} from './ragnarok-mvp-art.js';
export const RAGNAROK_TOWER_PACK_B_KINDS=Object.freeze(RAGNAROK_TOWER_PACK_B.map(v=>v.key));
const cache=new Map(),freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const getBase=k=>ragnarokCentennialSpec(k)||ragnarokNatureExpansionSpec(k)||ragnarokDarkExpansionSpec(k)||ragnarokCaveSpec(k)||ragnarokElementSpec(k)||ragnarokCavernSpec(k)||ragnarokCryptIceSpec(k)||ragnarokMvpSpec(k);
export function ragnarokTowerPackBSpec(key){
 if(!RAGNAROK_TOWER_PACK_B_KINDS.includes(key))return null;if(cache.has(key))return cache.get(key);
 const id=Number(key.slice(6));let parts=[],legs=[],wings=[],flames=[],fur=0x9b8167,eyeLine=1.25,motion='walk';
 const b=(...p)=>parts.push(p),leg=(x,y,z,w,h,d,color)=>legs.push({x,y,z,w,h,d,color});
 const oval=(x,y,z,rx,ry,rz,p,ny=6,nz=6)=>{p=Array.isArray(p)?p:[p];for(let j=0;j<ny;j++)for(let k=0;k<nz;k++){const a=(j+.5)/ny*2-1,c=(k+.5)/nz*2-1,q=1-a*a-c*c;if(q>.035)b(x,y+a*ry,z+c*rz,Math.max(.055,Math.round(2*rx*Math.sqrt(q)/.055)*.055),2*ry/ny+.004,2*rz/nz+.004,p[Math.min(p.length-1,Math.floor(j/ny*p.length))]);}};
 const rod=(a,c,w,color)=>{const n=Math.max(1,Math.ceil(Math.hypot(...a.map((v,i)=>c[i]-v))/(w*.87)));for(let j=0;j<=n;j++)b(...a.map((v,i)=>v+(c[i]-v)*j/n),w,w,w,color);};
 const spike=(x,y,z,r,h,c)=>{for(let j=0;j<4;j++)b(x,y+h*(j+.5)/4,z,r*(1-j/4),h/4+.004,r*(1-j/4),c);};
 const eyes=(x,y,z,space=.17,c=0x302836)=>{for(const s of [-1,1]){b(x+s*space,y,z,.11,.15,.05,c);b(x+s*space-.02,y+.027,z+.028,.032,.043,.014,0xfff8e4);}};
 const wing=(side,pivot,world)=>wings.push({side,pivot,parts:world.map(p=>[p[0]-pivot[0],p[1]-pivot[1],p[2]-pivot[2],...p.slice(3)])});
 const bat=(y,span,p)=>{for(const side of [-1,1]){const a=[];for(let j=0;j<7;j++)a.push([side*(.4+j*span/7),y+.25*Math.sin(j*.4),-.1-j*.04,span/7+.02,.62-j*.06,.12,p[j%p.length]]);wing(side,[side*.3,y,0],a);}};
 const recolor=(color,p)=>{if(!p)return color;const r=color>>16&255,g=color>>8&255,bl=color&255,l=(r+g+bl)/3;if(l<55)return color;if(l>230)return p[2];return p[l<120?0:l<185?1:2];};
 const copy=(kind,scale=1,p)=>{const m=getBase(kind);if(!m)throw Error('Unknown base sculpture '+kind);parts=m.parts.map(q=>q.map((v,i)=>i<6?v*scale:recolor(v,p)));legs=m.legs.map(q=>({...q,x:q.x*scale,y:q.y*scale,z:q.z*scale,w:q.w*scale,h:q.h*scale,d:q.d*scale,color:recolor(q.color,p)}));wings=m.wings.map(w=>({...w,pivot:w.pivot.map(v=>v*scale),parts:w.parts.map(q=>q.map((v,i)=>i<6?v*scale:recolor(v,p)))}));fur=recolor(m.fur,p);eyeLine=m.eyeLine*scale;motion=m.motion||'walk';flames=(m.flames||[]).map(q=>({...q,x:q.x*scale,y:q.y*scale,z:q.z*scale,size:q.size*scale}));};
 const body=(p,h=1)=>{fur=p[1];oval(0,1.15*h,0,.45*h,.62*h,.32*h,p,7,5);oval(0,2.02*h,.08,.37*h,.4*h,.32*h,p,6,5);for(const s of [-1,1]){leg(s*.24*h,.37*h,0,.28*h,.56*h,.3*h,p[0]);b(s*.24*h,.15*h,.13,.34*h,.2*h,.43*h,p[1]);oval(s*.55*h,1.2*h,.02,.24*h,.47*h,.25*h,p,5,4);}eyes(0,2.08*h,.4*h,.18*h);eyeLine=2.08*h;};
 const snake=(p,water=false)=>{fur=p[1];for(let j=0;j<10;j++){const a=j*.6;oval(Math.sin(a)*(.2+j*.035),.22+j*.075,Math.cos(a)*(.3+j*.025),.22,.17,.2,p,3,4);}rod([0,.72,0],[0,1.5,.15],.29,p[1]);oval(0,1.72,.25,.31,.34,.28,p,6,5);oval(0,1.61,.5,.25,.14,.2,p[2],4,4);eyes(0,1.8,.5,.16);b(0,1.54,.68,.18,.04,.05,0x7b3f43);if(water)for(let j=0;j<4;j++)spike(0,1.6+j*.11,.03,.2,.23,p[2]);eyeLine=1.8;};
 const orbEye=(p,spines=false)=>{fur=p[1];motion='float';oval(0,1.15,0,.55,.52,.45,p,8,7);oval(0,1.19,.42,.36,.34,.13,[0xd9c7aa,0xf2e5cc,0xffffe5],6,3);oval(0,1.19,.55,.16,.23,.035,p[0],5,2);b(0,1.2,.59,.07,.18,.025,0x292b35);if(spines)for(let j=0;j<8;j++){const a=j*Math.PI/4;spike(Math.cos(a)*.45,1.3+Math.sin(a)*.15,Math.sin(a)*.35,.18,.35,p[2]);}eyeLine=1.19;};
 // Direct source variants: transformed authored volumes, never a generic box fallback.
 if(id===1004||id===1303){copy('dragonfly',id===1004?.8:1.2,[0x6e5948,0xb19a6b,0xe4c994]);b(0,id===1004?.52:.8,-.35,.11,.36,.13,0x705447);for(let j=0;j<3;j++)b(0,(id===1004?.82:1.13)-j*.11,.05,.34,.05,.39,0x483c3b);}
 else if(id===1037||id===1255){snake(id===1037?[0x684a42,0x9f7863,0xcba88c]:[0x4b5771,0x7d7b9a,0xd1b6b7],id===1255);if(id===1255){rod([0,1.58,-.07],[.42,1.98,-.21],.09,0xb6a2b1);}}
 else if(id===1048||id===1097){const eggs=id===1097?3:2;fur=0xe5cfa6;for(let j=0;j<eggs;j++){const x=(j-(eggs-1)/2)*.5;oval(x,.52-j*.04,j%2*.13,.31,.48,.28,id===1097?[0xa69776,0xd9cc9c,0xf5edc7]:[0x9b7155,0xd1a273,0xedd0a2],8,5);b(x+.06,.63,.27+j%2*.13,.09,.13,.035,0xc7ac7d);}eyeLine=.6;motion='sway';}
 else if(id===1053||id===1054){copy('thiefbug',id===1053?.9:1.14,id===1053?[0x58413f,0x8d6c5d,0xbc9c83]:[0x254c50,0x49837f,0x9eb9a0]);for(const side of [-1,1])rod([side*.15,.6,.6],[side*.4,.99,.95],.055,fur);}
 else if(id===1088){copy('rocker',1.12,[0x5b7653,0xa2bd77,0xe6dbac]);for(const side of [-1,1])oval(side*.2,2.16,0,.16,.27,.1,0xc7d890,4,3);b(0,1.46,.29,.39,.11,.09,0xa25f58);}
 else if(id===1090){copy('poporing',1.32,[0xbe6978,0xe69aa1,0xffcebb]);for(const[x,z]of [[-.5,.2],[.4,.4],[.4,-.3]])oval(x,1.5,z,.17,.16,.16,[0xd68189,0xf1b8b1],4,4);}
 else if(id===1092||id===1107){copy(id===1092?'wolf':'desertwolf',id===1092?1.25:.65,id===1092?[0x4d4950,0x918995,0xc6c1c0]:null);if(id===1092)for(const side of [-1,1])for(let j=0;j<5;j++)b(side*.35,1.41-j*.1,.48,.23,.2,.3,0xc6c1c0);}
 else if(id===1156){copy('deleter',.94,[0x6b5f7e,0xa496b8,0xe1d3dc]);for(const side of [-1,1])spike(side*.26,2.12,.1,.14,.37,0xd6ccd1);}
 else if(id===1165){copy('sleeper',1.08,[0xb3925c,0xd3b679,0xefdab0]);for(const side of [-1,1])oval(side*.53,.22,.15,.23,.2,.25,0xe4c99a,4,4);}
 else if(id===1186){copy('whisper',1.5,[0xaaa4ad,0xe0d2d2,0xf5e8df]);}
 else if(id===1209||id===1256){copy('tarou',id===1209?1.08:.86,id===1209?[0x665474,0xa394b6,0xdbbdc7]:[0x61596b,0x8c8a9a,0xc4bac5]);if(id===1256){for(let j=0;j<5;j++)spike(0,1.02,-.55+j*.25,.14,.28,0xa89caa);}}
 else if(id===1212||id===1387){copy('scorpion',id===1212?1.2:1.05,id===1212?[0x59433d,0x8e6d54,0xcaa785]:[0x6d5a45,0xa2875f,0xcab991]);if(id===1387)for(const side of [-1,1])for(let j=0;j<3;j++)b(side*.44,.9+j*.12,-.31,.19,.14,.31,0xc3ad7e);}
 else if(id===1243||id===1306||id===1381){copy('zipperbear',id===1243?1.17:1.25,id===1381?[0x794a37,0xb57848,0xdca16e]:id===1306?[0x5a5865,0x92919c,0xc6bcc0]:[0x938e86,0xc7c5bb,0xf0ebd6]);for(const side of [-1,1])for(let j=0;j<7;j++)b(side*(.4+(j%2)*.1),2.1-j*.16,-.06,.22,.23,.28,fur);if(id===1306){for(let j=0;j<5;j++){const a=j*Math.PI*2/5;b(Math.sin(a)*.17,1.25+Math.cos(a)*.18,.52,.17,.17,.04,0xe6d5bb);}}}
 else if(id===1293){copy('creamy',1.42,[0x62475e,0xa77e96,0xe3b9c2]);for(const side of [-1,1])rod([side*.15,1.8,.1],[side*.45,2.53,.08],.07,0x957485);}
 else if(id===1294){copy('mantis',1.42,[0x414738,0x897d60,0xbba786]);for(const side of [-1,1]){b(side*.7,1.4,.72,.14,.82,.2,0xd3c497);spike(side*.7,1.79,.72,.2,.28,0xe1d2a9);}}
 else if(id===1300||id===1305){copy('argiope',id===1300?.85:1.1,id===1300?[0x9a7658,0xc7a576,0xe8cfa2]:[0x493954,0x80638f,0xb2a1c5]);if(id===1305)for(const side of [-1,1]){rod([side*.19,.6,.61],[side*.35,.27,.9],.13,0xd0b992);b(side*.35,.27,.9,.13,.16,.2,0xe3d0a8);}}
 else if(id===1310){copy('minorous',1.13,[0x8d3f3d,0xc26d58,0xe1ad8b]);for(const side of [-1,1])oval(side*.65,1.9,0,.29,.33,.32,[0x8b473d,0xc77d61],4,4);}
 else if(id===1312){copy('assaulter',1.4,[0x5c6454,0x9e9873,0xddc894]);for(let j=0;j<6;j++)b(0,1.49+j*.12,.58,.52-j*.05,.13,.1,0xdfd0a1);b(0,2.4,-.2,.68,.22,.56,0x668970);for(const side of [-1,1])b(side*.62,1.6,.1,.4,.35,.4,0xc9ad6f);rod([-.77,1.02,-.32],[-.77,2.9,-.32],.09,0x867350);b(-.95,2.64,-.31,.44,.46,.08,0xa34a4b);eyeLine=1.82;}
 else if(id===1366){copy('stalacticgolem',1.1,[0x793e31,0xc17c4f,0xebb56b]);for(const side of [-1,1]){rod([side*.5,1.7,.13],[side*.62,.34,.26],.12,0xf3c074);flames.push({x:side*.45,y:1.92,z:.03,size:.3});}flames.push({x:0,y:2.62,z:0,size:.45});}
 else if(id===1379){copy('nightmare',1.2,[0x555962,0x8b9196,0xc0b9ad]);for(let j=0;j<8;j++){const z=-.7+j*.25;spike(0,1.55,z,.23,.35+(j%2)*.22,0xdc8356);flames.push({x:0,y:1.7,z,size:.25});}}
 else if(id===1385){copy('petite',1,[0x98678a,0xce91b4,0xf0c0ce]);wings=[];for(let j=0;j<4;j++)b(0,1.15,-1-j*.15,.15,.25,.15,0xd5a0be);}
 else if(id===1515){copy('hatii',.43);flames=[];}
 else if(id===1618){copy('argos',1.45,[0x3a3535,0x695445,0x947c58]);for(let j=0;j<5;j++){b(0,1.48,-.2-j*.18,.95,.12,.14,0xb19c70);for(const side of [-1,1])spike(side*.48,1.1,-.3-j*.19,.13,.2,0xc2b18b);}for(const side of [-1,1])rod([side*.24,.7,.94],[side*.46,.53,1.26],.12,0x9a5c45);}
 else if(id===1680){copy('hillwind',1.03,[0x9b6155,0xc58d71,0xe3c09a]);parts=parts.filter(p=>!(p[0]>.45&&p[0]<.76&&p[1]>2));for(const side of [-1,1])for(let j=0;j<5;j++)b(side*.34,1.31-j*.14,.15,.16,.18,.23,0xc4aa88);}
 else if(id===1698){copy('rideword',1.15,[0x5b4050,0x876352,0xc39f76]);b(0,1.57,0,.91,.11,.63,0x9b7b63);for(const side of [-1,1])b(side*.48,1.5,.13,.12,.68,.6,0xd0b18b);b(0,1.55,.46,.2,.31,.06,0x655261);}
 else if(id===1716){copy('acidus',1.04,[0x555a7f,0x9397bb,0xcec5d4]);for(const side of [-1,1])leg(side*.35,.91,.48,.14,.36,.17,0xa3a2bd);}
 else if(id===1777){copy('icetitan',1);}
 else if(id===1873){copy('dragonfly',.75,[0x617d4d,0x9cbd75,0xd9d99f]);}
 else if(id===1064||id===1158){
  const bone=id===1064,p=bone?[0x5c526f,0x8e7d9f,0xc6b4ba]:[0x495363,0x7b8594,0xc3b6a5];fur=p[1];motion='float';
  oval(0,1.09,0,.35,.49,.94,p,7,8);oval(0,1.1,.78,.31,.37,.32,p,5,5);eyes(0,1.26,1.02,.19);for(const side of [-1,1]){rod([side*.22,1.04,-.24],[side*.7,.88,-.41],.11,p[2]);rod([0,1,-.84],[side*.38,1.02,-1.3],.13,p[1]);}
  if(bone){b(0,.95,1.1,.48,.2,.08,0x3c344e);for(let j=0;j<5;j++)b((j-2)*.09,1.03,1.17,.05,.17,.06,0xddd0b9);for(const side of [-1,1])for(let j=0;j<5;j++){rod([side*.08,1.43,.1-j*.26],[side*.35,1.09,.1-j*.26],.055,0xc2b1ac);spike(side*.13,1.42,-.2-j*.21,.1,.33,p[2]);}}
  else{rod([0,1.05,1.02],[0,.9,1.56],.08,0xcdbaa0);for(let j=0;j<5;j++)spike(0,1.5,-.4+j*.16,.13,.32,p[2]);}eyeLine=1.26;
 }else if(id===1065||id===1418){
  const p=id===1065?[0x42475a,0x77758a,0xc7b08c]:[0x67525d,0xab8d8b,0xe2c8a9];fur=p[1];snake(p);oval(0,1.62,.05,.38,.64,.31,p,7,5);oval(0,2.39,.12,.34,.36,.3,[0xbb9d84,0xdfc4a1,0xf3dbb6],6,5);eyes(0,2.45,.43,.15);for(const side of [-1,1]){rod([side*.31,1.94,.06],[side*.69,1.48,.26],.16,p[1]);b(side*.69,1.48,.26,.2,.22,.2,p[2]);}
  if(id===1065){for(let j=0;j<7;j++)spike((j-3)*.12,2.63,0,.13,.32+Math.sin(j)*.09,0xd7ad57);rod([.77,.35,.25],[.77,3.05,.25],.075,0xb48855);for(const dx of [-.2,0,.2]){b(.77+dx,3.06,.25,.07,.49,.09,0xd8b978);spike(.77+dx,3.25,.25,.1,.18,0xf1d9a1);}for(let j=0;j<5;j++)b(0,2.21-j*.12,.4,.3-j*.035,.14,.1,0xc8bb9b);}
  else{b(0,2.79,0,.65,.15,.5,0xc49c70);b(0,2.98,0,.38,.33,.38,0x746478);b(0,3.15,.02,.57,.13,.51,0xb78865);b(0,2.99,.21,.17,.2,.04,0xe2b45f);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;oval(Math.cos(a)*.71,1.61+Math.sin(a)*.35,Math.sin(a)*.32,.17,.22,.15,[0xa77b58,0xd2ad79,0xe9cd9f],4,4);rod([Math.cos(a)*.5,1.65+Math.sin(a)*.3,0],[Math.cos(a)*.71,1.61+Math.sin(a)*.35,Math.sin(a)*.32],.055,0x7b654e);}rod([-.7,.45,.3],[-.7,2.45,.3],.08,0xa67f57);}
  eyeLine=2.45;
 }else if(id===1108){
  fur=0xaebb8d;motion='float';oval(0,.8,0,.67,.42,.59,[0x9a5b66,0xd48c8c,0xf0c4af],7,6);oval(0,1.14,0,.58,.14,.51,[0x75a27a,0xb9d0a3],3,6);for(let j=0;j<10;j++){const a=j*Math.PI/5;rod([Math.cos(a)*.49,.61,Math.sin(a)*.4],[Math.cos(a)*.73,.33,Math.sin(a)*.66],.07,0xb95a6d);}rod([-.23,1.18,0],[-.36,1.86,.02],.14,0x86a778);b(-.36,1.87,.07,.32,.21,.14,0xe7b09c);b(-.36,1.87,.16,.23,.1,.05,0x835346);for(let j=0;j<4;j++)rod([.1,1.13,-.05],[.38+j*.12,1.45-j*.04,-.12],.055,0xe5b5a2);eyeLine=.9;
 }else if(id===1130){
  body([0x383846,0x5b5064,0x938072]);parts=parts.filter(p=>p[1]<1.75);oval(0,2.02,.08,.56,.45,.45,[0xaa6344,0xdd9c61,0xf3c08a],8,6);for(const side of [-1,1]){b(side*.24,2.11,.5,.21,.15,.06,0x503846);b(side*.16,1.9,.52,.13,.14,.06,0x6f3c41);}b(0,1.92,.53,.34,.07,.05,0x58333b);b(0,2.51,.04,.64,.18,.5,0x4b3c4c);b(0,2.67,.04,.45,.34,.39,0x4b3c4c);b(0,2.6,.25,.48,.12,.08,0xc39764);rod([.67,.18,.23],[.67,1.63,.23],.08,0xba8c5b);b(0,1.17,.36,.11,.6,.07,0xd4b98c);eyeLine=2.11;
 }else if(id===1204){
  copy('mysteltainn',1.05,[0x704450,0xb97983,0xe2b7ae]);parts=parts.filter(p=>p[1]<2.1);for(let j=0;j<8;j++)b((j%2-.5)*.16,1.1+j*.16,.18,.21,.2,.15,0xd0a59e);oval(0,2.16,.05,.29,.25,.18,[0x9e5c64,0xcf999c,0xf0c9b9],5,4);b(0,2.15,.24,.4,.21,.07,0x573843);for(let j=0;j<4;j++)b((j-1.5)*.09,2.24,.3,.055,.13,.05,0xf1ddbd);spike(0,2.39,.02,.28,.54,0xdab4aa);eyeLine=2.15;
 }else if(id===1206||id===1687||id===1717){
  const p=id===1717?[0x396653,0x72a77d,0xb3cd95]:id===1687?[0x4e6d41,0x829b50,0xbfc986]:[0x3d6240,0x7c9c5a,0xc3cd91];body(p,id===1687?.78:1);oval(0,id===1687?1.56:2.03,.43,.3,.2,.5,p,5,6);b(0,id===1687?1.48:1.94,.93,.43,.08,.05,0x3f4c38);for(const side of [-1,1])for(let j=0;j<4;j++)b(side*.2,id===1687?1.52:1.98,.7+j*.1,.045,.1,.06,0xe2dbac);for(let j=0;j<6;j++)spike(0,1.77,-.2-j*.18,.16,.25,p[2]);rod([0,.81,-.27],[.44,.38,-1.14],.16,p[1]);if(id===1687){rod([.44,.38,-1.14],[.12,.77,-1.34],.11,p[2]);rod([.12,.77,-1.34],[-.15,.58,-1.19],.1,p[2]);}if(id===1717){for(const side of [-1,1])rod([side*.21,2.28,0],[side*.43,2.71,-.13],.13,p[2]);bat(1.52,.55,[p[0],p[1]]);}eyeLine=id===1687?1.7:2.08;
 }else if(id===1207){
  fur=0x94718d;oval(0,.53,0,.65,.44,.55,[0x5c4d66,0x92718d,0xb99ba6],7,6);rod([0,.59,.05],[0,1.63,.13],.45,0xa8829c);oval(0,1.81,.17,.36,.31,.24,[0xd8c6b1,0xe9ded0],5,4);for(let j=0;j<4;j++){const x=(j-1.5)*.19;b(x,2.12-j*.015,.2,.16,.52,.25,0xeee4d6);b(x,2.38-j*.015,.3,.14,.13,.15,0xd3bda5);}rod([-.24,1.82,.13],[-.55,1.6,.25],.2,0xb99a9d);eyeLine=1.9;motion='sway';
 }else if(id===1253||id===1262){
  const dragon=id===1262,p=dragon?[0x405649,0x799171,0xb2b58a]:[0x6d6570,0xa49ca3,0xddd1ba];body(p,1);for(const side of [-1,1]){spike(side*.26,2.29,.02,.18,.48,p[2]);b(side*.25,2.02,.27,.21,.08,.14,p[0]);}bat(1.63,dragon?1.14:.86,dragon?[0x72484b,0xa16d67]:[0x6b526b,0x9f8498]);if(dragon){oval(0,2.02,.47,.27,.18,.28,p,4,4);rod([0,.64,-.22],[.63,.71,-1.02],.15,p[1]);rod([.63,.71,-1.02],[.71,1.14,-1.3],.1,p[2]);}else{rod([.62,.29,.25],[.62,2.1,.25],.075,0x815f4d);rod([.62,.29,.25],[.85,1.24,.25],.07,0xa99a81);rod([.85,1.24,.25],[.62,2.1,.25],.07,0xa99a81);b(.62,1.2,.3,.04,1.66,.04,0xddd2ba);}eyeLine=2.08;
 }else if(id===1263||id===1921){
  const p=id===1263?[0x454c49,0x737e71,0xa9b29b]:[0x7c7d96,0xb8bacf,0xe5e4e3];fur=p[1];motion='float';for(let j=0;j<9;j++){const r=.57-Math.abs(j-5)*.055;b(0,.45+j*.2,0,r*2,.22,.6-j*.025,p[j<3?0:j<7?1:2]);}oval(0,2.29,.09,.31,.39,.25,id===1263?[0xa3967e,0xd2c9ac,0xf0e6cb]:p,6,5);eyes(0,2.35,.34,.15);b(0,2.12,.35,.25,.16,.06,0x5b5864);for(const side of [-1,1]){rod([side*.35,1.82,0],[side*.67,1.41,.18],.17,p[0]);for(let j=0;j<3;j++)rod([side*.67,1.41,.18],[side*(.52+j*.11),1.1,.32],.06,p[2]);}if(id===1263){spike(0,2.41,-.05,.57,.59,0x788472);rod([.62,.3,.24],[.62,2.7,.24],.08,0x88745a);b(.62,2.71,.24,.29,.31,.22,0xd9cfb0);}else{for(const side of [-1,1])spike(side*.25,2.48,0,.22,.52,0xd2d4df);for(let j=0;j<5;j++)b(0,1.15+j*.17,.36,.24,.05,.06,0xd4d2dc);}eyeLine=2.35;
 }else if(id===1268){
  copy('dullahan',1.16,[0x4c4056,0x7e6177,0xb59b96]);oval(0,2.78,.07,.31,.36,.27,[0x574252,0x9a725f,0xdfaa71],5,5);b(0,2.79,.34,.46,.09,.07,0x433640);for(const side of [-1,1])spike(side*.24,3.01,0,.16,.48,0x9d6669);b(-.7,1.39,.35,.79,1.1,.17,0x673c50);b(-.7,1.42,.46,.56,.75,.08,0xb95b61);b(-.7,1.53,.52,.4,.17,.08,0x3b2b38);b(-.7,1.21,.51,.38,.13,.07,0xdfb38c);eyeLine=2.8;
 }else if(id===1270){
  copy('clock',1.15,[0x55433b,0x9b6d48,0xd4aa6e]);legs=[];parts=parts.filter(p=>p[1]<2.43);motion='float';b(0,2.38,0,1.03,.17,.69,0xab7a4d);b(0,2.57,0,.67,.27,.55,0xb99161);for(const side of [-1,1])b(side*.24,2.35,.4,.15,.19,.09,0x362f32);for(let j=0;j<9;j++){const a=j*Math.PI*2/9;b(Math.cos(a)*.44,.38,Math.sin(a)*.33,.22,.17,.21,0x8b8367);}rod([0,.51,0],[0,1.21,0],.08,0x8c7560);eyeLine=2.35;
 }else if(id===1283){
  copy('gryphon',1.06,[0x685c4a,0xa38d6c,0xd8c199]);wings=[];for(let j=0;j<10;j++){const a=j*Math.PI/5;oval(Math.cos(a)*.39,1.9+Math.sin(a)*.43,.29,.23,.26,.19,[0x6f5c48,0xb19a73],4,4);}for(const side of [-1,1]){rod([side*.25,1.76,-.18],[side*.73,2.23,-.22],.17,0xa99473);oval(side*.73,2.37,-.18,.2,.24,.21,[0x897156,0xb8a17b,0xd6c29b],4,4);eyes(side*.73,2.4,.03,.08);}rod([0,1.05,-.94],[.39,1.81,-1.27],.13,0x7d7460);oval(.39,1.92,-1.27,.16,.22,.16,0xa39e76,4,4);eyeLine=2.15;
 }else if(id===1295||id===1320){
  const baron=id===1295,p=baron?[0x6d4846,0xa77766,0xe3c6a0]:[0x433d48,0x6c6172,0xbaada6];fur=p[1];oval(0,1.42,0,.48,.75,.35,p,8,6);oval(0,2.22,.08,.49,.41,.33,[0xaa9b83,0xe3d0aa,0xf3e4c8],7,5);for(const side of [-1,1]){b(side*.24,2.22,.43,.27,.24,.06,0x665746);b(side*.24,2.22,.48,.13,.15,.045,0xe4c26f);b(side*.24,2.22,.51,.055,.13,.02,0x342f37);rod([side*.15,2.47,0],[side*.47,2.77,-.06],.1,0xd2b98e);leg(side*.23,.25,.1,.14,.36,.2,0x9b7858);for(let j=0;j<3;j++)b(side*.23+(j-1)*.07,.1,.24,.06,.12,.29,0xd5bd91);}b(0,2.06,.49,.17,.24,.11,0xceab62);b(0,2.69,0,.59,.12,.5,p[0]);b(0,2.92,0,.43,.42,.39,p[0]);b(0,2.78,.23,.45,.11,.07,baron?0xba6456:0x8b6d7a);for(const side of [-1,1]){for(let j=0;j<6;j++)b(side*.48,1.83-j*.15,0,.22,.21,.4,p[j%3]);}eyeLine=2.22;
 }else if(id===1307){
  fur=0xc4b8d4;body([0x817691,0xb3a9ca,0xe4d4df],.85);for(const side of [-1,1]){spike(side*.23,1.94,0,.21,.43,0xd0c9db);rod([side*.23,1.71,.35],[side*.55,1.71,.47],.045,0xd9d4d9);}b(0,1.63,.41,.29,.15,.11,0xe6c2bd);for(let j=0;j<9;j++){const a=(j-4)*.2;rod([0,.67,-.14],[Math.sin(a)*.81,1.25+Math.cos(a)*.28,-.65],.12,0x9f96b8);rod([Math.sin(a)*.81,1.25+Math.cos(a)*.28,-.65],[Math.sin(a)*1.03,1.51,-.92],.1,0xd0c5d6);}rod([.62,.16,.17],[.62,2.15,.17],.07,0xc3a781);b(.62,2.13,.17,.25,.32,.19,0xe5c89f);eyeLine=1.77;
 }else if(id===1309||id===1382||id===1383){
  const p=id===1382?[0x6d292d,0xa5433e,0xe38b54]:[0x884134,0xd77f4e,0xf5c47c];fur=p[1];motion='float';oval(0,1.07,0,.4,.57,.36,p,7,6);eyes(0,1.11,.36,.15,0xf5d38b);for(const side of [-1,1])rod([side*.24,.83,0],[side*.46,.72,.13],.11,p[1]);if(id===1383){for(let j=0;j<8;j++){const a=j*Math.PI/4;rod([Math.cos(a)*.23,1.31,Math.sin(a)*.22],[Math.cos(a)*.56,1.72+(j%2)*.22,Math.sin(a)*.52],.11,0xf6bc6e);}b(0,.91,.38,.3,.18,.05,0x492c2b);}
  else{for(let j=0;j<7;j++)oval(Math.sin(j)*.06,1.48+j*.11,0,.25-j*.03,.12,.23-j*.025,p[j%3],3,3);if(id===1382)rod([0,.67,-.18],[.53,.56,-.71],.095,p[0]);}flames=[{x:0,y:1.25,z:0,size:.55}];eyeLine=1.11;
 }else if(id===1375){
  fur=0xe0dcc1;motion='float';for(let j=0;j<11;j++){b(Math.sin(j*.46)*.12,.46+j*.16,0,.61+(j%3)*.04,.18,.05,j%2?0xd0c9ac:0xeee8cd);}b(0,1.71,.05,.41,.39,.025,0xb9b99b);eyes(0,1.77,.08,.13);b(0,1.55,.08,.19,.06,.025,0x6d755c);for(const side of [-1,1]){rod([side*.25,1.38,0],[side*.65,.82,.02],.08,0xd6d1b7);rod([side*.65,.82,.02],[side*.47,.45,.04],.07,0xe7e0c4);}eyeLine=1.77;
 }else if(id===1413){
  copy('dryad',1.14,[0x6f4c3d,0x9d795c,0xd0a783]);parts=parts.filter(p=>p[1]<1.85);oval(0,1.64,.18,.39,.32,.29,[0x794c3b,0xc08a63,0xe1ad7e],6,5);eyes(0,1.69,.48,.17);b(0,1.49,.49,.38,.11,.07,0x704638);rod([0,1.86,0],[0,2.62,0],.12,0x63854d);oval(0,2.51,.02,.28,.33,.25,[0x9c3d3e,0xc7654c,0xea9d64],5,5);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;rod([0,2.8,0],[Math.cos(a)*.44,2.67,Math.sin(a)*.35],.12,0x67834b);}eyeLine=1.69;
 }else if(id===1513||id===1587){
  const p=id===1513?[0x333943,0x596373,0xb0a9a0]:[0x554a56,0x95818c,0xdbc8ba];body(p,1.06);for(let j=0;j<5;j++)b(0,.32+j*.14,0,.93-j*.07,.16,.63,p[0]);if(id===1513){b(0,2.54,0,.68,.32,.5,0x5b5d71);b(0,2.83,0,.5,.32,.42,0x74788b);b(0,2.98,0,.6,.1,.47,0x999795);b(0,2.76,.24,.23,.23,.045,0xbba88e);b(0,2.76,.28,.11,.16,.025,0x544c52);rod([.65,.2,.1],[.65,2.75,.1],.09,0x8d775e);}else{b(0,2.51,0,.44,.2,.4,0xada08d);b(-.2,2.45,0,.42,.23,.42,0xc6b69a);for(const side of [-1,1])oval(side*.65,1.31,.19,.32,.33,.24,[0xc2a785,0xe6c99e,0xf6deb9],6,5);}eyeLine=2.2;
 }else if(id===1514){
  copy('alligator',1.2,[0x5b7150,0xa5aa73,0xd6cf9e]);for(let j=0;j<9;j++){const a=j*Math.PI*2/9;oval(Math.cos(a)*.4,1.6+Math.sin(a)*.34,.64,.19,.2,.18,[0xbd745d,0xe8a27a,0xf4c89a],4,4);}for(const side of [-1,1])rod([side*.3,1.68,.68],[side*.62,2.08,.51],.11,0xe8d1a0);b(0,1.35,1.39,.65,.12,.08,0xbc594e);eyeLine=1.55;
 }else if(id===1516){
  fur=0xd9c4a0;oval(0,.85,0,.56,.81,.5,[0xa58e6c,0xd0b58b,0xeed9ae],10,8);for(let j=0;j<12;j++){const a=j*2.4,y=.33+(j%5)*.25;b(Math.sin(a)*.42,y,Math.cos(a)*.39,.1,.15,.09,j%2?0xf2dfbc:0xbda47e);}b(-.16,.79,.47,.12,.07,.04,0x8d7356);b(.16,.79,.47,.12,.07,.04,0x8d7356);eyeLine=.8;motion='hop';
 }else if(id===1633||id===1774){
  const p=id===1633?[0x594a50,0x9a8181,0xd0b1aa]:[0x7e4050,0xb26b71,0xe2a48c];orbEye(p,id===1774);bat(1.24,id===1633?.7:.9,[p[0],p[1]]);if(id===1774){for(const side of [-1,1])b(side*.2,.63,.27,.12,.45,.14,0xd4b79c);}else for(const side of [-1,1])rod([side*.24,1.53,0],[side*.5,1.9,-.03],.11,p[2]);
 }else if([1670,1671,1672,1673].includes(id)){
  const colors={1670:[0x717e75,0xb3bba7,0xe3d6b3],1671:[0x466b69,0x86b0aa,0xc6d1b5],1672:[0x73555b,0xb88b86,0xdac0a0],1673:[0x6c607a,0xa69ab8,0xd5cccf]},p=colors[id];fur=p[1];b(0,1.2,0,.83,.82,.64,p[0]);oval(0,1.94,.04,.53,.43,.41,p,7,6);b(0,1.96,.46,.61,.23,.1,0x7d624b);b(0,1.96,.53,.29,.13,.05,0xddcb94);for(const side of [-1,1]){leg(side*.32,.39,0,.32,.52,.35,p[0]);oval(side*.32,.15,.12,.3,.2,.35,p,4,5);b(side*.65,1.25,.05,.34,.65,.43,p[1]);b(side*.65,1.17,.29,.23,.31,.11,p[2]);}b(-.64,1.12,.5,.27,.24,.42,0x5d6968);b(-.64,1.12,.73,.18,.16,.05,0x344246);for(let j=0;j<4;j++)b(0,1.01+j*.14,.35,.55,.055,.04,p[2]);eyeLine=1.96;
 }else if([1676,1677,1678,1679].includes(id)){
  const p=[0x5b6666,0xa1b5ad,0xdfd0af];fur=p[1];oval(0,1.72,0,.51,.46,.34,p,7,6);oval(0,1.77,.32,.31,.25,.1,[0xa28762,0xdbc291],5,3);b(0,1.78,.44,.19,.15,.035,0x628782);b(0,2.2,-.05,.2,.36,.2,[0x6a5657,0x6b6254,0x4d6969,0x6e536b][id-1676]);for(const side of [-1,1]){rod([side*.2,1.34,0],[side*.4,.54,.03],.15,0x6c716c);leg(side*.4,.32,.04,.14,.5,.18,0x6d726c);b(side*.4,.12,.18,.34,.17,.4,0xb5bfae);rod([side*.42,1.53,0],[side*.72,.94,.12],.13,0x6e766f);b(side*.72,.87,.15,.27,.38,.3,0xc3c8b4);}for(let j=0;j<3;j++)b(0,1.54+j*.15,-.35,.31,.07,.09,0xba9769);eyeLine=1.78;
 }else if(id>=1693&&id<=1697){
  const p={1693:[0x53638d,0x8da4ce,0xd2e7f1],1694:[0x75558b,0xb698d2,0xe6d4ec],1695:[0xa96849,0xe7ac68,0xffe2a1],1696:[0x538c76,0x9ccfb2,0xe3e9c5],1697:[0x895065,0xcf91a3,0xf4c5c6]}[id];fur=p[1];motion='float';oval(0,1.15,0,.4,.39,.36,p,7,6);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;const r=.7;const x=Math.cos(a)*r,y=1.15+Math.sin(a)*r;rod([Math.cos(a)*.27,1.15+Math.sin(a)*.27,0],[x,y,.05],.045,p[2]);rod([x,y,.05],[x*.76,y+.3,.12],.04,p[2]);}rod([0,1.51,0],[.13,2.32,0],.07,p[2]);rod([.13,2.32,0],[.04,2.56,0],.06,p[2]);eyeLine=1.15;
 }else if(id===1720){
  fur=0xb78964;oval(0,1.11,-.09,.71,.72,.54,[0x795b4d,0xb58b66,0xe4c296],8,6);for(const side of [-1,1]){leg(side*.42,.37,0,.33,.54,.38,0x926e55);b(side*.42,.15,.18,.42,.22,.55,0xb59069);}for(let j=0;j<3;j++){const x=(j-1)*.48;rod([x*.6,1.47,0],[x,2.26,0],.26,0xb78b63);oval(x,2.45,.15,.3,.36,.3,[0xa47355,0xd2ab7a,0xefd6a7],6,5);oval(x,2.28,.43,.23,.17,.23,0xc29a6d,4,4);eyes(x,2.5,.44,.14,0x527d7f);for(const side of [-1,1])spike(x+side*.19,2.7,-.01,.12,.37,0xe2c39b);}bat(1.58,1.15,[0x986954,0xd3a27d]);for(let j=0;j<5;j++)spike(0,1.42,-.5-j*.14,.18,.32,0xc3a079);eyeLine=2.5;
 }else if(id===1754||id===1755){
  const p=id===1754?[0x403137,0x72515b,0x9b7b7e]:[0x29213f,0x4f3966,0x8b73a3];fur=p[1];motion='float';oval(0,.9,0,.67,.64,.59,p,9,8);for(const side of [-1,1]){b(side*.63,1.02,0,.16,.4,.37,0xc1b3ad);b(side*.69,1.03,.13,.08,.17,.13,0xe0d5c1);}eyes(0,.96,.59,.25,0xd7c49c);b(0,.6,.56,.29,.04,.05,0x392c38);b(-.08,1.61,-.01,.18,.22,.18,0xc6bbae);eyeLine=.96;
 }else if(id===1785){
  const p=[0x3d3439,0x72624f,0xb9a083];body(p,1.22);oval(0,2.46,.39,.38,.27,.4,p,6,5);b(0,2.49,.81,.24,.17,.1,0x3c3034);for(const side of [-1,1]){spike(side*.34,2.78,0,.24,.52,0x8d7b63);oval(side*.65,1.96,0,.42,.43,.38,[0x7e6c57,0xb59c79,0xd0bd9b],5,5);for(let j=0;j<4;j++)b(side*.72,1.94-j*.15,.12,.33,.2,.3,0xc7b695);b(side*.13,2.28,.74,.1,.19,.08,0xd6c7a3);}b(0,1.11,.41,.73,.25,.14,0x584a3c);b(0,1.1,.51,.21,.19,.06,0xc9b383);b(.83,1.18,.24,.28,1.65,.18,0x7a7a78);b(.83,1.91,.24,.46,.17,.25,0x5a5b5c);spike(.83,1.97,.24,.28,.5,0xa1a09a);eyeLine=2.54;
 }else if(id===1869){
  fur=0xb59d8e;motion='float';oval(0,1.24,0,.42,.46,.35,[0x5c4851,0x9a7c7d,0xd4b9a5],7,6);for(const side of [-1,1])b(side*.2,1.31,.36,.19,.23,.08,0x3f3643);b(0,1.11,.37,.12,.14,.06,0x493743);for(let j=0;j<5;j++)b((j-2)*.1,.93,.3,.07,.18,.12,0xd5ba9f);for(let j=0;j<4;j++)rod([0,1.5,-.06],[Math.sin(j)*.35,2.16+j*.11,-.3],.13,0x51777a);flames=[{x:0,y:1.42,z:0,size:.54},{x:.1,y:1.9,z:-.2,size:.36}];eyeLine=1.31;
 }else if(id===1874){
  fur=0xa28a68;motion='float';for(let j=0;j<6;j++)oval(0,.97-j*.035,-.31-j*.25,.62-j*.065,.53-j*.03,.32,[0x8d5c55,0xc18b77,0xe2ba96],6,5);oval(0,1.62,.12,.42,.59,.36,[0x4a3341,0x75505b,0xa8806b],7,5);oval(0,2.29,.25,.38,.36,.31,[0x5b3f42,0xa47766,0xdab18a],6,5);eyes(0,2.32,.55,.2,0xba714f);for(const side of [-1,1]){rod([side*.28,2.51,.1],[side*.56,2.96,-.04],.15,0x443442);rod([side*.36,1.75,0],[side*.89,1.37,.21],.15,0x59404a);b(side*.89,1.3,.25,.25,.28,.29,0xc5a27e);for(let j=0;j<3;j++)leg(side*(.48+j*.08),.48,-.2-j*.37,.12,.52,.15,0x544249);}for(const side of [-1,1]){const wp=[];for(let j=0;j<7;j++)wp.push([side*(.58+j*.18),1.89+j*.07,-.28-j*.07,.26,.13,.61-j*.04,j%2?0xb29e82:0xd9c7a5]);wing(side,[side*.32,1.78,0],wp);}for(let j=0;j<4;j++)b(0,2.4+j*.14,0,.45-j*.07,.14,.36-j*.04,0xc09a68);for(const side of [-1,1])b(side*.12,2.1,.59,.08,.21,.06,0xe4cb9d);eyeLine=2.32;
 }else if(id===1957){
  fur=0xb38e79;oval(0,1.7,0,.47,.87,.34,[0x503e44,0x90705e,0xc9a58b],8,6);for(let j=0;j<4;j++){const y=.36+j*.39;oval(0,y,.1,.36-j*.03,.24,.26,[0x73635c,0xb8a38d,0xe0cdb2],4,4);eyes(0,y+.04,.37,.14);b(0,y-.12,.34,.27,.08,.06,0x51423f);}oval(0,2.72,.12,.35,.39,.3,[0x86634e,0xc49774,0xe3be95],6,5);eyes(0,2.76,.44,.17);b(0,2.54,.43,.28,.13,.06,0x4e3a3c);for(const side of [-1,1]){rod([side*.35,2.13,0],[side*1.01,2.22,.03],.22,0x735446);b(side*.9,2.24,.05,.37,.35,.32,0xc39c73);rod([side*.24,2.91,0],[side*.55,3.24,-.04],.13,0x4b3640);rod([side*.55,3.24,-.04],[side*.31,3.49,-.05],.1,0x75505a);for(let j=0;j<3;j++)b(side*.43,1.92-j*.27,-.07,.26,.21,.25,0xb1977d);}b(0,2.4,.39,.3,.18,.08,0x7e3c47);b(0,1.91,.38,.35,.17,.1,0x6b343f);eyeLine=2.76;
 }else if(id>=1958&&id<=1961){
  fur=0xa8907b;motion='sway';rod([0,.12,0],[0,1.97,0],.15,0x9b775d);for(const side of [-1,1])for(let j=0;j<3;j++){const y=.47+j*.42;rod([0,y,0],[side*.47,y+.42,.07],.09,0xc5ac8c);b(side*.47,y+.47,.07,.13,.23,.13,0xe6d6b6);}spike(0,1.93,0,.2,.43,[0xc15b61,0x81b88e,0xa88dc8,0xc5b97c][id-1958]);for(let j=0;j<4;j++){b(.11,.63+j*.29,.05,.12,.15,.17,0x725643);}eyeLine=1.8;
 }
 // Sprite-face planes stay in front of their rounded volume after scaling.
 if(id===1090){eyes(0,1.1,1.055,.35,0x51333c);b(0,.86,1.05,.21,.055,.04,0x8f4f58);}
 if(id===1186){eyes(0,1.56,.62,.27,0x76636c);b(0,1.22,.67,.29,.08,.04,0x8b6b75);}
 if([1243,1306,1381].includes(id))parts=parts.filter(p=>!(p[3]<=.075&&p[1]<2.3&&p[1]>.6&&p[2]>.48));
 if(id===1088||id===1294){parts=parts.filter(p=>!(Math.max(...p.slice(3,6))<.13&&p[1]>1.63&&p[2]<.3));for(const side of [-1,1])rod([side*.18,1.86,.06],[side*.43,2.55,.04],.055,fur);}
 // The baron wears a broader crown and a spreading bib; the duke has a tall hat and tapered beard.
 if(id===1295||id===1320){
  parts=parts.filter(p=>!(p[1]>=2.65&&p[1]<3.2&&Math.abs(p[0])<.36&&p[2]<=.25));
  b(0,2.69,0,id===1295?.77:.61,.12,id===1295?.62:.51,id===1295?0x6d4846:0x433d48);
  b(0,id===1295?2.95:3.02,0,id===1295?.51:.4,id===1295?.47:.6,id===1295?.46:.36,id===1295?0xa77766:0x6c6172);
  b(0,2.8,.26,id===1295?.53:.42,.12,.065,id===1295?0xc07765:0x9c8696);
  for(let j=0;j<5;j++)b(0,1.94-j*.105,.38,id===1295?.58-j*.045:.39-j*.055,.12,.11,0xe6d4b2);
  if(id===1295)for(const side of [-1,1])b(side*.49,1.28,.09,.24,.42,.31,0xe3c6a0);
 }
 const all=[...parts,...legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...wings.flatMap(w=>w.parts.map(p=>[p[0]+w.pivot[0],p[1]+w.pivot[1],p[2]+w.pivot[2],...p.slice(3)]))];
 if(!all.length)throw Error('Missing Tower B sculpture: '+key);
 const height=Math.max(...all.map(p=>p[1]+p[4]/2));eyeLine=Math.min(eyeLine,height-.04);
 const spec=freeze({key,parts,legs,wings,fur,height,eyeLine,motion,flames});cache.set(key,spec);return spec;
}
