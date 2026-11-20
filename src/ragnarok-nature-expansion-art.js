// Authored voxel studies of the 32 sprites identified in the nature registry.
// Layered bodies, facial planes and appendages are shared by live rigs/portraits.
import {RAGNAROK_NATURE_EXPANSION} from '../shared/ragnarok-nature-expansion.js';
export const RAGNAROK_NATURE_EXPANSION_KINDS=Object.freeze(RAGNAROK_NATURE_EXPANSION.map(v=>v.key));
const cache=new Map(),deep=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(deep);Object.freeze(v);}return v;};
export function ragnarokNatureExpansionSpec(key){
 if(!RAGNAROK_NATURE_EXPANSION_KINDS.includes(key))return null;if(cache.has(key))return cache.get(key);
 const parts=[],legs=[],wings=[],b=(...p)=>parts.push(p),leg=(x,y,z,w,h,d,color)=>legs.push({x,y,z,w,h,d,color});
 const oval=(x,y,z,rx,ry,rz,colors,ny=6,nz=7)=>{for(let j=0;j<ny;j++)for(let k=0;k<nz;k++){const yy=(j+.5)/ny*2-1,zz=(k+.5)/nz*2-1,q=1-yy*yy-zz*zz;if(q>.05)b(x,y+yy*ry,z+zz*rz,Math.max(.06,Math.round(rx*2*Math.sqrt(q)/.06)*.06),ry*2/ny+.006,rz*2/nz+.006,colors[Math.min(colors.length-1,Math.floor(j/ny*colors.length))]);}};
 const rod=(a,c,w,color,step=.16)=>{const n=Math.ceil(Math.hypot(...a.map((v,i)=>c[i]-v))/step);for(let i=0;i<=n;i++)b(...a.map((v,j)=>v+(c[j]-v)*i/Math.max(1,n)),w,w,w,color);};
 const eyes=(x,y,z,space=.18,color=0x3c2d35)=>{for(const s of [-1,1]){b(x+s*space,y,z,.105,.13,.045,color);b(x+s*space-.018,y+.03,z+.027,.033,.04,.015,0xfff4d9);}};
 const face=(y,z,space=.18)=>{eyes(0,y,z,space);b(0,y-.18,z+.01,.14,.04,.035,0x735044);};
 const wing=(side,pivot,world)=>wings.push({side,pivot,parts:world.map(p=>[p[0]-pivot[0],p[1]-pivot[1],p[2]-pivot[2],...p.slice(3)])});
 let fur=0x9e825f,eyeLine=1,motion='walk';
 if(['drops','poporing'].includes(key)){
  const acid=key==='poporing',p=acid?[0x6f985d,0x9bb66d,0xc9d990,0xe9edba]:[0xbd7650,0xe4a765,0xf6cd89,0xffe7ac];fur=p[1];
  oval(0,.74,0,.92,.7,.76,p,9,10);oval(acid?.08:-.08,1.31,-.04,.25,.22,.21,p.slice(1),4,4);
  face(.83,.74,.27);for(const s of [-1,1])b(s*.42,.57,.67,.16,.07,.06,acid?0x829e68:0xebae79);
  b(-.40,1.02,.62,.22,.10,.06,0xffedb9);b(-.52,.91,.64,.08,.16,.04,0xfff8db);
  if(acid){for(const [x,z]of [[-.41,-.27],[.39,.13],[.1,-.45]])b(x,1.12,z,.12,.07,.12,0x77945d);b(.08,1.62,-.04,.10,.11,.10,0xc6d888);}else b(-.08,1.65,-.04,.11,.11,.11,0xe69f6c);motion='hop';eyeLine=.83;
 }else if(key==='lunatic'){
  fur=0xe8e3f0;oval(0,.72,0,.78,.63,.64,[0x9690b0,0xc6bdd8,0xe9e5f3,0xfffbff],7,8);
  for(let i=0;i<14;i++){const a=i*Math.PI/7;b(Math.cos(a)*.72,.7+Math.sin(a)*.48,-.13,.2,.2,.24,i%2?0xd4cde6:0xf5f0fa);}
  for(const s of [-1,1]){rod([s*.25,1.05,0],[s*.4,1.98,-.12],.23,0xf7f3fb);rod([s*.25,1.13,.13],[s*.37,1.85,.04],.09,0xce98a8);leg(s*.33,.13,.32,.30,.25,.36,0xcac1de);}
  oval(0,.51,.50,.41,.25,.23,[0xc8bfd6,0xf3edf6],4,5);eyes(0,.78,.623,.26);b(0,.59,.74,.12,.08,.06,0xae7d92);oval(.70,.69,-.39,.24,.25,.24,[0xcfc5e2,0xf5edfb],4,4);eyeLine=.78;motion='hop';
 }else if(key==='fabre'){
  fur=0xa8bd7c;for(let i=0;i<5;i++){const z=-.78+i*.4,y=.39+Math.sin(i*.6)*.08;oval(0,y,z,.40-i*.025,.34,.3,[0x6c8864,0xa7b980,0xd8dca0],5,5);for(const s of [-1,1]){leg(s*.36,.12,z,.15,.17,.20,0xa7896c);b(s*.33,y+.1,z,.11,.12,.10,0xd5b6a1);}}
  oval(0,.45,1.04,.38,.36,.34,[0x819b6d,0xbbce90,0xe1e6ab],5,6);face(.53,1.36,.18);for(const s of [-1,1])rod([s*.18,.67,1],[s*.34,1,1.08],.07,0xa3af74);eyeLine=.53;motion='insect';
 }else if(key==='pupa'){
  fur=0x8c6d76;oval(0,1.1,0,.62,1.08,.52,[0x5d526d,0x826474,0xa88985,0xc2a68d],12,8);
  for(let j=0;j<11;j++){const y=.21+j*.17,r=Math.sqrt(Math.max(.05,1-((y-1.1)/1.1)**2));b((j%3-1)*.07,y,.45*r,.94*r,.075,.11,j%2?0xb69b86:0x6e5668);}
  b(-.19,1.56,.40,.25,.045,.1,0xd4b99a);b(.15,.8,.54,.27,.045,.08,0xbda08b);eyeLine=1;motion='idle';
 }else if(key==='creamy'){
  fur=0xb87377;oval(0,1.15,0,.18,.5,.19,[0x6f4c69,0x9b5e77,0xd69788],7,5);oval(0,1.72,.07,.22,.23,.2,[0x9e647c,0xd89a98],5,5);face(1.75,.25,.105);
  for(const s of [-1,1]){rod([s*.08,1.89,.04],[s*.30,2.25,.08],.05,0x81506a);b(s*.31,2.28,.08,.09,.09,.09,0xf1c298);leg(s*.13,.46,.02,.09,.42,.10,0xc98582);
   const w=[];for(let j=0;j<7;j++){const t=j/6;w.push([s*(.32+t*.69),1.42+t*.59,-.06-t*.2,.38-t*.12,.13,.57-t*.15,j%2?0xd9a495:0x99596e]);w.push([s*(.30+t*.47),1.03-t*.25,-.05-t*.08,.29-t*.09,.12,.35,j%2?0xe6b799:0xae697c]);}for(let j=0;j<4;j++)w.push([s*(.45+j*.15),1.47+j*.11,.23-j*.05,.12,.06,.06,0xf1c6a2]);wing(s,[s*.17,1.4,0],w);rod([s*.18,1.45,.05],[s*.38,1.1,.3],.07,0xc37c7c);
  }eyeLine=1.75;motion='float';
 }else if(key==='rocker'){
  fur=0x85a970;oval(0,1.23,-.07,.27,.57,.26,[0x547b65,0x8dad73,0xc3cf8d],7,6);oval(0,1.91,.10,.40,.3,.33,[0x5a8568,0xa4bb77,0xd0d898],5,7);eyes(0,1.99,.40,.24,0x985250);
  for(const s of [-1,1]){rod([s*.12,2.15,.03],[s*.45,2.66,-.14],.045,0x6b7d52);rod([s*.25,1.50,0],[s*.56,1.20,.35],.10,0x6d8d65);rod([s*.56,1.20,.35],[s*.18,1.14,.62],.075,0xc4b786);rod([s*.23,.88,0],[s*.54,.50,-.30],.16,0x86956a);leg(s*.47,.25,-.12,.10,.53,.13,0xa5b57e);b(s*.5,.035,.02,.19,.06,.31,0x6a845f);}
  oval(.13,1.10,.61,.26,.32,.10,[0x8b6150,0xc28f60],6,4);rod([-.04,.96,.73],[.30,1.48,.69],.055,0xe7c288);rod([-.39,1.13,.78],[.45,1.45,.78],.03,0xe1d7a3);eyeLine=1.99;motion='insect';
 }else if(['chonchon','steelchonchon'].includes(key)){
  const steel=key==='steelchonchon',shell=steel?[0x55654f,0x8e9d6c,0xc2c58e]:[0x665566,0x9b849c,0xc6acbd];fur=shell[1];
  oval(0,.95,-.35,steel?.38:.32,.35,steel?.65:.52,shell,7,8);oval(0,1.1,.30,.44,.37,.35,[0x7c5d59,0xaf8a73],5,6);
  for(const s of [-1,1]){oval(s*.30,1.24,.45,.26,.29,.23,steel?[0x919a6c,0xe4d8a4]:[0x605d83,0x9c93b4,0xc5b8d0],5,5);b(s*.29,1.35,.65,.09,.1,.045,0xeee4d6);for(let j=0;j<3;j++)rod([s*.22,.9,.15-j*.28],[s*.57,.42,.24-j*.32],.055,0x896f5c);
   for(const d of [-1,1]){const wp=[];for(let j=0;j<5;j++)wp.push([s*(.37+j*.19),1.24,.02+d*j*.10,.30,.055,.44-j*.045,steel?0xd6d69f:0xe0d7cf]);wing(s,[s*.3,1.2,0],wp);}
  }rod([0,.92,.57],[0,.52,.83],.08,0x6f5353);
  if(steel)for(let j=0;j<5;j++){b(0,1.22-j*.025,-.05-j*.22,.64-j*.04,.07,.12,0xd9d7a0);b(0,1.39-j*.025,-.07-j*.22,.11,.14,.11,0x647557);}eyeLine=1.3;motion='float';
 }else if(['condor','picky','pecopeco'].includes(key)){
  const baby=key==='picky',vulture=key==='condor';fur=baby?0xe58b79:vulture?0x897482:0xd99156;
  if(baby){oval(0,.57,0,.48,.43,.38,[0xc87664,0xf09a87,0xffc3a4],6,6);oval(0,1.11,.18,.35,.39,.30,[0xc96d60,0xed9780,0xffbd9a],6,6);for(let i=0;i<3;i++)b((i-1)*.14,1.54+(.1-Math.abs(i-1)*.04),.07,.12,.20,.16,0xea7665);b(0,1.03,.53,.22,.12,.24,0xe9b26c);eyes(0,1.20,.465,.19);for(const s of [-1,1]){leg(s*.20,.14,.06,.10,.25,.12,0xe8bd73);b(s*.21,.035,.19,.24,.06,.29,0xf1d592);b(s*.46,.58,0,.13,.28,.29,0xeeb68c);}eyeLine=1.2;}
  else{oval(0,1.05,-.12,.56,.57,.70,vulture?[0x5c5869,0x897584,0xb29a9b]:[0x9b6147,0xd2935a,0xf0c487],7,8);rod([0,1.26,.30],[0,2.08,.51],vulture?.19:.29,vulture?0xcaa997:0xe7bd86);oval(0,2.22,.61,vulture?.30:.39,.30,.35,vulture?[0x9d7a70,0xd5b39b]:[0xbe7551,0xedac6c],6,6);b(0,2.12,.98,vulture?.24:.31,.19,vulture?.48:.45,vulture?0xdbb986:0x8c5848);b(0,2.00,1.15,.17,.17,.20,vulture?0x9f806d:0xba7451);eyes(0,2.31,.89,.24);
   for(const s of [-1,1]){leg(s*.30,.37,.10,.14,.68,.16,vulture?0xa68b74:0xd0ae7c);for(let j=0;j<3;j++)b(s*.3+(j-1)*.11,.06,.22+j*.04,.08,.1,.45,vulture?0xbda78b:0xd3b98a);for(let j=0;j<5;j++)b(s*(.49+j*.03),1.30-j*.13,-.10-j*.07,.18,.17,.59-j*.045,vulture?0x7d7080:0xda945a);}
   for(let j=0;j<4;j++)b((j-1.5)*.14,1.2+j*.05,-.84,.16,.15,.53,vulture?0x5d5b6e:0xcf8550);if(!vulture)for(let i=0;i<3;i++)b((i-1)*.12,2.52,.42,.1,.17,.22,0xf0b865);eyeLine=2.31;
  }motion='bird';
 }else if(key==='muka'){
  fur=0xa6c891;oval(0,1.15,0,.44,1.10,.38,[0x709874,0xa6c68f,0xd5ddb1],12,7);for(let i=-1;i<=1;i++)b(i*.19,1.13,.34,.055,1.8,.055,0x6b9d7c);face(1.55,.375,.19);
  for(let j=0;j<7;j++)for(const s of [-1,1]){b(s*(.45+(j%2)*.05),.35+j*.26,.05,.20,.05,.07,0xe3b49b);b(s*.26,.34+j*.25,.33,.08,.04,.16,0xf2d3b1);}for(const s of [-1,1])leg(s*.19,.09,0,.23,.18,.26,0x8eaf79);eyeLine=1.55;
 }else if(['boa','anacondaq'].includes(key)){
  const red=key==='anacondaq',p=red?[0x845745,0xad755c,0xc79173]:[0x3f6d5c,0x67937d,0x89aa8b];fur=p[1];
  // A coiled tail then an upright S-curve; segment blocks follow a true snake path.
  const path=[];for(let i=0;i<17;i++){const t=i/16;path.push([Math.sin(t*Math.PI*2)*(.62-t*.22),.14+t*.25,-.18+Math.cos(t*Math.PI*2)*.45]);}for(let i=0;i<15;i++){const t=i/14;path.push([Math.sin(t*Math.PI)*.24,.4+t*1.34,.23+t*.36]);}
  path.forEach((a,i)=>{const r=i<17?.15:.18;b(...a,r*2,r*1.6,r*2,p[i%3]);if(i>15)b(a[0],a[1]-.025,a[2]+r,.20,.14,.05,0xe5cba3);});oval(0,1.87,.69,red?.30:.25,.30,.34,p,6,6);eyes(0,1.96,.97,.17,0x513c36);b(0,1.72,.99,.25,.10,.17,0xe5c7a0);b(0,1.66,1.13,.04,.04,.25,0xaf6f75);for(const s of [-1,1])b(s*.06,1.64,1.26,.035,.035,.11,0xaf6f75);if(red){for(const s of [-1,1])b(s*.25,1.84,.68,.12,.32,.29,0xc99c7e);}eyeLine=1.96;motion='slither';
 }else if(['wolf','desertwolf','savage','savagebabe'].includes(key)){
  const boar=key.startsWith('savage'),baby=key==='savagebabe',sand=key==='desertwolf',p=baby?[0xb85c65,0xe58a8f,0xffb0a5]:boar?[0x7b655b,0xad9280,0xd3bba0]:sand?[0x7c6c58,0xaf9d80,0xdbceb0]:[0x4b4b60,0x73738a,0xa7a4b7];fur=p[1];
  oval(0,baby?.55:.86,-.17,baby?.51:.49,baby?.42:.45,baby?.55:.86,p,7,9);oval(0,baby?.63:.94,baby?.43:.65,baby?.36:.39,baby?.32:.39,baby?.33:.43,p,6,6);
  b(0,baby?.51:.75,baby?.77:1.03,baby?.32:.38,baby?.19:.23,baby?.15:.43,baby?0xe4a29b:boar?0xcbb49b:0xdad4cf);b(0,baby?.55:.82,baby?.87:1.27,baby?.24:.25,.12,.09,boar?(baby?0xb66c74:0x80695b):0x403d4b);eyes(0,baby?.76:1.1,baby?.69:.98,baby?.20:.24);
  for(const s of [-1,1]){b(s*.28,baby?.96:1.36,.57,.18,baby?.20:.34,.20,p[2]);for(const z of [-.67,.50]){leg(s*(baby?.29:.32),baby?.17:.27,z*(baby?.67:1),.18,baby?.32:.52,.21,p[0]);b(s*(baby?.29:.32),.06,z*(baby?.67:1)+.06,.25,.12,.30,boar?0x6b5954:p[2]);}if(!baby&&boar){rod([s*.25,.66,1.08],[s*.40,1.04,1.16],.12,0xf1e1bb);}}
  if(baby){b(.13,.69,-.72,.08,.1,.17,0xe6a098);b(.25,.71,-.74,.17,.08,.08,0xe6a098);}
  else if(boar){for(let j=0;j<12;j++){b((j%3-1)*.17,1.20+(j%4)*.035,-.8+j*.12,.09,.20+(j%3)*.05,.10,j%2?0xd8c5aa:0x8d7769);}}
  else{rod([0,.98,-.84],[.16,.85,-1.43],.23,p[1]);b(.20,.78,-1.5,.20,.22,.25,p[2]);for(let j=0;j<7;j++){b((j%3-1)*.2,1.23+Math.sin(j)*.03,.38-j*.16,.16,.18,.16,p[j%3]);}for(const s of [-1,1])b(s*.14,.63,1.10,.05,.13,.05,0xf0e7d5);if(sand){for(let j=0;j<12;j++)b((j%3-1)*.28,1.21+(j%2)*.07,.48-Math.floor(j/3)*.12,.15,.25,.15,j%2?0xd9c8a7:0xa79373);for(const s of [-1,1])b(s*.37,1.07,.68,.19,.17,.23,0xeee0bc);}else{for(const s of [-1,1])b(s*.34,1.15,.62,.15,.17,.24,0xcac8d1);}}eyeLine=baby?.76:1.1;motion=baby?'scurry':'walk';
 }else if(key==='bigfoot'){
  fur=0x987e80;oval(0,1.17,-.13,.68,.91,.48,[0x645762,0x947b80,0xba9f9b],10,8);oval(0,2.08,.02,.41,.4,.38,[0x7f666d,0xac8b8b,0xc5aaa1],6,6);oval(0,1.88,.35,.32,.23,.22,[0x8b6e6e,0xc7aaa0],4,5);face(2.14,.38,.21);b(0,1.99,.56,.17,.10,.08,0x51434c);
  for(const s of [-1,1]){rod([s*.54,1.70,0],[s*.77,.77,.16],.30,0x9d8183);oval(s*.77,.67,.22,.22,.27,.20,[0x8a6f73,0xb79a95],4,4);leg(s*.36,.29,.03,.35,.56,.43,0x846c75);b(s*.36,.09,.25,.39,.16,.55,0xb89c98);for(let j=0;j<3;j++){b(s*.77+(j-1)*.11,.43,.39,.07,.14,.08,0xe7cbb7);b(s*.36+(j-1)*.12,.08,.56,.07,.08,.16,0xead1bd);}b(s*.24,2.38,-.05,.18,.18,.19,0x8d747c);}for(let j=0;j<10;j++)b((j%3-1)*.3,1.55-j*.06,-.52,.16,.22,.12,j%2?0x7d6570:0xa98b8e);eyeLine=2.14;
 }else if(['coco','yoyo','smokie','caramel'].includes(key)){
  const monkey=key==='yoyo',rac=key==='smokie',quill=key==='caramel',p=monkey?[0x94616e,0xc28686,0xdda899]:rac?[0x706c64,0x9e978b,0xc6baa5]:quill?[0x73585f,0xa78076,0xcfa795]:[0x8b786c,0xb4a18d,0xd8c9ae];fur=p[1];
  oval(0,.75,-.05,.47,.60,.43,p,7,7);oval(0,1.32,.12,.41,.37,.35,p,6,6);oval(0,1.22,.41,.31,.25,.16,monkey?[0xbd896e,0xeec19a]:[p[1],p[2]],4,5);
  for(const s of [-1,1]){oval(s*.34,1.64,.03,monkey?.19:.12,.18,.10,[p[0],p[2]],4,3);leg(s*.24,.15,.13,.19,.28,.28,p[0]);rod([s*.38,.96,.16],[s*.30,.52,.39],.12,p[1]);}
  eyes(0,1.38,.49,.20);b(0,1.22,.59,.13,.085,.08,0x57434a);b(0,1.10,.57,.13,.04,.03,0x8f5c56);
  if(rac){for(const s of [-1,1]){b(s*.20,1.37,.48,.30,.21,.055,0x4f4e4c);b(s*.20,1.40,.52,.075,.085,.045,0x181e22);b(s*.2,1.43,.548,.025,.025,.01,0xece4c9);}for(let j=0;j<9;j++)b(.11+j*.045,.44,-.48-j*.12,.29,.25,.16,j%2?0x555653:0xaaa293);}
  else if(monkey){for(let j=0;j<22;j++){const t=j/21*5.2,r=.32-j*.007;b(.38+Math.sin(t)*r,.7+Math.cos(t)*r,-.51-j*.018,.10,.10,.10,p[j%3]);}b(0,.40,.36,.35,.23,.11,0xe7b994);}
  else if(quill){for(let j=0;j<32;j++){const a=j*Math.PI*.47,x=Math.sin(a)*.40,z=-.11+Math.cos(a)*.32,y=.86+(j%5)*.075;rod([x,y,z],[x*1.8,y+.37,z*1.5-.15],.075,j%3?0xe4c7a6:0x805e65);}}
  else{oval(.10,1.10,-.60,.31,.67,.28,[0x7f6e64,0xaaa08d,0xd0c0a5],8,6);for(let j=0;j<5;j++)b(.1,1.3+j*.09,-.85,.30,.055,.06,0x7b6c62);oval(0,.64,.49,.28,.32,.20,[0x805e44,0xb68e5c],5,5);b(0,.87,.51,.44,.10,.30,0x665740);b(0,1.52,.41,.10,.2,.06,0x6f6258);}eyeLine=1.38;motion='scurry';
 }else if(['horn','stainer'].includes(key)){
  const lady=key==='stainer',p=lady?[0x8d3448,0xc94e5e,0xf27e70]:[0x3f333e,0x65505e,0x8c6d73];fur=p[1];oval(0,.62,-.17,lady?.62:.48,lady?.51:.37,lady?.65:.72,p,8,8);oval(0,.42,.53,.31,.26,.32,[0x4b3845,0x81606a],5,5);eyes(0,.49,.82,.17);
  for(const s of [-1,1])for(let j=0;j<3;j++){const z=.31-j*.37;rod([s*.3,.4,z],[s*.68,.26,z+.15],.065,p[0]);leg(s*.69,.15,z+.15,.075,.25,.08,p[1]);}
  if(lady){b(0,.99,-.2,.055,.14,1.05,0x873e4c);for(const s of [-1,1])for(let j=0;j<3;j++)b(s*(.24+(j%2)*.1),.94-j*.05,-.65+j*.45,.18,.07,.22,j%2?0xf9c68c:0xf5ad7d);}
  else{for(const s of [-1,1]){rod([s*.18,.50,.77],[s*.39,.38,1.05],.12,0xc5ae8d);rod([s*.39,.38,1.05],[s*.24,.51,1.26],.1,0xdac7a5);}rod([0,.64,.61],[0,.94,1.1],.13,0xb4a18b);rod([0,.94,1.1],[0,.87,1.4],.09,0xd3c5a9);for(let j=0;j<5;j++)b(0,.95,-.6+j*.25,.055,.07,.20,0x9b7e81);}eyeLine=.49;motion='insect';
 }else if(key==='mantis'){
  fur=0x779765;rod([0,.9,0],[0,1.9,0],.18,0x759460);oval(0,1.20,-.15,.22,.47,.30,[0x4e7758,0x7a9d67,0xb0bd7c],7,5);b(0,2.09,.07,.49,.22,.29,0x9fb474);b(0,1.96,.20,.30,.16,.20,0xbfd093);eyes(0,2.12,.24,.18,0xb97b75);
  for(const s of [-1,1]){rod([s*.17,2.17,0],[s*.39,2.64,-.12],.035,0x71865a);rod([s*.18,1.81,0],[s*.60,1.53,.10],.1,0x77955f);rod([s*.60,1.53,.10],[s*.39,1.14,.44],.12,0xb9c78a);for(let j=0;j<4;j++)b(s*(.38+j*.04),1.17+j*.07,.44-j*.06,.07,.10,.065,0xd7d5a1);rod([s*.13,.93,-.1],[s*.45,.44,-.29],.10,0x66855b);leg(s*.43,.22,-.16,.075,.44,.09,0x839d67);b(s*.43,.035,-.02,.09,.05,.29,0xb0ba7c);}eyeLine=2.12;motion='insect';
 }else if(key==='flora'){
  fur=0xb87571;rod([0,.10,0],[0,1.55,0],.13,0x79774f);oval(0,1.65,.02,.47,.50,.19,[0x845064,0xb86e79,0xdf9c83],7,6);b(0,1.65,.22,.46,.38,.08,0x653c50);for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.sin(a),y=Math.cos(a);b(x*.50,1.65+y*.53,.03,.23,.25,.18,i%2?0xd59a83:0xa76472);b(x*.29,1.65+y*.31,.28,.10,.10,.09,0xefc699);}
  for(const s of [-1,1]){rod([s*.09,.67,0],[s*.52,.89,.03],.07,0xa18d60);rod([s*.52,.89,.03],[s*.41,1.12,.03],.065,0xca9b76);b(s*.36,.20,0,.55,.08,.25,0x868c5b);rod([s*.38,1.98,0],[s*.70,2.28,0],.06,0xcc8c7d);b(s*.70,2.35,0,.19,.07,.08,0xe7ad8d);}eyeLine=1.65;motion='sway';
 }else if(key==='rafflesia'){
  fur=0x94bc9b;oval(0,.39,0,.76,.33,.67,[0x4f7764,0x83a889,0xb0d0a6],6,8);for(let i=0;i<20;i++){const a=i*Math.PI/10;for(let j=0;j<3;j++){const r=.43+j*.16;b(Math.sin(a)*r,.45+j*.06,Math.cos(a)*r,.18,.14,.20,[0x668c77,0x9cbea0,0xc0d8aa][j]);}b(Math.sin(a)*.37,.72,Math.cos(a)*.37,.18,.16,.18,0xa5c8a2);b(Math.sin(a)*.88,.49+(i%3)*.07,Math.cos(a)*.88,.12,.17,.12,0xbbd6a7);b(Math.sin(a)*.97,.56+(i%3)*.07,Math.cos(a)*.97,.065,.12,.065,0xd7e4b5);}b(0,.63,0,.55,.08,.52,0x345a50);for(let i=0;i<12;i++){const a=i*Math.PI/6;b(Math.sin(a)*.26,.72,Math.cos(a)*.26,.09,.12,.10,0xdfdfb5);}for(const s of [-1,1])b(s*.40,.12,.20,.29,.14,.33,0x789879);eyeLine=.7;motion='sway';
 }else if(['vitata','deniro','pierre'].includes(key)){
  const healer=key==='vitata',green=key==='pierre',p=healer?[0x372f50,0x5b486e,0x8b688b]:green?[0x55704e,0x92ad71,0xc9d08e]:[0x7a3b44,0xad5e5c,0xd58a76];fur=p[1];
  oval(0,.68,-.62,healer?.62:.37,healer?.39:.31,healer?.70:.54,p,7,8);oval(0,.68,.12,.30,.28,.36,p,5,5);oval(0,.76,.66,.36,.32,.34,p,6,6);eyes(0,.83,.965,.19,healer?0xe19b8f:0x44363b);
  for(const s of [-1,1]){rod([s*.16,1.02,.69],[s*.32,1.35,.92],.055,p[0]);rod([s*.32,1.35,.92],[s*.45,1.29,1.06],.045,p[1]);for(let j=0;j<3;j++){const z=.33-j*.42;rod([s*.24,.63,z],[s*.66,.41,z-.14],.055,p[0]);leg(s*.67,.23,z-.14,.065,.42,.08,p[1]);}rod([s*.16,.62,.96],[s*.31,.55,1.12],.09,healer?0xceb49d:0xe3c093);}
  for(let j=0;j<5;j++)b(0,.95,-.24-j*.20,healer?.87:.54,.07,.08,j%2?p[2]:p[0]);if(healer){for(const s of [-1,1])b(s*.46,.88,-.66,.20,.15,.18,0xb891a4);b(0,1.04,-.61,.13,.17,.15,0xd5b2ac);}else if(green){b(0,.99,.13,.16,.18,.23,0xd9d69d);for(const s of [-1,1])b(s*.32,.79,.59,.12,.15,.25,0xb5c58a);}else{b(0,1.06,.65,.20,.11,.27,0xe29b7f);for(const s of [-1,1])b(s*.31,.83,.61,.12,.10,.21,0x8e4a4e);}eyeLine=.83;motion='insect';
 }
 const all=[...parts,...legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...wings.flatMap(w=>w.parts.map(p=>[p[0]+w.pivot[0],p[1]+w.pivot[1],p[2]+w.pivot[2],...p.slice(3)]))],height=Math.max(...all.map(p=>p[1]+p[4]/2));
 const spec=deep({key,parts,legs,wings,fur,height,eyeLine,motion});cache.set(key,spec);return spec;
}
