// The same small stepped volumes, restrained ramps and readable faces used by
// the Ragnarok bestiary, authored for the older original animal identities.
export const ANIMAL_SCULPTURE_KINDS=Object.freeze(['rhino','lion','lynx','hare','frog','tortoise','hedgehog','duck','boar','bear','fox']);
const cache=new Map(),ivory=0xe9dcc0,dark=0x304039;
const tint=(c,f)=>[16,8,0].reduce((n,s)=>n|(Math.min(255,Math.round(((c>>s)&255)*f))<<s),0);
export function carvedAnimalLeg(part,kind){
 const {w,h,d,color:c}=part,web=['frog','duck'].includes(kind),toe=web?0xb9bf7b:ivory,parts=[
  [0,h*.22,-.02,w*.86,h*.52,d*.82,tint(c,1.05)],
  [0,0,.015,w*1.04,h*.24,d*.94,c],
  [0,-h*.23,.065,w*.75,h*.48,d*.78,tint(c,.88)],
  [0,-h*.45,.13,w*1.25,.12,d*1.24,tint(c,.92)]
 ];
 for(let i=-1;i<=1;i++)parts.push([i*w*.32,-h*.46,.13+d*.62,w*.22,.06,web?.18:.10,toe]);
 return Object.freeze({...part,parts:Object.freeze(parts.map(Object.freeze))});
}
export const sculptureLegParts=spec=>spec.legs.flatMap(p=>p.parts?p.parts.map(b=>[b[0]+p.x,b[1]+p.y,b[2]+p.z,...b.slice(3)]):[[p.x,p.y,p.z,p.w,p.h,p.d,p.color]]);
export function animalSculptureSpec(kind){
 if(!ANIMAL_SCULPTURE_KINDS.includes(kind))return null;if(cache.has(kind))return cache.get(kind);
 const parts=[],legs=[],b=(...p)=>parts.push(p);
 // Solid stepped slices have no transparent gaps and no hidden interior voxels.
 const volume=(x,y,z,rx,ry,rz,c,step=.115)=>{
  const rows=Math.ceil(ry*2/step),cols=Math.ceil(rz*2/step),h=ry*2/rows,d=rz*2/cols;
  for(let iy=0;iy<rows;iy++)for(let iz=0;iz<cols;iz++){
   const ny=(iy+.5)/rows*2-1,nz=(iz+.5)/cols*2-1,square=1-ny*ny-nz*nz;if(square<=0)continue;
   const w=Math.max(step,Math.round(rx*2*Math.sqrt(square)/step)*step),shade=.87+(ny+1)*.105+((iz+iy)%4===0?.035:0);
   b(x,y-ry+(iy+.5)*h,z-rz+(iz+.5)*d,w,h+.003,d+.003,tint(c,shade));
  }
 };
 const eye=(side,y,z,x=.31,iris=0x9c743f)=>{
  b(side*x,y,z,.17,.16,.048,ivory);b(side*(x+.008),y-.005,z+.032,.10,.12,.029,iris);b(side*(x+.008),y-.005,z+.052,.045,.105,.018,dark);b(side*(x-.025),y+.036,z+.067,.028,.032,.014,0xfff5d8);b(side*x,y+.105,z-.006,.20,.04,.05,tint(iris,.6));
 };
 const feet=(fur,width=.30,front=.57,back=-.65,height=.68)=>{for(const side of [-1,1])for(const z of [front,back]){
  legs.push({x:side*.40,y:height/2+.04,z,w:width,h:height,d:.37,color:fur});
 }};
 let fur=0x8c9a91,muzzle=0xc4bba2,eyeLine=1.39,motion='quadruped';
 if(kind==='rhino'){
  fur=0x8e9e98;muzzle=0xb4bca9;
  volume(0,1.04,-.22,.76,.66,1.20,fur);volume(0,.96,.94,.62,.48,.70,0x899b91);volume(0,.81,1.46,.49,.30,.40,muzzle);
  // Curved ivory horn, a smaller nasal horn, thick ears and overlapping hide.
  for(let i=0;i<8;i++)b(0,1.12+i*.125,1.63+i*.018,.32-i*.033,.145,.30-i*.031,i%2?0xd9d2b8:ivory);
  for(let i=0;i<4;i++)b(0,1.33+i*.1,1.08,.18-i*.036,.11,.18-i*.033,0xc8c6aa);
  for(const side of [-1,1]){
   volume(side*.48,1.58,.63,.17,.29,.12,0x6c8579);b(side*.48,1.62,.75,.13,.23,.025,0xc0bda2);eye(side,1.29,1.49,.45,0xb59456);
   for(let i=0;i<7;i++){const y=.66+i*.13;b(side*(.70-Math.abs(i-3)*.015),y,-.55,.045,.06,.68,0x71887e);b(side*(.72-Math.abs(i-3)*.02),y,.04,.045,.05,.48,0xaeb8a7);}
   b(side*.29,.86,1.83,.15,.085,.03,0x4f6559);b(side*.31,.66,1.73,.20,.025,.035,0x697d70);
  }
  feet(0x718779,.38,.70,-.86,.59);volume(0,.97,-1.48,.10,.12,.40,0x6b8176);volume(0,.81,-1.79,.13,.21,.13,dark);eyeLine=1.29;
 }else if(['lion','lynx','fox','boar','bear'].includes(kind)){
  fur=kind==='lion'?0xd2a261:kind==='lynx'?0xbda072:kind==='fox'?0xd08a50:kind==='boar'?0x8a7964:0x987859;muzzle=kind==='boar'?0xc0aa8c:0xe7d3a7;
  volume(0,.99,-.18,.58,.51,.98,fur);volume(0,1.52,.60,.49,.49,.48,fur);volume(0,1.28,1.02,.38,.25,.36,muzzle);
  for(const side of [-1,1]){
   eye(side,1.65,1.02,.28,kind==='fox'?0x8b9a63:0x9d793e);volume(side*.35,1.99,.49,.16,.23,.15,fur);b(side*.35,2.02,.64,.09,.18,.025,0xb09b87);
   for(let j=0;j<5;j++)b(side*(.42+j*.028),1.42-j*.035,.86-j*.02,.12,.12,.18,j%2?muzzle:fur);
   if(kind==='lynx')for(let j=0;j<6;j++){b(side*.55,.95+(j%2)*.14,-.70+j*.24,.035,.11,.10,0x695a43);b(side*.35,2.16+j*.05,.49,Math.max(.018,.06-j*.009),.065,.065,0x39453a);}
   if(kind==='boar')for(let j=0;j<5;j++)b(side*(.37+j*.018),1.02+j*.1,1.27,.13-j*.016,.12,.12,ivory);
  }
  b(0,1.37,1.37,.20,.12,.055,kind==='boar'?0x6c5e50:dark);b(0,1.17,1.30,.19,.025,.025,0x775d46);
  if(kind==='lion')for(let layer=0;layer<3;layer++)for(let i=0;i<18;i++){const a=i*Math.PI/9;b(Math.sin(a)*(.48+layer*.07),1.50+Math.cos(a)*(.48+layer*.06),.40-layer*.13,.20,.21,.18,tint(0x9e653d,.85+(i%4)*.10));}
  if(kind==='bear')volume(0,1.04,.52,.46,.47,.12,0xc4a977);
  if(kind==='boar')for(let i=0;i<10;i++)b(0,1.52-i*.013,.36-i*.16,.11,.19+(i%2)*.07,.13,0x4f5647);
  for(let i=0;i<8;i++)volume(Math.sin(i*.16)*.17,.99+i*.024,-1.03-i*.13,.17-i*.011,.16-i*.008,.16,kind==='fox'&&i>4?ivory:fur);
  feet(tint(fur,.84));eyeLine=1.65;
 }else if(kind==='hare'){
  fur=0xe3dfcf;muzzle=0xf3e9d6;volume(0,.87,-.14,.53,.50,.73,fur);volume(0,1.48,.50,.46,.43,.40,fur);volume(0,1.27,.86,.33,.22,.24,muzzle);
  for(const side of [-1,1]){volume(side*.25,2.25,.42,.13,.64,.13,fur);b(side*.25,2.28,.55,.09,.88,.026,0xd1a8a1);eye(side,1.58,.88,.25,0x9c6b77);volume(side*.41,.41,-.5,.22,.26,.36,0xcfcdbf);legs.push({x:side*.28,y:.36,z:.50,w:.23,h:.66,d:.30,color:0xc5cbbb});}
  b(0,1.30,1.09,.12,.08,.04,0xc3918c);volume(0,.89,-.88,.23,.23,.23,muzzle);eyeLine=1.58;
 }else if(kind==='frog'){
  fur=0x89ab68;muzzle=0xd9dca6;volume(0,.67,-.16,.68,.40,.76,fur);volume(0,1.10,.39,.59,.29,.45,0xa0be78);volume(0,.88,.58,.57,.16,.35,muzzle);
  for(const side of [-1,1]){volume(side*.39,1.38,.43,.24,.26,.23,0xb1cb8c);eye(side,1.45,.65,.40,0xb48e4c);volume(side*.72,.38,-.32,.25,.24,.45,0x75945b);legs.push({x:side*.45,y:.33,z:.62,w:.23,h:.58,d:.31,color:0x709456});for(let i=0;i<3;i++)b(side*(.48+i*.1),.095,.82,.12,.06,.24,0xa1ba7d);}
  for(let i=0;i<12;i++){const x=Math.sin(i*2.4)*.44,z=Math.cos(i*2.4)*.53;volume(x,.97-Math.abs(x)*.15,z,.09,.06,.09,i%3?0x668d53:0xc2cf83);}
  b(0,.91,.92,.70,.028,.025,0x698b50);eyeLine=1.45;
 }else if(kind==='tortoise'){
  fur=0x9bb679;muzzle=0xc8d09b;volume(0,.82,-.18,.83,.48,.98,0x537c5d);volume(0,.70,.94,.34,.28,.48,fur);volume(0,.70,1.26,.30,.20,.24,muzzle);
  // A domed shell with separate hex-like scutes and recessed seams.
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){const x=(col-2)*.30+(row%2)*.06,z=(row-2)*.33-.18,r=x*x/.68+((z+.18)**2)/.9;if(r>1)continue;const y=.87+.45*Math.sqrt(1-r);b(x,y,z,.28,.12,.30,(row+col)%3?0x8ea26c:0xb8bf84);b(x,y+.07,z,.20,.03,.21,0xaab67a);}
  for(const side of [-1,1]){eye(side,.80,1.45,.19,0x8f7543);for(const z of [-.70,.59])volume(side*.68,.35,z,.25,.20,.30,fur);}
  feet(0x7d9b65,.28,.59,-.70,.28);eyeLine=.80;
 }else if(kind==='hedgehog'){
  fur=0xa38b6a;muzzle=0xd4bf98;volume(0,.78,-.20,.64,.47,.85,fur);volume(0,.69,.65,.38,.28,.46,muzzle);
  for(let row=0;row<8;row++)for(let col=0;col<9;col++){const x=(col-4)*.14,z=(row-3.5)*.18-.23,r=x*x/.45+((z+.23)**2)/.8;if(r>1)continue;const y=.90+.37*Math.sqrt(1-r);b(x,y,z,.10,.26+(row+col)%3*.035,.12,(row+col)%3?0x615c48:0xc7b78e);b(x,y+.15,z,.055,.09,.06,ivory);}
  for(const side of [-1,1]){eye(side,.84,.96,.22,0x6e6946);volume(side*.30,.98,.53,.12,.16,.10,fur);}b(0,.66,1.15,.16,.11,.07,dark);feet(0x80775b,.22,.45,-.56,.28);eyeLine=.84;
 }else{
  fur=0xc6d0b1;muzzle=0xd4a654;volume(0,.89,-.13,.56,.53,.78,fur);volume(0,1.55,.54,.35,.39,.35,0x698d72);volume(0,1.43,.98,.31,.12,.31,muzzle);
  for(const side of [-1,1]){eye(side,1.65,.84,.22,0x7c6445);volume(side*.47,.96,-.12,.15,.30,.56,0xa1b597);for(let i=0;i<5;i++)b(side*.56,.81+i*.055,-.48+i*.16,.07,.09,.24,i%2?ivory:0x839e81);legs.push({x:side*.23,y:.23,z:.03,w:.12,h:.35,d:.13,color:0xc49a4d});b(side*.23,.10,.19,.30,.09,.38,muzzle);}
  for(let i=0;i<4;i++)b((i-1.5)*.18,1.05,-.91,.15,.31,.40,0x738e75);eyeLine=1.65;motion='biped';
 }
 const height=Math.max(...parts.map(p=>p[1]+p[4]/2));
 const spec=Object.freeze({key:kind,theme:'detailed-original-creature',parts:Object.freeze(parts.map(Object.freeze)),legs:Object.freeze(legs.map(p=>carvedAnimalLeg(p,kind))),wings:Object.freeze([]),fur,muzzle,height,eyeLine,motion});cache.set(kind,spec);return spec;
}
