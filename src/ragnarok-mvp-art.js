import {ragnarokTowerPackASpec} from './ragnarok-tower-art-a.js';
// Authored voxel studies of the sixteen MVP sprite silhouettes. Geometry only:
// encounters, rewards and health belong to the shared scenario simulation.
import {RAGNAROK_MVPS} from '../shared/ragnarok-mvp-catalog.js';
export const RAGNAROK_MVP_KINDS=Object.freeze(RAGNAROK_MVPS.map(v=>v.key));
const models=new Map();
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
export function ragnarokMvpSpec(key){
 if(key==='bio_eremes'){if(!models.has(key)){const base=ragnarokTowerPackASpec('tower_1635');const shards=Array.from({length:8},(_,j)=>[Math.sin(j*Math.PI/4)*.52,.5+j*.13,-.35+Math.cos(j*Math.PI/4)*.2,.035,.07,.035,0xb3a4cf]);models.set(key,freeze({...base,key,parts:[...base.parts,...shards],features:[...(base.features||[]),'biolab-mvp-memory']}));}return models.get(key);}if(!RAGNAROK_MVP_KINDS.includes(key))return null;if(models.has(key))return models.get(key);
 const parts=[],legs=[],wings=[],flames=[],b=(...p)=>parts.push(p),leg=(x,y,z,w,h,d,color)=>legs.push({x,y,z,w,h,d,color});
 const oval=(x,y,z,rx,ry,rz,palette,ny=7,nz=7)=>{
  const dy=ry*2/ny,dz=rz*2/nz;for(let j=0;j<ny;j++)for(let k=0;k<nz;k++){
   const fy=(j+.5)/ny*2-1,fz=(k+.5)/nz*2-1,q=1-fy*fy-fz*fz;if(q<.05)continue;
   const w=Math.max(.045,Math.round(rx*2*Math.sqrt(q)/.055)*.055),c=palette[Math.min(palette.length-1,Math.floor((fy+1)*.35*palette.length+(fz+1)*.15*palette.length))];b(x,y+fy*ry,z+fz*rz,w,dy+.004,dz+.004,c);
  }
 };
 const rod=(a,c,w,color,step=.12)=>{const n=Math.max(1,Math.ceil(Math.hypot(...a.map((v,i)=>c[i]-v))/step));for(let i=0;i<=n;i++)b(...a.map((v,j)=>v+(c[j]-v)*i/n),w,w,w,color);};
 const curve=(points,w,color)=>{for(let i=1;i<points.length;i++)rod(points[i-1],points[i],w*(1-(i-1)/(points.length+1)),color);};
 const eyes=(y,z,separation=.18,color=0xf6d36e)=>{for(const s of [-1,1]){b(s*separation,y,z,.14,.10,.06,0x30272d);b(s*separation,y+.005,z+.035,.065,.055,.035,color);}};
 const face=(y,z,pal=[0x947862,0xc9a588,0xf1d2b1],rx=.30,ry=.34,rz=.25)=>oval(0,y,z,rx,ry,rz,pal,7,6);
 const horns=(y,z,spread=.48,height=.65,color=0xd5c8a4)=>{for(const s of [-1,1])curve([[s*.24,y,z],[s*spread,y+.2,z-.05],[s*(spread+.15),y+height*.7,z-.15],[s*(spread+.10),y+height,z-.12]],.14,color);};
 const claws=(x,y,z,color=0xe9d5a2,n=3)=>{for(let j=0;j<n;j++)b(x+(j-(n-1)/2)*.13,y,z+.12,.08,.10,.22,color);};
 const feet=(color,w=.30,z=.08)=>{for(const s of [-1,1]){leg(s*.24,.20,z,w,.40,.40,color);b(s*.24,.50,z-.03,w*.83,.33,.30,color);}};
 const humanoid=(skin,armor,trim,y=1.45)=>{
  oval(0,y,0,.46,.62,.28,[skin,armor,trim],8,6);b(0,y-.43,.22,.79,.11,.12,trim);b(0,y-.43,.29,.19,.16,.06,0xc6a566);
  for(const s of [-1,1]){oval(s*.52,y+.26,-.01,.25,.25,.27,[skin,armor,trim],5,5);rod([s*.53,y+.13,.02],[s*.66,y-.30,.10],.23,armor);b(s*.66,y-.38,.12,.24,.23,.24,skin);}
  feet(armor);
 };
 const featherWings=(y,color,light,span=1.6)=>{
  for(const s of [-1,1]){const pivot=[s*.35,y,-.19],p=[];const add=(x,yy,z,w,h,d,c)=>p.push([x-pivot[0],yy-pivot[1],z-pivot[2],w,h,d,c]);
   for(let i=0;i<9;i++){const t=i/8,yy=y+.26+Math.sin(t*Math.PI*.52)*.78;
    add(s*(.47+t*span),yy,-.28-t*.17,.25,.24+t*.31,.14,i%2?color:light);
    add(s*(.51+t*span),yy-.28,-.25-t*.14,.21,.30+t*.18,.12,color);
    add(s*(.54+t*span),yy-.52,-.23-t*.14,.15,.22+t*.10,.10,i%2?light:color);
    add(s*(.56+t*span),yy-.69,-.22-t*.14,.085,.13,.08,color);
   }
   wings.push({side:s,pivot,parts:p});
  }
 };
 const flame=(x,y,z,size=1)=>{flames.push({x,y:y+.15*size,z,scale:size});for(let i=0;i<4;i++){const t=i/3;b(x+Math.sin(i*1.9)*.04*size,y+t*.48*size,z,(.27-t*.18)*size,(.23-t*.09)*size,(.24-t*.15)*size,[0xa72213,0xe44714,0xffa528,0xffdf7b][i]);}};
 const sword=(x,y,z,length=1.6,color=0xc3c2c6)=>{rod([x,y-.22,z],[x,y+.18,z],.105,0x70554d);b(x,y+.22,z,.5,.105,.14,0xb5a26e);for(let i=0;i<7;i++){const t=i/6;b(x,y+.32+t*length,z,.20-t*.09,length/7+.015,.09,i%2?color:0xe3dfda);}b(x,y+.34+length,z,.08,.22,.065,color);};
 let fur=0xb69a77,eyeLine=2.3,motion='walk';
 if(key==='ifrit'){
  fur=0xb82a16;motion='float';
  oval(0,1.77,0,.49,.60,.31,[0x6d1813,0xb42a16,0xf05a1b],8,7);
  // Ribbed red fire spirit, with angular shoulder spurs and long clawed arms.
  for(const s of [-1,1]){
   oval(s*.52,2.05,0,.27,.27,.28,[0x7a1c15,0xc53815,0xf47c23],5,5);
   rod([s*.60,2.02,.02],[s*.83,1.60,.12],.20,0xb52e17);rod([s*.83,1.60,.12],[s*.95,1.49,.32],.17,0xd54417);claws(s*.96,1.46,.40,0xffac35);
   curve([[s*.49,2.20,-.08],[s*.65,2.45,-.1],[s*.58,2.69,-.12]],.16,0x9b2215);
   for(let j=0;j<3;j++)b(s*(.15+j*.105),1.68+j*.12,.30,.18,.13,.07,0xe1541c);
   flame(s*.78,1.57,.12,.8);
  }
  face(2.52,.04,[0x7d1b13,0xc93617,0xf15f18],.27,.32,.24);eyes(2.54,.273,.13,0xffe181);b(0,2.39,.29,.22,.075,.09,0x5f1816);
  horns(2.69,-.02,.38,.62,0xa51f14);
  for(let j=0;j<7;j++){const yy=[.30,.48,.25,.61,.38,.53,.24][j];b((j-3)*.09,2.81+yy*.4,-.06,.09,.20+yy,.12,j%2?0xde4014:0xf3631b);}
  // The sprite's twisting lower fire tail replaces ordinary boots.
  curve([[0,1.30,0],[-.25,.94,.02],[.18,.69,.10],[.30,.37,.01],[-.10,.16,.14],[-.40,.23,.25]],.30,0x9f2517);
  curve([[.15,1.24,.03],[.31,.90,-.02],[-.02,.57,.03],[-.12,.28,.14]],.17,0xec5919);
  flame(-.39,.24,.22,1);flame(.19,1.13,.08,.7);eyeLine=2.54;
 }else if(key==='valkyrierandgris'){
  fur=0xa1a5bc;humanoid(0xd1b5a0,0x667080,0xc5c4d1,1.48);
  // Dark swept feathers and pink cloak distinguish Randgris from white angels.
  featherWings(2.05,0x493c49,0x71606f,1.45);
  for(let j=0;j<8;j++){const y=.39+j*.22,w=.78-j*.035;b(0,y,-.34,w,.23,.11,j%2?0x985e6b:0xb9767e);}
  for(const s of [-1,1]){b(s*.25,.77,.05,.28,.39,.35,0x838c9d);b(s*.24,.94,.23,.23,.15,.10,0xc9cbd5);b(s*.23,.24,.21,.30,.19,.40,0x667383);}
  face(2.28,.02,[0xa88177,0xd4b7a8,0xf0d5ba],.24,.28,.22);b(0,2.54,-.02,.51,.17,.45,0xaab1c0);b(0,2.64,-.01,.19,.18,.23,0xc7c9d1);eyes(2.31,.24,.12,0x6f6576);
  for(const s of [-1,1])curve([[s*.23,2.48,-.02],[s*.37,2.72,-.04],[s*.36,2.98,-.03]],.10,0xb4bccb);
  sword(.77,1.31,.18,1.8,0x9da7c2);b(-.63,1.40,.30,.42,.64,.14,0x565e76);b(-.63,1.40,.39,.12,.45,.06,0xc8b6a4);eyeLine=2.31;
 }else if(key==='satanmorroc'){
  fur=0x65504b;oval(0,1.79,-.02,.82,.82,.50,[0x382f33,0x66514d,0x927465],9,8);
  for(const s of [-1,1]){
   oval(s*.90,1.92,.02,.37,.43,.37,[0x493c3d,0x72574f,0x98745e],6,6);rod([s*.96,1.72,.03],[s*1.13,1.04,.11],.34,0x6d554c);oval(s*1.12,.85,.22,.31,.29,.28,[0x443937,0x6d5547,0x8f725c],5,5);claws(s*1.12,.69,.38,0xc3a27f);
   for(let j=0;j<5;j++)b(s*(.48+j%2*.09),1.39+j*.18,.40,.24,.15,.13,j%2?0x4f403f:0x8a6a5c);
   for(let j=0;j<4;j++)curve([[s*(.60+j*.13),2.42-j*.11,-.29],[s*(.74+j*.18),2.61-j*.11,-.42],[s*(.90+j*.18),2.73-j*.13,-.49]],.13,0x342e34);
   b(s*.46,.65,.03,.44,.48,.47,0x463d3b);leg(s*.49,.25,.17,.48,.38,.66,0x6f5a4e);claws(s*.49,.09,.51,0xbca17a);
  }
  face(2.68,.10,[0x3e3335,0x775a4c,0xa77b5c],.39,.40,.32);eyes(2.74,.407,.20,0xf2bf57);b(0,2.51,.42,.50,.21,.12,0x302a30);for(let i=0;i<5;i++)b((i-2)*.09,2.56,.49,.065,.105,.045,0xd6bb8e);
  horns(2.91,-.03,.59,.70,0x3b3030);curve([[0,2.92,-.10],[0,3.27,-.09],[.08,3.45,-.10]],.15,0x3b3030);
  for(const s of [-1,1]){oval(s*.35,2.02,.41,.33,.27,.12,[0x4e3e3d,0x816250,0x9e785e],5,4);for(let j=0;j<6;j++)b(s*(.10+j*.10),1.63+(j%2)*.08,.46,.09,.13,.075,j%2?0x725248:0xa07c61);for(let j=0;j<3;j++)b(s*.49,.52+j*.12,.30,.32-j*.025,.08,.14,0x9d7e63);}
  b(0,1.07,.44,1.08,.20,.17,0x302e32);b(0,1.07,.56,.40,.30,.09,0xad9574);b(0,1.07,.62,.23,.16,.05,0x463c38);for(const s of [-1,1])for(let j=0;j<4;j++)b(s*(.30+j*.08),.96-j*.06,.45,.075,.16,.07,0xb89a70);eyeLine=2.74;
 }else if(key==='phreeoni'){
  fur=0xe5a49e;motion='hop';oval(0,1.20,-.10,1.02,.80,.72,[0x946d80,0xc88f9b,0xefb0a2],9,9);oval(0,1.72,.33,.76,.60,.48,[0xa97082,0xe7a3a1,0xffc4ac],8,7);
  // Huge tooth-lined grin, hanging tongue, little eyes and green head feelers.
  oval(0,1.32,.78,.69,.39,.12,[0x4f3946,0x6e3e4b,0x995b63],6,4);
  for(let i=0;i<11;i++){const x=(i-5)*.112,y=1.45-Math.abs(i-5)*.013;b(x,y,.91,.086,.24,.065,0xffe9bc);b(x,1.15+Math.abs(i-5)*.012,.91,.085,.14,.065,0xe5c58c);}
  b(.12,1.02,.88,.32,.12,.20,0xc76d88);b(.12,.95,.99,.29,.10,.24,0xe58fa4);eyes(1.89,.745,.40,0x83cfb1);
  for(const s of [-1,1]){oval(s*1.01,1.23,.08,.40,.27,.28,[0xc18191,0xeaa29e,0xffc3b1],5,5);b(s*1.29,1.27,.16,.30,.13,.33,0xf5bab1);leg(s*.43,.26,.08,.30,.28,.37,0x966d79);for(let j=0;j<3;j++)b(s*.43+(j-1)*.12,.14,.27,.08,.08,.17,0xd7b0a1);}
  for(let j=0;j<7;j++){const x=(j-3)*.19,h=.36+(j%3)*.14;curve([[x,2.03,.10],[x*1.22,2.12+h*.5,.03],[x*1.40+(j%2?.12:-.09),2.10+h,-.05]],.07,0xa9ba68);b(x*1.40,2.12+h,-.05,.13,.07,.15,0xcbd58b);}
  eyeLine=1.89;
 }else if(key==='baphomet'){
  fur=0xa45b37;humanoid(0x945034,0x9f5735,0xc88750,1.43);face(2.33,.10,[0x713f32,0xab643e,0xd39557],.27,.37,.31);
  oval(0,2.19,.38,.24,.26,.20,[0x8a4a32,0xb87646,0xdba363],5,5);b(0,2.12,.56,.20,.15,.10,0x5b3430);eyes(2.46,.36,.17,0xebc262);
  horns(2.60,-.05,.51,.61,0x69554a);for(const s of [-1,1]){b(s*.39,2.31,.02,.28,.15,.20,0x9b5337);for(let j=0;j<4;j++)b(s*(.44+j*.09),1.96-j*.08,-.17,.22,.31,.30,j%2?0xd3b78b:0xead1a1);leg(s*.24,.17,.13,.26,.28,.40,0x493635);}
  for(let j=0;j<4;j++)b(0,2.01-j*.12,.35,.22-j*.035,.17,.15,0x8f5134);
  // Oversized crescent scythe: long dark shaft and a segmented silver arc.
  rod([.82,.12,.05],[.82,3.20,.05],.095,0x493a3d);
  for(let i=0;i<14;i++){const t=i/13,x=.80-1.67*t,y=3.18+.24*Math.sin(t*Math.PI);b(x,y,.05,.20,.17,.085,i%2?0xbfc0d1:0xe0d9e1);if(i>6)b(x,y-.12,.05,.16,.12,.07,0x817b98);}
  eyeLine=2.46;
 }else if(key==='osiris'){
  fur=0x958689;oval(0,1.36,-.06,.37,.64,.28,[0x554b60,0x8d7d90,0xb3a1a6],8,6);
  for(let j=0;j<11;j++){const y=.80+j*.10;b(0,y,.22,.68,.06,.075,j%2?0xc2afb1:0x8c7a8c);if(j%3===0)b(.12,y+.035,.27,.23,.03,.04,0x5b4c60);}
  feet(0x6c586f,.23);for(const s of [-1,1]){rod([s*.39,1.85,.01],[s*.53,1.29,.18],.18,0x9b8796);for(let j=0;j<4;j++)b(s*.50,1.35+j*.10,.28,.21,.055,.08,0xc3ada9);}
  face(2.22,.05,[0x5c4b65,0x968095,0xbea8b1],.27,.33,.24);for(let j=0;j<5;j++)b(0,2.02+j*.10,.29,.49,.055,.05,j%2?0xc6b4b7:0x8a7588);eyes(2.26,.322,.14,0xf5c36d);
  // Golden uraeus crown with the upright curling cobra on the brow.
  b(0,2.49,.02,.55,.13,.43,0xd4a45c);b(0,2.58,.03,.40,.12,.34,0x9a6943);curve([[0,2.60,.17],[0,2.86,.17],[.12,2.98,.15],[.20,2.88,.16],[.10,2.77,.17]],.10,0xe5bc71);b(.10,2.83,.22,.17,.10,.09,0xf2ce85);eyeLine=2.26;
 }else if(key==='drake'){
  fur=0x3c5554;humanoid(0x9b9b83,0x334a4e,0x617d73,1.42);
  for(let j=0;j<8;j++){const y=.40+j*.18;for(const s of [-1,1])b(s*(.31+j*.012),y,-.10,.19,.20,.43,0x334948);b(0,y,-.28,.66,.20,.10,0x253a41);}
  for(const s of [-1,1]){b(s*.38,1.47,.29,.10,.77,.09,0xd39e58);for(let j=0;j<5;j++)b(s*.28,1.15+j*.13,.31,.08,.07,.06,0xcc9d5c);for(let j=0;j<4;j++)b(s*(.53+j*.045),1.98-j*.04,.03,.11,.17,.27,0xc8b270);}
  face(2.20,.02,[0x5c7775,0x9cae9b,0xc6c7a7],.24,.30,.22);eyes(2.27,.24,.13,0xd3be7a);b(0,2.09,.26,.23,.15,.05,0x394844);for(let i=0;i<4;i++)b((i-1.5)*.06,2.08,.30,.04,.10,.04,0xc3b99e);
  b(0,2.50,-.03,.80,.13,.46,0x263644);b(0,2.66,-.08,.54,.26,.33,0x314654);b(-.38,2.58,-.04,.16,.22,.38,0x786e58);b(.38,2.58,-.04,.16,.22,.38,0x786e58);b(0,2.68,.105,.20,.14,.04,0xd2b075);b(0,2.68,.135,.07,.07,.04,0x2e3b41);
  sword(.73,.80,.22,1.08,0xb5c6bb);eyeLine=2.27;
 }else if(key==='doppelganger'){
  fur=0x514c64;humanoid(0x5f5367,0x46445b,0x7d7489,1.41);face(2.22,.03,[0x51465a,0x8c7282,0xb89b9d],.235,.28,.22);eyes(2.24,.255,.12,0xb7899a);
  // Spiky silver-grey hair, layered pauldrons, arm guards and long sword.
  for(let j=0;j<7;j++)b((j-3)*.074,2.46+(j%3)*.045,.0,.10,.16+(j%2)*.11,.36,j%2?0x92909b:0xb0a6ad);
  for(const s of [-1,1]){for(let j=0;j<3;j++)b(s*(.49+j*.06),1.96-j*.085,0,.33,.12,.44,j%2?0x817588:0x5a526b);b(s*.24,.73,.12,.27,.25,.36,0x6f647b);b(s*.23,.23,.21,.28,.20,.45,0x3c3a51);b(s*.65,1.16,.18,.24,.25,.28,0x756c82);}
  for(let j=0;j<4;j++)b(0,1.37+j*.12,.28,.54-j*.04,.09,.09,0x71667a);sword(.79,.60,.24,1.68,0x8e879f);eyeLine=2.24;
 }else if(key==='amonra'){
  fur=0xb69c78;
  // Entire carved sandstone throne is part of the MVP, not a plain pedestal.
  b(0,.14,-.05,1.72,.22,1.30,0x89775e);b(0,.30,-.05,1.51,.17,1.16,0xb29b75);b(0,.54,-.10,1.27,.32,.99,0x8b7963);
  for(const s of [-1,1]){for(let j=0;j<7;j++){const y=.58+j*.28;oval(s*.64,y,-.42,.19,.20,.22,[0x766858,0xaa9374,0xc7af89],4,4);}b(s*.62,1.05,.02,.30,.17,.90,0xc4ad88);b(s*.63,.79,.32,.29,.44,.33,0xaa9170);for(let j=0;j<3;j++)b(s*.63,.70+j*.10,.50,.20,.06,.05,0xe1c69a);}
  for(let j=0;j<6;j++)b(0,1.42+j*.22,-.48,1.14,.18,.22,j%2?0x9a856b:0xb49c7b);for(const s of [-1,1])b(s*.40,2.68,-.47,.30,.25,.30,0xd5ba93);
  oval(0,1.43,.02,.31,.47,.24,[0x4f6259,0x718b78,0xa3b29a],7,6);b(0,1.07,.26,.70,.31,.42,0x9f8c68);
  for(const s of [-1,1]){rod([s*.20,1.04,.16],[s*.28,.67,.47],.22,0xb69b76);b(s*.28,.61,.57,.23,.14,.33,0xd3b58b);rod([s*.34,1.66,.06],[s*.55,1.30,.30],.17,0xab9371);}
  face(2.05,.06,[0x846e54,0xb99b6e,0xdfbe86],.23,.31,.21);b(0,2.29,.03,.58,.13,.36,0xb09c70);for(const s of [-1,1])for(let j=0;j<5;j++)b(s*.27,2.17-j*.13,.03,.13,.14,.36,j%2?0xb9ab76:0x5b938d);eyes(2.10,.28,.12,0x314b45);b(0,1.87,.27,.12,.27,.11,0x5d6955);
  rod([-.71,.94,.20],[-.71,2.24,.20],.075,0x9c764d);b(-.71,2.37,.20,.22,.32,.14,0x729c9a);b(-.71,2.37,.29,.09,.22,.05,0xe0b771);eyeLine=2.10;
 }else if(key==='eddga'){
  fur=0xc98c4b;oval(0,1.29,0,.68,.84,.47,[0x916141,0xc78d4e,0xe9bc70],9,8);oval(0,1.25,.39,.45,.64,.20,[0xc89960,0xe6bd7d,0xf6d69b],7,5);face(2.22,.08,[0xaa7441,0xddaa60,0xf3cc86],.48,.44,.36);oval(0,2.09,.42,.33,.23,.18,[0xc8a079,0xf5dab1,0xffe5c6],5,5);eyes(2.35,.40,.24,0x674b39);b(0,2.17,.61,.19,.12,.10,0x614336);
  for(const s of [-1,1]){oval(s*.38,2.58,.0,.18,.20,.13,[0x9c643b,0xd89d59,0xe9bc75],4,4);b(s*.38,2.58,.13,.12,.16,.05,0x5b473d);rod([s*.65,1.77,.0],[s*.83,1.17,.14],.30,0xd49b59);oval(s*.83,1.06,.18,.23,.26,.23,[0x9a6a42,0xcf9857,0xf2c782],5,5);leg(s*.34,.22,.15,.35,.34,.50,0xdca55e);claws(s*.34,.08,.39,0xead4ab);for(let j=0;j<4;j++){b(s*(.52-j*.04),1.08+j*.22,.35,.21,.075,.11,0x73503b);b(s*(.37-j*.04),2.13+j*.13,.40,.13,.055,.06,0x76503a);}}
  // Smoking pipe and crest are the boss's most distinctive accessories.
  rod([-.24,2.12,.56],[-.76,2.13,.70],.065,0x5a443a);b(-.83,2.18,.70,.19,.22,.18,0xc1b39b);b(-.83,2.31,.70,.21,.05,.19,0xe4d6b9);for(let j=0;j<3;j++)b(-.83+j*.06,2.43+j*.17,.70,.10+j*.035,.10,.10+j*.035,0x9d9b96);b(0,2.63,-.10,.29,.27,.27,0x6b4639);eyeLine=2.35;
 }else if(key==='gtb'){
  fur=0xc9a052;motion='insect';oval(0,.94,-.03,.78,.51,1.02,[0x6d522c,0xb18438,0xe1bc65,0xf4d98e],9,11);
  // Raised elytra surround a dark central seam and circular golden boss marks.
  for(let j=0;j<9;j++)b(0,1.38-Math.abs(j-4)*.035,-.79+j*.20,.055,.045,.18,0x5b482d);
  for(const s of [-1,1]){for(let j=0;j<3;j++){const z=-.64+j*.61;rod([s*.59,.82,z],[s*.97,.62,z+.13],.10,0x987139);rod([s*.97,.62,z+.13],[s*1.13,.15,z+.30],.08,0x493a30);leg(s*1.13,.10,z+.30,.13,.12,.20,0x4c3d2e);}
   for(let j=0;j<3;j++){const z=-.49+j*.49;b(s*.38,1.29,z,.26,.10,.26,0x967133);b(s*.38,1.36,z,.15,.07,.15,0xf5d78c);}}
  oval(0,.86,.89,.43,.34,.36,[0x88602d,0xc09243,0xe7bf65],6,6);eyes(.98,1.20,.22,0x251e1a);for(const s of [-1,1]){curve([[s*.26,.87,1.16],[s*.41,.72,1.38],[s*.22,.66,1.50]],.10,0xe2c17a);curve([[s*.22,1.12,1.04],[s*.39,1.42,1.20],[s*.51,1.58,1.36]],.055,0x6b5231);}eyeLine=.98;
 }else if(key==='mistress'){
  fur=0xe4bd7a;motion='float';oval(0,1.12,-.07,.38,.66,.33,[0x9c7348,0xd7ad69,0xf5d38b],8,7);oval(0,1.83,.04,.29,.39,.25,[0xac8757,0xe2bf87,0xffdb9e],7,6);eyes(1.88,.29,.14,0x745843);
  for(let j=0;j<5;j++)b(0,.77+j*.16,.26,.55-j*.035,.055,.07,j%2?0x7e5e42:0xdab77a);
  // Tall queen crown, pink translucent-style wings and long tapered abdomen.
  b(0,2.16,.01,.57,.14,.44,0xc79951);for(let j=0;j<5;j++)b((j-2)*.11,2.32+(j%2)*.09,.03,.08,.30+(j%2)*.17,.12,0xeac77f);b(0,2.27,.25,.12,.14,.06,0xe89891);
  for(const s of [-1,1]){rod([s*.33,1.62,.01],[s*.57,1.16,.13],.105,0xc69b64);rod([s*.19,.78,.04],[s*.24,.35,.10],.09,0xb38d5a);b(s*.24,.31,.17,.12,.12,.26,0xe7c58a);curve([[s*.17,2.08,.02],[s*.23,2.55,-.02],[s*.35,2.67,-.04]],.045,0x987549);
   const pivot=[s*.20,1.70,-.17],pp=[];for(let j=0;j<5;j++){pp.push([s*(.35+j*.13),.04+j*.10,-.07,.22,.37-j*.035,.06,j%2?0xdc91a1:0xf0b0b6]);pp.push([s*(.35+j*.11),-.21+j*.035,-.06,.20,.24,.055,0xd68c9f]);}wings.push({side:s,pivot,parts:pp});}
  for(let j=0;j<4;j++)b(0,.53-j*.09,-.15,.51-j*.105,.13,.37-j*.065,j%2?0xa77a43:0xd1a260);eyeLine=1.88;
 }else if(key==='maya'){
  fur=0xb98c5e;motion='insect';oval(0,.80,-.43,.65,.43,.91,[0x71533f,0xac8152,0xd6ad76],8,9);oval(0,1.40,.37,.30,.53,.26,[0x947056,0xc39871,0xe5c7a0],7,6);face(2.04,.37,[0xa77c58,0xd3ad7d,0xedcf9c],.26,.32,.24);eyes(2.09,.62,.13,0x3e3b2d);
  for(let j=0;j<6;j++)b(0,.90,-1.11+j*.27,.95-Math.abs(j-2)*.10,.075,.12,0x72533e);
  for(const s of [-1,1]){for(let j=0;j<3;j++){const z=-.87+j*.66;rod([s*.46,.81,z],[s*.89,.58,z+.05],.075,0x9c744e);rod([s*.89,.58,z+.05],[s*1.03,.12,z+.22],.06,0xb68c59);leg(s*1.03,.09,z+.22,.12,.10,.17,0xd0ad72);}
   rod([s*.30,1.68,.35],[s*.66,1.42,.46],.105,0xc29465);curve([[s*.66,1.42,.46],[s*.88,1.62,.52],[s*.74,1.78,.54]],.08,0xe0bd86);curve([[s*.15,2.29,.33],[s*.27,2.60,.28],[s*.40,2.70,.28]],.05,0xc0935a);b(s*.40,2.71,.28,.08,.10,.08,0xe7c888);
   for(let j=0;j<4;j++)b(s*(.21+j*.05),1.12+j*.15,.60,.095,.12,.07,0xe0ba80);}
  b(0,2.35,.40,.45,.10,.32,0x8a643f);for(let j=0;j<3;j++)b((j-1)*.13,2.47+(!j?.06:0),.40,.08,.18,.09,0xe6c17a);eyeLine=2.09;
 }else if(key==='stormyknight'){
  fur=0x8499cc;humanoid(0x6176a9,0x7386b6,0xc2ccec,1.43);face(2.26,.01,[0x4c5f92,0x8da1d0,0xc7d6ec],.28,.33,.25);b(0,2.26,.28,.48,.10,.07,0x414f79);eyes(2.29,.33,.15,0xffcc6c);
  for(const s of [-1,1]){for(let j=0;j<3;j++){b(s*(.47+j*.10),2.02+j*.08,-.02,.18,.28,.25,0xc1cbee);b(s*(.35+j*.08),2.61+j*.08,-.02,.12,.25,.13,0xdbe1ef);}curve([[s*.28,2.61,-.03],[s*.43,2.93,-.09],[s*.37,3.23,-.13],[s*.54,3.43,-.16]],.075,0xa4765b);curve([[s*.43,3.00,-.10],[s*.65,3.10,-.12],[s*.75,3.24,-.13]],.06,0xb68c6b);leg(s*.23,.18,.15,.30,.25,.46,0xa3424c);b(s*.23,.57,.12,.30,.24,.31,0x5d719f);}
  // Icicle lance, orange copper shield with engraved cross, red scarf/boots.
  rod([.78,.25,.15],[.78,2.25,.15],.075,0x6e7697);for(let j=0;j<5;j++)b(.78,2.29+j*.12,.15,.28-j*.045,.15,.09,0xb8d4ee);
  oval(-.75,1.43,.31,.44,.55,.11,[0x714644,0xaa6852,0xd89865],8,5);b(-.75,1.43,.44,.64,.11,.05,0x5f4145);b(-.75,1.43,.44,.10,.79,.05,0x5f4145);b(-.75,1.43,.48,.19,.19,.05,0xe0ab70);b(0,1.99,.30,.53,.15,.15,0xc34e57);eyeLine=2.29;
 }else if(key==='hatii'){
  fur=0xd4d6f1;motion='run';oval(0,1.18,-.20,.56,.51,1.0,[0x7c8fb9,0xb6c1e4,0xe6e2f8],8,10);oval(0,1.57,.68,.47,.47,.52,[0x8198c2,0xc0c8e8,0xeeeafa],7,8);oval(0,1.36,1.16,.29,.24,.37,[0x9bb0d0,0xd2d9ec,0xf1edfa],5,6);b(0,1.43,1.49,.27,.13,.12,0x5c6585);eyes(1.76,1.04,.24,0xb57666);
  for(const s of [-1,1]){for(const z of [-.86,.57]){rod([s*.37,.96,z],[s*.45,.31,z+.08],.23,0xc1cce7);leg(s*.45,.17,z+.20,.28,.22,.40,0xe3e1f2);claws(s*.45,.09,z+.40,0x839ac3);}b(s*.34,1.97,.55,.19,.41,.23,0xc8c9e8);b(s*.34,2.11,.58,.11,.20,.12,0xeff0fa);for(let j=0;j<5;j++){const z=-.8+j*.39;b(s*(.43+Math.sin(j)*.09),1.42,z,.23,.40+(j%2)*.16,.27,0xe4e0f6);b(s*.50,1.66,z,.12,.18,.17,0xb7b8df);}}
  for(let j=0;j<8;j++){const z=-.96+j*.24;b(0,1.77,z,.21,.27+(j%3)*.11,.25,j%2?0xeeeafa:0xb1b8de);b(0,1.94+(j%3)*.05,z,.10,.20,.14,0xd6daf1);}
  b(0,1.23,1.32,.38,.09,.15,0x667591);for(const s of [-1,1]){b(s*.14,1.21,1.40,.065,.16,.07,0xe9e8f5);for(let j=0;j<3;j++)b(s*.32,.48+j*.15,.60,.22,.075,.13,j%2?0xc5d1ed:0xf0eefa);}
  curve([[0,1.16,-1.04],[.12,1.46,-1.43],[.21,1.59,-1.74],[.16,1.39,-1.94]],.23,0xe2e2f3);eyeLine=1.76;
 }else if(key==='fallenbishop'){
  fur=0x796b85;motion='float';
  // Ragged purple vestments, towering bent mitre and spectral bishop behind.
  for(let j=0;j<10;j++){const y=.30+j*.16,w=.89-j*.037;b(0,y,-.03,w,.18,.46,j%2?0x574c61:0x77657b);for(const s of [-1,1])b(s*(w*.42),y,.23,.10,.18,.07,0xa48d7f);}
  face(2.00,.10,[0x756960,0xafa18a,0xd2c1a1],.24,.27,.22);eyes(2.03,.33,.12,0xb09b80);b(0,1.91,.34,.15,.10,.045,0x5a4d53);
  for(let j=0;j<5;j++)b(0,2.28+j*.12,-.02,.51-j*.065,.14,.38-j*.025,j%2?0x8b7c93:0xb4a0a9);b(.05,2.79,-.03,.17,.14,.23,0xc0a8b0);b(.13,2.85,-.05,.13,.13,.18,0x87728b);
  for(const s of [-1,1]){rod([s*.42,1.70,0],[s*.64,1.28,.18],.18,0x776373);b(s*.64,1.22,.23,.17,.20,.18,0xc3ad91);b(s*.38,.24,.10,.17,.23,.28,0x8f7977);}
  for(let j=0;j<7;j++)b(0,.51+j*.15,.24,.13,.10,.06,0xb69d75);
  rod([-.80,.28,.18],[-.80,2.25,.18],.075,0x665569);curve([[ -.80,2.25,.18],[-1.05,2.50,.18],[-1.00,2.77,.18],[-.79,2.89,.18],[-.65,2.73,.18],[-.80,2.57,.18]],.10,0x9f8eac);
  // Circular spectral halo/face appears above the rear shoulder in the sprite.
  for(let i=0;i<18;i++){const a=i*Math.PI/9;b(.30+Math.sin(a)*.46,2.56+Math.cos(a)*.54,-.38,.12,.15,.10,0x817799);}
  oval(.30,2.57,-.40,.29,.36,.12,[0x625772,0x8d83a4,0xada0b9],6,4);for(const s of [-1,1])b(.30+s*.12,2.62,-.255,.07,.10,.045,0x453d59);b(.30,2.43,-.25,.13,.09,.04,0x51435e);eyeLine=2.03;
 }
 const all=[...parts,...legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...wings.flatMap(w=>w.parts.map(p=>[p[0]+w.pivot[0],p[1]+w.pivot[1],p[2]+w.pivot[2],...p.slice(3)]))];
 const height=Math.max(...all.map(p=>p[1]+p[4]/2))+.02;
 const spec=freeze({key,parts,legs,wings,flames,fur,height,eyeLine,motion});models.set(key,spec);return spec;
}
