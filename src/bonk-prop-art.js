// Purpose-built small voxel props, in metres around the object's ground anchor.
// The open lids, hollow necks and separate staves keep silhouettes legible at play distance.
export function bonkObjectParts(o,p){
 const parts=[],add=(x,y,z,w,h,d,c,a=0)=>parts.push([x,y,z,w,h,d,c,a]);
 if(o.type==='chest'){
  const wood=o.used?0x705c46:0x9c693c,edge=o.used?0x8b8066:0xd9b46b;
  for(let j=0;j<5;j++)add((j-2)*.24,.29,0,.225,.5,.82,wood);
  for(const z of [-.43,.43]){add(0,.08,z,1.35,.13,.1,p.dark);for(const x of [-.44,.44])add(x,.33,z,.09,.62,.08,edge);add(0,.55,z,1.35,.08,.08,edge);}
  for(let j=0;j<5;j++){const x=(j-2)*.24;add(x,o.used?.92:.66,o.used?-.48:0,.225,o.used?.68:.22,o.used?.12:.87,wood);}
  if(o.used){add(-.45,.92,-.57,.08,.72,.08,edge);add(.45,.92,-.57,.08,.72,.08,edge);add(0,1.27,-.57,1.35,.09,.09,edge);}
  else{for(const x of [-.44,.44])add(x,.67,0,.1,.12,.91,edge);add(0,.43,.51,.21,.23,.1,edge);add(0,.45,.57,.04,.08,.03,p.dark);}
  for(const x of [-.68,.68]){add(x,.37,0,.07,.18,.27,edge);add(x,.37,0,.09,.08,.16,p.dark);}
 }
 else if(o.type==='pot'&&!o.used){
  const rings=[[.09,.2,.1],[.22,.32,.16],[.39,.38,.18],[.55,.3,.14],[.67,.19,.1],[.76,.23,.08]];
  for(const [y,r,h]of rings)for(let i=0;i<10;i++){const a=i*Math.PI/5;add(Math.sin(a)*r,y,Math.cos(a)*r,.16,h,.11,i%3?0xa97b55:0xc49a6e,-a);}
  for(const side of [-1,1]){add(side*.43,.51,0,.09,.32,.11,0x99704d);add(side*.35,.66,0,.23,.09,.11,0xb98f63);}
 }
 else if(o.type==='shrine'){
  for(let j=0;j<3;j++)add(0,.12+j*.18,0,1.9-j*.27,.22,1.8-j*.25,j%2?p.stone:p.dark);
  for(const side of [-1,1]){add(side*.5,.91,0,.25,.85,.45,p.stone);add(side*.58,1.31,0,.4,.17,.6,p.dark);}
  add(0,1.48,0,1.6,.2,1.1,p.stone);add(0,1.64,0,1.3,.13,.9,p.dark);
  for(const side of [-1,1]){add(side*.55,1.91,0,.2,.48,.3,p.stone);add(side*.43,2.2,0,.22,.18,.3,p.stone);}
  add(0,1.92,0,.4,.42,.4,o.used?p.dark:p.glow,Math.PI/4);
 }
 else if(o.type==='campfire'){
  for(let i=0;i<10;i++){const a=i*Math.PI/5;add(Math.sin(a)*.65,.13,Math.cos(a)*.65,.32,.24,.27,p.stone,a);}
  for(let i=0;i<3;i++)add(0,.16+i*.1,0,1.15,.18,.23,i%2?0x524333:0x70523b,i*Math.PI/3);
 }
 return parts;
}

// Each guardian has a different roofline, on the existing solid statue footprint.
export function bonkMonumentParts(index,stage,p){
 const parts=[],b=(x,y,z,w,h,d,c=p.stone,a=0)=>parts.push([x,y,z,w,h,d,c,a]);
 for(let j=0;j<3;j++)b(0,.18+j*.25,0,2.6-j*.3,.3,2.6-j*.3,j%2?p.stone:p.dark);
 if(index===0){ // The watchtower: courses, narrow windows and a crenellated crown.
  for(let j=0;j<7;j++){b(0,1.04+j*.49,0,1.68,.44,1.45,j%2?p.stone:p.dark);if(j%2===0)b(0,1.12+j*.49,.74,.19,.31,.04,p.glow);}
  b(0,4.52,0,2.15,.24,1.95);for(const x of [-.8,0,.8])for(const z of [-.77,.77])b(x,4.83,z,.35,.44,.4);b(0,5.16,0,.63,.48,.63,p.glow,Math.PI/4);
 }else if(index===1){ // A winged warrior, rather than another copy of a square pillar.
  for(const side of [-1,1]){b(side*.32,1.43,0,.43,1.32,.5);b(side*.34,.96,.2,.48,.2,.85);b(side*.92,2.75,0,.35,1.2,.5);for(let j=0;j<4;j++)b(side*(1.08+j*.23),3.2-j*.2,-.16,.38,.28,.75,p.stone);}
  b(0,2.55,0,1.12,1.05,.7);b(0,3.44,0,.72,.73,.7);b(0,3.87,0,.85,.14,.8,p.dark);b(0,4.04,0,.25,.32,.8,p.glow);b(-.89,2.65,.41,.76,1.21,.18,p.dark);b(-.89,2.65,.52,.49,.89,.08,p.stone);
 }else{ // Root altar / furnace / ice crown, always with a recognisable open centre.
  for(const side of [-1,1])for(let j=0;j<6;j++)b(side*(.9-j*.035),1.02+j*.5,0,.5,.46,.65,j%2?p.stone:p.dark);
  for(let j=0;j<3;j++)b(0,4.0+j*.23,0,2.1-j*.42,.25,.95,p.stone);
  b(0,2.7,0,.61,.8,.61,p.glow,Math.PI/4);for(const side of [-1,1]){b(side*.43,3.52,0,.22,.65,.28,p.glow);b(side*.24,3.9,0,.24,.28,.28,p.glow);}
 }
 if(stage==='grove')for(let j=0;j<7;j++)b(Math.sin(j*1.5)*.86,.7+j*.36,.78,.32,.25,.24,j%2?0x6e8e47:0x3e6549);
 if(stage==='forge')for(const side of [-1,1])for(let j=0;j<3;j++)b(side*.6,1+j*.72,.77,.08,.34,.03,0xf1a053);
 if(stage==='glacier')for(const side of [-1,1])for(let j=0;j<3;j++)b(side*(.86-j*.17),.91+j*.15,.3, .32,.18,1.35-j*.15,0xdcebe5);
 return parts;
}

export function bonkRockParts(o,p){
 const seed=String(o.id||'rock').split('').reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0),parts=[],nx=7,nz=6,cw=o.w/nx,cd=o.d/nz,phase=seed%100*.13;
 for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
  const x=(ix+.5)/nx*2-1,z=(iz+.5)/nz*2-1,r=Math.pow(x+.1*Math.sin(phase),2)/.94+Math.pow(z-.09*Math.cos(phase),2)/.92;
  if(r>1)continue;const shoulder=.12*Math.sin(ix*.8+phase)*Math.cos(iz*.7),height=Math.max(.13,Math.round((.27+Math.sqrt(1-r)*.69+shoulder)*o.h/.14)*.14),px=(ix-(nx-1)/2)*cw,pz=(iz-(nz-1)/2)*cd;
  parts.push([px,height/2,pz,cw+.005,height,cd+.005,(ix+iz+seed)%5===0?p.dark:(ix+iz)%3===0?p.grass:p.stone,0]);
  if((ix*3+iz+seed)%8===0)parts.push([px,height+.04,pz,cw*.98,.08,cd*.97,p.grass,0]);
 }
 return parts;
}
