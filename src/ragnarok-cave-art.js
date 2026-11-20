// Voxel reconstructions of Gravity's Ragnarok Online sprite designs.
// Reference IDs: Familiar 1005, Thief Bug 1051, Tarou 1175, Archer Skeleton 1016.
// Geometry remains independent of combat statistics and authoritative collision.
export const RAGNAROK_CAVE_KINDS=Object.freeze(['familiar','thiefbug','tarou','archerskeleton']);
const cache=new Map();
const freezeSpec=s=>Object.freeze({
 ...s,parts:Object.freeze(s.parts.map(Object.freeze)),legs:Object.freeze(s.legs.map(Object.freeze)),
 wings:Object.freeze(s.wings.map(w=>Object.freeze({...w,pivot:Object.freeze(w.pivot),parts:Object.freeze(w.parts.map(Object.freeze))})))
});

export function ragnarokCaveSpec(key){
 if(!RAGNAROK_CAVE_KINDS.includes(key))return null;
 if(cache.has(key))return cache.get(key);
 const parts=[],legs=[],wings=[],box=(...p)=>parts.push(p),limb=(x,y,z,w,h,d,color)=>legs.push({x,y,z,w,h,d,color});
 // Stacked cross-sections retain pixel-sized steps without reducing a rounded
 // thorax or fur coat to a single cuboid. Every box stays in the shared mesh.
 const oval=(x,y,z,rx,ry,rz,palette,ny=9,nz=10)=>{
  const sy=ry*2/ny,sz=rz*2/nz;
  for(let j=0;j<ny;j++)for(let k=0;k<nz;k++){
   const fy=(j+.5)/ny*2-1,fz=(k+.5)/nz*2-1,r=1-fy*fy-fz*fz;if(r<=.035)continue;
   const width=Math.round(Math.sqrt(r)*rx*2/.08)*.08;
   if(width>.035)box(x,y+fy*ry,z+fz*rz,width,sy+.004,sz+.004,palette[Math.min(palette.length-1,Math.floor((fy+1)*.5*palette.length))]);
  }
 };
 const rod=(a,b,width,color,step=.105)=>{
  const n=Math.max(1,Math.ceil(Math.hypot(...a.map((v,i)=>b[i]-v))/step));
  for(let i=0;i<=n;i++){const t=i/n;box(...a.map((v,j)=>v+(b[j]-v)*t),width,width,width,color);}
 };
 let fur=0x9b8aaa,height=1.65,eyeLine=1,motion='walk';
 if(key==='familiar'){
  fur=0x8b789f;motion='fly';height=1.76;eyeLine=.94;
  oval(0,.8,-.06,.26,.43,.36,[0x493b5b,0x645074,0x8b789f],7,7);
  oval(0,1.03,.23,.36,.31,.29,[0x55415f,0x8b739a,0xafa2c4],6,7);
  // Long, pale ears and the little pointed muzzle identify the Familiar.
  for(const side of [-1,1]){
   for(let i=0;i<5;i++)box(side*(.27+i*.018),1.23+i*.105,.12,.20-i*.029,.12,.18-i*.018,i%2?0x8f7eac:0xb6a8d0);
   box(side*.25,1.30,.223,.07,.24,.025,0x6c4e79);
   box(side*.18,1.05,.489,.13,.105,.035,0x493248);box(side*.18,1.064,.511,.065,.055,.018,0xcc7b7d);
   box(side*.105,.75,.54,.06,.17,.07,0xd6c9d9);
   const pivot=[side*.21,.89,-.06],wp=[],wb=(x,y,z,w,h,d,c)=>wp.push([x-pivot[0],y-pivot[1],z-pivot[2],w,h,d,c]);
   // A rasterized membrane tapers to three fingers. Its scalloped rear edge
   // is part of the silhouette, with the light leading border from the sprite.
   for(let i=0;i<11;i++){
    const u=i/10,xx=side*(.36+i*.145),front=.14-u*.13,back=-.63+u*.27+Math.abs(Math.sin(u*Math.PI*2.1))*.17,yy=.92+u*.58;
    for(let k=0;k<4;k++){const f=k/3,zz=back+(front-back)*f;wb(xx,yy+(f-.5)*.07,zz,.16,.075,.17,k===3?0xb7a9d1:k===0?0x69547e:0x9481af);}
   }
   for(let i=0;i<11;i++){const u=i/10;wb(side*(.36+i*.145),.98+u*.58,.14-u*.13,.16,.07,.075,0xbbaed5);}
   for(let i=0;i<5;i++){const u=i/4;wb(side*(.55+u*.69),.89+u*.35,-.26-u*.32,.115,.07,.11,0x665078);}
   wings.push({side,pivot,parts:wp});
  }
  box(0,.91,.55,.28,.19,.26,0x8b7b9e);box(0,.94,.705,.14,.10,.065,0x69536f);
  box(0,.71,-.49,.13,.15,.29,0x5a426b);
  for(const side of [-1,1])limb(side*.13,.43,.02,.1,.24,.14,0x57415f);
 }else if(key==='thiefbug'){
  fur=0x80646b;height=1.24;eyeLine=.64;motion='insect';
  oval(0,.42,-.08,.57,.29,.83,[0x32282e,0x4b3941,0x70545f],6,10);
  // Paired curved elytra, pale broad reflections and the dark central seam.
  for(const side of [-1,1]){
   oval(side*.26,.67,-.21,.39,.39,.69,[0x53404b,0x80616e,0xaa8795,0xc3a1ad],8,11);
   rod([side*.13,.96,-.61],[side*.16,1.04,.12],.067,0xd0a9b7,.13);
   for(let i=0;i<3;i++){
    const zz=-.64+i*.51,xx=.62+(i===1?.07:0),far=1.03+(i===1?.09:0);
    rod([side*.43,.46,zz],[side*xx,.55,zz+(i-1)*.12],.105,0x4b3541,.13);
    rod([side*xx,.55,zz+(i-1)*.12],[side*far,.22,zz+(i-1)*.3],.095,0x382b34,.13);
    limb(side*far,.13,zz+(i-1)*.3,.115,.27,.23,0x46323d);
   }
   // Antennae curl forward past the low, wedge-shaped head.
   rod([side*.19,.65,.83],[side*.36,.92,1.08],.06,0x6e535d,.12);
   rod([side*.36,.92,1.08],[side*.54,.84,1.30],.055,0x9f7c88,.12);
   box(side*.25,.54,.975,.095,.09,.04,0xc7b09d);
   rod([side*.2,.31,.92],[side*.29,.22,1.13],.10,0x957c7b,.11);
  }
  box(0,.83,-.2,.07,.39,1.27,0x3c2b36);
  oval(0,.49,.71,.37,.27,.34,[0x3e3036,0x65515a,0x9b8086],6,6);
  box(0,.72,.50,.69,.12,.2,0xb19499);box(0,.34,1.02,.3,.13,.15,0x4b3940);
 }else if(key==='tarou'){
  fur=0xe6d7d0;height=1.45;eyeLine=.7;motion='scurry';
  oval(0,.68,-.12,.68,.62,.78,[0x9a8288,0xc0a9aa,0xe9dcd1,0xf8ece0],10,12);
  oval(0,.55,.62,.40,.33,.40,[0xad9190,0xddc4bb,0xf5e4d5],7,8);
  // Tarou's off-white coat is a shaggy ball, with a low pink snout, huge ears
  // and isolated grey bristles rather than an ordinary grey sewer rat body.
  for(const side of [-1,1]){
   oval(side*.31,.94,.49,.24,.30,.14,[0xad8d91,0xdcbcb9,0xf5e3d5],6,4);
   box(side*.31,.94,.64,.22,.33,.04,0xd99a9e);box(side*.30,.98,.667,.12,.18,.02,0xf3b3b3);
   box(side*.23,.64,.956,.095,.10,.04,0x63505d);box(side*.24,.666,.981,.025,.025,.018,0xfaf0d9);
   for(const zz of [-.52,.38]){limb(side*.39,.14,zz,.21,.22,.28,0xb4858c);box(side*.39,.09,zz+.1,.27,.12,.24,0xd6aaa6);}
   for(let i=0;i<6;i++){const z=-.65+i*.24,y=1.03+Math.sin(i*.7)*.14;box(side*(.43+(i%2)*.13),y,z,.11,.23,.12,i%3?0xd1bfbc:0xa5a1b1);}
   rod([side*.2,.44,1.01],[side*.61,.48,1.03],.025,0xada3ad,.1);
   rod([side*.2,.40,1.01],[side*.58,.31,1.11],.025,0xc7b4ba,.1);
  }
  for(let i=0;i<7;i++){const z=-.56+i*.16;box((i%2?-.08:.10),1.25+(i%3)*.055,z,.16,.16,.17,i%3?0xede2d7:0xb5b2c1);}
  box(0,.45,1.015,.27,.19,.18,0xd99ca0);box(0,.39,1.1,.12,.07,.05,0xeab6b2);
  for(let i=0;i<10;i++)box(Math.sin(i*.38)*.24,.34+i*.022,-.88-i*.12,.12-i*.005,.11-i*.004,.18, i%2?0xc18e99:0xa97787);
 }else{
  fur=0xc8bcb1;height=2.52;eyeLine=2.12;motion='walk';
  const bone=0xd6c9b9,shade=0xa49c98,cloth=0x9c5741,red=0xa85039;
  // Skull, eye sockets, cheek bones and exposed jaw remain readable through
  // the ragged cap. The asymmetrical shoulder cape leaves the rib cage bare.
  oval(0,2.05,.04,.31,.33,.27,[0x9c918a,0xc6beb1,0xe9ddcb],6,6);
  for(const side of [-1,1]){box(side*.13,2.10,.3,.17,.145,.045,0x3c3e47);box(side*.135,2.10,.331,.07,.06,.025,0xd9a975);box(side*.23,1.98,.25,.12,.12,.13,bone);}
  box(0,1.97,.32,.09,.1,.03,0x776f70);box(0,1.86,.19,.37,.12,.25,shade);
  for(let i=0;i<5;i++)box((i-2)*.066,1.88,.332,.045,.09,.04,bone);
  for(let i=0;i<3;i++)box(0,2.30+i*.07,-.015,.79-i*.10,.08,.66-i*.10,[0xb6a6a0,0xd1c1b6,0xb2a5ab][i]);
  box(0,2.46,-.02,.43,.065,.43,0xaaa4b4);box(0,2.30,.36,.84,.07,.13,0x8c7777);
  rod([0,1.04,0],[0,1.83,0],.105,bone,.11);
  for(let i=0;i<5;i++){const y=1.24+i*.105,w=.39+(i<3?i:4-i)*.055;box(0,y,.13,w,.065,.08,bone);for(const side of [-1,1]){box(side*w*.48,y,-.005,.065,.065,.27,shade);}}
  for(const side of [-1,1]){
   box(side*.22,1.09,0,.21,.16,.3,bone);box(side*.24,.93,.02,.18,.21,.24,cloth);
   rod([side*.23,.87,.02],[side*.29,.46,.05],.10,bone,.12);
   box(side*.28,.35,.06,.25,.25,.29,red);box(side*.28,.18,.15,.34,.18,.52,0xc0734f);box(side*.28,.08,.17,.38,.065,.54,0x6d453c);
   box(side*.28,.40,.07,.30,.10,.34,0xd08d60);limb(side*.28,.5,.04,.10,.4,.12,bone);
  }
  box(-.29,1.55,-.08,.22,.58,.5,cloth);box(-.30,1.24,.1,.28,.15,.29,0xc47c55);
  rod([-.32,1.70,.04],[-.51,1.40,.22],.115,bone,.13);rod([-.51,1.40,.22],[-.70,1.55,.36],.10,bone,.13);
  rod([.31,1.69,.05],[.52,1.48,.14],.115,bone,.13);rod([.52,1.48,.14],[.35,1.67,.38],.10,bone,.13);
  box(-.69,1.55,.37,.16,.17,.12,shade);box(.32,1.67,.4,.16,.14,.12,bone);
  // Tall curved wooden bow with a straight taut string and an actual arrow.
  for(let i=0;i<15;i++){const f=i/14,yy=.72+f*1.48,xx=-.72-Math.sin(f*Math.PI)*.22;box(xx,yy,.4,.075,.13,.075,0x8b5b45);}
  rod([-.72,.72,.4],[-.72,2.20,.4],.025,0xd0b5a0,.13);
  rod([-.76,1.55,.40],[.43,1.63,.43],.035,0xb79979,.13);box(-.83,1.55,.4,.15,.06,.12,0xa9aaa9);
  box(.30,1.47,-.37,.30,.67,.30,0x80503b);box(.30,1.83,-.37,.36,.11,.35,0xc18b62);
  for(let i=0;i<4;i++){const x=.19+i*.075;rod([x,1.82,-.38],[x+.02,2.13,-.39],.035,0xc1a07d,.13);box(x+.02,2.14,-.39,.08,.13,.08,0xd4c2b0);}
 }
 const spec=freezeSpec({key,parts,legs,wings,fur,height,eyeLine,motion});cache.set(key,spec);return spec;
}
