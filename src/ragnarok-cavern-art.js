// Direct voxel studies of Ragnarok Online's Scorpion, Andre, Hode and Golem.
// Sprite sources/IDs are tracked separately from local combat configuration.
export const RAGNAROK_CAVERN_KINDS=Object.freeze(['scorpion','andre','hode','golem']);
const cache=new Map();
const freeze=s=>Object.freeze({...s,parts:Object.freeze(s.parts.map(Object.freeze)),legs:Object.freeze(s.legs.map(Object.freeze)),wings:Object.freeze([])});
export function ragnarokCavernSpec(key){
 if(!RAGNAROK_CAVERN_KINDS.includes(key))return null;if(cache.has(key))return cache.get(key);
 const parts=[],legs=[],box=(...p)=>parts.push(p),limb=(x,y,z,w,h,d,color)=>legs.push({x,y,z,w,h,d,color});
 const oval=(x,y,z,rx,ry,rz,palette,ny=7,nz=8)=>{
  const dy=ry*2/ny,dz=rz*2/nz;
  for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++){
   const fy=(iy+.5)/ny*2-1,fz=(iz+.5)/nz*2-1,q=1-fy*fy-fz*fz;if(q<.035)continue;
   const width=Math.max(.07,Math.round(rx*2*Math.sqrt(q)/.07)*.07),t=Math.min(palette.length-1,Math.floor((iy/ny*.7+iz/nz*.3)*palette.length));
   box(x,y+fy*ry,z+fz*rz,width,dy+.005,dz+.005,palette[t]);
  }
 };
 const rod=(a,b,w,c,step=.13)=>{const n=Math.max(1,Math.ceil(Math.hypot(...a.map((v,i)=>b[i]-v))/step));for(let i=0;i<=n;i++){const t=i/n;box(...a.map((v,j)=>v+(b[j]-v)*t),w,w,w,c);}};
 let fur=0,height=2,eyeLine=.8,motion='insect';
 if(key==='scorpion'){
  const copper=[0x7e493f,0xad6548,0xd68b51,0xf0b879],joint=0x46685f,dark=0x4f4059;fur=copper[2];
  oval(0,.56,-.1,.58,.29,.85,copper,7,9);
  oval(0,.57,.61,.49,.29,.42,[0x925442,0xc17d4f,0xe9af6b],6,6);
  // Transverse armor plates retain the orange abdomen seen in the sprite.
  for(let i=0;i<5;i++){const z=-.72+i*.29;box(0,.83-Math.abs(i-2)*.025,z,.78-Math.abs(i-2)*.09,.09,.10,0xedb577);}
  for(const side of [-1,1]){
   for(let i=0;i<4;i++){
    const z=-.64+i*.36,forward=(i-1.5)*.12;
    rod([side*.43,.48,z],[side*.77,.50,z+forward],.1,joint);
    rod([side*.77,.50,z+forward],[side*1.02,.17,z+forward*1.5],.085,dark);
    limb(side*1.03,.09,z+forward*1.5,.12,.19,.23,0x5c4c5f);
   }
   // The pincers are broad orange palms with an open cleft between the jaws.
   rod([side*.37,.55,.72],[side*.73,.46,1.03],.17,0x986345);
   oval(side*.82,.42,1.22,.31,.24,.36,copper,5,6);
   for(const jaw of [-1,1]){
    box(side*.82+jaw*.20,.40,1.55,.18,.24,.36,jaw<0?0xc9814c:0xe9ad69);
    box(side*.82+jaw*.14,.40,1.78,.15,.18,.18,0xf4c187);
   }
   box(side*.18,.72,.94,.095,.08,.045,0x42342f);box(side*.18,.735,.968,.035,.025,.016,0xffd38b);
  }
  // A green-blue articulated tail curls upward; its last segment is a purple sting.
  const tail=[[0,.63,-.77],[0,.93,-1.03],[0,1.27,-1.19],[0,1.62,-1.16],[0,1.92,-.96],[0,2.10,-.66],[0,2.06,-.37]];
  for(let i=0;i<tail.length;i++){
   const[x,y,z]=tail[i];box(x,y,z,.29-i*.013,.32,.31,[0x4b715e,0x5f8c70,0x63816e,0x5d697a,0x747299,0x9580b5,0xb294cf][i]);
   box(x,y+.13,z+.07,.22-i*.01,.065,.18,0xd4b492);
  }
  for(let i=0;i<4;i++)box(0,2.06-i*.105,-.17+i*.10,.23-i*.045,.18-i*.025,.20-i*.022,i%2?0x8f73b0:0xb8a0d6);
  height=2.29;eyeLine=.72;
 }else if(key==='andre'){
  fur=0xe8d2a9;const shell=[0x9a756d,0xc4a58c,0xe9d4ad,0xffedc9],brown=0x60464b;
  oval(0,.67,-.74,.43,.43,.72,shell,8,10);
  // Fine dark banding separates the pale, tapered abdominal segments.
  for(let i=0;i<4;i++)box(0,.99-i*.025,-1.17+i*.27,.56-i*.035,.07,.055,0xb49184);
  for(let i=0;i<4;i++)box(0,.76+i*.035,-1.38-i*.105,.39-i*.075,.28-i*.045,.17,shell[Math.min(3,i)]);
  oval(0,.62,.07,.27,.30,.39,[0x60474d,0x957265,0xceac89],6,6);
  oval(0,.63,.60,.39,.33,.39,[0x8b5f5a,0xc08e75,0xf1d2a2,0xffe6ba],7,7);
  for(const side of [-1,1]){
   box(side*.29,.73,.87,.16,.16,.07,0xab4e50);box(side*.30,.755,.91,.075,.07,.025,0xe27871);
   rod([side*.23,.86,.69],[side*.50,1.25,.94],.06,brown,.11);
   rod([side*.50,1.25,.94],[side*.77,1.18,1.15],.055,0x8e6c70,.11);
   rod([side*.77,1.18,1.15],[side*.80,.96,1.27],.05,0xb39491,.11);
   for(let i=0;i<3;i++){
    const zz=-.30+i*.38,front=(i-1)*.22,far=.85+(i===1?.10:0);
    rod([side*.21,.52,zz],[side*.53,.55,zz+front],.075,brown,.13);
    rod([side*.53,.55,zz+front],[side*far,.18,zz+front*1.7],.07,0x7d5d63,.13);
    limb(side*far,.11,zz+front*1.7,.09,.22,.21,brown);
   }
   rod([side*.19,.42,.89],[side*.29,.31,1.10],.11,0xe7c79d,.11);
   box(side*.19,.32,1.16,.17,.09,.15,0xffe3b3);
  }
  box(0,.48,.95,.22,.10,.10,0x574146);height=1.38;eyeLine=.75;
 }else if(key==='hode'){
  fur=0xa77c8b;motion='slither';const sand=[0xb88958,0xdba566,0xf3c883,0xffde9b];
  oval(0,.095,0,.91,.10,.83,sand,3,12);
  for(let i=0;i<18;i++){const a=i*2.399,r=.46+(i%4)*.14;box(Math.sin(a)*r,.16+(i%3)*.035,Math.cos(a)*r,.14,.12,.15,sand[i%4]);}
  // Hode's visible attack frames show a soft lavender tube, not a toothed sand beast.
  for(let i=0;i<8;i++){
   const y=.33+i*.245,x=Math.sin(i*.16)*.12,z=i*.035,r=.32+Math.sin(i*.45)*.045;
   oval(x,y,z,r,.17,r,[0x7c586e,0x9c7287,0xbb929e,0xd8b1af],3,6);
   if(i===1||i===6){box(x,y+.13,z,r*1.72,.09,r*1.76,0xe6c6aa);box(x,y+.19,z,r*1.45,.04,r*1.52,0xf0d6b8);}
  }
  oval(.12,2.17,.26,.39,.34,.36,[0x9d7387,0xc19ca7,0xe6bfc0],6,7);
  // A dark round opening and fleshy rim lean toward the camera like the sprite.
  for(let j=0;j<7;j++){const yy=(j-3)*.07,r=Math.sqrt(Math.max(0,1-(yy/.25)**2))*.24;box(.12,2.18+yy,.588,r*2,.075,.025,0x805a6d);}
  for(let i=0;i<16;i++){const a=i*Math.PI/8;box(.12+Math.sin(a)*.29,2.18+Math.cos(a)*.285,.61,.12,.12,.10,i<8?0xf0c6bd:0xc28f9b);}
  box(.04,2.31,.667,.10,.09,.018,0xb8879a);height=2.54;eyeLine=2.2;
 }else if(key==='golem'){
  fur=0xa28164;motion='heavy';const rock=[0x715246,0x92705a,0xb2916f,0xd1b38d,0xe2c9a4];
  oval(0,.91,-.04,.57,.34,.45,rock,5,6);
  oval(0,1.52,-.02,.67,.54,.52,rock,7,7);
  for(const side of [-1,1]){
   oval(side*.64,1.94,-.05,.43,.34,.44,rock,5,6);
   oval(side*.88,1.45,.02,.31,.43,.35,rock,6,6);
   oval(side*1.01,.94,.18,.39,.36,.42,rock,5,6);
   // Flat knuckles and little broken facets make the large fists recognizable.
   for(let i=0;i<3;i++)box(side*1.01+(i-1)*.19,.84,.55,.17,.28,.13,0xc5a47e);
   for(let i=0;i<3;i++)box(side*.89,.99+i*.15,.48,.13,.09,.05,0xe0bd91);
   oval(side*.32,.58,-.03,.25,.31,.27,[0x725447,0xa17c5d,0xc4a17a],5,5);
   limb(side*.32,.22,.13,.48,.44,.65,0x967054);
   box(side*.32,.18,.48,.45,.19,.17,0xc1a17c);
  }
  oval(0,2.43,.07,.48,.41,.39,rock,7,7);
  box(0,2.32,.449,.65,.21,.045,0x49382f);
  for(let i=0;i<6;i++)box(-.25+i*.1,2.36+(i%2)*.025,.484,.075,.12,.055,0xe0c49e);
  for(const side of [-1,1]){box(side*.19,2.59,.443,.15,.11,.035,0x503a30);box(side*.20,2.60,.468,.06,.045,.018,0xf0d49e);box(side*.19,2.72,.40,.29,.10,.16,0xc6a780);}
  box(0,2.45,.48,.19,.22,.14,0xac8664);
  for(let i=0;i<7;i++){const a=i*2.399,r=.21+(i%2)*.13;box(Math.sin(a)*r,2.85+(i%3)*.07,Math.cos(a)*r-.01,.15,.22+(i%2)*.13,.16,i%2?0xc4a17c:0xe1c39b);}
  // Cracked horizontal stone courses across the belly, not an armor costume.
  for(let i=0;i<3;i++){box((i%2-.5)*.11,1.13+i*.27,.49,.87-i*.07,.055,.045,0x6b4e41);box(-.34+i*.23,1.36+i*.16,.52,.055,.22,.04,0xe1bf94);}
  height=3.08;eyeLine=2.59;
 }
 const spec=freeze({key,parts,legs,wings:[],fur,height,eyeLine,motion});cache.set(key,spec);return spec;
}
