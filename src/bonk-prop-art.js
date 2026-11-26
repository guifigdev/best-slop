import {roRegionalPropParts} from './ro-regional-prop-art.js';
import {habitatSceneryParts} from './habitat-scenery.js';
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
 if(stage==='payon'){for(let side of [-1,1]){for(let j=0;j<5;j++)b(side*(.7+j*.17),4.4+j*.025,0,.22,.18,1.1,0x566b64);b(side*.7,2,.54,.29,.55,.25,p.glow);for(let j=0;j<3;j++)b(side*.7,1.8+j*.19,.55,.36,.045,.3,p.wood);}}
 if(stage==='crypt'){for(let side of [-1,1])for(let j=0;j<4;j++){b(side*(.7-j*.13),4.4+j*.18,.1,.25,.3,.6,p.dark);b(side*.51,1.1+j*.6,.79,.06,.14,.025,0xa8a998);}b(0,4.9,.1,.1,.75,.2,p.stone);b(0,5.1,.1,.52,.1,.2,p.stone);}
 if(stage==='geffen'){for(let j=0;j<12;j++){const a=j*Math.PI/6;b(Math.sin(a)*.8,2.6+Math.cos(a)*.8,.8,.12,.14,.12,p.glow,a);}for(let side of [-1,1])for(let j=0;j<5;j++)b(side*.6,1+j*.48,.8,.09,.12,.025,j%2?p.glow:p.dark);}
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
// Regional landmarks. Geometry uses layered masonry, open arches, roof tiles and
// recognisable silhouettes; no invisible decorative cubes replace these assets.
export function bonkSceneryParts(type,p,variant=0){const regional=roRegionalPropParts(type,p,variant);if(regional)return regional;const habitat=habitatSceneryParts(type,p,variant);if(habitat)return habitat;
 const parts=[],b=(x,y,z,w,h,d,c=p.stone,a=0,lit=false)=>parts.push([x,y,z,w,h,d,c,a,lit]),stone=p.stone,dark=p.dark,wood=p.wood,cream=0xd8c9a9,roof=type.includes('payon')?0x526569:0x9e5447;
 const base=(w=7,d=6)=>{for(let i=0;i<3;i++)b(0,.14+i*.2,0,w-i*.3,.25,d-i*.3,i%2?stone:dark);};
 const ring=(r,y,thick,h,c,n=24)=>{for(let i=0;i<n;i++){const a=i*Math.PI*2/n;b(Math.sin(a)*r,y,Math.cos(a)*r,thick,h,2*Math.PI*r/n*.96,c,-a);}};
 const column=(x,z,h=5,material=stone)=>{b(x,.3,z,1,.5,1,dark);b(x,.65,z,.85,.2,.85,material);for(let i=0;i<Math.ceil(h/.36);i++){b(x,.85+i*.36,z,.55,.32,.55,i%5===0?dark:material);if(i%3===0)b(x+.29,.85+i*.36,z,.035,.15,.3,cream);}b(x,h+.85,z,.88,.3,.88,material);};
 const arch=(span=5,h=5,z=0,c=stone)=>{for(let side of [-1,1]){for(let y=.6;y<h;y+=.38)b(side*span/2,y,z,.8,.34,1,c);for(let i=0;i<6;i++)b(side*(span/2-i*.32),h+i*.24,z,.72,.35,1,c);}b(0,h+1.42,z,.7,.5,1.1,dark);};
 const window=(x,y,z,w=1,h=1.4,glowing=true)=>{b(x,y,z,w+.23,h+.2,.16,wood);b(x,y,z+.1,w,h,.05,glowing?p.glow:dark,0,glowing);b(x,y,z+.17,.07,h,.07,wood);b(x,y,z+.17,w,.08,.07,wood);b(x,y-h/2-.15,z+.2,w+.4,.2,.5,stone);};
 const roofTiles=(width=8,depth=6,y=5)=>{const pitch=(width-.5)/14;for(let side of [-1,1])for(let row=0;row<8;row++){const x=side*(row*pitch+.18),yy=y+(7-row)*.37;b(x,yy-.12,0,pitch+.18,.54,depth+.36,roof);for(let tile=0;tile<10;tile++)b(x,yy+.12,-depth/2+tile*depth/9,pitch+.09,.16,depth/9*1.06,(row+tile)%5===0?0xb9755d:roof);}for(let z=-depth/2-.1;z<=depth/2+.15;z+=.44)b(0,y+2.88,z,.62,.34,.5,0xc08a6b);};
 const house=(oriental=false)=>{base(8,6.5);for(const side of [-1,1])b(side*2.2,2.85,2.98,2.7,4.1,.48,0xbeb49b);b(0,4.15,2.98,1.8,1.5,.48,0xbeb49b);for(let row=0;row<9;row++)for(let col=0;col<9;col++){if(row<5&&Math.abs(col-4)<1.2)continue;b(-3.4+col*.85,1+row*.43,3,.82,.4,.45,(row+col)%7===0?0xb6aa8f:cream);}b(0,2.9,-2.6,7,4.1,.45,cream);for(let s of [-1,1]){b(s*3.5,2.9,0,.45,4.1,5.5,cream);b(s*3.65,2.9,3.3,.25,4.3,.25,wood);window(s*2.25,3.05,3.29);b(s*2.25,4.33,3.45,1.5,.24,.4,wood);for(let j=0;j<4;j++)b(s*2.25+(j-1.5)*.35,1.3,3.5,.2,.45,.25,0x658a4f);}
 b(0,2,3.3,1.65,2.6,.19,dark);b(0,2,3.48,1.4,2.4,.12,0x846449);b(.48,1.9,3.58,.1,.13,.07,GOLD);for(let y of [1,2.1,4.8])b(0,y,3.4,7.8,.2,.25,wood);for(let x of [-3.6,0,3.6])b(x,3,3.42,.2,4.3,.23,wood);for(const z of [3.06,-2.67]){for(let col=-7;col<=7;col++){const x=col*.48,top=7.72-Math.abs(x)*.71,h=Math.max(.2,top-4.75);b(x,4.75+h*.5,z,.5,h,.45,cream);}b(0,6.25,z+(z>0?.26:-.26),.18,3,.12,wood);b(0,5.05,z+(z>0?.26:-.26),7.4,.18,.15,wood);}roofTiles(8,6.8,5);b(2,6.5,-1.8,.8,3,.9,stone);for(let i=0;i<4;i++)b(2,7.9+i*.07,-1.8,1.05,.08,1.15,dark);
 if(oriental){for(let side of [-1,1])for(let i=0;i<5;i++)b(side*(3.5+i*.18),5.1+i*.13,0,.35,.3,7,roof);for(let s of [-1,1]){b(s*2.6,4,3.85,.65,.95,.65,p.glow,0,true);for(let j=0;j<5;j++)b(s*2.6,3.6+j*.19,3.85,.72,.06,.72,0x98594a);b(s*2.6,3.25,3.85,.12,.4,.12,0xc99c60);}}
 };
 if(type==='prontera-fountain'){
  base(7.5,7.5);ring(3,.92,.48,.65,stone,32);ring(2.8,1.26,.5,.18,cream,32);for(let i=0;i<14;i++){const r=2.5-i*.17;ring(Math.max(.13,r),1.02,.24,.045,0x244858,24);}for(let j=0;j<8;j++)b(0,1.1+j*.32,0,1.2-j*.075,.3,1.2-j*.075,stone);ring(1.2,2.4,.34,.28,cream,20);ring(.95,2.52,.25,.07,0x98d6d4,20);b(0,3.2,0,.55,1.8,.55,0x827f63);b(0,4.3,0,.65,.7,.55,0x8f8c72);for(let s of [-1,1]){b(s*.3,3.2,0,.22,.8,.3,0x7d8369);b(s*.5,3.75,0,.25,.8,.3,0x939078);}for(let i=0;i<8;i++){const a=i*Math.PI/4;b(Math.sin(a)*3.6,.2,Math.cos(a)*3.6,.3,.3,.3,0xc3bd9b);}for(let side of [-1,1]){for(let i=0;i<4;i++){const x=side*(3.4+i*.17),z=side*2.4;b(x,.55,z,.5,.3,.5,0x65834f);b(x,.76,z,.16,.16,.16,i%2?0xd89eab:0xe9d5a0);}b(side*.24,3.25,.15,.22,.8,.28,0x81856d);}b(-.5,3.65,.26,.4,.75,.15,0x777f68);b(.6,4.15,.15,.08,1.5,.12,0xb0ae88);b(0,4.7,0,.7,.13,.6,0x6b7865);

 }else if(type==='prontera-house'||type==='payon-pavilion'){house(type==='payon-pavilion');}
 else if(type==='prontera-gate'){
  base(9,3.8);arch(5,4.7,0,cream);for(let side of [-1,1]){column(side*3.8,0,6,cream);for(let j=0;j<5;j++)b(side*3.8,7.1+j*.33,0,2-j*.3,.35,2-j*.3,roof);b(side*3.8,8.8,0,.14,1.3,.14,GOLD);b(side*3.1,5.3,.65,.7,1.8,.08,0x447d97);for(let y=4.6;y<6.1;y+=.2)b(side*3.1,y,.71,.5,.06,.04,GOLD);}
 }else if(type==='payon-gate'){
  base(8,3);for(let side of [-1,1]){b(side*2.6,3,0,.65,5.5,.65,0x875446);b(side*2.6,1,0,.9,1,.9,dark);for(let j=0;j<3;j++)b(side*2.6,4.9+j*.3,0,1,.14,1,0xa76648);}b(0,4.8,0,6.5,.45,.65,0x9b6147);for(let i=-7;i<=7;i++)b(i*.5,6+Math.abs(i)*.035,0,.52,.35,1.3,i%3?0x52696a:0x697d76);b(0,5.5,.72,1,1.1,.1,dark);for(let i=0;i<4;i++)b(0,5.15+i*.22,.79,.45,.06,.04,GOLD);
 }else if(type==='payon-lanterns'){
  base(6,5);for(let s of [-1,1]){column(s*2.3,0,3.3,0x7f7766);b(s*2.3,4.3,0,1.4,.2,1.4,0x4f645e);for(let j=0;j<4;j++)b(s*2.3,4.5+j*.23,0,1.4-j*.3,.25,1.4-j*.3,0x58706a);b(s*2.3,3.7,0,.65,.8,.65,p.glow,0,true);for(let y=3.3;y<4.1;y+=.18)b(s*2.3,y,0,.76,.06,.76,wood);}for(let j=0;j<6;j++){b(-1.3+j*.5,.8,0,.46,.9,1.8,stone);b(-1.3+j*.5,1.3,0,.5,.16,2,dark);}
 }else if(type==='payon-cavemouth'||type==='ice-cavemouth'){
  const ice=type.startsWith('ice');for(let i=0;i<13;i++){const a=Math.PI*i/12,x=Math.cos(a)*3.3,y=1.2+Math.sin(a)*4;for(let j=0;j<3;j++)b(x+(j-1)*.08,y,(j-1)*.57,1.1,1,.53,ice?[0x92bdc8,0xb5dce0,0xd4ebdf][j]:[stone,dark,0x978c72][j]);}for(let s of [-1,1])for(let j=0;j<5;j++)b(s*(2.6+j*.3),.6+j*.26,0,.9,1.2,2.4,stone);if(ice)for(let i=-4;i<=4;i++)b(i*.55,3.5+Math.sqrt(1-(i/5)**2)*1.5,1,.2,1+Math.abs(i)*.13,.23,0xd4eeec);else{b(-3.1,2.5,1.2,.5,.9,.5,p.glow,0,true);b(3.1,2.5,1.2,.5,.9,.5,p.glow,0,true);}
 }else if(type==='gothic-gate'||type==='ruined-chapel'){
  const chapel=type==='ruined-chapel';base(chapel?10:8,chapel?8:3);arch(4.6,5.3,chapel?-2:0);for(let s of [-1,1]){column(s*3.4,0,6.8);for(let i=0;i<6;i++)b(s*3.4,7.6+i*.35,0,1.2-i*.16,.4,1.2-i*.16,dark);b(s*3.4,10,0,.12,.7,.12,0xadb9b4);b(s*3.4,9.9,0,.55,.12,.12,0xadb9b4);if(chapel)for(let j=0;j<6;j++){b(s*4,1.2+j*.65,0,.65,.6,7,stone);b(s*3.7,2.6+j*.7,3.5,.45,.18,.5,dark);}}if(chapel){for(let x=-4;x<=4;x+=.9){const y=5.4+(4-Math.abs(x))*.5;b(x,y,-2.4,.8,.45,.8,stone);}for(let i=0;i<18;i++){const a=i*.9;b(Math.sin(a)*3,.8+(i%3)*.17,Math.cos(a)*2,.7,.35,.55,i%3?stone:dark,a);}}else{for(let s of [-1,1])for(let i=0;i<5;i++)b(s*(2-i*.18),4.7+i*.19,.6,.23,.25,.3,0x7f8991);}
 }else if(type==='tomb-garden'){
  base(8,7);for(let row=0;row<2;row++)for(let col=0;col<3;col++){const x=(col-1)*2.2,z=(row-.5)*3;for(let j=0;j<4;j++)b(x,.7+j*.09,z,1.5-j*.13,.12,2.4-j*.13,stone);b(x,1.4,z-.8,.5,1.2,.35,0x9a9c95);b(x,1.7,z-.8,1,.2,.35,0x9a9c95);for(let i=0;i<3;i++)b(x,1.05+i*.12,z+.8,.48,.035,.035,dark);}for(let s of [-1,1])for(let j=0;j<13;j++){b(s*4,1+j%2*.15,-3+j*.5,.1,1,.1,dark);if(j<12)b(s*4,.95,-2.75+j*.5,.1,.08,.5,dark);}
 }else if(type==='mage-tower'){
  base(8,8);for(let y=0;y<17;y++){const r=2.6-y*.035;ring(r,1+y*.4,.45,.37,y%4===0?dark:stone,20);if(y%4===1)for(let side of [-1,1])window(side*1.2,1+y*.4,r+.1,.65,1.1);}
  ring(2.4,7.8,.6,.3,cream,20);for(let i=0;i<10;i++)b(0,8.1+i*.38,0,5.6-i*.5,.4,5.6-i*.5,0x4e668b,Math.PI/4);b(0,12.3,0,.3,1.5,.3,GOLD);b(0,13.2,0,.7,.7,.7,p.glow,Math.PI/4,true);for(let i=0;i<8;i++){let a=i*Math.PI/4;b(Math.sin(a)*3,7.9,Math.cos(a)*3,.3,.3,.3,p.glow,Math.PI/4,true);}
 }else if(type==='arcane-library'){
  base(8,6);for(let side of [-1,1]){b(side*3.5,3,0,.5,5.1,4.7,wood);for(let shelf=0;shelf<4;shelf++){b(side*2,1+shelf*1.1,0,3,.16,4.7,wood);for(let i=0;i<9;i++){const h=.55+(i%3)*.1;b(side*(.8+i*.29),1.4+shelf*1.1,1.8,.23,h,.6,[0x725078,0x5e807b,0x8d6e63,0xb4a070][(i+shelf)%4]);b(side*(.8+i*.29),1.45+shelf*1.1,2.13,.17,.04,.03,GOLD);}}}arch(4,5.3,-2.2);b(0,2,1.7,1.7,.25,1.2,wood);for(let s of [-1,1])b(s*.4,2.25,1.7,.7,.13,.95,cream,s*.2);for(let i=0;i<7;i++)b(0,2.4+i*.1,1.7,.18,.1,.18,p.glow,0,true);
 }else if(type==='runic-gate'||type==='ice-crown'){
  const frost=type==='ice-crown',c=frost?0xafdae0:0x80719c;base(7,6);for(let s of [-1,1])for(let j=0;j<9;j++){b(s*(2.8-j*.13),1+j*.55,0,.8-j*.04,.6,1.1,c);b(s*(2.8-j*.13),1+j*.55,.6,.17,.22,.04,p.glow,0,true);}for(let i=0;i<12;i++){let a=i*Math.PI/6;b(Math.sin(a)*1.5,3+Math.cos(a)*1.5,0,.3,.3,.3,p.glow,a,true);}if(frost)for(let s of [-1,1])for(let j=0;j<4;j++)b(s*(3.3+j*.18),1.7+j*.3,0,.5,3-j*.4,.6,0xd9efec);
 }else if(type==='crystal-orbit'||type==='ice-spires'){
  base(7,6);const c=type==='ice-spires'?0xb1dce0:0xa68bce;for(let i=0;i<9;i++){const a=i*2.4,r=i===0?0:1.4+(i%2)*.7,h=3+(i%4)*1.2;for(let j=0;j<6;j++)b(Math.sin(a)*r,.8+j*h/6,Math.cos(a)*r,.75-j*.07,h/6+.05,.75-j*.07,j%3===0?p.glow:c,a,j%3===0);}ring(3.1,.9,.18,.18,dark,32);
 }else if(type==='magma-furnace'){
  base(8,6);arch(3.4,3.7,0,0x6e5448);b(0,1.1,0,3,.4,2.5,0xe87c35,0,true);for(let s of [-1,1])for(let j=0;j<5;j++)b(s*3,1+j*.75,0,1.5,.7,3,0x514741);for(let j=0;j<7;j++)b(0,5+j*.5,-1,2.8-j*.16,.46,2.8-j*.16,j%2?0x715a4e:0x493f3c);for(let i=-3;i<=3;i++)b(i*.5,2.3,.6,.12,2.1,.1,dark);for(let i=0;i<8;i++)b((i-3.5)*.4,.8,.9+i*.4,.2,.12,.3,0xf1a450,0,true);
 }else if(type==='lava-arch'||type==='basalt-throne'){
  base(8,6);for(let s of [-1,1])for(let j=0;j<10;j++){let x=s*(2.6-j*.1);b(x,1+j*.5,0,1.1-(j%2)*.2,.46,1.8,j%3?0x5e4c42:0x382f30);b(x+.2,1+j*.5,1,.08,.2,.05,p.glow,0,true);}for(let i=0;i<7;i++)b((i-3)*.7,6+Math.sin(i)*.17,0,.8,.6,2,0x52413b);for(let i=0;i<9;i++){let a=i*2.1;b(Math.sin(a)*2,.7+(i%3)*.1,Math.cos(a)*1.6,.9,.3,.7,0xa25b3c,a);}
 }else{base();for(let j=0;j<4;j++)b(0,1+j*.6,0,4-j*.7,.7,3.5-j*.5,stone);}
 return parts;
}
const GOLD=0xd2b06d;
